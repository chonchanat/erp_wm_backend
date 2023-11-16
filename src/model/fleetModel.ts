const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../utils"
import { FleetType } from "../interfaces/fleet";

import * as customerOperation from "../operation/customer";
import * as relationOperation from "../operation/relation";

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
        let action_by: number = body.create_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        let fleetResult = await transaction.request()
            .input('fleet_name', sql.NVARCHAR, body.fleet.fleet_name)
            .input('parent_fleet_id', sql.INT, body.fleet.parent_fleet_id ? body.fleet.parent_fleet_id : null) 
            .input('action_by', sql.INT, body.create_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_insert_fleet @fleet_name = @fleet_name, @parent_fleet_id = @parent_fleet_id,
                    @action_by = @action_by, @action_date = @action_date
            `)
        let fleet_id = fleetResult.recordset[0].fleet_id

        // create customer in fleet menu
        for (const customer of body.customerNew) {
            let customerResult = await customerOperation.createCustomerNew(transaction, customer, action_by, datetime)
            let customer_id = customerResult.recordset[0].customer_id

            await relationOperation.createFleetCustomer(transaction, fleet_id, customer_id, action_by, datetime)
        }

        for (const customer of body.customerExist) {
            let customerResult = await transaction.request()
                .input('customer_id', sql.INT, customer)
                .input('fleet_id', sql.INT, fleet_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        //

        for (const person of body.personExist) {
            let personResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet_id)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_person @fleet_id = @fleet_id, @person_id = @person_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        
        for (const vehicle of body.vehicleExist) {
            let vehicleResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet_id)
                .input('vehicle_id', sql.INT, vehicle)
                .input('action_by', sql.INT, body.create_by)
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
        let action_by: number = body.update_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let fleetResult = await transaction.request()
            .input('fleet_id', sql.INT, fleet_id)
            .input('fleet_name', sql.NVARCHAR, body.fleet.fleet_name)
            .input('parent_fleet_id', sql.INT, body.fleet.parent_fleet_id)
            .input('action_by', sql.INT, body.update_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_update_fleet @fleet_id = @fleet_id, @fleet_name = @fleet_name,
                    @parent_fleet_id = @parent_fleet_id, @action_by = @action_by, @action_date = @action_date
            `)

        // create customer is fleet menu
        for (const customer of body.customerNew) {
            let customerResult = await customerOperation.createCustomerNew(transaction, customer, action_by, datetime)
            let customer_id = customerResult.recordset[0].customer_id

            await relationOperation.createFleetCustomer(transaction, fleet_id, customer_id, action_by, datetime)
        }
        for (const customer of body.customerDelete) {
            let customerDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customer)
                .input('fleet_id', sql.INT, fleet_id)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const customer of body.customerExist) {
            let customerResult = await transaction.request()
                .input('customer_id', sql.INT, customer)
                .input('fleet_id', sql.INT, fleet_id)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        //

        for (const person of body.personDelete) {
            let personDeleteResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet_id)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_fleet_person @fleet_id = @fleet_id, @person_id = @person_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const person of body.personExist) {
            let personResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet_id)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_person @fleet_id = @fleet_id, @person_id = @person_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        
        for (const vehicle of body.vehicleDelete) {
            let vehicleDeleteResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet_id)
                .input('vehicle_id', sql.INT, vehicle)
                .input('action_by', sql.INT, body.update_by)
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
                .input('action_by', sql.INT, body.update_by)
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