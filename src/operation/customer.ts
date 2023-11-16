const sql = require('mssql')
import { Customer } from "../interfaces/customer"

export async function createCustomerNew(transaction: any, customer: Customer, action_by: number, datetime: object) {
    return await transaction.request()
        .input('customer_name', sql.NVARCHAR, customer.customer_name)
        .input('sales_type_code_id', sql.INT, customer.sales_type_code_id)
        .input('customer_type_code_id', sql.INT, customer.customer_type_code_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_Clear..sp_insert_customer @customer_name = @customer_name, @sales_type_code_id = @sales_type_code_id, 
            @customer_type_code_id = @customer_type_code_id, @action_by = @action_by, @action_date = @action_date
    `)
}