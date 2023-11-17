const sql = require('mssql')
import { Vehicle, VehicleConfig, VehiclePermit } from "../interfaces/vehicle"

export async function createVehicleNew(transaction: any, vehicle: Vehicle, action_by: string | number, datetime: object) {
    return await transaction.request()
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
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_vehicle @frame_no = @frame_no, @license_plate = @license_plate, @vehicle_model_id = @vehicle_model_id, 
                @registration_province_code_id = @registration_province_code_id, @registration_type_code_id = @registration_type_code_id, 
                @driving_license_type_code_id = @driving_license_type_code_id, @number_of_axles = @number_of_axles, 
                @number_of_wheels = @number_of_wheels, @number_of_tires = @number_of_tires, @vehicle_type_code_id = @vehicle_type_code_id, 
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function createVehicleConfig(transaction: any, vehicle_id: string | number, vehicleConfig: VehicleConfig, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('oil_lite', sql.DECIMAL(10, 2), vehicleConfig.oil_lite)
        .input('kilo_rate', sql.DECIMAL(10, 2), vehicleConfig.kilo_rate)
        .input('max_speed', sql.INT, vehicleConfig.max_speed)
        .input('idle_time', sql.INT, vehicleConfig.idle_time)
        .input('cc', sql.INT, vehicleConfig.cc)
        .input('type', sql.INT, vehicleConfig.type)
        .input('max_fuel_voltage', sql.INT, vehicleConfig.max_fuel_voltage)
        .input('max_fuel_voltage_2', sql.INT, vehicleConfig.max_fuel_voltage_2)
        .input('max_fuel_voltage_3', sql.INT, vehicleConfig.max_fuel_voltage_3)
        .input('max_fuel', sql.INT, vehicleConfig.max_fuel)
        .input('max_fuel_2', sql.INT, vehicleConfig.max_fuel_2)
        .input('max_fuel_3', sql.INT, vehicleConfig.max_fuel_3)
        .input('max_empty_voltage', sql.INT, vehicleConfig.max_empty_voltage)
        .input('max_empty_voltage_2', sql.INT, vehicleConfig.max_empty_voltage_2)
        .input('max_empty_voltage_3', sql.INT, vehicleConfig.max_empty_voltage_3)
        .input('fuel_status', sql.INT, vehicleConfig.fuel_status)
        .input('action_by', sql.INT, action_by)
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
}

export async function createVehiclePermit(transaction: any, vehicle_id: string | number, vehiclePermit: VehiclePermit, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('dlt', sql.BIT, vehiclePermit.dlt)
        .input('tls', sql.BIT, vehiclePermit.tls)
        .input('scgl', sql.BIT, vehiclePermit.scgl)
        .input('diw', sql.BIT, vehiclePermit.diw)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_vehiclePermit @vehicle_id = @vehicle_id, 
                @dlt = @dlt, @tls = @tls, @scgl = @scgl, @diw = @diw, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function updateVehicle(transaction: any, vehicle_id: string | number, vehicle: Vehicle, action_by: string | number, datetime: object) {
    return transaction.request()
        .input('vehicle_id', sql.INT, vehicle_id)
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
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_vehicle @vehicle_id = @vehicle_id, @frame_no = @frame_no, @license_plate = @license_plate, 
            @vehicle_model_id = @vehicle_model_id, @registration_province_code_id = @registration_province_code_id, 
            @registration_type_code_id = @registration_type_code_id, @driving_license_type_code_id = @driving_license_type_code_id, 
            @number_of_axles = @number_of_axles, @number_of_wheels = @number_of_wheels, @number_of_tires = @number_of_tires, 
            @vehicle_type_code_id = @vehicle_type_code_id, 
            @action_by = @action_by, @action_date = @action_date
        `)
}

export async function updateVehicleConfig(transaction: any, vehicle_id: string | number, vehicleConfig: VehicleConfig, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('oil_lite', sql.DECIMAL(10, 2), vehicleConfig.oil_lite)
        .input('kilo_rate', sql.DECIMAL(10, 2), vehicleConfig.kilo_rate)
        .input('max_speed', sql.INT, vehicleConfig.max_speed)
        .input('idle_time', sql.INT, vehicleConfig.idle_time)
        .input('cc', sql.INT, vehicleConfig.cc)
        .input('type', sql.INT, vehicleConfig.type)
        .input('max_fuel_voltage', sql.INT, vehicleConfig.max_fuel_voltage)
        .input('max_fuel_voltage_2', sql.INT, vehicleConfig.max_fuel_voltage_2)
        .input('max_fuel_voltage_3', sql.INT, vehicleConfig.max_fuel_voltage_3)
        .input('max_fuel', sql.INT, vehicleConfig.max_fuel)
        .input('max_fuel_2', sql.INT, vehicleConfig.max_fuel_2)
        .input('max_fuel_3', sql.INT, vehicleConfig.max_fuel_3)
        .input('max_empty_voltage', sql.INT, vehicleConfig.max_empty_voltage)
        .input('max_empty_voltage_2', sql.INT, vehicleConfig.max_empty_voltage_2)
        .input('max_empty_voltage_3', sql.INT, vehicleConfig.max_empty_voltage_3)
        .input('fuel_status', sql.INT, vehicleConfig.fuel_status)
        .input('action_by', sql.INT, action_by)
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
}

export async function updateVehiclePermit(transaction: any, vehicle_id: string | number, vehiclePermit: VehiclePermit, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('dlt', sql.BIT, vehiclePermit.dlt)
        .input('tls', sql.BIT, vehiclePermit.tls)
        .input('scgl', sql.BIT, vehiclePermit.scgl)
        .input('diw', sql.BIT, vehiclePermit.diw)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_CLear..sp_update_vehiclePermit @vehicle_id = @vehicle_id, 
                @dlt = @dlt, @tls = @tls, @scgl = @scgl, @diw = @diw, @action_by = @action_by, @action_date = @action_date
        `)
}