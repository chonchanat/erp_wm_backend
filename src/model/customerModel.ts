import { getDateTime } from "../utils"
import { CustomerType } from "../interfaces/type";

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
                DECLARE @customerTable IdType
                INSERT INTO @customerTable
                EXEC DevelopERP_Clear..sp_filterCustomer @customer_name = @customer_name, @fleet_id = NULL, @person_id = NULL, @vehicle_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_Clear..sp_formatCustomerTable @customerTable = @customerTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data 
                FROM DevelopERP_Clear..Customer
                WHERE customer_name LIKE @customer_name AND is_archived = 0
            `)
        return {
            customer: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function getCustomerData(customerId: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('customer_id', sql.INT, customerId)
            .query(`
                SELECT C.customer_id, C.customer_name, C.sales_type_code_id, M_salestype.value AS sales_type, C.customer_type_code_id, M_customertype.value as customer_type
                FROM DevelopERP_Clear..Customer C
                INNER JOIN DevelopERP_Clear..MasterCode M_salestype
                ON C.sales_type_code_id = M_salestype.code_id
                INNER JOIN DevelopERP_Clear..MasterCode M_customertype
                ON C.customer_type_code_id = M_customertype.code_id
                WHERE customer_id = @customer_id AND is_archived = 0
                
                DECLARE @fleetTable IdType
                INSERT INTO @fleetTable
                EXEC DevelopERP_Clear..sp_filterFleet @fleet_name = '%', @customer_id = @customer_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatFleetTable @fleetTable = @fleetTable, @firstIndex = 1

                DECLARE @contactTable IdType
                INSERT INTO @contactTable
                EXEC DevelopERP_Clear..sp_filterContact @value = '%', @customer_id = @customer_id, @person_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatContactTable @contactTable = @contactTable, @firstIndex = 1

                DECLARE @addressTable IdType
                INSERT INTO @addressTable
                EXEC DevelopERP_Clear..sp_filterAddress @location = '%', @customer_id = @customer_id, @person_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatAddressTable @addressTable = @addressTable, @firstIndex = 1

                DECLARE @personTable IdType
                INSERT INTO @personTable
                EXEC DevelopERP_Clear..sp_filterPerson @fullname = '%', @customer_id = @customer_id, @fleet_id = NULL, @vehicle_id = NULL, @user_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatPersonTable @personTable = @personTable, @firstIndex = 1
                
                DECLARE @vehicleTable IdType
                INSERT INTO @vehicleTable 
                EXEC DevelopERP_Clear..sp_filterVehicle @license_plate = '%', @customer_id = @customer_id, @fleet_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatVehicleTable @vehicleTable = @vehicleTable, @firstIndex = 1
            `)
        return {
            customer: result.recordsets[0][0],
            fleet: result.recordsets[1],
            contact: result.recordsets[2],
            address: result.recordsets[3],
            person: result.recordsets[4],
            vehicle: result.recordsets[5]
        };
    } catch (err) {
        throw err;
    }
}

async function deleteCustomer(customerId: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('customer_id', sql.INT, customerId)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_delete_customer @customer_id = @customer_id, @action_by = @action_by, @action_date = @action_date
            `)
    } catch (err) {
        throw err;
    }
}

