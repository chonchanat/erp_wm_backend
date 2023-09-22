const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../utils"

async function getPersonTable(index: number, filterPerson: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .input('fullname', sql.NVARCHAR, "%" + filterPerson + "%")
            .query(`
                EXEC chonTest..getPersonTable @fullname = @fullname, @firstIndex = @firstIndex, @lastIndex = @lastIndex

                SELECT COUNT(*) AS count_data
                FROM (
                    SELECT 
                    person_id,
                    COALESCE(firstname + ' ', '') + COALESCE(lastname, '') + COALESCE('(' + nickname + ')', '') AS fullname,
                    isArchived
                    FROM chonTest..Person
                ) t
                WHERE fullname LIKE @fullname AND isArchived = 0
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
                FROM chonTest..Person p
                LEFT JOIN chonTest..MasterCode m
                on p.title_code_id = m.code_id
                WHERE person_id = @person_id AND isArchived = 0

                SELECT 
                    role_code_id, value AS role_type
                FROM chonTest..Person_Role PR
                LEFT JOIN chonTest..MasterCode M
                ON PR.role_code_id = M.code_id
                WHERE person_id = @person_id

                DECLARE @customerTable TABLE (
                    customer_id INT,
                    customer_name NVARCHAR(MAX),
                    telephone NVARCHAR(MAX),
                    email NVARCHAR(MAX)
                )
                INSERT INTO @customerTable
                EXEC chonTest..getCustomerTable @customer_name = '%%', @firstIndex = 0, @lastIndex = 0
                SELECT C.customer_id, C.customer_name, C.telephone, C.email
                FROM @customerTable AS C
                LEFT JOIN chonTest..Customer_Person CP
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
                EXEC chonTest..getContactTable @value = '%', @firstIndex = 0, @lastIndex = 0
                SELECT contact_id, value, contact_type
                FROM @contactTable
                WHERE person_id = @person_id

                DECLARE @addressTable TABLE (
                    address_id INT,
                    location NVARCHAR(MAX),
                    address_type NVARCHAR(MAX)
                )
                INSERT INTO @addressTable
                EXEC chonTest..getAddressTable @location = '%', @firstIndex= 0, @lastIndex= 0
                SELECT A.address_id, A.location, A.address_type
                FROM @addressTable A
                LEFT JOIN chonTest..Address_Person AP
                ON A.address_id = AP.address_id
                WHERE AP.person_id = @person_id
                
            `)
        // return {
        //     person: result.recordsets[0][0],
        //     role: result.recordsets[1],
        //     customer: result.recordsets[2],
        //     contact: result.recordsets[3],
        //     address: result.recordsets[4]
        // };
        return {
            person: {
                ...result.recordsets[0][0],
                role: result.recordsets[1],
            },
            customer: result.recordsets[2],
            contact: result.recordsets[3],
            address: result.recordsets[4]
        }
    } catch (err) {
        throw err;
    }
}

async function deletePerson(personId: string) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('person_id', sql.INT, personId)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE chonTest..Person
                SET isArchived = 1, update_date = @update_date
                WHERE person_id = @person_id
            `)
    } catch (err) {
        throw err;
    }
}

const personQuery = `
    INSERT INTO chonTest..Person (firstname, lastname, nickname, title_code_id, description, create_by, create_date, isArchived)
    OUTPUT inserted.person_id
    VALUES (@firstname, @lastname, @nickname, @title_code_id, @description, @create_by, @create_date, @isArchived)
`
const roleQuery = `
    INSERT INTO chonTest..Person_Role (person_id, role_code_id)
    VALUES (@person_id, @role_code_id)
`
const roleDeleteQuery = `
    DELETE FROM chonTest..Person_Role
    WHERE person_id = @person_id AND role_code_id = @role_code_id
`
const customerPersonQuery = `
    INSERT INTO chonTest..Customer_Person (person_id, customer_id)
    VALUES (@person_id, @customer_id)
`
const customerPersonDeleteQuery = `
    DELETE FROM chonTest..Customer_Person
    WHERE person_id = @person_id AND customer_id = @customer_id
