import { getDateTime } from "../utils";
import { UserAccountType } from "../interfaces/userAccount";
const devConfig = require("../config/dbconfig")
const sql = require("mssql")

import * as operation from "../operation/index"

async function getUserAccountTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await operation.getUserAccountTable(pool, index, filter);

        return {
            userAccount: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        }
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function getUserAccountData(user_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getUserAccountData(pool, user_id);

        return {
            userAccount: result.recordsets[0][0],
            person: result.recordsets[1],
        }
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function deleteUserAccountData(user_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig)
        await operation.deleteUserAccount(pool, user_id, action_by, datetime);

    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function createUserAccountData(body: UserAccountType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin()

        await operation.createUserAccountNew(transaction, body.userAccount, action_by, datetime)

        await transaction.commit()

    } catch (err) {
        console.log(err)
        await transaction.rollback()
        throw err;
    }
}

async function updateUserAccount(user_id: string, body: UserAccountType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction()
        await transaction.begin()

        await operation.updateUserAccount(transaction, user_id, body.userAccount, action_by, datetime)

        await transaction.commit()

    } catch (err) {
        console.log(err)
        await transaction.rollback()
        throw err;
    }
}

export default { getUserAccountTable, getUserAccountData, deleteUserAccountData, createUserAccountData, updateUserAccount }