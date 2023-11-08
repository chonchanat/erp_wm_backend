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
                DECLARE @personTable IdType
                INSERT INTO @personTable
                EXEC DevelopERP_Clear..sp_filterPerson @fullname = @fullname, @customer_id = NULL, @fleet_id = NULL, @vehicle_id = NULL, @user_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_Clear..sp_formatPersonTable @personTable = @personTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data
                FROM (
                    SELECT 
                    person_id,
                    COALESCE(firstname + ' ', '') + COALESCE(lastname, '') + COALESCE('(' + nickname + ')', '') AS fullname,
                    is_archived
                    FROM DevelopERP_Clear..Person
                ) t
                WHERE fullname LIKE @fullname AND is_archived = 0
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
                FROM DevelopERP_Clear..Person p
                LEFT JOIN DevelopERP_Clear..MasterCode m
                on p.title_code_id = m.code_id
                WHERE person_id = @person_id AND is_archived = 0

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

async function deletePerson(personId: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('person_id', sql.INT, personId)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_delete_person @person_id = @person_id, @action_by = @action_by, @action_date = @action_date
            `)
    } catch (err) {
        throw err;
    }
}

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
            .input('action_by', sql.INT, body.create_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_insert_person @firstname = @firstname, @lastname = @lastname, @nickname = @nickname,
                    @title_code_id = @title_code_id, @description = @description, @action_by = @action_by, @action_date = @action_date
            `)
        let person_id = personResult.recordset[0].person_id

        for (const role of body.person.role) {
            let roleResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('role_code_id', sql.INT, role)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_person_role @person_id = @person_id, @role_code_id = @role_code_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const customer of body.customerExist) {
            let customerResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('customer_id', sql.INT, customer)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_customer_person @customer_id = @customer_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const contact of body.contact) {
            let contactResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('value', sql.NVARCHAR, contact.value)
                .input('contact_code_id', sql.INT, contact.contact_code_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_contact @contact_code_id = @contact_code_id, @person_id = @person_id, 
                        @customer_id = NULL, @value = @value, @action_by = @action_by, @action_date = @action_date
                `)
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
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address @name = @name, @house_no = @house_no, @village_no = @village_no,
                        @alley = @alley, @road = @road, @sub_district = @sub_district, @district = @district,
                        @province = @province, @postal_code = @postal_code, @action_by = @action_by, @action_date = @action_date
                `)
            const address_id = addressResult.recordset[0].address_id
            let addressPersonResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('address_id', sql.INT, address_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_person @address_id = @address_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
            for (const addressMasterCode of address.address_type_code_id) {
                let addressMaterCodeResult = await transaction.request()
                    .input('address_id', sql.INT, address_id)
                    .input('address_type_code_id', sql.INT, addressMasterCode)
                    .input('action_by', sql.INT, body.create_by)
                    .input('action_date', sql.DATETIME, datetime)
                    .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_mastercode @address_id = @address_id, @address_type_code_id = @address_type_code_id, 
                        @action_by = @action_by, @action_date = @action_date
                    `)
            }
        }

        for (const address of body.addressExist) {
            let addressResult = await transaction.request()
                .input('person_id', sql.INT, person_id)
                .input('address_id', sql.INT, address)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_person @address_id = @address_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const card of body.cardNew) {
            let cardResult = await transaction.request()
                .input('card_code_id', sql.INT, card.card_code_id)
                .input('value', sql.NVARCHAR, card.value)
                .input('person_id', sql.INT, person_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_card @card_code_id = @card_code_id, @value = @value, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        await transaction.commit();

    } catch (err) {
        console.log(err)
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
            .input('action_by', sql.INT, body.update_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_update_person @person_id = @person_id, @firstname = @firstname, @lastname = @lastname, 
                    @nickname = @nickname, @title_code_id = @title_code_id, @description = @description, 
                    @action_by = @action_by, @action_date = @action_date
            `)

        for (const role of body.person.roleDelete) {
            let roleResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('role_code_id', sql.INT, role)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_person_role @person_id = @person_id, @role_code_id = @role_code_id,    
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const role of body.person.role) {
            let roleResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('role_code_id', sql.INT, role)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_person_role @person_id = @person_id, @role_code_id = @role_code_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const customer of body.customerDelete) {
            let customerResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('customer_id', sql.INT, customer)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_customer_person @customer_id = @customer_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const customer of body.customerExist) {
            let customerResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('customer_id', sql.INT, customer)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_customer_person @customer_id = @customer_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const contact of body.contactDelete) {
            let contactResult = await transaction.request()
                .input('contact_id', sql.INT, contact)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_contact @contact_id = @contact_id, @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const contact of body.contact) {
            let contactResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('value', sql.NVARCHAR, contact.value)
                .input('contact_code_id', sql.INT, contact.contact_code_id)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_contact @contact_code_id = @contact_code_id, @person_id = @person_id, 
                        @customer_id = NULL, @value = @value, @action_by = @action_by, @action_date = @action_date
                `)
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
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address @name = @name, @house_no = @house_no, @village_no = @village_no,
                        @alley = @alley, @road = @road, @sub_district = @sub_district, @district = @district,
                        @province = @province, @postal_code = @postal_code, @action_by = @action_by, @action_date = @action_date
                `)
            const address_id = addressResult.recordset[0].address_id
            let addressPersonResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('address_id', sql.INT, address_id)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_person @address_id = @address_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
            for (const addressMasterCode of address.addres_type_code_id) {
                let addressMasterCodeResult = await transaction.request()
                    .input('addrsss_id', sql.INT, address_id)
                    .input('address_type_code_id', sql.INT, addressMasterCode)
                    .input('action_by', sql.INT, body.update_by)
                    .input('action_date', sql.DATETIME, datetime)
                    .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_mastercode @address_id = @address_id, @address_type_code_id = @address_type_code_id, 
                        @action_by = @action_by, @action_date = @action_date
                    `)
            }
        }

        for (const address of body.addressDelete) {
            let addressResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('address_id', sql.INT, address)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_address_person @address_id = @address_id, @person_id = @person_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const address of body.addressExist) {
            let addressResult = await transaction.request()
                .input('person_id', sql.INT, personId)
                .input('address_id', sql.INT, address)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_person @address_id = @address_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const card of body.cardNew) {
            let cardResult = await transaction.request()
                .input('card_code_id', sql.INT, card.card_code_id)
                .input('value', sql.NVARCHAR, card.value)
                .input('person_id', sql.INT, personId)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_card @card_code_id = @card_code_id, @value = @value, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const card of body.cardDelete) {
            let cardResult = await transaction.request()
                .input('card_id', sql.INT, card)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_card @card_id = @card_id, @action_by = @action_by, @action_date = @action_date    
                `)
        }

        await transaction.commit();

    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

export default { getPersonTable, getPersonData, deletePerson, createPersonData, updatePersonDate }