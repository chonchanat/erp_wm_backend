import { getDateTime } from "../utils"
import { DocumentType } from "../interfaces/document";
const devConfig = require('../config/dbconfig')
const sql = require('mssql')

import * as operation from "../operation/index";

async function getDocumentTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getDocumentTable(pool, index, filter);

        return {
            document: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        }

    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getDocumentData(document_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getDocumentData(pool, document_id);

        return {
            document: result.recordsets[0][0],
        }

    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function createDocumentData(body: DocumentType, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(file.originalname, 'latin1').toString('utf8');

            await operation.createDocumentNew(transaction, body.document.document_code_id, files[i].originalname, files[i].buffer,
                body.document.customer_id, body.document.person_id, body.document.address_id, body.document.vehicle_id,
                action_by, datetime)
        }

        await transaction.commit();
    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

async function updateDocumentData(document_id: string, body: DocumentType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updateDocument(transaction, document_id, body.document, action_by, datetime)

        await transaction.commit();

    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

async function deleteDocumentData(document_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        await operation.deleteDocument(pool, document_id, action_by, datetime);

    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function downloadDocument(document_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.downloadDocument(pool, document_id);

        return {
            document: result.recordsets[0][0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default { getDocumentTable, getDocumentData, createDocumentData, updateDocumentData, deleteDocumentData, downloadDocument }