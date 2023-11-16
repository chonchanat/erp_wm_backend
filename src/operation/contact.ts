const sql = require('mssql')

export async function createContactNew(transaction: any, contact: any, action_by: string | number, datetime: object) {
    return await transaction.request()
    .input('contact_code_id', sql.INT, contact.contact_code_id)
    .input('person_id', sql.INT, contact.person_id)
    .input('customer_id', sql.INT, contact.customer_id)
    .input('value', sql.NVARCHAR, contact.value)
    .input('action_by', sql.INT, action_by)
    .input('action_date', sql.DATETIME, datetime)
    .query(`
        EXEC DevelopERP_Clear..sp_insert_contact @contact_code_id = @contact_code_id, @person_id = @person_id, 
            @customer_id = @customer_id, @value = @value, @action_by = @action_by, @action_date = @action_date
    `)
}