const sql = require('mssql')
import { MasterCode } from "../interfaces/masterCode"

export async function getMasterCode(transaction: any, category: string, classes: string) {
    return await transaction.request()
        .input('category', sql.NVARCHAR, category !== undefined ? category : "%")
        .input('class', sql.NVARCHAR, classes !== undefined ? classes : "%")
        .query(`
            SELECT *
            FROM DevelopERP_Clear..MasterCode
            WHERE category LIKE @category ${classes === undefined ? "" : `AND class ${classes === "null" ? "IS NULL" : "LIKE @class"}`} AND active = 1
        `)
}

export async function getMasterCodeTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('value', sql.NVARCHAR, "%" + filter + "%")
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .query(`
            DECLARE @masterCodeTable IdType
            INSERT INTO @masterCodeTable
            EXEC DevelopERP_Clear..sp_filterMasterCode @value = @value, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_Clear..sp_formatMasterCode @masterCodeTable = @masterCodeTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data 
            FROM DevelopERP_Clear..MasterCode
            WHERE value LIKE @value AND active = 1
        `)
}

export async function getMasterCodeData(transaction: any, code_id: string) {
    return await transaction.request()
        .input('code_id', sql.INT, code_id)
        .query(`
            SELECT
                code_id, category, COALESCE(class, '-') AS class, value
            FROM DevelopERP_Clear..MasterCode
            WHERE code_id = @code_id
        `)
}

export async function createMasterCodeData(transaction: any, masterCode: MasterCode, action_by: number, datetime: object) {
    return transaction.request()
        .input('category', sql.NVARCHAR, masterCode.category !== "" ? masterCode.category : null)
        .input('class', sql.NVARCHAR, masterCode.class !== "" ? masterCode.class : null)
        .input('value', sql.NVARCHAR, masterCode.value !== "" ? masterCode.value : null)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_masterCode @category = @category, @class = @class, @value = @value,
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function updateMasterCodeData(transaction: any, code_id: string, masterCode: MasterCode, action_by: number, datetime: object) {
    return transaction.request()
        .input('code_id', sql.INT, code_id)
        .input('value', sql.NVARCHAR, masterCode.value !== "" ? masterCode.value : null)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_masterCode @code_id = @code_id, @value = @value, @action_by = @action_by,
                @action_date = @action_date
        `)
}

export async function deleteMasterCode(transaction: any, code_id: string, action_by: number, datetime: object) {
    return transaction.request()
        .input('code_id', sql.INT, code_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_masterCode @code_id = @code_id, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function getMasterCodeCategory(transaction: any) {
    return await transaction.request()
        .query(`
            SELECT category
            FROM DevelopERP_Clear..MasterCode
            WHERE active = 1
            GROUP BY category
        `)
}

export async function getMasterCodeClass(transaction: any, category: string) {
    return await transaction.request()
        .input('category', sql.NVARCHAR, category)
        .query(`
            SELECT class
            FROM DevelopERP_Clear..MasterCode
            WHERE category LIKE @category AND active = 1
            GROUP BY class
        `)
}