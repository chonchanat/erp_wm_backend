import { getDateTime } from "../utils"
import { CustomerType } from "../interfaces/customer";

const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getCustomerTable(index: number, filterCustomerName: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('customer_name', sql.NVARCHAR, "%" + filterCustomerName + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
            SELECT
                customer_id, customer_name, sales_type_code_id, customer_type_code_id, COALESCE(phone, '-') as telephone, COALESCE(email, '-') as email
            FROM (
                SELECT
                    C.customer_id,
                    C.customer_name,
                    C.sales_type_code_id,
                    C.customer_type_code_id,
                    Cphone.value AS phone,
                    Cemail.value AS email,
                    ROW_NUMBER() OVER (ORDER BY C.customer_id) AS RowNum
                FROM DevelopERP..Customer C
                LEFT JOIN (
                    SELECT customer_id, min(contact_code_id) as contact_code_id, max(value) as value
                    FROM DevelopERP..Contact
                    WHERE contact_code_id = 2
                    GROUP BY customer_id
                ) Cphone
                ON C.customer_id = Cphone.customer_id AND Cphone.contact_code_id = 2
                LEFT JOIN(
                    SELECT customer_id, min(contact_code_id) as contact_code_id, max(value) as value
                    FROM DevelopERP..Contact
                    WHERE contact_code_id = 3
                    GROUP BY customer_id
                ) Cemail
                ON C.customer_id = Cemail.customer_id AND Cemail.contact_code_id = 3
                WHERE C.customer_name LIKE @customer_name AND isArchived = 0
            ) AS SubQuery
            WHERE (@firstIndex = 0 OR @lastIndex = 0 OR RowNum BETWEEN @firstIndex AND @lastIndex)

            SELECT COUNT(*) AS count_data 
            FROM DevelopERP..Customer
            WHERE customer_name LIKE @customer_name AND isArchived = 0
            `)
        return {
            customer: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getCustomerData(customerId: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('customer_id', sql.INT, customerId)
            .query(`
                SELECT C.customer_id, C.customer_name, C.sales_type_code_id, MC1.value AS sales_type, C.customer_type_code_id, MC2.value as customer_type
                FROM DevelopERP..Customer C
                INNER JOIN DevelopERP..MasterCode MC1
                ON C.sales_type_code_id = MC1.code_id
                INNER JOIN DevelopERP..MasterCode MC2
                ON C.customer_type_code_id = MC2.code_id
                WHERE customer_id = @customer_id
                
                SELECT P.person_id, 
                    COALESCE(P.firstname + ' ', '') + COALESCE(P.lastname + ' ', '') + COALESCE('(' + P.nickname + ')', '') AS fullname,
                    COALESCE(CTemail.value, '-') AS email,
                    COALESCE(CTmobile.value, '-') AS mobile,
                    COALESCE(P.description, '-') AS description
                    /*, STUFF((
                        SELECT ', ' + M.value
                        FROM DevelopERP..Person_Role PR
                        LEFT JOIN DevelopERP..MasterCode M
                        ON PR.role_code_id = M.code_id
                        WHERE PR.person_id = P.person_id
                        FOR XML PATH('')
                    ), 1, 2, '') AS role */
                FROM DevelopERP..Person P
                LEFT JOIN DevelopERP..Customer_Person CP
                ON P.person_id = CP.person_id
                LEFT JOIN (
                    SELECT person_id, min(contact_code_id) as contact_code_id, max(value) as value
                    FROM DevelopERP..Contact
                    WHERE contact_code_id = 3
                    GROUP BY person_id
                ) CTemail
                ON P.person_id = CTemail.person_id AND CTemail.contact_code_id = 3
                LEFT JOIN (
                    SELECT person_id, min(contact_code_id) as contact_code_id, max(value) as value
                    FROM DevelopERP..Contact
                    WHERE contact_code_id = 2
                    GROUP BY person_id
                ) CTmobile
                ON P.person_id = CTmobile.person_id AND CTmobile.contact_code_id = 2
                WHERE CP.customer_id = @customer_id
                
                SELECT 
                    CT.contact_id, M.value AS contact_type, CT.value AS value
                FROM DevelopERP..Contact CT
                LEFT JOIN DevelopERP..MasterCode M
                ON CT.contact_code_id = M.code_id
                WHERE CT.customer_id = 92

                SELECT 
                    A.address_id,
                    COALESCE(A.name + ', ', '') + 
                    COALESCE(A.house_no + ', ', '') +
                    COALESCE('หมู่ที่ ' + A.village_no + ', ', '') + 
                    COALESCE('ซอย' + A.alley + ', ', '') +
                    COALESCE('ถนน' + A.road + ', ', '') + 
                    COALESCE(A.sub_district + ', ', '') +
                    COALESCE(A.district + ', ', '') +
                    COALESCE(A.province + ', ', '') +
                    COALESCE(A.postal_code , '') as location,
                    STUFF((
                        SELECT ', ' + M.value
                        FROM DevelopERP..Address_MasterCode AM
                        LEFT JOIN DevelopERP..MasterCode M
                        ON AM.address_type_code_id = M.code_id
                        WHERE AM.address_id = A.address_id
                        FOR XML PATH('')
                    ), 1, 2, '') AS address_type
                FROM DevelopERP..Address A
                LEFT JOIN DevelopERP..Address_Customer AC
                ON A.address_id = AC.address_id
                WHERE AC.customer_id = @customer_id
            `)
        return {
            customer: result.recordsets[0][0],
            person: result.recordsets[1],
            contact: result.recordsets[2],
            address: result.recordsets[3],
        };
    } catch (err) {
        throw err;
    }
}

async function deleteCustomer(customerId: string) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('customer_id', sql.INT, customerId)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE DevelopERP..Customer
                SET isArchived = 1, update_date = @update_date
                WHERE customer_id = @customer_id
            `)
    } catch (err) {
        throw err;
    }
}

