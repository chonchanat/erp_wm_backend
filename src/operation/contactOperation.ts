const sql = require('mssql')
import { Contact } from "../interfaces/contact"

export async function getContactTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .input('value', sql.NVARCHAR, "%" + filter + "%")
        .query(`
            DECLARE @contactTable IdType
            INSERT INTO @contactTable
            EXEC DevelopERP_ForTesting2..sp_filterContact @value = @value, @customer_id = NULL, @person_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_ForTesting2..sp_formatContactTable @contactTable = @contactTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data
            FROM DevelopERP_ForTesting2..Contact
            WHERE value LIKE @value AND active = 1
        `)
}

export async function getContactData(transaction: any, contact_id: string) {
    return await transaction.request()
        .input('contact_id', sql.INT, contact_id)
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
                    THEN RTRIM(COALESCE(P.firstname + ' ', '') + COALESCE(P.lastname + ' ', '') + COALESCE('(' + P.nickname + ')', ''))
                END AS owner_name,
                CASE
                    WHEN ct.person_id IS NULL
                    THEN 'ลูกค้า'
                    WHEN ct.customer_id IS NULL
                    THEN 'บุคคล'
                END AS owner_type
            FROM DevelopERP_ForTesting2..Contact ct 
            LEFT JOIN DevelopERP_ForTesting2..Customer c
            ON ct.customer_id = c.customer_id
            LEFT JOIN DevelopERP_ForTesting2..Person p
            ON ct.person_id = p.person_id
            LEFT JOIN DevelopERP_ForTesting2..MasterCode m
            ON ct.contact_code_id = m.code_id
            WHERE ct.contact_id = @contact_id AND ct.active = 1
        `)
}

export async function createContactNew(transaction: any, contact: Contact, person_id: string | number | null, customer_id: string | number | null, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('contact_code_id', sql.INT, contact.contact_code_id)
        .input('person_id', sql.INT, person_id)
        .input('customer_id', sql.INT, customer_id)
        .input('value', sql.NVARCHAR, contact.value)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_ForTesting2..sp_insert_contact @contact_code_id = @contact_code_id, @person_id = @person_id, 
                @customer_id = @customer_id, @value = @value, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function updateContact(transaction: any, contact_id: string | number, contact: Contact, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('contact_id', sql.INT, contact_id)
        .input('contact_code_id', sql.INT, contact.contact_code_id)
        .input('value', sql.NVARCHAR, contact.value)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_ForTesting2..sp_update_contact @contact_id = @contact_id, @contact_code_id = @contact_code_id, 
                @value = @value, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function deleteContact(transaction: any, contact_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('contact_id', sql.INT, contact_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_ForTesting2..sp_delete_contact @contact_id = @contact_id, @action_by = @action_by, @action_date = @action_date
        `)
}