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
                SELECT *
                FROM DevelopERP_ForTesting..Vehicle
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
        console.log(err)
        throw err;
    }
}

async function deleteVehicle (vehicleId: string) {
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

export default { getVehicleTable, getVehicleData, deleteVehicle }