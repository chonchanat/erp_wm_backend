const sql = require('mssql')
import { DeviceSerial } from "../interfaces/deviceSerial"

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