const customerQuery = `
INSERT INTO chonTest..Customer (customer_name, sales_type_code_id, customer_type_code_id, create_date, update_date, create_by, isArchived)
OUTPUT INSERTED.customer_id
VALUES (@customer_name, @sales_type_code_id, @customer_type_code_id, @create_date, @update_date, @create_by, @isArchived)
`;
const addressQuery = `
INSERT INTO chonTest..Address (name, house_no, village_no, alley, road, sub_district, district, province, postal_code)
OUTPUT INSERTED.address_id
VALUES (@name, @house_no, @village_no, @alley, @road, @sub_district, @district, @province, @postal_code)
`;
const addressCustomerQuery = `
INSERT INTO chonTest..Address_Customer (customer_id, address_id)
VALUES (@customer_id, @address_id)
`;
const addressMasterCodeQuery = `
INSERT INTO chonTest..Address_MasterCode (address_id, address_type_code_id)
VALUES (@address_id, @address_type_code_id)
`
const addressCustomerDeleteQuery = `
DELETE FROM chonTest..Address_Customer
WHERE customer_id = @customer_id AND address_id = @address_id
`
const contactQuery = `
INSERT INTO chonTest..Contact (customer_id, value, contact_code_id)
VALUES (@customer_id, @value, @contact_code_id)
`;
const contactDeleteQuery = `
UPDATE chonTest..Contact
SET customer_id = NULL
WHERE contact_id = @contact_id
`
const personQuery = `
INSERT INTO chonTest..Person (firstname, lastname, nickname, title_code_id, description)
OUTPUT INSERTED.person_id
VALUES (@firstname, @lastname, @nickname, @title_code_id, @description)
`;
const personDeleteQuery = `
DELETE FROM chonTest..Customer_Person
WHERE customer_id = @customer_id AND person_id = @person_id
`
const customerPersonQuery = `
INSERT INTO chonTest..Customer_Person (customer_id, person_id)
VALUES (@customer_id, @person_id)
`
const addressPersonQuery = `
INSERT INTO chonTest..Address_Person (person_id, address_id)
VALUES (@person_id, @address_id)
`;
const contactPersonQuery = `
INSERT INTO chonTest..Contact (person_id, value, contact_code_id)
VALUES (@person_id, @value, @contact_code_id)
`

