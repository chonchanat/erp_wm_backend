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
                EXEC chonTest..getFleetTable @fleet_name = @fleet_name, @firstIndex = @firstIndex, @lastIndex = @lastIndex

                SELECT COUNT(*) AS count_data
                FROM chonTest..Fleet
                WHERE fleet_name LIKE @fleet_name AND isArchived = 0
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
                FROM chonTest..Fleet F
                LEFT JOIN chonTest..Fleet PF
                ON F.parent_fleet_id = PF.fleet_id
                WHERE F.fleet_id = @fleet_id

                DECLARE @customerTable TABLE (
                    customer_id INT,
                    customer_name NVARCHAR(MAX),
                    telephone NVARCHAR(MAX),
                    email NVARCHAR(MAX)
                )
                INSERT INTO @customerTable
                EXEC chonTest..getCustomerTable @customer_name = '%', @firstIndex = 0, @lastIndex = 0
                SELECT C.customer_id, C.customer_name, C.telephone, C.email
                FROM @customerTable C
                LEFT JOIN chonTest..Customer_Fleet CF
                ON C.customer_id = CF.customer_id
                WHERE CF.fleet_id = @fleet_id
            `)

        return {
            fleet: result.recordsets[0][0],
            customer: result.recordsets[1],
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
                    FROM chonTest..Fleet
                    WHERE fleet_id = @fleet_id
                    UNION ALL
                    SELECT F.fleet_id, F.parent_fleet_id
                    FROM chonTest..Fleet AS F
                    INNER JOIN RecursiveCTE AS RC ON F.parent_fleet_id = RC.fleet_id
                )
                
                UPDATE chonTest..Fleet
                SET isArchived = 1
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
            .input('isArchived', sql.INT, 0)
            .query(`
                INSERT INTO chonTest..Fleet (fleet_name, parent_fleet_id, create_by, create_date, isArchived)
                OUTPUT INSERTED.fleet_id
                VALUES (@fleet_name, @parent_fleet_id, @create_by, @create_date, @isArchived)
            `)
        let fleet_id = fleetResult.recordset[0].fleet_id

        for (const customer of body.customer) {
            let customerResult = await transaction.request()
                .input('customer_id', sql.INT, customer)
                .input('fleet_id', sql.INT, fleet_id)
                .query(`
                    INSERT INTO chonTest..Customer_Fleet (customer_id, fleet_id)
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
                UPDATE chonTest..Fleet
                SET fleet_name = @fleet_name, parent_fleet_id = @parent_fleet_id, update_date = @update_date
                WHERE fleet_id = @fleet_id
            `)

        for (const customer of body.customerDelete) {
            let customerDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customer)
                .input('fleet_id', sql.INT, fleetId)
                .query(`
                    DELETE FROM chonTest..Customer_Fleet
                    WHERE fleet_id = @fleet_id AND customer_id = @customer_id
                `)
        }
        for (const customer of body.customer) {
            let customerResult = await transaction.request()
                .input('customer_id', sql.INT, customer)
                .input('fleet_id', sql.INT, fleetId)
                .query(`
                    INSERT INTO chonTest..Customer_Fleet (customer_id, fleet_id)
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