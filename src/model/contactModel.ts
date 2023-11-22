import { getDateTime } from "../utils"
import { ContactType } from "../interfaces/contact"
const devConfig = require('../config/dbconfig')
const sql = require('mssql')

import * as operation from "../operation/index"

async function getContactTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await operation.getContactTable(pool, index, filter);

        return {
            contact: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data,
        }
    } catch (err) {
        throw err;
    }
}

async function getContactData(contact_id: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await operation.getContactData(pool, contact_id);

        return result.recordsets[0][0]
    } catch (err) {
        throw err;
    }
}

async function deleteContact(contact_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);

        await operation.deleteContact(pool, contact_id, action_by, datetime)
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

        await operation.updateContact(transaction, contact_id, body.contact, action_by, datetime)

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export default { getContactTable, getContactData, deleteContact, createContactData, updateContactData }