const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime, vehicleConfigDefault, vehiclePermitDefault } from "../utils"
import { FleetType } from "../interfaces/fleet";

import * as operation from "../operation/index"

async function getFleetTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getFleetTable(pool, index, filter);

        return {
            fleet: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getFleetChild(fleet_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getFleetChild(pool, fleet_id);

        return {
            fleet: result.recordsets[0],
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getFleetName() {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getFleetName(pool);

        return {
            fleets: result.recordsets[0],
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getFleetData(fleet_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getFleetData(pool, fleet_id);

        return {
            fleet: result.recordsets[0][0],
            customer: result.recordsets[1],
            person: result.recordsets[2],
            vehicle: result.recordsets[3],
        }
    } catch (err) {
        throw err;
    }
}

async function deleteFleet(fleet_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        await operation.deleteFleet(pool, fleet_id, action_by, datetime);

    } catch (err) {
        throw err;
    }
}

async function createFleetData(body: FleetType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by: number = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin()

        let fleetResult = await operation.createFleetNew(transaction, body.fleet, action_by, datetime)
        let fleet_id = fleetResult.recordset[0].fleet_id

        for (const customer of body.customerNew) {
            let customerResult = await operation.createCustomerNew(transaction, customer.customer, action_by, datetime)
            let customer_id = customerResult.recordset[0].customer_id

            await operation.linkFleetCustomer(transaction, fleet_id, customer_id, action_by, datetime)
            for (const contact of customer.contactNew) {
                await operation.createContactNew(transaction, contact, null, customer_id, action_by, datetime)
            } 
        }
        for (const customer of body.customerExist) {
            await operation.linkFleetCustomer(transaction, fleet_id, customer, action_by, datetime)
        }

        for (const person of body.personNew) {
            let personResult = await operation.createPersonNew(transaction, person.person, action_by, datetime)
            let person_id = personResult.recordset[0].person_id

            await operation.linkFleetPerson(transaction, fleet_id, person_id, action_by, datetime)
            for (const contact of person.contactNew) {
                await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
            }
        }
        for (const person of body.personExist) {
            await operation.linkFleetPerson(transaction, fleet_id, person, action_by, datetime)
        }
      
        for (const vehicle of body.vehicleNew) {
            let vehicleResult = await operation.createVehicleNew(transaction, vehicle, action_by, datetime)
            let vehicle_id = vehicleResult.recordset[0].vehicle_id

            await operation.createVehicleConfig(transaction, vehicle_id, vehicleConfigDefault, action_by, datetime)
            await operation.createVehiclePermit(transaction, vehicle_id, vehiclePermitDefault, action_by, datetime)

            await operation.linkFleetVehicle(transaction, fleet_id, vehicle_id, action_by, datetime)
        }
        for (const vehicle of body.vehicleExist) {
            await operation.linkFleetVehicle(transaction, fleet_id, vehicle, action_by, datetime)
        }

        await transaction.commit();
    
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function updateFleetData(fleet_id: string, body: FleetType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by: number = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updateFleet(transaction, fleet_id, body.fleet, action_by, datetime)

        for (const customer of body.customerNew) {
            let customerResult = await operation.createCustomerNew(transaction, customer.customer, action_by, datetime)
            let customer_id = customerResult.recordset[0].customer_id

            await operation.linkFleetCustomer(transaction, fleet_id, customer_id, action_by, datetime)
            for (const contact of customer.contactNew) {
                await operation.createContactNew(transaction, contact, null, customer_id, action_by, datetime)
            } 
        }
        for (const customer of body.customerDelete) {
            await operation.unlinkFleetCustomer(transaction, fleet_id, customer, action_by, datetime)
        }
        for (const customer of body.customerExist) {
            await operation.linkFleetCustomer(transaction, fleet_id, customer, action_by, datetime)
        }

        for (const person of body.personNew) {
            let personResult = await operation.createPersonNew(transaction, person.person, action_by, datetime)
            let person_id = personResult.recordset[0].person_id

            await operation.linkFleetPerson(transaction, fleet_id, person_id, action_by, datetime)
            for (const contact of person.contactNew) {
                await operation.createContactNew(transaction, contact, person_id, null, action_by, datetime)
            }
        }
        for (const person of body.personDelete) {
            await operation.unlinkFleetPerson(transaction, fleet_id, person, action_by, datetime)
        }
        for (const person of body.personExist) {
            await operation.linkFleetPerson(transaction, fleet_id, person, action_by, datetime)
        }

        for (const vehicle of body.vehicleNew) {
            let vehicleResult = await operation.createVehicleNew(transaction, vehicle, action_by, datetime)
            let vehicle_id = vehicleResult.recordset[0].vehicle_id

            await operation.createVehicleConfig(transaction, vehicle_id, vehicleConfigDefault, action_by, datetime)
            await operation.createVehiclePermit(transaction, vehicle_id, vehiclePermitDefault, action_by, datetime)

            await operation.linkFleetVehicle(transaction, fleet_id, vehicle_id, action_by, datetime)
        }
        for (const vehicle of body.vehicleDelete) {
            await operation.unlinkFleetVehicle(transaction, fleet_id, vehicle, action_by, datetime)
        }
        for (const vehicle of body.vehicleExist) {
            await operation.linkFleetVehicle(transaction, fleet_id, vehicle, action_by, datetime)
        }

        await transaction.commit();

    } catch (err) {
        transaction.rollback();
        throw err;
    }
}

export default { getFleetTable, getFleetChild, getFleetName, getFleetData, deleteFleet, createFleetData, updateFleetData }