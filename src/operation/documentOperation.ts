const sql = require('mssql')
import { Document } from "../interfaces/document"

export async function createDocumentNew(transaction: any, document_code_id: string | number, document_name: string, value: any, customer_id: string | number | null, person_id: string | number | null, address_id: string | number | null, vehicle_id: string | number | null, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('document_code_id', sql.INT, document_code_id)
        .input('customer_id', sql.INT, customer_id)
        .input('person_id', sql.INT, person_id)
        .input('address_id', sql.INT, address_id)
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('document_name', sql.NVARCHAR, document_name)
        .input('value', sql.VARBINARY, value)
        .input('create_date', sql.DATETIME, datetime)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_Clear..sp_insert_document @document_code_id = @document_code_id, @customer_id = @customer_id,
            @person_id = @person_id, @address_id = @address_id, @vehicle_id = @vehicle_id,
            @document_name = @document_name, @value = @value, @create_date = @create_date, 
            @action_by = @action_by, @action_by = @action_by
    `)
}

export async function updateDocument(transaction: any, document_id: string | number, document: Document, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('document_id', sql.INT, document_id)
        .input('document_code_id', sql.INT, document.document_code_id)
        .input('document_name', sql.NVARCHAR, document.document_name)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_document @document_id = @document_id, @document_code_id = @document_code_id,
                @document_name = @document_name, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function deleteDocument(transaction: any, document_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('document_id', sql.INT, document_id)
        .input('action_by', sql.INT, action_by)
        .input('action_by', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_document @document_id = @document_id, @action_by = @action_by, @action_by = @action_by
        `)
}