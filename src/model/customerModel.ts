import { getDateTime } from "../utils"
// import { CustomerType } from "../interfaces/type";
import { CustomerType } from "../interfaces/customer"

import * as operation from "../operation/index"

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
                WHERE customer_name LIKE @customer_name AND active = 1
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

async function getCustomerData(customer_id: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('customer_id', sql.INT, customer_id)
            .query(`
                SELECT C.customer_id, C.customer_name, C.sales_type_code_id, M_salestype.value AS sales_type, C.customer_type_code_id, M_customertype.value as customer_type
                FROM DevelopERP_Clear..Customer C
                INNER JOIN DevelopERP_Clear..MasterCode M_salestype
                ON C.sales_type_code_id = M_salestype.code_id
                INNER JOIN DevelopERP_Clear..MasterCode M_customertype
                ON C.customer_type_code_id = M_customertype.code_id
                WHERE customer_id = @customer_id AND active = 1
                
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

                DECLARE @documentTable IdType
                INSERT INTO @documentTable
                EXEC DevelopERP_Clear..sp_filterDocument @document_name = '%', @customer_id = @customer_id, @person_id = NULL, 
                    @address_id = NULL, @vehicle_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatDocument @documentTable = @documentTable, @firstIndex = 1
            `)
        return {
            customer: result.recordsets[0][0],
            fleet: result.recordsets[1],
            contact: result.recordsets[2],
            address: result.recordsets[3],
            person: result.recordsets[4],
            vehicle: result.recordsets[5],
            files: result.recordsets[6],
        };
    } catch (err) {
        throw err;
    }
}

async function deleteCustomer(customer_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('customer_id', sql.INT, customer_id)
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
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        let customerResult = await operation.createCustomerNew(transaction, body.customer, action_by, datetime)
        let customer_id = customerResult.recordset[0].customer_id

        for (const address of body.addressNew) {
            let addressResult = await operation.createAddressNew(transaction, address, action_by, datetime)
            const address_id = addressResult.recordset[0].address_id

            await operation.linkAddressCustomer(transaction, address_id, customer_id, action_by, datetime)
            for (const addressMasterCode of address.address_type_code_id) {
                await operation.linkAddressMasterCode(transaction, address_id, addressMasterCode, action_by, datetime)
            }
        }
        for (const address of body.addressExist) {
            await operation.linkAddressCustomer(transaction, address, customer_id, action_by, datetime)
        }

        for (const contact of body.contactNew) {
            await operation.createContactNew(transaction, contact, null, customer_id, action_by, datetime)
        }

        for (const person of body.personNew) {
            let personResult = await operation.createPersonNew(transaction, person.person, action_by, datetime)
            let person_id = personResult.recordset[0].person_id

            await operation.linkCustomerPerson(transaction, customer_id, person_id, action_by, datetime)

            for (const role of person.person.role) {
                await operation.linkPersonRole(transaction, person_id, role, action_by, datetime)
            }

            for (const contact of person.contactNew) {
                await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
            }
        }
        for (const person of body.personExist) {
            await operation.linkCustomerPerson(transaction, customer_id, person, action_by, datetime)
        }

        for (const vehicle of body.vehicleNew) {
            let vehicleResult = await operation.createVehicleNew(transaction, vehicle, action_by, datetime)
            let vehicle_id = await vehicleResult.recordset[0].vehicle_id

            await operation.linkVehicleCustomer(transaction, vehicle_id, customer_id, action_by, datetime)
        }
        for (const vehicle of body.vehicleExist) {
            await operation.linkVehicleCustomer(transaction, vehicle, customer_id, action_by, datetime)
        }

        for (const fleet of body.fleetNew) {
            let fleetResult = await operation.createFleetNew(transaction, fleet, action_by, datetime)
            let fleet_id = fleetResult.recordset[0].fleet_id

            await operation.linkFleetCustomer(transaction, fleet_id, customer_id, action_by, datetime)
        }
        for (const fleet of body.fleetExist) {
            await operation.linkFleetCustomer(transaction, fleet, customer_id, action_by, datetime)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            await operation.createDocumentNew(transaction, body.documentCodeNew[i], files[i].originalname, files[i].buffer,
                customer_id, null, null, null, action_by, datetime)
        }

        await transaction.commit();

    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

async function updateCustomerData(customer_id: string, body: CustomerType, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        await operation.updateCustomer(transaction, customer_id, body.customer, action_by, datetime)

        for (const address of body.addressNew) {
            let addressResult = await operation.createAddressNew(transaction, address, action_by, datetime)
            const address_id = addressResult.recordset[0].address_id

            await operation.linkAddressCustomer(transaction, address_id, customer_id, action_by, datetime)
            for (const addressMasterCode of address.address_type_code_id) {
                await operation.linkAddressMasterCode(transaction, address_id, addressMasterCode, action_by, datetime)
            }
        }
        for (const address of body.addressDelete) {
            await operation.unlinkAddressCustomer(transaction, address, customer_id, action_by, datetime)
        }
        for (const address of body.addressExist) {
            await operation.linkAddressCustomer(transaction, address, customer_id, action_by, datetime)
        }

        for (const contact of body.contactDelete) {
            await operation.deleteContact(transaction, contact, action_by, datetime)
        }
        for (const contact of body.contactNew) {
            await operation.createContactNew(transaction, contact, null, customer_id, action_by, datetime)
        }

        for (const person of body.personNew) {
            let personResult = await operation.createPersonNew(transaction, person.person, action_by, datetime)
            let person_id = personResult.recordset[0].person_id

            await operation.linkCustomerPerson(transaction, customer_id, person_id, action_by, datetime)

            for (const role of person.person.role) {
                await operation.linkPersonRole(transaction, person_id, role, action_by, datetime)
            }

            for (const contact of person.contactNew) {
                await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
            }
        }
        for (const person of body.personDelete) {
            await operation.unlinkCustomerPerson(transaction, customer_id, person, action_by, datetime)
        }
        for (const person of body.personExist) {
            await operation.linkCustomerPerson(transaction, customer_id, person, action_by, datetime)
        }

        for (const vehicle of body.vehicleNew) {
            let vehicleResult = await operation.createVehicleNew(transaction, vehicle, action_by, datetime)
            let vehicle_id = await vehicleResult.recordset[0].vehicle_id

            await operation.linkVehicleCustomer(transaction, vehicle_id, customer_id, action_by, datetime)
        }
        for (const vehicle of body.vehicleDelete) {
            await operation.unlinkVehicleCustomer(transaction, vehicle, customer_id, action_by, datetime)
        }
        for (const vehicle of body.vehicleExist) {
            await operation.linkVehicleCustomer(transaction, vehicle, customer_id, action_by, datetime)
        }

        for (const fleet of body.fleetNew) {
            let fleetResult = await operation.createFleetNew(transaction, fleet, action_by, datetime)
            let fleet_id = fleetResult.recordset[0].fleet_id

            await operation.linkFleetCustomer(transaction, fleet_id, customer_id, action_by, datetime)
        }
        for (const fleet of body.fleetDelete) {
            await operation.unlinkFleetCustomer(transaction, fleet, customer_id, action_by, datetime)
        }
        for (const fleet of body.fleetExist) {
            await operation.linkFleetCustomer(transaction, fleet, customer_id, action_by, datetime)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            await operation.createDocumentNew(transaction, body.documentCodeNew[i], files[i].originalname, files[i].buffer,
                customer_id, null, null, null, action_by, datetime)
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

export default { getCustomerTable, getCustomerData, deleteCustomer, createCustomerData, updateCustomerData } 