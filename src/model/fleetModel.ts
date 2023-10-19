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
                SELECT *
                FROM DevelopERP_ForTesting..Fleet
                EXEC DevelopERP_ForTesting..formatFleetTable @fleetTable = @fleetTable, @fleet_name = '%', @firstIndex = @firstIndex, @lastIndex = @lastIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP_ForTesting..Fleet
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
                FROM DevelopERP_ForTesting..Fleet F
                LEFT JOIN DevelopERP_ForTesting..Fleet PF
                ON F.parent_fleet_id = PF.fleet_id
                WHERE F.fleet_id = @fleet_id

                DECLARE @customerTable CustomerType
                INSERT INTO @customerTable
                SELECT C.customer_id, C.customer_name, C.sales_type_code_id, C.customer_type_code_id, C.create_by, C.create_date, C.update_date, C.is_archived
                FROM DevelopERP_ForTesting..Fleet_Customer FC
                LEFT JOIN DevelopERP_ForTesting..Customer C
                ON FC.customer_id = C.customer_id
                WHERE FC.fleet_id = @fleet_id
                EXEC DevelopERP_ForTesting..formatCustomerTable @customerTable = @customerTable, @customer_name = '%', @firstIndex = 0, @lastIndex = 0

                DECLARE @personTable PersonType
                INSERT INTO @personTable
                SELECT P.person_id, P.firstname, P.lastname, P.nickname, P.title_code_id, description, create_by, create_date, update_date, is_archived
                FROM DevelopERP_ForTesting..Fleet_Person FP
                LEFT JOIN DevelopERP_ForTesting..Person P
                ON FP.person_id = P.person_id
                WHERE FP.fleet_id = @fleet_id
                EXEC DevelopERP_ForTesting..formatPersonTable @personTable = @personTable, @fullname = '%', @firstIndex = 0, @lastIndex = 0

                DECLARE @vehicleTable VehicleType
                INSERT INTO @vehicleTable
                SELECT V.vehicle_id, V.frame_no, V.license_plate, V.vehicle_model_id, V.registration_province_code_id, V.registration_type_code_id, V.driving_license_type_code_id , V.number_of_axles, V.number_of_wheels, V.number_of_tires, V.vehicle_type_code_id, V.create_by, V.create_date,update_date, V.is_archived  
                FROM DevelopERP_ForTesting..Fleet_Vehicle FV
                LEFT JOIN DevelopERP_ForTesting..Vehicle V
                ON FV.vehicle_id = V.vehicle_id
                WHERE FV.fleet_id = @fleet_id
                EXEC DevelopERP_ForTesting..formatVehicleTable @vehicleTable = @vehicleTable, @license_plate = '%', @firstIndex = 0, @lastIndex = 0
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

async function deleteFleet(fleetId: string) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('fleet_id', sql.INT, fleetId)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                WITH RecursiveCTE AS (
                    SELECT fleet_id, parent_fleet_id
                    FROM DevelopERP_ForTesting..Fleet
                    WHERE fleet_id = @fleet_id
                    UNION ALL
                    SELECT F.fleet_id, F.parent_fleet_id
                    FROM DevelopERP_ForTesting..Fleet AS F
                    INNER JOIN RecursiveCTE AS RC ON F.parent_fleet_id = RC.fleet_id
                )
                
                UPDATE DevelopERP_ForTesting..Fleet
                SET is_archived = 1
                WHERE fleet_id IN ( 
                    SELECT fleet_id
                    FROM RecursiveCTE
                )
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
            .input('create_by', sql.INT, body.create_by)
            .input('create_date', sql.DATETIME, datetime)
            .input('is_archived', sql.INT, 0)
            .query(`
                INSERT INTO DevelopERP_ForTesting..Fleet (fleet_name, parent_fleet_id, create_by, create_date, is_archived)
                OUTPUT INSERTED.fleet_id
                VALUES (@fleet_name, @parent_fleet_id, @create_by, @create_date, @is_archived)
            `)
        let fleet_id = fleetResult.recordset[0].fleet_id

        for (const customer of body.customer) {
            let customerResult = await transaction.request()
                .input('customer_id', sql.INT, customer)
                .input('fleet_id', sql.INT, fleet_id)
                .query(`
                    INSERT INTO DevelopERP_ForTesting..Fleet_Customer (customer_id, fleet_id)
                    VALUES (@customer_id, @fleet_id)
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
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE DevelopERP_ForTesting..Fleet
                SET fleet_name = @fleet_name, parent_fleet_id = @parent_fleet_id, update_date = @update_date
                WHERE fleet_id = @fleet_id
            `)

        for (const customer of body.customerDelete) {
            let customerDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customer)
                .input('fleet_id', sql.INT, fleetId)
                .query(`
                    DELETE FROM DevelopERP_ForTesting..Fleet_Customer
                    WHERE fleet_id = @fleet_id AND customer_id = @customer_id
                `)
        }
        for (const customer of body.customer) {
            let customerResult = await transaction.request()
                .input('customer_id', sql.INT, customer)
                .input('fleet_id', sql.INT, fleetId)
                .query(`
                    INSERT INTO DevelopERP_ForTesting..Fleet_Customer (customer_id, fleet_id)
                    VALUES (@customer_id, @fleet_id)
                `)
        }

        await transaction.commit();

    } catch (err) {
        transaction.rollback();
        throw err;
    }
}

export default { getFleetTable, getFleetData, deleteFleet, createFleetData, updateFleetData }