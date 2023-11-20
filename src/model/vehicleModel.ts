import { getDateTime } from "../utils";
import { VehicleType } from "../interfaces/vehicle";
const devConfig = require("../config/dbconfig")
const sql = require("mssql")

import * as operation from "../operation/index"

async function getVehicleTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getVehicleTable(pool, index, filter);

        return {
            vehicle: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        }
    } catch (err) {
        throw err;
    }
}

async function getVehicleData(vehicle_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getVehicleData(pool, vehicle_id);

        return {
            vehicle: result.recordsets[0][0],
            vehicleConfig: result.recordsets[1][0],
            vehiclePermit: result.recordsets[2][0],
            customer: result.recordsets[3],
            person: result.recordsets[4],
            fleet: result.recordsets[5],
            document: result.recordsets[6],
            installation: result.recordsets[7],
        }
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function deleteVehicle(vehicle_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        await operation.deleteVehicle(pool, vehicle_id, action_by, datetime);

    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function createVehicleData(body: VehicleType, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin();

        let vehicleResult = await operation.createVehicleNew(transaction, body.vehicle, action_by, datetime)
        let vehicle_id = await vehicleResult.recordset[0].vehicle_id

        await operation.createVehicleConfig(transaction, vehicle_id, body.vehicleConfig, action_by, datetime)
        await operation.createVehiclePermit(transaction, vehicle_id, body.vehiclePermit, action_by, datetime)

        for (const customer of body.customerNew) {
            let customerResult = await operation.createCustomerNew(transaction, customer.customer, action_by, datetime)
            let customer_id = customerResult.recordset[0].customer_id

            await operation.linkVehicleCustomer(transaction, vehicle_id, customer_id, action_by, datetime)
            for (const contact of customer.contactNew) {
                await operation.createContactNew(transaction, contact, null, customer_id, action_by, datetime)
            }
        }
        for (const customer of body.customerExist) {
            await operation.linkVehicleCustomer(transaction, vehicle_id, customer, action_by, datetime)
        }

        for (const person of body.personNew) {
            let personResult = await operation.createPersonNew(transaction, person.person, action_by, datetime)
            let person_id = personResult.recordset[0].person_id

            await operation.linkVehiclePerson(transaction, vehicle_id, person_id, action_by, datetime)
            for (const contact of person.contactNew) {
                await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
            }
        }
        for (const person of body.personExist) {
            await operation.linkVehiclePerson(transaction, vehicle_id, person, action_by, datetime)
        }

        for (const fleet of body.fleetNew) {
            let fleetResult = await operation.createFleetNew(transaction, fleet, action_by, datetime)
            let fleet_id = fleetResult.recordset[0].fleet_id

            await operation.linkFleetVehicle(transaction, fleet_id, vehicle_id, action_by, datetime)
        }
        for (const fleet of body.fleetExist) {
            await operation.linkFleetVehicle(transaction, fleet, vehicle_id, action_by, datetime)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            await operation.createDocumentNew(transaction, body.documentCodeNew[i], files[i].originalname, files[i].buffer,
                null, null, null, vehicle_id, action_by, datetime)
        }

        await transaction.commit();

    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

async function updateVehicleData(vehicle_id: string, body: VehicleType, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updateVehicle(transaction, vehicle_id, body.vehicle, action_by, datetime)
        await operation.updateVehicleConfig(transaction, vehicle_id, body.vehicleConfig, action_by, datetime)
        await operation.updateVehiclePermit(transaction, vehicle_id, body.vehiclePermit, action_by, datetime)

        for (const customer of body.customerNew) {
            let customerResult = await operation.createCustomerNew(transaction, customer.customer, action_by, datetime)
            let customer_id = customerResult.recordset[0].customer_id

            await operation.linkVehicleCustomer(transaction, vehicle_id, customer_id, action_by, datetime)
            for (const contact of customer.contactNew) {
                await operation.createContactNew(transaction, contact, null, customer_id, action_by, datetime)
            }
        }
        for (const customer of body.customerDelete) {
            await operation.unlinkVehicleCustomer(transaction, vehicle_id, customer, action_by, datetime)
        }
        for (const customer of body.customerExist) {
            await operation.linkVehicleCustomer(transaction, vehicle_id, customer, action_by, datetime)
        }

        for (const person of body.personNew) {
            let personResult = await operation.createPersonNew(transaction, person.person, action_by, datetime)
            let person_id = personResult.recordset[0].person_id

            await operation.linkVehiclePerson(transaction, vehicle_id, person_id, action_by, datetime)
            for (const contact of person.contactNew) {
                await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
            }
        }
        for (const person of body.personDelete) {
            await operation.unlinkVehiclePerson(transaction, vehicle_id, person, action_by, datetime)
        }
        for (const person of body.personExist) {
            await operation.linkVehiclePerson(transaction, vehicle_id, person, action_by, datetime)
        }

        for (const fleet of body.fleetNew) {
            let fleetResult = await operation.createFleetNew(transaction, fleet, action_by, datetime)
            let fleet_id = fleetResult.recordset[0].fleet_id

            await operation.linkFleetVehicle(transaction, fleet_id, vehicle_id, action_by, datetime)
        }
        for (const fleet of body.fleetExist) {
            await operation.linkFleetVehicle(transaction, fleet, vehicle_id, action_by, datetime)
        }
        for (const fleet of body.fleetDelete) {
            await operation.unlinkFleetVehicle(transaction, fleet, vehicle_id, action_by, datetime)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            await operation.createDocumentNew(transaction, body.documentCodeNew[i], files[i].originalname, files[i].buffer,
                null, null, null, vehicle_id, action_by, datetime)
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

async function getVehicleBrand() {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getVehicleBrand(pool);

        return {
            brands: result.recordsets[0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getVehicleModel(brand: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getVehicleModel(pool, brand);

        return {
            models: result.recordsets[0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default { getVehicleTable, getVehicleData, deleteVehicle, createVehicleData, updateVehicleData, getVehicleBrand, getVehicleModel }