import { getDateTime } from "../utils"

const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getBillingLocationTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('name', sql.NVARCHAR, "%" + filter + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                EXEC DevelopERP..getBillingLocationTable @name = @name, @firstIndex = @firstIndex, @lastIndex = @lastIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP..BillingLocation
                WHERE name LIKE @name
            `)

        return {
            billingLocation: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        }
    } catch (err) {
        throw err;
    }
}

async function getBillingLocationData(billingLocationId: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('billing_location_id', sql.INT, billingLocationId)
            .query(`
                SELECT billing_location_id, name, tin, COALESCE(branch, '-') AS branch
                FROM DevelopERP..BillingLocation
                WHERE billing_location_id = @billing_location_id AND is_archived = 0

                DECLARE @customerTable TABLE (
                    customer_id INT,
                    customer_name NVARCHAR(MAX),
                    telephone NVARCHAR(MAX),
                    email NVARCHAR(MAX)
                )
                INSERT INTO @customerTable
                EXEC DevelopERP..getCustomerTable @customer_name = '%%', @firstIndex = 0, @lastIndex = 0
                SELECT C.customer_id, C.customer_name, C.telephone, C.email
                FROM @customerTable C
                LEFT JOIN DevelopERP..BillingLocation BL
                ON C.customer_id = BL.customer_id
                WHERE BL.billing_location_id = @billing_location_id

                DECLARE @addressTable TABLE (
                    address_id INT,
                    location NVARCHAR(MAX),
                    address_type NVARCHAR(MAX)
                )
                INSERT INTO @addressTable
                EXEC DevelopERP..getAddressTable @location = '%', @firstIndex= 0, @lastIndex= 0
                SELECT A.address_id, A.location, A.address_type
                FROM @addressTable A
                LEFT JOIN DevelopERP..BillingLocation BL
                ON A.address_id = BL.address_id
                WHERE BL.billing_location_id = @billing_location_id

                DECLARE @personTable TABLE (
                    person_id INT,
                    fullname NVARCHAR(MAX),
                    mobile NVARCHAR(MAX),
                    email NVARCHAR(MAX),
                    description NVARCHAR(MAX),
                    role NVARCHAR(MAX)
                )
                INSERT INTO @personTable
                EXEC DevelopERP..getPersonTable @fullname = '%', @firstIndex = 0, @lastIndex = 0
                SELECT P.person_id, P.fullname, P.mobile, P.email, P.description, P.role
                FROM @personTable P
                LEFT JOIN DevelopERP..BillingLocation BL
                ON P.person_id = BL.person_id
                WHERE BL.billing_location_id = @billing_location_id
            `)
        return {
            billingLocation: result.recordsets[0][0],
            customer: result.recordsets[1],
            address: result.recordsets[2],
            person: result.recordsets[3],
        }
    } catch (err) {
        throw err;
    }
}

async function deleteBillingLocation(billingLocationId: string) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('billing_location_id', sql.INT, billingLocationId)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE DevelopERP..BillingLocation
                SET is_archived = 1, update_date = @update_date
                WHERE billing_location_id = @billing_location_id
            `)
    } catch (err) {
        throw err;
    }
}

async function createBillingLocationData(body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let billingLocationResult = await transaction.request()
            .input('name', sql.NVARCHAR, body.billingLocation.name)
            .input('tin', sql.NVARCHAR, body.billingLocation.tin)
            .input('branch', sql.NVARCHAR, body.billingLocation.branch ? body.billingLocation.branch : null)
            .input('customer_id', sql.INT, body.billingLocation.customer_id)
            .input('address_id', sql.INT, body.billingLocation.address_id)
            .input('person_id', sql.INT, body.billingLocation.person_id)
            .input('create_by', sql.INT, body.create_by)
            .input('create_date', sql.DATETIME, datetime)
            .input('is_archived', sql.INT, 0)
            .query(`
                INSERT INTO DevelopERP..BillingLocation (name, tin, branch, customer_id, address_id, person_id, create_by, create_date, is_archived)
                OUTPUT INSERTED.billing_location_id
                VALUES (@name, @tin, @branch, @customer_id, @address_id, @person_id, @create_by, @create_date, @is_archived)
            `)
        const billing_location_id = billingLocationResult.recordset[0].billing_location_id

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function updateBillingLocationData(billingLocationId: string, body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        let billingLocationResult = await transaction.request()
            .input('billing_location_id', sql.INT, billingLocationId)
            .input('name', sql.NVARCHAR, body.billingLocation.name)
            .input('tin', sql.NVARCHAR, body.billingLocation.tin)
            .input('branch', sql.NVARCHAR, body.billingLocation.branch ? body.billingLocation.branch : null)
            .input('customer_id', sql.INT, body.billingLocation.customer_id)
            .input('address_id', sql.INT, body.billingLocation.address_id)
            .input('person_id', sql.INT, body.billingLocation.person_id)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE DevelopERP..BillingLocation
                SET name = @name, tin = @tin, branch = @branch, customer_id = @customer_id, address_id = @address_id, person_id = @person_id, update_date = @update_date
                WHERE billing_location_id = @billing_location_id
            `)

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export default { getBillingLocationTable, getBillingLocationData, deleteBillingLocation, createBillingLocationData, updateBillingLocationData }