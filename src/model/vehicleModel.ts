import { getDateTime } from "../utils";
import { VehicleType } from "../interfaces/vehicle";
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
                EXEC DevelopERP_ForTesting2..sp_filterVehicle @license_plate = @license_plate, @customer_id = NULL, @fleet_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_ForTesting2..sp_formatVehicleTable @vehicleTable = @vehicleTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP_ForTesting2..Vehicle
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

async function getVehicleData(vehicleId: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('vehicle_id', sql.INT, vehicleId)
            .query(`
                SELECT vehicle_id, frame_no, license_plate, vehicle_model_id, registration_province_code_id, registration_type_code_id, driving_license_type_code_id, number_of_axles, number_of_wheels, number_of_tires, vehicle_type_code_id
                FROM DevelopERP_ForTesting2..Vehicle
                WHERE vehicle_id = @vehicle_id AND active = 1

                SELECT 
                    vehicle_config_id, vehicle_id, oil_lite, kilo_rate, max_speed, idle_time, cc, type, 
                    max_fuel_voltage, max_fuel_voltage_2, max_fuel_voltage_3, max_fuel, max_fuel_2, max_fuel_3, 
                    max_empty_voltage, max_empty_voltage_2, max_empty_voltage_3, fuel_status
                FROM DevelopERP_ForTesting2..VehicleConfig
                WHERE vehicle_id = @vehicle_id

                SELECT
                    dlt, tls, scgl, diw
                FROM DevelopERP_ForTesting2..VehiclePermit
                WHERE vehicle_id = @vehicle_id

                DECLARE @customerTable IdType
                INSERT INTO @customerTable
                EXEC DevelopERP_ForTesting2..sp_filterCustomer @customer_name = '%', @fleet_id = NULL, @person_id = NULL, @vehicle_id = @vehicle_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_ForTesting2..sp_formatCustomerTable @customerTable = @customerTable, @firstIndex = 1

                DECLARE @personTable IdType
                INSERT INTO @personTable
                EXEC DevelopERP_ForTesting2..sp_filterPerson @fullname = '%', @customer_id = NULL, @fleet_id = NULL, @vehicle_id = @vehicle_id, @user_id = NULL, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_ForTesting2..sp_formatPersonTable @personTable = @personTable, @firstIndex = 1

                `)

        return {
            vehicle: result.recordsets[0][0],
            vehicleConfig: result.recordsets[1][0],
            vehiclePermit: result.recordsets[2][0],
            customer: result.recordsets[3],
            person: result.recordsets[4],
        }
    } catch (err) {
        console.log(err)
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
                EXEC DevelopERP_ForTesting2..sp_delete_vehicle @vehicle_id = @vehicle_id, @action_by = @action_by, @action_date = @action_date
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
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_insert_vehicle @frame_no = @frame_no, @license_plate = @license_plate, @vehicle_model_id = @vehicle_model_id, 
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
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_insert_vehicleConfig @vehicle_id = @vehicle_id, @oil_lite = @oil_lite, 
                    @kilo_rate = @kilo_rate, @max_speed = @max_speed, @idle_time = @idle_time, @cc = @cc, @type = @type, 
                    @max_fuel_voltage = @max_fuel_voltage, @max_fuel_voltage_2 = @max_fuel_voltage_2, 
                    @max_fuel_voltage_3 = @max_fuel_voltage_3, 
                    @max_fuel = @max_fuel, @max_fuel_2 = @max_fuel_2, @max_fuel_3 = @max_fuel_3, 
                    @max_empty_voltage = @max_empty_voltage, @max_empty_voltage_2 = @max_empty_voltage_2, 
                    @max_empty_voltage_3 = @max_empty_voltage_3, @fuel_status = @fuel_status,
                    @action_by = @action_by, @action_date = @action_date   
            `)

        let vehiclePermitReuslt = await transaction.request()
            .input('vehicle_id', sql.INT, vehicle_id)
            .input('dlt', sql.BIT, body.vehiclePermit.dlt)
            .input('tls', sql.BIT, body.vehiclePermit.tls)
            .input('scgl', sql.BIT, body.vehiclePermit.scgl)
            .input('diw', sql.BIT, body.vehiclePermit.diw)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_insert_vehiclePermit @vehicle_id = @vehicle_id, 
                    @dlt = @dlt, @tls = @tls, @scgl = @scgl, @diw = @diw, @action_by = @action_by, @action_date = @action_date
            `)

        for (const customer of body.customerExist) {
            let vehicleCustomerResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicle_id)
                .input('customer_id', sql.INT, customer)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_ForTesting2..sp_insert_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const person of body.personExist) {
            let vehiclePersonResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicle_id)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_ForTesting2..sp_insert_vehicle_person @vehicle_id = @vehicle_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            let documentResult = await transaction.request()
                .input('document_code_id', sql.INT, body.documentCodeNew[i])
                .input('customer_id', sql.INT, null)
                .input('person_id', sql.INT, null)
                .input('address_id', sql.INT, null)
                .input('vehicle_id', sql.INT, vehicle_id)
                .input('document_name', sql.NVARCHAR, files[i].originalname)
                .input('value', sql.VARBINARY, files[i].buffer)
                .input('create_date', sql.DATETIME, datetime)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_ForTesting2..sp_insert_document @document_code_id = @document_code_id, @customer_id = @customer_id,
                        @person_id = @person_id, @address_id = @address_id, @vehicle_id = @vehicle_id,
                        @document_name = @document_name, @value = @value, @create_date = @create_date, 
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

