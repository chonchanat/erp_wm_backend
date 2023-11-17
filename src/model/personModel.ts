const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../utils"
import { PersonType } from "../interfaces/person"
import * as operation from "../operation/index"

async function getPersonTable(index: number, filterPerson: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .input('fullname', sql.NVARCHAR, "%" + filterPerson + "%")
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
        return {
            person: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getPersonData(person_id: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
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
                WHERE person_id = @person_id AND active = 1

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
            `)

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
        console.log(err)
        throw err;
    }
}

async function deletePerson(person_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('person_id', sql.INT, person_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_delete_person @person_id = @person_id, @action_by = @action_by, @action_date = @action_date
            `)
    } catch (err) {
        throw err;
    }
}

async function createPersonData(body: PersonType, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        let personResult = await operation.createPersonNew(transaction, body.person, action_by, datetime)
        let person_id = personResult.recordset[0].person_id

        for (const role of body.person.role) {
            await operation.linkPersonRole(transaction, person_id, role, action_by, datetime)
        }

        for (const customer of body.customerNew) {
            let customerResult = await operation.createCustomerNew(transaction, customer.customer, action_by, datetime)
            let customer_id = customerResult.recordset[0].customer_id

            await operation.linkCustomerPerson(transaction, customer_id, person_id, action_by, datetime)
            for (const contact of customer.contactNew) {
                await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
            }
        }
        for (const customer of body.customerExist) {
            await operation.linkCustomerPerson(transaction, customer, person_id, action_by, datetime)
        }

        for (const contact of body.contactNew) {
            await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
        }

        for (const address of body.addressNew) {
            let addressResult = await operation.createAddressNew(transaction, address, action_by, datetime)
            const address_id = addressResult.recordset[0].address_id

            await operation.linkAddressPerson(transaction, address_id, person_id, action_by, datetime)
            for (const addressMasterCode of address.address_type_code_id) {
                await operation.linkAddressMasterCode(transaction, address_id, addressMasterCode, action_by, datetime)
            }
        }
        for (const address of body.addressExist) {
            await operation.linkAddressPerson(transaction, address, person_id, action_by, datetime)
        }

        for (const card of body.cardNew) {
            await operation.createCardNew(transaction, card, person_id, action_by, datetime)
        }

        for (let i = 0; i < files.length; i++) {
            await operation.createDocumentNew(transaction, body.documentCodeNew[i], files[i].originalname, files[i].buffer,
                null, person_id, null, null, action_by, datetime)
        }

        await transaction.commit();

    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

async function updatePersonDate(person_id: string, body: PersonType, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updatePerson(transaction, person_id, body.person, action_by, datetime)

        for (const role of body.person.roleDelete) {
            await operation.unlinkPersonRole(transaction, person_id, role, action_by, datetime)
        }
        for (const role of body.person.role) {
            await operation.linkPersonRole(transaction, person_id, role, action_by, datetime)
        }

        for (const customer of body.customerNew) {
            let customerResult = await operation.createCustomerNew(transaction, customer.customer, action_by, datetime)
            let customer_id = customerResult.recordset[0].customer_id

            await operation.linkCustomerPerson(transaction, customer_id, person_id, action_by, datetime)

            for (const contact of customer.contactNew) {
                await operation.createContactNew(transaction, contact, null, customer_id, action_by, datetime)
            }
        }
        for (const customer of body.customerDelete) {
            await operation.unlinkCustomerPerson(transaction, customer, person_id, action_by, datetime)
        }
        for (const customer of body.customerExist) {
            await operation.linkCustomerPerson(transaction, customer, person_id, action_by, datetime)
        }

        for (const contact of body.contactDelete) {
            await operation.deleteContact(transaction, contact, action_by, datetime)
        }
        for (const contact of body.contactNew) {
            await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
        }

        for (const address of body.addressNew) {
            let addressResult = await operation.createAddressNew(transaction, address, action_by, datetime)
            const address_id = addressResult.recordset[0].address_id

            await operation.linkAddressPerson(transaction, address_id, person_id, action_by, datetime)
            for (const addressMasterCode of address.address_type_code_id) {
                await operation.linkAddressMasterCode(transaction, address_id, addressMasterCode, action_by, datetime)
            }
        }
        for (const address of body.addressDelete) {
            await operation.unlinkAddressPerson(transaction, address, person_id, action_by, datetime)
        }
        for (const address of body.addressExist) {
            await operation.linkAddressPerson(transaction, address, person_id, action_by, datetime)
        }

        for (const card of body.cardNew) {
            await operation.createCardNew(transaction, card, person_id, action_by, datetime)
        }
        for (const card of body.cardDelete) {
            await operation.deleteCard(transaction, card, action_by, datetime)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            await operation.createDocumentNew(transaction, body.documentCodeNew[i], files[i].originalname, files[i].buffer,
                null, person_id, null, null, action_by, datetime)
        }

        for (const document of body.documentDelete) {
            await operation.deleteDocument(transaction, document, action_by, datetime)
        }

        await transaction.commit();

    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

export default { getPersonTable, getPersonData, deletePerson, createPersonData, updatePersonDate }