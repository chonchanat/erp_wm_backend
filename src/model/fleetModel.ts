const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../utils"
import { FleetType } from "../interfaces/fleet";

// import * as customerOperation from "../operation/customer";
// import * as relationOperation from "../operation/relation";
import * as operation from "../operation/index"

async function getFleetTable(index: number, filterFleet: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .input('fleet_name', sql.NVARCHAR, "%" + filterFleet + "%")
            .query(`
                DECLARE @fleetTable IdType
                INSERT INTO @fleetTable
                EXEC DevelopERP_Clear..sp_filterFleet @fleet_name = @fleet_name, @customer_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_Clear..sp_formatFleetTable @fleetTable = @fleetTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP_Clear..Fleet
                WHERE fleet_name LIKE @fleet_name AND active = 1
            `)
        return {
            fleet: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getFleetData(fleet_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('fleet_id', sql.INT, fleet_id)
            .query(`
                SELECT F.fleet_id, F.fleet_name, PF.fleet_id AS parent_fleet_id, PF.fleet_name AS parent_fleet_name
                FROM DevelopERP_Clear..Fleet F
                LEFT JOIN DevelopERP_Clear..Fleet PF
                ON F.parent_fleet_id = PF.fleet_id
                WHERE F.fleet_id = @fleet_id

                DECLARE @customerTable IdType
                INSERT INTO @customerTable
                EXEC DevelopERP_Clear..sp_filterCustomer @customer_name = '%',@fleet_id = @fleet_id, @person_id = NULL, @vehicle_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatCustomerTable @customerTable = @customerTable, @firstIndex = 1

                DECLARE @personTable IdType
                INSERT INTO @personTable
                EXEC DevelopERP_Clear..sp_filterPerson @fullname = '%', @customer_id = NULL, @fleet_id = @fleet_id, @vehicle_id = NULL, @user_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatPersonTable @personTable = @personTable, @firstIndex = 1

                DECLARE @vehicleTable IdType
                INSERT INTO @vehicleTable 
                EXEC DevelopERP_Clear..sp_filterVehicle @license_plate = '%', @customer_id = NULL, @fleet_id = @fleet_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatVehicleTable @vehicleTable = @vehicleTable, @firstIndex = 1
            `)

        return {
            fleet: result.recordsets[0][0],
            customer: result.recordsets[1],
            person: result.recordsets[2],
            vehicle: result.recordsets[3],
        }
    } catch (err) {
        throw err;
    }
}

async function deleteFleet(fleet_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('fleet_id', sql.INT, fleet_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_delete_fleet @fleet_id = @fleet_id, 
                    @action_by = @action_by, @action_date = @action_date
            `)
    } catch (err) {
        throw err;
    }
}

async function createFleetData(body: FleetType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by: number = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        let fleetResult = await operation.createFleetNew(transaction, body.fleet, action_by, datetime)
        let fleet_id = fleetResult.recordset[0].fleet_id

        for (const customer of body.customerNew) {
            let customerResult = await operation.createCustomerNew(transaction, customer.customer, action_by, datetime)
            let customer_id = customerResult.recordset[0].customer_id

            await operation.linkFleetCustomer(transaction, fleet_id, customer_id, action_by, datetime)
            for (const contact of customer.contactNew) {
                await operation.createContactNew(transaction, contact, null, customer_id, action_by, datetime)
            } 
        }
        for (const customer of body.customerExist) {
            await operation.linkFleetCustomer(transaction, fleet_id, customer, action_by, datetime)
        }

        for (const person of body.personNew) {
            let personResult = await operation.createPersonNew(transaction, person.person, action_by, datetime)
            let person_id = personResult.recordset[0].person_id

            await operation.linkFleetPerson(transaction, fleet_id, person_id, action_by, datetime)
            for (const contact of person.contactNew) {
                await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
            }
        }
        for (const person of body.personExist) {
            await operation.linkFleetPerson(transaction, fleet_id, person, action_by, datetime)
        }
      
        for (const vehicle of body.vehicleExist) {
            let vehicleResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet_id)
                .input('vehicle_id', sql.INT, vehicle)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_vehicle @fleet_id = @fleet_id, @vehicle_id = @vehicle_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        await transaction.commit();
    
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function updateFleetData(fleet_id: string, body: FleetType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by: number = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updateFleet(transaction, fleet_id, body.fleet, action_by, datetime)

        for (const customer of body.customerNew) {
            let customerResult = await operation.createCustomerNew(transaction, customer.customer, action_by, datetime)
            let customer_id = customerResult.recordset[0].customer_id

            await operation.linkFleetCustomer(transaction, fleet_id, customer_id, action_by, datetime)
            for (const contact of customer.contactNew) {
                await operation.createContactNew(transaction, contact, null, customer_id, action_by, datetime)
            } 
        }
        for (const customer of body.customerDelete) {
            await operation.unlinkFleetCustomer(transaction, fleet_id, customer, action_by, datetime)
        }
        for (const customer of body.customerExist) {
            await operation.linkFleetCustomer(transaction, fleet_id, customer, action_by, datetime)
        }

        for (const person of body.personNew) {
            let personResult = await operation.createPersonNew(transaction, person.person, action_by, datetime)
            let person_id = personResult.recordset[0].person_id

            await operation.linkFleetPerson(transaction, fleet_id, person_id, action_by, datetime)
            for (const contact of person.contactNew) {
                await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
            }
        }
        for (const person of body.personDelete) {
            await operation.unlinkFleetPerson(transaction, fleet_id, person, action_by, datetime)
        }
        for (const person of body.personExist) {
            await operation.linkFleetPerson(transaction, fleet_id, person, action_by, datetime)
        }

        for (const vehicle of body.vehicleDelete) {
            let vehicleDeleteResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet_id)
                .input('vehicle_id', sql.INT, vehicle)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_fleet_vehicle @fleet_id = @fleet_id, @vehicle_id = @vehicle_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const vehicle of body.vehicleExist) {
            let vehicleResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet_id)
                .input('vehicle_id', sql.INT, vehicle)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_vehicle @fleet_id = @fleet_id, @vehicle_id = @vehicle_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        await transaction.commit();

    } catch (err) {
        transaction.rollback();
        throw err;
    }
}

export default { getFleetTable, getFleetData, deleteFleet, createFleetData, updateFleetData }