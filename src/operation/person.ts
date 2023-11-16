const sql = require('mssql')
import { Person } from "../interfaces/person";

export async function createPersonNew(transaction: any, person: Person, action_by: number, datetime: object) {
    return await transaction.request()
        .input('firstname', sql.NVARCHAR, person.firstname === "" ? null : person.firstname)
        .input('lastname', sql.NVARCHAR, person.lastname === "" ? null : person.lastname)
        .input('nickname', sql.NVARCHAR, person.nickname === "" ? null : person.nickname)
        .input('title_code_id', sql.INT, person.title_code_id)
        .input('description', sql.NVARCHAR, person.description === "" ? null : person.description)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_Clear..sp_insert_person @firstname = @firstname, @lastname = @lastname, @nickname = @nickname,
            @title_code_id = @title_code_id, @description = @description, @action_by = @action_by, @action_date = @action_date
    `)
}