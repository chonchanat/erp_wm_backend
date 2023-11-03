const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../utils"

async function getFleetTable(index: number, filterFleet: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .input('fleet_name', sql.NVARCHAR, "%" + filterFleet + "%")
            .query(`
                DECLARE @fleetTable FleetType
                INSERT INTO @fleetTable
                EXEC DevelopERP_Clear..sp_filterFleet @customer_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_Clear..sp_formatFleetTable @fleetTable = @fleetTable, @fleet_name = @fleet_name, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP_Clear..Fleet
                WHERE fleet_name LIKE @fleet_name AND is_archived = 0
            `)
        return {
            fleet: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getFleetData(fleetId: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('fleet_id', sql.INT, fleetId)
            .query(`
                SELECT F.fleet_id, F.fleet_name, PF.fleet_id AS parent_fleet_id, PF.fleet_name AS parent_fleet_name
                FROM DevelopERP_Clear..Fleet F
                LEFT JOIN DevelopERP_Clear..Fleet PF
                ON F.parent_fleet_id = PF.fleet_id
                WHERE F.fleet_id = @fleet_id

                DECLARE @customerTable CustomerType
                INSERT INTO @customerTable
                EXEC DevelopERP_Clear..sp_filterCustomer @fleet_id = @fleet_id, @person_id = NULL, @vehicle_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatCustomerTable @customerTable = @customerTable, @customer_name = '%', @firstIndex = 1

                DECLARE @personTable PersonType
                INSERT INTO @personTable
                EXEC DevelopERP_Clear..sp_filterPerson @customer_id = NULL, @fleet_id = @fleet_id, @vehicle_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatPersonTable @personTable = @personTable, @fullname = '%', @firstIndex = 1

                DECLARE @vehicleTable VehicleType
                INSERT INTO @vehicleTable 
                EXEC DevelopERP_Clear..sp_filterVehicle @customer_id = NULL, @fleet_id = @fleet_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatVehicleTable @vehicleTable = @vehicleTable, @license_plate = '%', @firstIndex = 1
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

async function deleteFleet(fleetId: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('fleet_id', sql.INT, fleetId)
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

async function createFleetData(body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
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

async function updateFleetData(fleetId: string, body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let fleetResult = await transaction.request()
            .input('fleet_id', sql.INT, fleetId)
            .input('fleet_name', sql.NVARCHAR, body.fleet.fleet_name)
            .input('parent_fleet_id', sql.INT, body.fleet.parent_fleet_id)
            .input('action_by', sql.INT, body.update_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_update_fleet @fleet_id = @fleet_id, @fleet_name = @fleet_name,
                    @parent_fleet_id = @parent_fleet_id, @action_by = @action_by, @action_date = @action_date
            `)

        for (const customer of body.customerDelete) {
            let customerDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customer)
                .input('fleet_id', sql.INT, fleetId)
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
                .input('fleet_id', sql.INT, fleetId)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const person of body.personDelete) {
            let personDeleteResult = await transaction.request()
                .input('fleet_id', sql.INT, fleetId)
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
                .input('fleet_id', sql.INT, fleetId)
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
                .input('fleet_id', sql.INT, fleetId)
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
                .input('fleet_id', sql.INT, fleetId)
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