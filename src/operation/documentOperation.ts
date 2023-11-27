const sql = require('mssql')
import { Document } from "../interfaces/document"

export async function getDocumentTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('document_name', sql.NVARCHAR, "%" + filter + "%")
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .query(`
            DECLARE @documentTable IdType
            INSERT INTO @documentTable
            EXEC DevelopERP_ForTesting2..sp_filterDocument @document_name = @document_name, @customer_id = NULL, @person_id = NULL, 
                @address_id = NULL, @vehicle_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_ForTesting2..sp_formatDocument @documentTable = @documentTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data
            FROM DevelopERP_ForTesting2..Document
            WHERE document_name LIKE @document_name AND active = 1
        `)
}

export async function getDocumentData(transaction: any, document_id: string) {
    return await transaction.request()
        .input('document_id', sql.INT, document_id)
        .query(`
            SELECT 
                D.document_id,
                D.document_code_id,
                D.document_name,
                D.create_date,
                CASE
                    WHEN D.customer_id IS NOT NULL
                    THEN 'ลูกค้า'
                    WHEN D.person_id IS NOT NULL
                    THEN 'บุคคล'
                    WHEN D.address_id IS NOT NULL
                    THEN 'ที่อยู่'
                    WHEN D.vehicle_id IS NOT NULL
                    THEN 'ยานพาหนะ'
                END AS owner_type,
                D.customer_id,
                D.person_id,
                D.address_id,
                D.vehicle_id
            FROM DevelopERP_ForTesting2..Document D
            LEFT JOIN Customer C
            ON D.customer_id = C.customer_id
            LEFT JOIN Person P
            ON D.person_id = P.person_id
            LEFT JOIN Address A
            ON D.address_id = A.address_id
            LEFT JOIN Vehicle V
            ON D.vehicle_id = V.vehicle_id
            LEFT JOIN MasterCode M
            ON D.document_code_id = M.code_id
            LEFT JOIN MasterCode M_province
            ON V.registration_province_code_id = M.code_id
            WHERE D.document_id = @document_id AND D.active = 1
        `)
}

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
        .input('action_date', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_ForTesting2..sp_insert_document @document_code_id = @document_code_id, @customer_id = @customer_id,
            @person_id = @person_id, @address_id = @address_id, @vehicle_id = @vehicle_id,
            @document_name = @document_name, @value = @value, @create_date = @create_date, 
            @action_by = @action_by, @action_date = @action_date
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
            EXEC DevelopERP_ForTesting2..sp_update_document @document_id = @document_id, @document_code_id = @document_code_id,
                @document_name = @document_name, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function deleteDocument(transaction: any, document_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('document_id', sql.INT, document_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_ForTesting2..sp_delete_document @document_id = @document_id, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function downloadDocument(transaction: any, document_id: string) {
    return await transaction.request()
        .input('document_id', sql.INT, document_id)
        .query(`
            SELECT 
                document_name, value
            FROM DevelopERP_ForTesting2..Document
            WHERE document_id = @document_id
        `)
}