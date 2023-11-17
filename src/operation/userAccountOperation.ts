const sql = require('mssql')
import { UserAccount } from "../interfaces/userAccount"

export async function createUserAccountNew(transaction: any, userAccount: UserAccount, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('username', sql.NVARCHAR, userAccount.username)
        .input('password', sql.NVARCHAR, userAccount.password)
        .input('uid', sql.NVARCHAR, userAccount.uid)
        .input('person_id', sql.INT, userAccount.person_id)
        .input('profile_id', sql.INT, userAccount.profile_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_Clear..sp_insert_userAccount @username = @username, @password = @password,
            @uid = @uid, @person_id = @person_id, @profile_id = @profile_id,
            @action_by = @action_by, @action_date = @action_date
    `)
}

export async function updateUserAccount(transaction: any, user_id: string | number, userAccount: UserAccount, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('user_id', sql.INT, user_id)
        .input('uid', sql.NVARCHAR, userAccount.uid)
        .input('profile_id', sql.INT, userAccount.profile_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_userAccount @user_id = @user_id, @uid = @uid, @profile_id = @profile_id,
                @action_by = @action_by, @action_date = @action_date
        `)
}