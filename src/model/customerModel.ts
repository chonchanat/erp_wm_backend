import { getDateTime, vehicleConfigDefault, vehiclePermitDefault } from "../utils"
// import { CustomerType } from "../interfaces/type";
import { CustomerType } from "../interfaces/customer"

import * as operation from "../operation/index"

const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getCustomerTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await operation.getCustomerTable(pool, index, filter);

        return {
            customer: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function getCustomerName() {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getCustomerName(pool);

        return {
            customers: result.recordsets[0],
        }
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function getCustomerData(customer_id: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await operation.getCustomerData(pool, customer_id);

        return {
            customer: result.recordsets[0][0],
            fleet: result.recordsets[1],
            contact: result.recordsets[2],
            address: result.recordsets[3],
            person: result.recordsets[4],
            vehicle: result.recordsets[5],
            document: result.recordsets[6],
        };
    } catch (err) {
        throw err;
    }
}

async function deleteCustomer(customer_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        await operation.deleteCustomer(pool, customer_id, action_by, datetime);

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
            
            await operation.createVehicleConfig(transaction, vehicle_id, vehicleConfigDefault, action_by, datetime)
            await operation.createVehiclePermit(transaction, vehicle_id, vehiclePermitDefault, action_by, datetime)

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

            await operation.createVehicleConfig(transaction, vehicle_id, vehicleConfigDefault, action_by, datetime)
            await operation.createVehiclePermit(transaction, vehicle_id, vehiclePermitDefault, action_by, datetime)

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

export default { getCustomerTable, getCustomerName, getCustomerData, deleteCustomer, createCustomerData, updateCustomerData } 