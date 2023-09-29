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
                SELECT vehicle_id, license_plate, frame_no, vehicle_type, model_code
                FROM (
                    SELECT  
                        V.vehicle_id, 
                        COALESCE(V.license_plate, '-') AS license_plate, 
                        COALESCE(V.frame_no, '-') AS frame_no, 
                        COALESCE(V.vehicle_type_code_id, '-') AS vehicle_type, 
                        COALESCE(V.model_code_id, '-') AS model_code,
                        ROW_NUMBER () OVER (ORDER BY V.vehicle_id) AS RowNum
                    FROM chonTest..Vehicle V
                    WHERE V.license_plate LIKE @license_plate AND V.isArchived = 0
                ) t1
                WHERE (@firstIndex = 0 OR @lastIndex = 0 OR RowNum BETWEEN @firstIndex AND @lastIndex)

                SELECT COUNT(*) AS count_data
                FROM chonTest..Vehicle
                WHERE license_plate LIKE '%' AND isArchived = 0
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
                SELECT vehicle_id, frame_no, license_plate, model_code_id, registration_province_code_id, registration_type_code_id, driving_license_code_id, number_of_shaft, number_of_wheel, number_of_tire, vehicle_type_code_id
                FROM chonTest..Vehicle
                WHERE vehicle_id = @vehicle_id AND isArchived = 0

                DECLARE @customerTable TABLE (
                    customer_id INT,
                    customer_name NVARCHAR(MAX),
                    telephone NVARCHAR(MAX),
                    email NVARCHAR(MAX)
                )
                INSERT INTO @customerTable
                EXEC chonTest..getCustomerTable @customer_name = '%', @firstIndex = 0, @lastIndex = 0
                SELECT C.customer_id, C.customer_name, C.telephone, C.email
                FROM @customerTable AS C
                LEFT JOIN chonTest..Vehicle V
                ON C.customer_id = V.customer_id
                WHERE V.customer_id = C.customer_id

                DECLARE @personTable TABLE (
                    person_id INT,
                    fullname NVARCHAR(MAX),
                    mobile NVARCHAR(MAX),
                    email NVARCHAR(MAX),
                    description NVARCHAR(MAX),
                    role NVARCHAR(MAX)
                )
                INSERT INTO @personTable
                EXEC chonTest..getPersonTable @fullname = '%', @firstIndex = 0, @lastIndex = 0
                SELECT P.person_id, P.fullname, P.mobile, P.email, P.description, P.role
                FROM @personTable P
                LEFT JOIN chonTest..Vehicle V
                ON P.person_id = V.person_id
                WHERE V.person_id = P.person_id
            `)

        return {
            vehicle: result.recordsets[0][0],
            customer: result.recordsets[1],
            person: result.recordsets[2],
        }
    } catch (err) {
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
                UPDATE chonTest..Vehicle
                SET isArchived = 1, update_date = @update_date
                WHERE vehicle_id = @vehicle_id
            `)
    } catch (err) {
        throw err;
    }
}

export default { getVehicleTable, getVehicleData, deleteVehicle }