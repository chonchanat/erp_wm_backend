import { getDateTime } from "../utils";

const devConfig = require("../config/dbconfig")
const sql = require("mssql")

async function getVehicleTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('license_plate', sql.NVARCHAR, "%" + filter + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                DECLARE @vehicleTable VehicleType
                INSERT INTO @vehicleTable 
                EXEC DevelopERP_ForTesting..sp_filterVehicle @customer_id = NULL, @fleet_id = NULL
                EXEC DevelopERP_ForTesting..sp_formatVehicleTable @vehicleTable = @vehicleTable, @license_plate = '%', @firstIndex = @firstIndex, @lastIndex = @lastIndex 

                SELECT COUNT(*) AS count_data
                FROM DevelopERP_ForTesting..Vehicle
                WHERE license_plate LIKE '%' AND is_archived = 0
            `)
        return {
            vehicle: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        }
    } catch (err) {
        throw err;
    }
}

async function getVehicleData(vehicleId: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('vehicle_id', sql.INT, vehicleId)
            .query(`
                SELECT vehicle_id, frame_no, license_plate, vehicle_model_id, registration_province_code_id, registration_type_code_id, driving_license_type_code_id, number_of_axles, number_of_wheels, number_of_tires, vehicle_type_code_id
                FROM DevelopERP_ForTesting..Vehicle
                WHERE vehicle_id = @vehicle_id AND is_archived = 0

                SELECT 
                    vehicle_config_id, vehicle_id, oil_lite, kilo_rate, max_speed, idle_time, cc, type, 
                    max_fuel_voltage, max_fuel_voltage_2, max_fuel_voltage_3, max_fuel, max_fuel_2, max_fuel_3, 
                    max_empty_voltage, max_empty_voltage_2, max_empty_voltage_3, fuel_status
                FROM DevelopERP_ForTesting..VehicleConfig
                WHERE vehicle_id = @vehicle_id

                DECLARE @customerTable CustomerType
                INSERT INTO @customerTable
                EXEC DevelopERP_ForTesting..sp_filterCustomer @fleet_id = NULL, @person_id = NULL, @vehicle_id = @vehicle_id
                EXEC DevelopERP_ForTesting..sp_formatCustomerTable @customerTable = @customerTable, @customer_name = '%', @firstIndex = 0, @lastIndex = 0

                DECLARE @personTable PersonType
                INSERT INTO @personTable
                EXEC DevelopERP_ForTesting..sp_filterPerson @customer_id = NULL, @fleet_id = NULL, @vehicle_id = @vehicle_id
                EXEC DevelopERP_ForTesting..sp_formatPersonTable @personTable = @personTable, @fullname = '%', @firstIndex = 0, @lastIndex = 0
            `)

        return {
            vehicle: result.recordsets[0][0],
            vehicleConfig: result.recordsets[1][0],
            customer: result.recordsets[2],
            person: result.recordsets[3],
        }
    } catch (err) {
        throw err;
    }
}

async function deleteVehicle(vehicleId: string) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('vehicle_id', sql.INT, vehicleId)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE DevelopERP_ForTesting..Vehicle
                SET is_archived = 1, update_date = @update_date
                WHERE vehicle_id = @vehicle_id
            `)
    } catch (err) {
        throw err;
    }
}

