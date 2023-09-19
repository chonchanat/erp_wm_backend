const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getPersonTable(index: number, filterPerson: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .input('fullname', sql.NVARCHAR, "%" + filterPerson + "%")
            .query(`
                EXEC DevelopERP..getPersonTable @fullname = @fullname, @firstIndex = @firstIndex, @lastIndex = @lastIndex

                SELECT COUNT(*) AS count_data
                FROM (
                    SELECT 
                    person_id,
                    COALESCE(firstname + ' ', '') + COALESCE(lastname, '') + COALESCE('(' + nickname + ')', '') AS fullname
                    FROM DevelopERP..Person
                ) t
                WHERE fullname LIKE @fullname
            `)
        return {
            person: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getPersonData(personId: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('person_id', sql.INT, personId)
            .query(`
                SELECT
                    p.person_id as person_id,
                    COALESCE(p.firstname, '') as firstname,
                    COALESCE(p.lastname, '') as lastname,
                    COALESCE(p.nickname, '') as nickname,
                    m.code_id as title_code_id,
                    m.value as title_type,
                    COALESCE(p.description, '') as description
                FROM DevelopERP..Person p
                LEFT JOIN DevelopERP..MasterCode m
                on p.title_code_id = m.code_id
                WHERE person_id = @person_id

                SELECT 
                    role_code_id, value AS role_type
                FROM DevelopERP..Person_Role PR
                LEFT JOIN DevelopERP..MasterCode M
                ON PR.role_code_id = M.code_id
                WHERE person_id = @person_id

                DECLARE @customerTable TABLE (
                    customer_id INT,
                    customer_name NVARCHAR(MAX),
                    telephone NVARCHAR(MAX),
                    email NVARCHAR(MAX)
                )
                INSERT INTO @customerTable
                EXEC DevelopERP..getCustomerTable @customer_name = '%%', @firstIndex = 0, @lastIndex = 0
                SELECT C.customer_id, C.customer_name, C.telephone, C.email
                FROM @customerTable AS C
                LEFT JOIN DevelopERP..Customer_Person CP
                ON C.customer_id = CP.customer_id
                WHERE CP.person_id = @person_id

                DECLARE @contactTable TABLE (
                    contact_id INT,
                    value NVARCHAR(MAX),
                    contact_type NVARCHAR(MAX),
                    owner_name NVARCHAR(MAX),
                    customer_id INT,
                    person_id INT
                )
                INSERT INTO @contactTable
                EXEC getContactTable @value = '%', @firstIndex = 0, @lastIndex = 0
                SELECT contact_id, value, contact_type
                FROM @contactTable
                WHERE person_id = @person_id

                DECLARE @addressTable TABLE (
                    address_id INT,
                    location NVARCHAR(MAX),
                    address_type NVARCHAR(MAX)
                )
                INSERT INTO @addressTable
                EXEC DevelopERP..getAddressTable @location = '%', @firstIndex= 0, @lastIndex= 0
                SELECT A.address_id, A.location, A.address_type
                FROM @addressTable A
                LEFT JOIN DevelopERP..Address_Person AP
                ON A.address_id = AP.address_id
                WHERE AP.person_id = @person_id
                
            `)
        return {
            person: result.recordsets[0][0],
            role: result.recordsets[1],
            customer: result.recordsets[2],
            contact: result.recordsets[3],
            address: result.recordsets[4]
        };
    } catch (err) {
        throw err;
    }
}

async function createPersonData(body: any) {
    let transaction;
    try {
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction;
        await transaction.begin();

        let personResult = await transaction.request()
            .input('firstname', sql.NVARCHAR, body.person.firstName)
            .input('lastname', sql.NVARCHAR, body.person.lastname)
            .input('nickname', sql.NVARCHAR, body.person.nickname)
            .input('title_code_id', sql.INT, body.person.title_code_id)
            .input('description', sql.NVARCHAR, body.person.description)
            .query(`
                INSERT INTO DevelopERP..Person (firstname, lastname, nickname, title_code_id, description)
                OUTPUT inserted.person_id
                VALUES (@firstname, @lastname, @nickname, @title_code_id, @description)
            `)
        let person_id = personResult.recordset[0].person_id

        for (const role of body.role) {
            let roleResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('role_code_id', sql.INT, role.role_code_id)
                .query(`
                    INSERT INTO DevelopERP..Person_Role (person_id, role_code_id)
                    VALUES (@person_id, @role_code_id)
                `)
        }

        for (const customer of body.customerExist) {
            let customerResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('customer_id', sql.INT, customer)
                .query(`
                    INSERT INTO DevelopERP..Customer_Person (person_id, customer_id)
                    VALUES (@person_id, @customer_id)
                `)
        }

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}


export default { getPersonTable, getPersonData }