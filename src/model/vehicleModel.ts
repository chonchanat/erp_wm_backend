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
                DECLARE @vehicleTable IdType
                INSERT INTO @vehicleTable 
                EXEC DevelopERP_Clear..sp_filterVehicle @license_plate = @license_plate, @customer_id = NULL, @fleet_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_Clear..sp_formatVehicleTable @vehicleTable = @vehicleTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP_Clear..Vehicle
                WHERE license_plate LIKE @license_plate AND is_archived = 0
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
                FROM DevelopERP_Clear..Vehicle
                WHERE vehicle_id = @vehicle_id AND is_archived = 0

                SELECT 
                    vehicle_config_id, vehicle_id, oil_lite, kilo_rate, max_speed, idle_time, cc, type, 
                    max_fuel_voltage, max_fuel_voltage_2, max_fuel_voltage_3, max_fuel, max_fuel_2, max_fuel_3, 
                    max_empty_voltage, max_empty_voltage_2, max_empty_voltage_3, fuel_status
                FROM DevelopERP_Clear..VehicleConfig
                WHERE vehicle_id = @vehicle_id

                DECLARE @customerTable IdType
                INSERT INTO @customerTable
                EXEC DevelopERP_Clear..sp_filterCustomer @customer_name = '%', @fleet_id = NULL, @person_id = NULL, @vehicle_id = @vehicle_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatCustomerTable @customerTable = @customerTable, @firstIndex = 1

                DECLARE @personTable IdType
                INSERT INTO @personTable
                EXEC DevelopERP_Clear..sp_filterPerson @fullname = '%', @customer_id = NULL, @fleet_id = NULL, @vehicle_id = @vehicle_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatPersonTable @personTable = @personTable, @firstIndex = 1

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

async function deleteVehicle(vehicleId: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('vehicle_id', sql.INT, vehicleId)
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
            .input('action_by', sql.INT, body.create_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_insert_vehicleConfig @vehicle_id = @vehicle_id, @oil_lite = @oil_lite, 
                    @kilo_rate = @kilo_rate, @max_speed = @max_speed, @idle_time = @idle_time, @cc = @cc, @type = @type, 
                    @max_fuel_voltage = @max_fuel_voltage, @max_fuel_voltage_2 = @max_fuel_voltage_2, 
                    @max_fuel_voltage_3 = @max_fuel_voltage_3, 
                    @max_fuel = @max_fuel, @max_fuel_2 = @max_fuel_2, @max_fuel_3 = @max_fuel_3, 
                    @max_empty_voltage = @max_empty_voltage, @max_empty_voltage_2 = @max_empty_voltage_2, 
                    @max_empty_voltage_3 = @max_empty_voltage_3, @fuel_status = @fuel_status,
                    @action_by = @action_by, @action_date = @action_date   
            `)

        for (const customer of body.customerExist) {
            let vehicleCustomerResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicle_id)
                .input('customer_id', sql.INT, customer)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const person of body.personExist) {
            let vehiclePersonResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicle_id)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_vehicle_person @vehicle_id = @vehicle_id, @person_id = @person_id,
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

async function updateVehicleData(vehicleId: string, body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin();

        let vehicleResult = await transaction.request()
            .input('vehicle_id', sql.INT, vehicleId)
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
            .input('action_by', sql.INT, body.update_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_update_vehicle @vehicle_id = @vehicle_id, @frame_no = @frame_no, @license_plate = @license_plate, 
                @vehicle_model_id = @vehicle_model_id, @registration_province_code_id = @registration_province_code_id, 
                @registration_type_code_id = @registration_type_code_id, @driving_license_type_code_id = @driving_license_type_code_id, 
                @number_of_axles = @number_of_axles, @number_of_wheels = @number_of_wheels, @number_of_tires = @number_of_tires, 
                @vehicle_type_code_id = @vehicle_type_code_id, 
                @action_by = @action_by, @action_date = @action_date
            `)

        let vehicleConfigResult = await transaction.request()
            .input('vehicle_id', sql.INT, vehicleId)
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
            .input('action_by', sql.INT, body.update_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_update_vehicleConfig @vehicle_id = @vehicle_id, @oil_lite = @oil_lite, 
                    @kilo_rate = @kilo_rate, @max_speed = @max_speed, @idle_time = @idle_time, @cc = @cc, @type = @type, 
                    @max_fuel_voltage = @max_fuel_voltage, @max_fuel_voltage_2 = @max_fuel_voltage_2, 
                    @max_fuel_voltage_3 = @max_fuel_voltage_3, @max_fuel = @max_fuel, @max_fuel_2 = @max_fuel_2, 
                    @max_fuel_3 = @max_fuel_3, @max_empty_voltage = @max_empty_voltage, @max_empty_voltage_2 = @max_empty_voltage_2, 
                    @max_empty_voltage_3 = @max_empty_voltage_3, @fuel_status = @fuel_status,
                    @action_by = @action_by, @action_date = @action_date
            `)
        
        for (const customer of body.customerDelete) {
            let vehicleCustomerDeleteResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicleId)
                .input('customer_id', sql.INT, customer)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const customer of body.customerExist) {
            let vehicleCustomerResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicleId)
                .input('customer_id', sql.INT, customer)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const person of body.personDelete) {
            let vehiclePersonDeleteResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicleId)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_vehicle_person @vehicle_id = @vehicle_id, @person_id = @person_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const person of body.personExist) {
            let vehiclePersonResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicleId)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_vehicle_person @vehicle_id = @vehicle_id, @person_id = @person_id,
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

export default { getVehicleTable, getVehicleData, deleteVehicle, createVehicleData, updateVehicleData }