async function createVehicleData(body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin();

        let vehicleResult = await transaction.request()
            .input('frame_no', sql.NVARCHAR, body.vehicle.frame_no)
            .input('license_plate', sql.NVARCHAR, body.vehicle.license_plate)
            .input('vehicle_model_id', sql.INT, body.vehicle.vehicle_model_id)
            .input('registration_province_code_id', sql.INT, body.vehicle.registration_province_code_id)
            .input('registration_type_code_id', sql.INT, body.vehicle.registration_type_code_id)
            .input('driving_license_type_code_id', sql.INT, body.vehicle.driving_license_type_code_id)
            .input('number_of_axles', sql.INT, body.vehicle.number_of_axles)
            .input('number_of_wheels', sql.INT, body.vehicle.number_of_wheels)
            .input('number_of_tires', sql.INT, body.vehicle.number_of_tires)
            .input('vehicle_type_code_id', sql.INT, body.vehicle.vehicle_type_code_id)
            .input('create_by', sql.INT, body.create_by)
            .input('create_date', sql.DATETIME, datetime)
            .input('is_archived', sql.INT, 0)
            .query(`
                INSERT INTO DevelopERP_ForTesting..Vehicle (frame_no, license_plate, vehicle_model_id, registration_province_code_id, registration_type_code_id, driving_license_type_code_id, number_of_axles, number_of_wheels, number_of_tires, vehicle_type_code_id, create_by, create_date, is_archived)
                OUTPUT INSERTED.vehicle_id
                VALUES (@frame_no, @license_plate, @vehicle_model_id, @registration_province_code_id, @registration_type_code_id, @driving_license_type_code_id, @number_of_axles, @number_of_wheels, @number_of_tires, @vehicle_type_code_id, @create_by, @create_date, @is_archived)
            `)
        let vehicle_id = await vehicleResult.recordset[0].vehicle_id

        let vehicleConfigResult = await transaction.request()
            .input('vehicle_id', sql.INT, vehicle_id)
            .input('oil_lite', sql.DECIMAL(10,2), body.vehicleConfig.oil_lite)
            .input('kilo_rate', sql.DECIMAL(10,2), body.vehicleConfig.kilo_rate)
            .input('max_speed', sql.INT, body.vehicleConfig.max_speed)
            .input('idle_time', sql.INT, body.vehicleConfig.idle_time)
            .input('cc', sql.INT, body.vehicleConfig.cc)
            .input('type', sql.INT, body.vehicleConfig.type)
            .input('max_fuel_voltage', sql.INT, body.vehicleConfig.max_fuel_voltage)
            .input('max_fuel_voltage_2', sql.INT, body.vehicleConfig.max_fuel_voltage_2)
            .input('max_fuel_voltage_3', sql.INT, body.vehicleConfig.max_fuel_voltage_3)
            .input('max_fuel', sql.INT, body.vehicleConfig.max_fuel)
            .input('max_fuel_2', sql.INT, body.vehicleConfig.max_fuel_2)
            .input('max_fuel_3', sql.INT, body.vehicleConfig.max_fuel_3)
            .input('max_empty_voltage', sql.INT, body.vehicleConfig.max_empty_voltage)
            .input('max_empty_voltage_2', sql.INT, body.vehicleConfig.max_empty_voltage_2)
            .input('max_empty_voltage_3', sql.INT, body.vehicleConfig.max_empty_voltage_3)
            .input('fuel_status', sql.INT, body.vehicleConfig.fuel_status)
            .query(`
                INSERT INTO DevelopERP_ForTesting..VehicleConfig (vehicle_id, oil_lite, kilo_rate, max_speed, idle_time, cc, type, max_fuel_voltage, max_fuel_voltage_2, max_fuel_voltage_3, max_fuel, max_fuel_2, max_fuel_3, max_empty_voltage, max_empty_voltage_2, max_empty_voltage_3, fuel_status)
                VALUES (@vehicle_id, @oil_lite, @kilo_rate, @max_speed, @idle_time, @cc, @type, @max_fuel_voltage, @max_fuel_voltage_2, @max_fuel_voltage_3, @max_fuel, @max_fuel_2, @max_fuel_3, @max_empty_voltage, @max_empty_voltage_2, @max_empty_voltage_3, @fuel_status)    
            `)

        for (const customer of body.customerExist) {
            let vehicleCustomerResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicle_id)
                .input('customer_id', sql.INT, customer)
                .query(`
                    INSERT INTO DevelopERP_ForTesting..Customer (vehicle_id, customer_id)
                    VALUES (@vehicle_id, @customer_id)
                `)
        }

        for (const person of body.personExist) {
            let vehiclePersonResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicle_id)
                .input('person_id', sql.INT, person)
                .query(`
                    INSERT INTO DevelopERP_ForTesting (vehicle_id, person_id)
                    VALUE (@vehicle_id, @person_id)
                `)
        }

        await transaction.commit();

    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export default { getVehicleTable, getVehicleData, deleteVehicle, createVehicleData }