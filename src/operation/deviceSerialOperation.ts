const sql = require('mssql')
import { DeviceSerial } from "../interfaces/deviceSerial"

export async function getDeviceSerialTable(transaction: any, index: number, filter: string) {
    return transaction.request()
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
}

export async function getDeviceSerialId(transaction: any) {
    return await transaction.request()
        .query(`
            SELECT 
                device_serial_id, serial_id
            FROM DevelopERP_Clear..DeviceSerial
            WHERE active = 1
            ORDER BY device_serial_id DESC
        `)
}

export async function getDeviceSerialData(transaction: any, device_serial_id: string) {
    return await transaction.request()
        .input('device_serial_id', sql.NVARCHAR, device_serial_id)
        .query(`
            SELECT 
                DS.device_serial_id, 
                DS.serial_id, 
                COALESCE(DS.imei_serial, '-') AS imei_serial,
                DS.device_type_code_id,
                M.value AS device_type, 
                DS.create_date
            FROM DevelopERP_Clear..DeviceSerial DS
            LEFT JOIN DevelopERP_Clear..MasterCode M
            ON DS.device_type_code_id = M.code_id
            WHERE DS.device_serial_id = @device_serial_id

            DECLARE @deviceTable IdType
            INSERT INTO @deviceTable
            EXEC DevelopERP_Clear..sp_filterDevice @device_id = '%', @device_serial_id = @device_serial_id, @package_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatDeviceTable @deviceTable = @deviceTable, @firstIndex = 1

            DECLARE @packageHistoryTable IdType
            INSERT INTO @packageHistoryTable
            EXEC sp_filterInstallation @vehicle_id = null, @device_serial_id = @device_serial_id, @firstIndex = 0, @lastIndex = 0
            EXEC sp_formatInstallationTable @packageHistoryTable = @packageHistoryTable, @firstIndex = 1
        `)
}

export async function deleteDeviceSerial(transaction: any, device_serial_id: string, action_by: number, datetime: object) {
    return await transaction.request()
        .input('device_serial_id', sql.INT, device_serial_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_deviceSerial @device_serial_id = @device_serial_id,
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function createDeviceSerialNew(transaction: any, deviceSerial: DeviceSerial, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('serial_id', sql.NVARCHAR, deviceSerial.serial_id)
        .input('imei_serial', sql.NVARCHAR, deviceSerial.imei_serial)
        .input('dvr_id', sql.NVARCHAR, deviceSerial.dvr_id)
        .input('device_type_code_id', sql.INT, deviceSerial.device_type_code_id)
        .input('create_date', sql.DATETIME, datetime)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_deviceSerial @serial_id = @serial_id, @imei_serial = @imei_serial, @dvr_id = @dvr_id, 
                @device_type_code_id = @device_type_code_id, @create_date = @create_date, 
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function updateDeviceSerial(transaction: any, device_serial_id: string | number, deviceSerial: DeviceSerial, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('device_serial_id', sql.INT, device_serial_id)
        .input('serial_id', sql.NVARCHAR, deviceSerial.serial_id)
        .input('imei_serial', sql.NVARCHAR, deviceSerial.imei_serial)
        .input('dvr_id', sql.NVARCHAR, deviceSerial.dvr_id)
        .input('device_type_code_id', sql.INT, deviceSerial.device_type_code_id)
        .input('create_date', sql.DATETIME, deviceSerial.create_date)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_deviceSerial @device_serial_id = @device_serial_id, 
            @serial_id = @serial_id, @imei_serial = @imei_serial, @dvr_id = @dvr_id, 
            @device_type_code_id = @device_type_code_id, @create_date = @create_date, 
            @action_by = @action_by, @action_date = @action_date
        `)
}