async function createCustomerDataSecure(body: CustomerType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()
        // const request = transaction.request();

        let customerResult = await transaction.request()
            .input('customer_name', sql.NVARCHAR, body.customer.customer_name === "" ? null : body.customer.customer_name)
            .input('sales_type_code_id', sql.INT, body.customer.sales_type_code_id)
            .input('customer_type_code_id', sql.INT, body.customer.customer_type_code_id)
            .input('create_date', sql.DATETIME, datetime)
            .input('update_date', sql.DATETIME, null)
            .input('create_by', sql.INT, body.create_by)
            .input('isArchived', sql.INT, 0)
            .query(customerQuery)
        let customer_id = customerResult.recordset[0].customer_id

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
                .query(addressQuery)
            const address_id = addressResult.recordset[0].address_id
            let addressCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('address_id', sql.INT, address_id)
                .query(addressCustomerQuery)
            let addressMasterCodeResult = await transaction.request()
                .input('address_id', sql.INT, address_id)
                .input('address_type_code_id', sql.INT, address.address_type_code_id)
                .query(addressMasterCodeQuery)
        }

        for (const address of body.addressExist) {
            let addressResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('address_id', sql.INT, address)
                .query(addressCustomerQuery)
        }

        for (const contact of body.contact) {
            let contactResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                .input('contact_code_id', sql.INT, contact.contact_code_id)
                .query(contactQuery)
        }

        // 
        for (const person of body.personNew) {
            let personResult = await transaction.request()
                .input('firstname', sql.NVARCHAR, person.person.firstname === "" ? null : person.person.firstname)
                .input('lastname', sql.NVARCHAR, person.person.lastname === "" ? null : person.person.lastname)
                .input('nickname', sql.NVARCHAR, person.person.nickname === "" ? null : person.person.nickname)
                .input('title_code_id', sql.Int, person.person.title_code_id)
                .input('description', sql.NVARCHAR, person.person.description === "" ? null : person.person.description)
                .query(personQuery)
            let person_id = personResult.recordset[0].person_id
            let personCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('person_id', sql.INT, person_id)
                .query(customerPersonQuery)

            for (const address of person.addressNew) {
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
                    .query(addressQuery)
                const address_id = addressResult.recordset[0].address_id
                let addressPersonResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('address_id', sql.INT, address_id)
                    .query(addressPersonQuery)
                let addressMasterCodeResult = await transaction.request()
                    .input('address_id', sql.INT, address_id)
                    .input('address_type_code_id', sql.INT, address.address_type_code_id)
                    .query(addressMasterCodeQuery)
            }

            for (const address of body.addressExist) {
                let addressResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('address_id', sql.INT, address)
                    .query(addressPersonQuery)
            }

            for (const contact of person.contact) {
                let contactResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                    .input('contact_code_id', sql.INT, contact.contact_code_id)
                    .query(contactPersonQuery)
            }
        }
        // 
        for (const person of body.personExist) {
            let personResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('person_id', sql.INT, person)
                .query(customerPersonQuery)
        }

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function updateCustomerDataSecure(customerId: string, body: CustomerType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        let customerResult = await transaction.request()
            .input('customer_id', sql.INT, customerId)
            .input('customer_name', sql.NVARCHAR, body.customer.customer_name)
            .input('sales_type_code_id', sql.INT, body.customer.sales_type_code_id)
            .input('customer_type_code_id', sql.INT, body.customer.customer_type_code_id)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE chonTest..Customer
                SET customer_name = @customer_name, sales_type_code_id = @sales_type_code_id, customer_type_code_id = @customer_type_code_id, update_date = @update_date
                WHERE customer_id = @customer_id
            `)

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
                .query(addressQuery)
            const address_id = addressResult.recordset[0].address_id
            let addressCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('address_id', sql.INT, address_id)
                .query(addressCustomerQuery)
            let addressMasterCodeResult = await transaction.request()
                .input('address_id', sql.INT, address_id)
                .input('address_type_code_id', sql.INT, address.address_type_code_id)
                .query(addressMasterCodeQuery)
        }
        
        for (const address of body.addressDelete) {
            let addressDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('address_id', sql.INT, address)
                .query(addressCustomerDeleteQuery)
        }
        for (const address of body.addressExist) {
            let addressResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('address_id', sql.INT, address)
                .query(addressCustomerQuery)
        }

        for (const contact of body.contactDelete) {
            let contactDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('contact_id', sql.INT, contact)
                .query(contactDeleteQuery)
        }
        for (const contact of body.contact) {
            let contactResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                .input('contact_code_id', sql.INT, contact.contact_code_id)
                .query(contactQuery)
        }

        // 
        for (const person of body.personNew) {
            let personResult = await transaction.request()
                .input('firstname', sql.NVARCHAR, person.person.firstname === "" ? null : person.person.firstname)
                .input('lastname', sql.NVARCHAR, person.person.lastname === "" ? null : person.person.lastname)
                .input('nickname', sql.NVARCHAR, person.person.nickname === "" ? null : person.person.nickname)
                .input('title_code_id', sql.Int, person.person.title_code_id)
                .input('description', sql.NVARCHAR, person.person.description === "" ? null : person.person.description)
                .query(personQuery)
            let person_id = personResult.recordset[0].person_id
            let personCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('person_id', sql.INT, person_id)
                .query(customerPersonQuery)

            for (const address of person.addressNew) {
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
                    .query(addressQuery)
                const address_id = addressResult.recordset[0].address_id
                let addressPersonResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('address_id', sql.INT, address_id)
                    .query(addressPersonQuery)
                let addressMasterCodeResult = await transaction.request()
                    .input('address_id', sql.INT, address_id)
                    .input('address_type_code_id', sql.INT, address.address_type_code_id)
                    .query(addressMasterCodeQuery)
            }

            for (const address of body.addressExist) {
                let addressResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('address_id', sql.INT, address)
                    .query(addressPersonQuery)
            }

            for (const contact of person.contact) {
                let contactResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                    .input('contact_code_id', sql.INT, contact.contact_code_id)
                    .query(contactPersonQuery)
            }
        }
        // 
        for (const person of body.personDelete) {
            let personDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('person_id', sql.INT, person)
                .query(personDeleteQuery)
        }
        for (const person of body.personExist) {
            let personResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('person_id', sql.INT, person)
                .query(customerPersonQuery)
        }

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export default { getCustomerTable, getCustomerData, deleteCustomer, createCustomerDataSecure, updateCustomerDataSecure } 