async function createCustomerData(body: CustomerType, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        let customerResult = await transaction.request()
            .input('customer_name', sql.NVARCHAR, body.customer.customer_name === "" ? null : body.customer.customer_name)
            .input('sales_type_code_id', sql.INT, body.customer.sales_type_code_id)
            .input('customer_type_code_id', sql.INT, body.customer.customer_type_code_id)
            .input('action_by', sql.INT, body.create_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_insert_customer @customer_name = @customer_name, @sales_type_code_id = @sales_type_code_id, 
                    @customer_type_code_id = @customer_type_code_id, @action_by = @action_by, @action_date = @action_date
            `)
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
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address @name = @name, @house_no = @house_no, @village_no = @village_no,
                        @alley = @alley, @road = @road, @sub_district = @sub_district, @district = @district,
                        @province = @province, @postal_code = @postal_code, @action_by = @action_by, @action_date = @action_date
                `)
            const address_id = addressResult.recordset[0].address_id
            let addressCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('address_id', sql.INT, address_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_customer @address_id = @address_id, @customer_id = @customer_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
            for (const addressMasterCode of address.address_type_code_id) {
                let addressMasterCodeResult = await transaction.request()
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
                .input('customer_id', sql.INT, customer_id)
                .input('address_id', sql.INT, address)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_customer @address_id = @address_id, @customer_id = @customer_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const contact of body.contact) {
            let contactResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                .input('contact_code_id', sql.INT, contact.contact_code_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_contact @contact_code_id = @contact_code_id, @person_id = NULL, 
                        @customer_id = @customer_id, @value = @value, @action_by = @action_by, @action_date = @action_date
                `)
        }

        // 
        for (const person of body.personNew) {
            let personResult = await transaction.request()
                .input('firstname', sql.NVARCHAR, person.person.firstname === "" ? null : person.person.firstname)
                .input('lastname', sql.NVARCHAR, person.person.lastname === "" ? null : person.person.lastname)
                .input('nickname', sql.NVARCHAR, person.person.nickname === "" ? null : person.person.nickname)
                .input('title_code_id', sql.Int, person.person.title_code_id)
                .input('description', sql.NVARCHAR, person.person.description === "" ? null : person.person.description)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_person @firstname = @firstname, @lastname = @lastname, @nickname = @nickname,
                        @title_code_id = @title_code_id, @description = @description, @action_by = @action_by, @action_date = @action_date
                `)
            let person_id = personResult.recordset[0].person_id
            let personCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('person_id', sql.INT, person_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_customer_person @customer_id = @customer_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)

            for (const role of person.person.role) {
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
                    let addressMasterCodeResult = await transaction.request()
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

            for (const contact of person.contact) {
                let contactResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                    .input('contact_code_id', sql.INT, contact.contact_code_id)
                    .input('action_by', sql.INT, body.create_by)
                    .input('action_date', sql.DATETIME, datetime)
                    .query(`
                    EXEC DevelopERP_Clear..sp_insert_contact @contact_code_id = @contact_code_id, @person_id = @person_id, 
                        @customer_id = NULL, @value = @value, @action_by = @action_by, @action_date = @action_date
                    `)
            }
        }
        // 
        for (const person of body.personExist) {
            let personResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_customer_person @customer_id = @customer_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const vehicle of body.vehicleNew) {
            let vehicleResult = await transaction.request()
                .input('frame_no', sql.NVARCHAR, vehicle.frame_no)
                .input('license_plate', sql.NVARCHAR, vehicle.license_plate)
                .input('vehicle_model_id', sql.INT, vehicle.vehicle_model_id)
                .input('registration_province_code_id', sql.INT, vehicle.registration_province_code_id)
                .input('registration_type_code_id', sql.INT, vehicle.registration_type_code_id)
                .input('driving_license_type_code_id', sql.INT, vehicle.driving_license_type_code_id)
                .input('number_of_axles', sql.INT, vehicle.number_of_axles)
                .input('number_of_wheels', sql.INT, vehicle.number_of_wheels)
                .input('number_of_tires', sql.INT, vehicle.number_of_tires)
                .input('vehicle_type_code_id', sql.INT, vehicle.vehicle_type_code_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_vehicle @frame_no = @frame_no, @license_plate = @license_plate, @vehicle_model_id = @vehicle_model_id, 
                        @registration_province_code_id = @registration_province_code_id, @registration_type_code_id = @registration_type_code_id, 
                        @driving_license_type_code_id = @driving_license_type_code_id, @number_of_axles = @number_of_axles, 
                        @number_of_wheels = @number_of_wheels, @number_of_tires = @number_of_tires, @vehicle_type_code_id = @vehicle_type_code_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
            let vehicle_id = await vehicleResult.recordset[0].vehicle_id

            let vehicleCustomerResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicle_id)
                .input('customer_id', sql.INT, customer_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const vehicle of body.vehicleExist) {
            let vehicleResult = await transaction.request()
                .input('customer_id', sql.INT, customer_id)
                .input('vehicle_id', sql.INT, vehicle)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const fleet of body.fleetNew) {
            let fleetResult = await transaction.request()
                .input('fleet_name', sql.NVARCHAR, fleet.fleet_name)
                .input('parent_fleet_id', sql.INT, fleet.parent_fleet_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet @fleet_name = @fleet_name, @parent_fleet_id = @parent_fleet_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
            let fleet_id = fleetResult.recordset[0].fleet_id

            let fleetCustomerResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet_id)
                .input('customer_id', sql.INT, customer_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const fleet of body.fleetExist) {
            let fleetResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet)
                .input('customer_id', sql.INT, customer_id)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');
            let documentResult = await pool.request()
                .input('document_code_id', sql.INT, body.documentCodeNew[i])
                .input('customer_id', sql.INT, customer_id)
                .input('person_id', sql.INT, null)
                .input('address_id', sql.INT, null)
                .input('vehicle_id', sql.INT, null)
                .input('document_name', sql.NVARCHAR, files[i].originalname)
                .input('value', sql.VARBINARY, files[i].buffer)
                .input('create_date', sql.DATETIME, datetime)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_document @document_code_id = @document_code_id, @customer_id = @customer_id,
                        @person_id = @person_id, @address_id = @address_id, @vehicle_id = @vehicle_id,
                        @document_name = @document_name, @value = @value, @create_date = @create_date, 
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

async function updateCustomerData(customerId: string, body: CustomerType) {
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
            .input('action_by', sql.INT, body.update_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_update_customer @customer_id = @customer_id, @customer_name = @customer_name,
                    @sales_type_code_id = @sales_type_code_id, @customer_type_code_id = @customer_type_code_id,
                    @action_by = @action_by, @action_date = @action_date
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
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address @name = @name, @house_no = @house_no, @village_no = @village_no,
                        @alley = @alley, @road = @road, @sub_district = @sub_district, @district = @district,
                        @province = @province, @postal_code = @postal_code, @action_by = @action_by, @action_date = @action_date
                `)
            const address_id = addressResult.recordset[0].address_id
            let addressCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('address_id', sql.INT, address_id)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_customer @address_id = @address_id, @customer_id = @customer_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
            for (const addressMasterCode of address.address_type_code_id) {
                let addressMasterCodeResult = await transaction.request()
                    .input('address_id', sql.INT, address_id)
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
            let addressDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('address_id', sql.INT, address)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_address_customer @address_id = @address_id, @customer_id = @customer_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const address of body.addressExist) {
            let addressResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('address_id', sql.INT, address)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_customer @address_id = @address_id, @customer_id = @customer_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const contact of body.contactDelete) {
            let contactDeleteResult = await transaction.request()
                .input('contact_id', sql.INT, contact)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_contact @contact_id = @contact_id, @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const contact of body.contact) {
            let contactResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                .input('contact_code_id', sql.INT, contact.contact_code_id)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_contact @contact_code_id = @contact_code_id, @person_id = NULL, 
                        @customer_id = @customer_id, @value = @value, @action_by = @action_by, @action_date = @action_date
                `)
        }

        // 
        for (const person of body.personNew) {
            let personResult = await transaction.request()
                .input('firstname', sql.NVARCHAR, person.person.firstname === "" ? null : person.person.firstname)
                .input('lastname', sql.NVARCHAR, person.person.lastname === "" ? null : person.person.lastname)
                .input('nickname', sql.NVARCHAR, person.person.nickname === "" ? null : person.person.nickname)
                .input('title_code_id', sql.Int, person.person.title_code_id)
                .input('description', sql.NVARCHAR, person.person.description === "" ? null : person.person.description)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_person @firstname = @firstname, @lastname = @lastname, @nickname = @nickname,
                        @title_code_id = @title_code_id, @description = @description, @action_by = @action_by, @action_date = @action_date
                `)
            let person_id = personResult.recordset[0].person_id
            let personCustomerResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('person_id', sql.INT, person_id)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_customer_person @customer_id = @customer_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)

            for (const role of person.person.role) {
                let roleResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('role_code_id', sql.INT, role)
                    .input('action_by', sql.INT, body.update_by)
                    .input('action_date', sql.DATETIME, datetime)
                    .query(`
                        EXEC DevelopERP_Clear..sp_insert_person_role @person_id = @person_id, @role_code_id = @role_code_id,
                            @action_by = @action_by, @action_date = @action_date
                    `)
            }

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
                    .input('action_by', sql.INT, body.update_by)
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
                    .input('action_by', sql.INT, body.update_by)
                    .input('action_by', sql.DATETIME, datetime)
                    .query(`
                        EXEC DevelopERP_Clear..sp_insert_address_person @address_id = @address_id, @person_id = @person_id,
                            @action_by = @action_by, @action_date = @action_date
                    `)
                for (const addressMasterCode of address.address_type_code_id) {
                    let addressMasterCodeResult = await transaction.request()
                        .input('address_id', sql.INT, address_id)
                        .input('address_type_code_id', sql.INT, addressMasterCode)
                        .input('action_by', sql.INT, body.update_by)
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
                    .input('action_by', sql.INT, body.update_by)
                    .input('action_by', sql.DATETIME, datetime)
                    .query(`
                        EXEC DevelopERP_Clear..sp_insert_address_person @address_id = @address_id, @person_id = @person_id,
                            @action_by = @action_by, @action_date = @action_date
                    `)
            }

            for (const contact of person.contact) {
                let contactResult = await transaction.request()
                    .input('person_id', sql.INT, person_id)
                    .input('value', sql.NVARCHAR, contact.value === "" ? null : contact.value)
                    .input('contact_code_id', sql.INT, contact.contact_code_id)
                    .input('action_by', sql.INT, body.update_by)
                    .input('action_date', sql.DATETIME, datetime)
                    .query(`
                    EXEC DevelopERP_Clear..sp_insert_contact @contact_code_id = @contact_code_id, @person_id = @person_id, 
                        @customer_id = NULL, @value = @value, @action_by = @action_by, @action_date = @action_date
                    `)
            }
        }

        for (const person of body.personDelete) {
            let personDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_customer_person @customer_id = @customer_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const person of body.personExist) {
            let personResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_customer_person @customer_id = @customer_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        //

        for (const vehicle of body.vehicleNew) {
            let vehicleResult = await transaction.request()
                .input('frame_no', sql.NVARCHAR, vehicle.frame_no)
                .input('license_plate', sql.NVARCHAR, vehicle.license_plate)
                .input('vehicle_model_id', sql.INT, vehicle.vehicle_model_id)
                .input('registration_province_code_id', sql.INT, vehicle.registration_province_code_id)
                .input('registration_type_code_id', sql.INT, vehicle.registration_type_code_id)
                .input('driving_license_type_code_id', sql.INT, vehicle.driving_license_type_code_id)
                .input('number_of_axles', sql.INT, vehicle.number_of_axles)
                .input('number_of_wheels', sql.INT, vehicle.number_of_wheels)
                .input('number_of_tires', sql.INT, vehicle.number_of_tires)
                .input('vehicle_type_code_id', sql.INT, vehicle.vehicle_type_code_id)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_vehicle @frame_no = @frame_no, @license_plate = @license_plate, @vehicle_model_id = @vehicle_model_id, 
                        @registration_province_code_id = @registration_province_code_id, @registration_type_code_id = @registration_type_code_id, 
                        @driving_license_type_code_id = @driving_license_type_code_id, @number_of_axles = @number_of_axles, 
                        @number_of_wheels = @number_of_wheels, @number_of_tires = @number_of_tires, @vehicle_type_code_id = @vehicle_type_code_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
            let vehicle_id = await vehicleResult.recordset[0].vehicle_id

            let vehicleCustomerResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicle_id)
                .input('customer_id', sql.INT, customerId)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                        EXEC DevelopERP_Clear..sp_insert_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                            @action_by = @action_by, @action_date = @action_date
                    `)
        }

        for (const vehicle of body.vehicleDelete) {
            let vehicleDeleteResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('vehicle_id', sql.INT, vehicle)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }
        for (const vehicle of body.vehicleExist) {
            let vehicleResult = await transaction.request()
                .input('customer_id', sql.INT, customerId)
                .input('vehicle_id', sql.INT, vehicle)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const fleet of body.fleetNew) {
            let fleetResult = await transaction.request()
                .input('fleet_name', sql.NVARCHAR, fleet.fleet_name)
                .input('parent_fleet_id', sql.INT, fleet.parent_fleet_id)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet @fleet_name = @fleet_name, @parent_fleet_id = @parent_fleet_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
            let fleet_id = fleetResult.recordset[0].fleet_id

            let fleetCustomerResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet_id)
                .input('customer_id', sql.INT, customerId)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const fleet of body.fleetDelete) {
            let fleetDeleteResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet)
                .input('customer_id', sql.INT, customerId)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const fleet of body.fleetExist) {
            let fleetResult = await transaction.request()
                .input('fleet_id', sql.INT, fleet)
                .input('customer_id', sql.INT, customerId)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_fleet_customer @fleet_id = @fleet_id, @customer_id = @customer_id,
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

export default { getCustomerTable, getCustomerData, deleteCustomer, createCustomerData, updateCustomerData } 