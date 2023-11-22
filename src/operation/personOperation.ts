const sql = require('mssql')
import { Person } from "../interfaces/person";

export async function getPersonTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .input('fullname', sql.NVARCHAR, "%" + filter + "%")
        .query(`
            DECLARE @personTable IdType
            INSERT INTO @personTable
            EXEC DevelopERP_Clear..sp_filterPerson @fullname = @fullname, @customer_id = NULL, @fleet_id = NULL, @vehicle_id = NULL, @user_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_Clear..sp_formatPersonTable @personTable = @personTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data
            FROM (
                SELECT 
                person_id,
                COALESCE(firstname + ' ', '') + COALESCE(lastname, '') + COALESCE('(' + nickname + ')', '') AS fullname,
                active
                FROM DevelopERP_Clear..Person
            ) t
            WHERE fullname LIKE @fullname AND active = 1
        `)
}

export async function getPersonName(transaction: any) {
    return await transaction.request()
        .query(`
            SELECT 
                person_id, 
                RTRIM(COALESCE(firstname + ' ', '') + COALESCE(lastname + ' ', '') + COALESCE('(' + nickname + ')', '')) AS fullname
            FROM Person
            ORDER BY fullname
        `)
}

export async function getPersonData(transaction: any, person_id: string) {
    return await transaction.request()
        .input('person_id', sql.INT, person_id)
        .query(`
            SELECT
                p.person_id as person_id,
                COALESCE(p.firstname, '') as firstname,
                COALESCE(p.lastname, '') as lastname,
                COALESCE(p.nickname, '') as nickname,
                m.code_id as title_code_id,
                m.value as title_type,
                COALESCE(p.description, '') as description
            FROM DevelopERP_Clear..Person p
            LEFT JOIN DevelopERP_Clear..MasterCode m
            on p.title_code_id = m.code_id
            WHERE person_id = @person_id AND p.active = 1

            SELECT 
                role_code_id, value AS role_type
            FROM DevelopERP_Clear..Person_Role PR
            LEFT JOIN DevelopERP_Clear..MasterCode M
            ON PR.role_code_id = M.code_id
            WHERE person_id = @person_id
            
            DECLARE @customerTable IdType
            INSERT INTO @customerTable
            EXEC DevelopERP_Clear..sp_filterCustomer @customer_name = '%', @fleet_id = NULL, @person_id = @person_id, @vehicle_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatCustomerTable @customerTable = @customerTable, @firstIndex = 1

            DECLARE @contactTable IdType
            INSERT INTO @contactTable
            EXEC DevelopERP_Clear..sp_filterContact @value = '%', @customer_id = NULL, @person_id = @person_id, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatContactTable @contactTable = @contactTable, @firstIndex = 1
            
            DECLARE @addressTable IdType
            INSERT INTO @addressTable
            EXEC DevelopERP_Clear..sp_filterAddress @location = '%', @customer_id = NULL, @person_id = @person_id, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatAddressTable @addressTable = @addressTable, @firstIndex = 1

            DECLARE @documentTable IdType
            INSERT INTO @documentTable
            EXEC DevelopERP_Clear..sp_filterDocument @document_name = '%', @customer_id = NULL, @person_id = @person_id, 
                @address_id = NULL, @vehicle_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatDocument @documentTable = @documentTable, @firstIndex = 1

            DECLARE @cardTable IdType
            INSERT @cardTable
            EXEC DevelopERP_Clear..sp_filterCard @value = '%', @person_id = @person_id, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatCardTable @cardTable = @cardTable, @firstIndex = 1
        `)
}

export async function deletePerson(transaction: any, person_id: string, action_by: number, datetime: object) {
    return await transaction.request()
        .input('person_id', sql.INT, person_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_person @person_id = @person_id, @action_by = @action_by, @action_date = @action_date
        `)
}

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

export async function updatePerson(transaction: any, person_id: string | number, person: Person, action_by: number, datetime: object) {
    return await transaction.request()
        .input('person_id', sql.INT, person_id)
        .input('firstname', sql.NVARCHAR, person.firstname === "" ? null : person.firstname)
        .input('lastname', sql.NVARCHAR, person.lastname === "" ? null : person.lastname)
        .input('nickname', sql.NVARCHAR, person.nickname === "" ? null : person.nickname)
        .input('title_code_id', sql.INT, person.title_code_id)
        .input('description', sql.NVARCHAR, person.description === "" ? null : person.description)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
                EXEC DevelopERP_Clear..sp_update_person @person_id = @person_id, @firstname = @firstname, @lastname = @lastname, 
                    @nickname = @nickname, @title_code_id = @title_code_id, @description = @description, 
                    @action_by = @action_by, @action_date = @action_date
        `)
}