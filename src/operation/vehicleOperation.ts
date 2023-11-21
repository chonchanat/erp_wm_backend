const sql = require('mssql')
import { Vehicle, VehicleConfig, VehiclePermit } from "../interfaces/vehicle"

export async function getVehicleTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
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
}

export async function getVehicleData(transaction: any, vehicle_id: string) {
    return await transaction.request()
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

            DECLARE @packageHistoryTable IdType
            INSERT INTO @packageHistoryTable
            EXEC sp_filterInstallation @vehicle_id = @vehicle_id, @device_serial_id = null, @firstIndex = 0, @lastIndex = 0
            EXEC sp_formatInstallationTable @packageHistoryTable = @packageHistoryTable, @firstIndex = 1
            `)
}

export async function deleteVehicle(transaction: any, vehicle_id: string, action_by: number, datetime: object) {
    return await transaction.request()
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_vehicle @vehicle_id = @vehicle_id, @action_by = @action_by, @action_date = @action_date
        `)
}

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

export async function getVehicleBrand(transaction: any) {
    return await transaction.request()
        .query(`
            SELECT distinct brand
            FROM DevelopERP_Clear..VehicleModel
            ORDER BY brand
        `)
}

export async function getVehicleModel(transaction: any, brand: string) {
    return await transaction.request()
        .input('brand', sql.NVARCHAR, brand)
        .query(`
            SELECT vehicle_model_id, model
            FROM DevelopERP_Clear..VehicleModel
            WHERE brand LIKE @brand
            ORDER BY model
        `)
}