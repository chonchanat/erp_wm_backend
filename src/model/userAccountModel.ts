import { getDateTime } from "../utils";

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
                DECLARE @userAccountTable UserAccountType
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
                WHERE fullname LIKE @fullname AND UA.is_archived = 0
                
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
                FROM DevelopERP_Clear..UserAccount UA
                WHERE UA.user_id = @user_id 

                DECLARE @personTable IdType
                INSERT INTO @personTable
                EXEC DevelopERP_Clear..sp_filterPerson @fullname = '%', @customer_id = NULL, @fleet_id = NULL, @vehicle_id = NULL, @user_id = @user_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatPersonTable @personTable = @personTable, @firstIndex = 1
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

export default { getUserAccountTable, getUserAccountData }