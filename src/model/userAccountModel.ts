import { getDateTime } from "../utils";
import { UserAccountType } from "../interfaces/userAccount";
const devConfig = require("../config/dbconfig")
const sql = require("mssql")

async function getUserAccountTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('fullname', sql.NVARCHAR, '%' + filter + '%')
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                DECLARE @userAccountTable IdType
                INSERT @userAccountTable
                EXEC DevelopERP_ForTesting2..sp_filterUserAccount @fullname = @fullname, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_ForTesting2..sp_formatUserAccountTable @userAccountTable = @userAccountTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP_ForTesting2..UserAccount UA
                LEFT JOIN (
                    SELECT 
                        person_id,
                        RTRIM(COALESCE(firstname + ' ', '') + COALESCE(lastname + ' ', '') + COALESCE('(' + nickname + ')', '')) AS fullname
                    FROM Person
                ) P
                ON UA.person_id = P.person_id
                WHERE fullname LIKE @fullname AND UA.active = 1
                
            `)

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
        let result = await pool.request()
            .input('user_id', sql.INT, user_id)
            .query(`
                SELECT
                    UA.username,
                    UA.profile_id,
                    COALESCE(UA.uid, '') AS uid
                FROM DevelopERP_ForTesting2..UserAccount UA
                WHERE UA.user_id = @user_id 

                DECLARE @personTable IdType
                INSERT INTO @personTable
                EXEC DevelopERP_ForTesting2..sp_filterPerson @fullname = '%', @customer_id = NULL, @fleet_id = NULL, @vehicle_id = NULL, @user_id = @user_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_ForTesting2..sp_formatPersonTable @personTable = @personTable, @firstIndex = 1
            `)
        
        return {
            userAccount: result.recordsets[0][0],
            person: result.recordsets[1],
        }
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function deleteUserAccountData (user_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('user_id', sql.INT, user_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_delete_userAccount @user_id = @user_id, @action_by = @action_by, @action_date = @action_date
            `)
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function createUserAccountData (body: UserAccountType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin()

        let userAccountResult = await transaction.request()
            .input('username', sql.NVARCHAR, body.userAccount.username)
            .input('password', sql.NVARCHAR, body.userAccount.password)
            .input('uid', sql.NVARCHAR, body.userAccount.uid)
            .input('person_id', sql.INT, body.userAccount.person_id)
            .input('profile_id', sql.INT, body.userAccount.profile_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_insert_userAccount @username = @username, @password = @password,
                    @uid = @uid, @person_id = @person_id, @profile_id = @profile_id,
                    @action_by = @action_by, @action_date = @action_date
            `)

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
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction()
        await transaction.begin()

        let userAccountResult = await transaction.request()
            .input('user_id', sql.INT, user_id)
            .input('uid', sql.NVARCHAR, body.userAccount.uid)
            .input('profile_id', sql.INT, body.userAccount.profile_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_update_userAccount @user_id = @user_id, @uid = @uid, @profile_id = @profile_id,
                    @action_by = @action_by, @action_date = @action_date
            `)

        await transaction.commit()

    } catch (err) {
        console.log(err)
        await transaction.rollback()
        throw err; 
    }
}

export default { getUserAccountTable, getUserAccountData, deleteUserAccountData, createUserAccountData, updateUserAccount }