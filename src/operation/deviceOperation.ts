const sql = require('mssql')
import { Device, DeviceConfig } from "../interfaces/device"

export async function createDeviceNew(transaction: any, device: Device, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('veh_id', sql.INT, device.veh_id)
        .input('device_serial_id', sql.INT, device.device_serial_id)
        .input('action_by', sql.INT, action_by)
        .input('create_date', sql.DATETIME, datetime)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_device @veh_id = @veh_id, @device_serial_id = @device_serial_id,
                @action_by = @action_by, @create_date = @create_date, @action_date = @action_date
        `)
}

export async function createDeviceConfigNew(transaction: any, device_id: string | number, deviceConfig: DeviceConfig, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('device_id', sql.INT, device_id)
        .input('config_name', sql.NVARCHAR, deviceConfig.config_name)
        .input('software_version', sql.NVARCHAR, deviceConfig.software_version)
        .input('ip_address', sql.NVARCHAR, deviceConfig.ip_address)
        .input('gateway_port', sql.NVARCHAR, deviceConfig.gateway_port)
        .input('sms_server_number', sql.NVARCHAR, deviceConfig.sms_server_number)
        .input('sms_message_center', sql.NVARCHAR, deviceConfig.sms_message_center)
        .input('sim_serial', sql.NVARCHAR, deviceConfig.sim_serial)
        .input('mobile_number', sql.NVARCHAR, deviceConfig.mobile_number)
        .input('sim_type_code_id', sql.INT, deviceConfig.sim_type_code_id)
        .input('network', sql.NVARCHAR, deviceConfig.network)
        .input('username', sql.NVARCHAR, deviceConfig.username)
        .input('password', sql.NVARCHAR, deviceConfig.password)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_deviceConfig @device_id = @device_id, @config_name = @config_name, 
            @software_version = @software_version, @ip_address = @ip_address, @gateway_port = @gateway_port, 
            @sms_server_number = @sms_server_number, @sms_message_center = @sms_message_center, 
            @sim_serial = @sim_serial, @mobile_number = @mobile_number, @sim_type_code_id = @sim_type_code_id, 
            @network = @network, @username = @username, @password = @password,
            @action_by = @action_by, @action_date = @action_date
        `)
}

export async function updateDevice(transaction: any, device_id: string | number, device: Device, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('device_id', sql.INT, device_id)
        .input('veh_id', sql.INT, device.veh_id)
        .input('device_serial_id', sql.INT, device.device_serial_id)
        .input('action_by', sql.INT, action_by)
        .input('create_date', sql.DATETIME, device.create_date)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_device @device_id = @device_id, @veh_id = @veh_id, 
                @device_serial_id = @device_serial_id, @action_by = @action_by, 
                @create_date = @create_date, @action_date = @action_date
        `)
}

export async function updateDeviceConfig(transaction: any, device_id: string | number, deviceConfig: DeviceConfig, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('device_id', sql.INT, device_id)
        .input('config_name', sql.NVARCHAR, deviceConfig.config_name)
        .input('software_version', sql.NVARCHAR, deviceConfig.software_version)
        .input('ip_address', sql.NVARCHAR, deviceConfig.ip_address)
        .input('gateway_port', sql.NVARCHAR, deviceConfig.gateway_port)
        .input('sms_server_number', sql.NVARCHAR, deviceConfig.sms_server_number)
        .input('sms_message_center', sql.NVARCHAR, deviceConfig.sms_message_center)
        .input('sim_serial', sql.NVARCHAR, deviceConfig.sim_serial)
        .input('mobile_number', sql.NVARCHAR, deviceConfig.mobile_number)
        .input('sim_type_code_id', sql.INT, deviceConfig.sim_type_code_id)
        .input('network', sql.NVARCHAR, deviceConfig.network)
        .input('username', sql.NVARCHAR, deviceConfig.username)
        .input('password', sql.NVARCHAR, deviceConfig.password)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_deviceConfig @device_id = @device_id, @config_name = @config_name, 
                @software_version = @software_version, @ip_address = @ip_address, @gateway_port = @gateway_port, 
                @sms_server_number = @sms_server_number, @sms_message_center = @sms_message_center, 
                @sim_serial = @sim_serial, @mobile_number = @mobile_number, @sim_type_code_id = @sim_type_code_id, 
                @network = @network, @username = @username, @password = @password,
                @action_by = @action_by, @action_date = @action_date
        `)
}