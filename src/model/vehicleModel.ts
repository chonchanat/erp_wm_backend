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
                FROM DevelopERP..Vehicle
                EXEC DevelopERP..formatVehicleTable @vehicleTable = @vehicleTable, @license_plate = '%', @firstIndex = @firstIndex, @lastIndex = @lastIndex 

                SELECT COUNT(*) AS count_data
                FROM DevelopERP..Vehicle
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
                FROM DevelopERP..Vehicle
                WHERE vehicle_id = @vehicle_id AND is_archived = 0

                SELECT 
                    vehicle_config_id, vehicle_id, oil_lite, kilo_rate, max_speed, idle_time, cc, type, 
                    max_fuel_voltage, max_fuel_voltage_2, max_fuel_voltage_3, max_fuel, max_fuel_2, max_fuel_3, 
                    max_empty_voltage, max_empty_voltage_2, max_empty_voltage_3, fuel_status
                FROM DevelopERP..VehicleConfig
                WHERE vehicle_id = @vehicle_id

                DECLARE @customerTable CustomerType
                INSERT INTO @customerTable
                SELECT C.customer_id, C.customer_name, C.sales_type_code_id, C.customer_type_code_id, C.create_by, C.create_date, C.update_date, C.is_archived
                FROM DevelopERP..Vehicle_Customer VC
                LEFT JOIN DevelopERP..Customer C
                ON VC.customer_id = C.customer_id
                WHERE VC.vehicle_id = @vehicle_id
                EXEC DevelopERP..formatCustomerTable @customerTable = @customerTable, @customer_name = '%', @firstIndex = 0, @lastIndex = 0

                DECLARE @personTable PersonType
                INSERT INTO @personTable
                SELECT P.person_id, P.firstname, P.lastname, P.nickname, P.title_code_id, P.description, P.create_by, P.create_date, P.update_date, P.is_archived
                FROM DevelopERP..Vehicle_Person VP
                LEFT JOIN DevelopERP..Person P
                ON VP.person_id = P.person_id
                WHERE VP.vehicle_id = @vehicle_id
                EXEC DevelopERP..formatPersonTable @personTable = @personTable, @fullname = '%', @firstIndex = 0, @lastIndex = 0
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
                UPDATE DevelopERP..Vehicle
                SET is_archived = 1, update_date = @update_date
                WHERE vehicle_id = @vehicle_id
            `)
    } catch (err) {
        throw err;
    }
}

export default { getVehicleTable, getVehicleData, deleteVehicle }