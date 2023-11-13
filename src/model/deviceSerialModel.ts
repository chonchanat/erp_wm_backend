import { getDateTime } from "../utils"

const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getDeviceSerialTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('serial_id', sql.NVARCHAR, "%" + filter + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                DECLARE @deviceSerialTable IdType
                INSERT INTO @deviceSerialTable 
                EXEC DevelopERP_Clear..sp_filterDeviceSerial @serial_id = @serial_id, @device_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_Clear..sp_formatDeviceSerialTable @deviceSerialTable = @deviceSerialTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data 
                FROM DevelopERP_Clear..DeviceSerial
                WHERE serial_id LIKE @serial_id AND active = 1
            `)
        return {
            deviceSerial: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        }
    } catch (err) {
        throw err;
    }
}

async function getDeviceSerialData(device_serial_id: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('device_serial_id', sql.NVARCHAR, device_serial_id)
            .query(`
                SELECT DS.device_serial_id, DS.serial_id, COALESCE(DS.imei_serial, '-') AS imei_serial, M.value AS box_type, DS.create_date
                FROM DevelopERP_Clear..DeviceSerial DS
                LEFT JOIN DevelopERP_Clear..MasterCode M
                ON DS.device_type_code_id = M.code_id
                WHERE DS.device_serial_id = @device_serial_id

                DECLARE @deviceTable IdType
                INSERT INTO @deviceTable
                EXEC DevelopERP_Clear..sp_filterDevice @device_id = '%', @device_serial_id = @device_serial_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatDeviceTable @deviceTable = @deviceTable, @firstIndex = 1
            `)
        return {
            deviceSerial: result.recordsets[0][0],
            device: result.recordsets[1],
        };
    } catch (err) {
        throw err;
    }
}

async function deleteDeviceSerial(device_serial_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('device_serial_id', sql.INT, device_serial_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_delete_deviceSerial @device_serial_id = @device_serial_id,
                    @action_by = @action_by, @action_date = @action_date
            `)
    } catch (err) {
        throw err;
    }
}

async function createDeviceSerialData(body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let deviceSerialResult = await transaction.request()
            .input('serial_id', sql.NVARCHAR, body.deviceSerial.serial_id)
            .input('imei_serial', sql.NVARCHAR, body.deviceSerial.imei_serial)
            .input('dvr_id', sql.NVARCHAR, body.deviceSerial.dvr_id)
            .input('device_type_code_id', sql.INT, body.deviceSerial.device_type_code_id)
            .input('create_date', sql.DATETIME, datetime)
            .input('action_by', sql.INT, body.create_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_insert_deviceSerial @serial_id = @serial_id, @imei_serial = @imei_serial, @dvr_id = @dvr_id, 
                    @device_type_code_id = @device_type_code_id, @create_date = @create_date, 
                    @action_by = @action_by, @action_date = @action_date
            `)

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function updateDeviceSerialData(device_serial_id: string, body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let deviceSerialResult = await transaction.request()
            .input('device_serial_id', sql.INT, device_serial_id)
            .input('serial_id', sql.NVARCHAR, body.deviceSerial.serial_id)
            .input('imei_serial', sql.NVARCHAR, body.deviceSerial.imei_serial)
            .input('dvr_id', sql.NVARCHAR, body.deviceSerial.dvr_id)
            .input('device_type_code_id', sql.INT, body.deviceSerial.device_type_code_id)
            .input('create_date', sql.DATETIME, body.deviceSerial.create_date)
            .input('action_by', sql.INT, body.update_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_update_deviceSerial @device_serial_id = @device_serial_id, 
                @serial_id = @serial_id, @imei_serial = @imei_serial, @dvr_id = @dvr_id, 
                @device_type_code_id = @device_type_code_id, @create_date = @create_date, 
                @action_by = @action_by, @action_date = @action_date
            `)

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export default { getDeviceSerialTable, getDeviceSerialData, deleteDeviceSerial, createDeviceSerialData, updateDeviceSerialData }