async function updateVehicleData(vehicleId: string, body: VehicleType, files: any) {
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
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_update_vehicle @vehicle_id = @vehicle_id, @frame_no = @frame_no, @license_plate = @license_plate, 
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
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_update_vehicleConfig @vehicle_id = @vehicle_id, @oil_lite = @oil_lite, 
                    @kilo_rate = @kilo_rate, @max_speed = @max_speed, @idle_time = @idle_time, @cc = @cc, @type = @type, 
                    @max_fuel_voltage = @max_fuel_voltage, @max_fuel_voltage_2 = @max_fuel_voltage_2, 
                    @max_fuel_voltage_3 = @max_fuel_voltage_3, @max_fuel = @max_fuel, @max_fuel_2 = @max_fuel_2, 
                    @max_fuel_3 = @max_fuel_3, @max_empty_voltage = @max_empty_voltage, @max_empty_voltage_2 = @max_empty_voltage_2, 
                    @max_empty_voltage_3 = @max_empty_voltage_3, @fuel_status = @fuel_status,
                    @action_by = @action_by, @action_date = @action_date
            `)

        let vehiclePermitReuslt = await transaction.request()
            .input('vehicle_id', sql.INT, vehicleId)
            .input('dlt', sql.BIT, body.vehiclePermit.dlt)
            .input('tls', sql.BIT, body.vehiclePermit.tls)
            .input('scgl', sql.BIT, body.vehiclePermit.scgl)
            .input('diw', sql.BIT, body.vehiclePermit.diw)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_update_vehiclePermit @vehicle_id = @vehicle_id, 
                    @dlt = @dlt, @tls = @tls, @scgl = @scgl, @diw = @diw, @action_by = @action_by, @action_date = @action_date
            `)
        
        for (const customer of body.customerDelete) {
            let vehicleCustomerDeleteResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicleId)
                .input('customer_id', sql.INT, customer)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_ForTesting2..sp_delete_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const customer of body.customerExist) {
            let vehicleCustomerResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicleId)
                .input('customer_id', sql.INT, customer)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_ForTesting2..sp_insert_vehicle_customer @vehicle_id = @vehicle_id, @customer_id = @customer_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const person of body.personDelete) {
            let vehiclePersonDeleteResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicleId)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_ForTesting2..sp_delete_vehicle_person @vehicle_id = @vehicle_id, @person_id = @person_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const person of body.personExist) {
            let vehiclePersonResult = await transaction.request()
                .input('vehicle_id', sql.INT, vehicleId)
                .input('person_id', sql.INT, person)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_ForTesting2..sp_insert_vehicle_person @vehicle_id = @vehicle_id, @person_id = @person_id,
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            let documentResult = await transaction.request()
                .input('document_code_id', sql.INT, body.documentCodeNew[i])
                .input('customer_id', sql.INT, null)
                .input('person_id', sql.INT, null)
                .input('address_id', sql.INT, null)
                .input('vehicle_id', sql.INT, vehicleId)
                .input('document_name', sql.NVARCHAR, files[i].originalname)
                .input('value', sql.VARBINARY, files[i].buffer)
                .input('create_date', sql.DATETIME, datetime)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_ForTesting2..sp_insert_document @document_code_id = @document_code_id, @customer_id = @customer_id,
                        @person_id = @person_id, @address_id = @address_id, @vehicle_id = @vehicle_id,
                        @document_name = @document_name, @value = @value, @create_date = @create_date, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const document of body.documentDelete) {
            let documentResult = await transaction.request()
                .input('document_id', sql.INT, document)
                .input('action_by', sql.INT, body.action_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_ForTesting2..sp_delete_document @document_id = @document_id, @action_by = @action_by, @action_date = @action_date
                `)
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
                FROM DevelopERP_ForTesting2..VehicleModel
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
                FROM DevelopERP_ForTesting2..VehicleModel
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