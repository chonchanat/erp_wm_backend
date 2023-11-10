import { getDateTime } from "../utils"

const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getDocumentTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('document_name', sql.NVARCHAR, "%" + filter + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                
            `)
        
        return {
            document: result.recordsets[0],
        }

    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getDocumentData(document_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('document_id', sql.INT, document_id)
            .query(`
                SELECT * 
                FROM DevelopERP_Clear..Document
                WHERE document_id = @document_id
            `)
        
        return {
            document: result.recordsets[0][0],
        }

    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function createDocumentData(body: any, files: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);

        console.log(body)
        for (let file of files) {
            let documentResult = await pool.request()
                .input('document_code_id', sql.INT, body.document.document_code_id)
                .input('customer_id', sql.INT, body.document.customer_id)
                .input('person_id', sql.INT, body.document.person_id)
                .input('address_id', sql.INT, body.document.address_id)
                .input('vehicle_id', sql.INT, body.document.vehicle_id)
                .input('document_name', sql.NVARCHAR, file.originalname)
                .input('value', sql.VARBINARY, file.buffer)
                .input('create_by', sql.DATETIME, datetime)
                .input('is_archived', sql.INT, 0)
                .query(`
                    INSERT INTO DevelopERP_Clear..Document (document_code_id, customer_id, person_id, address_id, vehicle_id, document_name, value, create_by, is_archived)
                    VALUES (@document_code_id, @customer_id, @person_id, @address_id, @vehicle_id, @document_name, @value, @create_by, @is_archived)
                `)
        }

    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default { getDocumentData, createDocumentData }