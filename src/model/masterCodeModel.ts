import { getDateTime } from "../utils"
import { MasterCodeType, MasterCode } from "../interfaces/masterCode"
const devConfig = require('../config/dbconfig')
const sql = require('mssql')

import * as operation from "../operation/index"

async function getMasterCode(body: MasterCode) {
    try {
        let pool = await sql.connect(devConfig)

        let result = [];
        if (typeof (body.category) !== typeof ([])) {
            let temp = await operation.getMasterCode(pool, body.category as string, body.class as string)
            result.push(temp.recordsets[0])

        } else if (typeof (body.category) === typeof ([])) {
            for (let i = 0; i < body.category.length; i++) {
                let temp = await operation.getMasterCode(pool, body.category[i], body.class[i])
                result.push(temp.recordsets[0])
            }
        }

        return result
    } catch (err) {
        throw err
    }
}

async function getMasterCodeTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getMasterCodeTable(pool, index, filter);

        return {
            masterCode: result.recordsets[0],
            count_date: result.recordsets[1][0].count_data,
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getMasterCodeData(code_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getMasterCodeData(pool, code_id);

        return {
            masterCode: result.recordsets[0][0],
        }

    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function createMasterCodeData(body: MasterCodeType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.createMasterCodeData(transaction, body.masterCode, action_by, datetime)

        await transaction.commit();

    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

async function updateMasterCodeData(code_id: string, body: MasterCodeType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updateMasterCodeData(transaction, code_id, body.masterCode, action_by, datetime)

        await transaction.commit();
        
    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

async function deleteMasterCode(code_id: string, body: MasterCodeType) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        await operation.deleteMasterCode(pool, code_id, action_by, datetime);

    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getMasterCodeCategory() {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getMasterCodeCategory(pool);

        return {
            categories: result.recordsets[0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getMasterCodeClass(category: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getMasterCodeClass(pool, category);

        return {
            classes: result.recordsets[0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default {
    getMasterCode,
    getMasterCodeTable,
    getMasterCodeData,
    createMasterCodeData,
    updateMasterCodeData,
    deleteMasterCode,
    getMasterCodeCategory,
    getMasterCodeClass
}