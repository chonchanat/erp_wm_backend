const sql = require('mssql')
import { UserAccount } from "../interfaces/userAccount"

export async function getUserAccountTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('fullname', sql.NVARCHAR, '%' + filter + '%')
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .query(`
            DECLARE @userAccountTable IdType
            INSERT @userAccountTable
            EXEC DevelopERP_Clear..sp_filterUserAccount @fullname = @fullname, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_Clear..sp_formatUserAccountTable @userAccountTable = @userAccountTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data
            FROM DevelopERP_Clear..UserAccount UA
            LEFT JOIN (
                SELECT 
                    person_id,
                    RTRIM(COALESCE(firstname + ' ', '') + COALESCE(lastname + ' ', '') + COALESCE('(' + nickname + ')', '')) AS fullname
                FROM Person
            ) P
            ON UA.person_id = P.person_id
            WHERE fullname LIKE @fullname AND UA.active = 1
        `)
}

export async function getUserAccountData(transaction: any, user_id: string) {
    return await transaction.request()
        .input('user_id', sql.INT, user_id)
        .query(`
            SELECT
                UA.username,
                UA.profile_id,
                COALESCE(UA.uid, '') AS uid
            FROM DevelopERP_Clear..UserAccount UA
            WHERE UA.user_id = @user_id 

            DECLARE @personTable IdType
            INSERT INTO @personTable
            EXEC DevelopERP_Clear..sp_filterPerson @fullname = '%', @customer_id = NULL, @fleet_id = NULL, @vehicle_id = NULL, @user_id = @user_id, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatPersonTable @personTable = @personTable, @firstIndex = 1
        `)
}

export async function deleteUserAccount(transaction: any, user_id: string, action_by: number, datetime: object) {
    return await transaction.request()
        .input('user_id', sql.INT, user_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_userAccount @user_id = @user_id, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function createUserAccountNew(transaction: any, userAccount: UserAccount, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('username', sql.NVARCHAR, userAccount.username !== "" ? userAccount.username : null)
        .input('password', sql.NVARCHAR, userAccount.password !== "" ? userAccount.password : null)
        .input('uid', sql.NVARCHAR, userAccount.uid !== "" ? userAccount.uid : null)
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
        .input('uid', sql.NVARCHAR, userAccount.uid !== "" ? userAccount.uid : null)
        .input('profile_id', sql.INT, userAccount.profile_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_userAccount @user_id = @user_id, @uid = @uid, @profile_id = @profile_id,
                @action_by = @action_by, @action_date = @action_date
        `)
}