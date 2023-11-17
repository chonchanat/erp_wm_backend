import { getDateTime } from "../utils";
import { VehicleType } from "../interfaces/vehicle";
const devConfig = require("../config/dbconfig")
const sql = require("mssql")

import * as operation from "../operation/index"

async function getVehicleTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('license_plate', sql.NVARCHAR, "%" + filter + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                DECLARE @vehicleTable IdType
                INSERT INTO @vehicleTable 
                EXEC DevelopERP_Clear..sp_filterVehicle @license_plate = @license_plate, @customer_id = NULL, @fleet_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_Clear..sp_formatVehicleTable @vehicleTable = @vehicleTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP_Clear..Vehicle
                WHERE license_plate LIKE @license_plate AND active = 1
            `)
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
        let result = await pool.request()
            .input('vehicle_id', sql.INT, vehicle_id)
            .query(`
                SELECT vehicle_id, frame_no, license_plate, vehicle_model_id, registration_province_code_id, registration_type_code_id, driving_license_type_code_id, number_of_axles, number_of_wheels, number_of_tires, vehicle_type_code_id
                FROM DevelopERP_Clear..Vehicle
                WHERE vehicle_id = @vehicle_id AND active = 1

                SELECT 
                    vehicle_config_id, vehicle_id, oil_lite, kilo_rate, max_speed, idle_time, cc, type, 
                    max_fuel_voltage, max_fuel_voltage_2, max_fuel_voltage_3, max_fuel, max_fuel_2, max_fuel_3, 
                    max_empty_voltage, max_empty_voltage_2, max_empty_voltage_3, fuel_status
                FROM DevelopERP_Clear..VehicleConfig
                WHERE vehicle_id = @vehicle_id

                SELECT
                    dlt, tls, scgl, diw
                FROM DevelopERP_Clear..VehiclePermit
                WHERE vehicle_id = @vehicle_id

                DECLARE @customerTable IdType
                INSERT INTO @customerTable
                EXEC DevelopERP_Clear..sp_filterCustomer @customer_name = '%', @fleet_id = NULL, @person_id = NULL, @vehicle_id = @vehicle_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatCustomerTable @customerTable = @customerTable, @firstIndex = 1

                DECLARE @personTable IdType
                INSERT INTO @personTable
                EXEC DevelopERP_Clear..sp_filterPerson @fullname = '%', @customer_id = NULL, @fleet_id = NULL, @vehicle_id = @vehicle_id, @user_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatPersonTable @personTable = @personTable, @firstIndex = 1

                DECLARE @fleetTable IdType
                INSERT INTO @fleetTable
                EXEC DevelopERP_Clear..sp_filterFleet @fleet_name = '%', @customer_id = NULL, @vehicle_id = @vehicle_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatFleetTable @fleetTable = @fleetTable, @firstIndex = 1

                DECLARE @documentTable IdType
                INSERT INTO @documentTable
                EXEC DevelopERP_Clear..sp_filterDocument @document_name = '%', @customer_id = NULL, @person_id = NULL, 
                    @address_id = NULL, @vehicle_id = @vehicle_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatDocument @documentTable = @documentTable, @firstIndex = 1
                `)

        return {
            vehicle: result.recordsets[0][0],
            vehicleConfig: result.recordsets[1][0],
            vehiclePermit: result.recordsets[2][0],
            customer: result.recordsets[3],
            person: result.recordsets[4],
            fleet: result.recordsets[5],
            document: result.recordsets[6],
        }
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function deleteVehicle(vehicle_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('vehicle_id', sql.INT, vehicle_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_delete_vehicle @vehicle_id = @vehicle_id, @action_by = @action_by, @action_date = @action_date
            `)

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
        let result = await pool.request()
            .query(`
                SELECT distinct brand
                FROM DevelopERP_Clear..VehicleModel
                ORDER BY brand
            `)

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
        let result = await pool.request()
            .input('brand', sql.NVARCHAR, brand)
            .query(`
                SELECT vehicle_model_id, model
                FROM DevelopERP_Clear..VehicleModel
                WHERE brand LIKE @brand
                ORDER BY model
            `)

        return {
            models: result.recordsets[0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default { getVehicleTable, getVehicleData, deleteVehicle, createVehicleData, updateVehicleData, getVehicleBrand, getVehicleModel }