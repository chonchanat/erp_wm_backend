import { getDateTime } from "../utils"
import { ContactType } from "../interfaces/contact"
const devConfig = require('../config/dbconfig')
const sql = require('mssql')

import * as operation from "../operation/index"

async function getContactTable(index: number, filterValue: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .input('value', sql.NVARCHAR, "%" + filterValue + "%")
            .query(`
                DECLARE @contactTable IdType
                INSERT INTO @contactTable
                EXEC DevelopERP_Clear..sp_filterContact @value = @value, @customer_id = NULL, @person_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_Clear..sp_formatContactTable @contactTable = @contactTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP_Clear..Contact
                WHERE value LIKE @value AND active = 1
            `)
        return {
            contact: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data,
        }
    } catch (err) {
        throw err;
    }
}

async function getContactData(contactId: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('contact_id', sql.INT, contactId)
            .query(`
                SELECT 
                    ct.contact_id,
                    ct.value,
                    ct.contact_code_id,
                    m.value AS contact_type,
                    CASE
                        WHEN ct.person_id IS NULL
                        THEN c.customer_name
                        WHEN ct.customer_id IS NULL
                        THEN RTRIM(COALESCE(P.firstname + ' ', '') + COALESCE(P.lastname + ' ', '') + COALESCE('(' + P.nickname + ')', '-'))
                    END AS owner_name,
                    CASE
                        WHEN ct.person_id IS NULL
                        THEN 'ลูกค้า'
                        WHEN ct.customer_id IS NULL
                        THEN 'บุคคล'
                    END AS owner_type
                FROM DevelopERP_Clear..Contact ct 
                LEFT JOIN DevelopERP_Clear..Customer c
                ON ct.customer_id = c.customer_id
                LEFT JOIN DevelopERP_Clear..Person p
                ON ct.person_id = p.person_id
                LEFT JOIN DevelopERP_Clear..MasterCode m
                ON ct.contact_code_id = m.code_id
                WHERE ct.contact_id = @contact_id AND ct.active = 1
            `)
        return result.recordsets[0][0]
    } catch (err) {
        throw err;
    }
}

async function deleteContact(contactId: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('contact_id', sql.INT, contactId)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_delete_contact @contact_id = @contact_id, @action_by = @action_by, @action_date = @action_date
            `)
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function createContactData(body: ContactType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.createContactNew(transaction, body.contact, body.contact.person_id, body.contact.customer_id, action_by, datetime)

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function updateContactData(contact_id: string, body: ContactType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updateContact(transaction, contact_id, body.contact, body.contact.person_id, body.contact.customer_id, action_by, datetime)

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export default { getContactTable, getContactData, deleteContact, createContactData, updateContactData }