`
const contactQuery = `
    INSERT INTO chonTest..Contact (person_id, value, contact_code_id, create_by, create_date, isArchived)
    VALUES (@person_id, @value, @contact_code_id, @create_by, @create_date, @isArchived)
`
const contactDeleteQuery = `
    UPDATE chonTest..Contact
    SET isArchived = 1
    WHERE contact_id = @contact_id AND person_id = @person_id
`
const addressQuery = `
    INSERT INTO chonTest..Address (name, house_no, village_no, alley, road, sub_district, district, province, postal_code, create_by, create_date, isArchived)
    OUTPUT INSERTED.address_id
    VALUES (@name, @house_no, @village_no, @alley, @road, @sub_district, @district, @province, @postal_code, @create_by, @create_date, @isArchived)
`
const addressPersonQuery = `
    INSERT INTO chonTest..Address_Person (person_id, address_id)
    VALUES (@person_id, @address_id)
`
const addressPersonDeleteQuery = `
    DELETE FROM chonTest..Address_Person
    WHERE person_id = @person_id AND address_id = @address_id
`
const addressMasterCodeQuery = `
    INSERT INTO chonTest..Address_MasterCode (address_id, address_type_code_id)
    VALUES (@address_id, @address_type_code_id)
`

async function createPersonData(body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        let personResult = await transaction.request()
            .input('firstname', sql.NVARCHAR, body.person.firstname === "" ? null : body.person.firstname)
            .input('lastname', sql.NVARCHAR, body.person.lastname === "" ? null : body.person.lastname)
            .input('nickname', sql.NVARCHAR, body.person.nickname === "" ? null : body.person.nickname)
            .input('title_code_id', sql.INT, body.person.title_code_id)
            .input('description', sql.NVARCHAR, body.person.description === "" ? null : body.person.description)
            .input('create_by', sql.INT, body.create_by)
            .input('create_date', sql.DATETIME, datetime)
            .input('isArchived', sql.INT, 0)
            .query(personQuery)
        let person_id = personResult.recordset[0].person_id

        for (const role of body.person.role) {
            let roleResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('role_code_id', sql.INT, role)
                .query(roleQuery)
        }

        for (const customer of body.customerExist) {
            let customerResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('customer_id', sql.INT, customer)
                .query(customerPersonQuery)
        }

        for (const contact of body.contact) {
            let contactResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('value', sql.NVARCHAR, contact.value)
                .input('contact_code_id', sql.INT, contact.contact_code_id)
                .input('create_by', sql.INT, body.create_by)
                .input('create_date', sql.DATETIME, datetime)
                .input('isArchived', sql.INT, 0)
                .query(contactQuery)
        }

        for (const address of body.addressNew) {
            let addressResult = await transaction.request()
                .input('name', sql.NVARCHAR, address.name === "" ? null : address.name)
                .input('house_no', sql.NVARCHAR, address.house_no === "" ? null : address.house_no)
                .input('village_no', sql.NVARCHAR, address.village_no === "" ? null : address.village_no)
                .input('alley', sql.NVARCHAR, address.alley === "" ? null : address.alley)
                .input('road', sql.NVARCHAR, address.road === "" ? null : address.road)
                .input('sub_district', sql.NVARCHAR, address.sub_district === "" ? null : address.sub_district)
                .input('district', sql.NVARCHAR, address.district === "" ? null : address.district)
                .input('province', sql.NVARCHAR, address.province === "" ? null : address.province)
                .input('postal_code', sql.NVARCHAR, address.postal_code === "" ? null : address.postal_code)
                .input('create_by', sql.INT, body.create_by)
                .input('create_date', sql.DATETIME, datetime)
                .input('isArchived', sql.INT, 0)
                .query(addressQuery)
            const address_id = addressResult.recordset[0].address_id
            let addressPersonResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('address_id', sql.INT, address_id)
                .query(addressPersonQuery)
            for (const addressMasterCode of address.address_type_code_id) {
                let addressMaterCodeResult = await transaction.request()
                    .input('address_id', sql.INT, address_id)
                    .input('address_type_code_id', sql.INT, addressMasterCode)
                    .query(addressMasterCodeQuery)
            }
        }

        for (const address of body.addressExist) {
            let addressResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('address_id', sql.INT, address)
                .query(addressPersonQuery)
        }

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function updatePersonDate(personId: string, body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();
        let personResult = await transaction.request()
            .input('person_id', sql.INT, personId)
            .input('firstname', sql.NVARCHAR, body.person.firstname === "" ? null : body.person.firstname)
            .input('lastname', sql.NVARCHAR, body.person.lastname === "" ? null : body.person.lastname)
            .input('nickname', sql.NVARCHAR, body.person.nickname === "" ? null : body.person.nickname)
            .input('title_code_id', sql.INT, body.person.title_code_id)
            .input('description', sql.NVARCHAR, body.person.description === "" ? null : body.person.description)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE chonTest..Person
                SET firstname = @firstname, lastname = @lastname, nickname = @nickname, title_code_id = @title_code_id, description = @description, update_date = @update_date
                WHERE person_id = @person_id
            `)

        for (const role of body.person.roleDelete) {
            let roleResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('role_code_id', sql.INT, role)
                .query(roleDeleteQuery)
        }
        for (const role of body.person.role) {
            let roleResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('role_code_id', sql.INT, role)
                .query(roleQuery)
        }

        for (const customer of body.customerDelete) {
            let customerResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('customer_id', sql.INT, customer)
                .query(customerPersonDeleteQuery)
        }
        for (const customer of body.customerExist) {
            let customerResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('customer_id', sql.INT, customer)
                .query(customerPersonQuery)
        }

        for (const contact of body.contactDelete) {
            let contactResult = await transaction.request()
                .input('person_id',sql.INT, personId)
                .input('contact_id', sql.INT, contact)
                .query(contactDeleteQuery)
        }
        for (const contact of body.contact) {
            let contactResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('value', sql.NVARCHAR, contact.value)
                .input('contact_code_id', sql.INT, contact.contact_code_id)
                .input('create_by', sql.INT, body.create_by)
                .input('create_date', sql.DATETIME, datetime)
                .input('isArchived', sql.INT, 0)
                .query(contactQuery)
        }

        for (const address of body.addressNew) {
            let addressResult = await transaction.request()
                .input('name', sql.NVARCHAR, address.name === "" ? null : address.name)
                .input('house_no', sql.NVARCHAR, address.house_no === "" ? null : address.house_no)
                .input('village_no', sql.NVARCHAR, address.village_no === "" ? null : address.village_no)
                .input('alley', sql.NVARCHAR, address.alley === "" ? null : address.alley)
                .input('road', sql.NVARCHAR, address.road === "" ? null : address.road)
                .input('sub_district', sql.NVARCHAR, address.sub_district === "" ? null : address.sub_district)
                .input('district', sql.NVARCHAR, address.district === "" ? null : address.district)
                .input('province', sql.NVARCHAR, address.province === "" ? null : address.province)
                .input('postal_code', sql.NVARCHAR, address.postal_code === "" ? null : address.postal_code)
                .input('create_by', sql.INT, body.update_by)
                .input('create_date', sql.DATETIME, datetime)
                .input('isArchived', sql.INT, 0)
                .query(addressQuery)
            const address_id = addressResult.recordset[0].address_id
            let addressPersonResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('address_id', sql.INT, address_id)
                .query(addressPersonQuery)
            for (const addressMasterCode of address.addres_type_code_id) {
                let addressMasterCodeResult = await transaction.request()
                    .input('addrsss_id', sql.INT, address_id)
                    .input('address_type_code_id', sql.INT, addressMasterCode)
                    .query(addressMasterCodeQuery)
            }
        }

        for (const address of body.addressDelete) {
            let addressResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('address_id', sql.INT, address)
                .query(addressPersonDeleteQuery)
        }
        for (const address of body.addressExist) {
            let addressResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('address_id', sql.INT, address)
                .query(addressPersonQuery)
        }

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export default { getPersonTable, getPersonData, deletePerson, createPersonData, updatePersonDate }