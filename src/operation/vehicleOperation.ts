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