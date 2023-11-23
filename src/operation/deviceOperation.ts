const sql = require('mssql')
import { Device, DeviceConfig } from "../interfaces/device"

export async function getDeviceTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('device_id', sql.NVARCHAR, "%" + filter + "%")
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .query(`

            DECLARE @deviceTable IdType
            INSERT INTO @deviceTable
            EXEC DevelopERP_Clear..sp_filterDevice @device_id = @device_id, @device_serial_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_Clear..sp_formatDeviceTable @deviceTable = @deviceTable, @firstIndex = @firstIndex
            
            --EXEC DevelopERP_Clear..sp_filter_format_deviceTable 
            --@device_serial_id=NULL, @device_id = '%', @firstIndex = 0, @lastIndex = 0

            SELECT COUNT(*) AS count_data 
            FROM DevelopERP_Clear..Device
            WHERE device_id LIKE @device_id AND active = 1    
        `)
}

export async function getDeviceData(transaction: any, device_id: string) {
    return await transaction.request()
        .input('device_id', sql.INT, device_id)
        .query(`
            SELECT device_id, veh_id, device_serial_id, create_date
            FROM DevelopERP_Clear..Device
            WHERE device_id = @device_id

            SELECT DC.device_config_id, DC.device_id, DC.config_name, DC.software_version, DC.ip_address, DC.gateway_port, DC.sms_server_number, DC.sms_message_center, DC.sim_serial, DC.mobile_number, DC.sim_type_code_id, M_simtype.value AS sim_type, DC.network, DC.username ,DC.password
            FROM DevelopERP_Clear..DeviceConfig DC
            LEFT JOIN DevelopERP_Clear..MasterCode M_simtype
            ON DC.sim_type_code_id = M_simtype.code_id
            WHERE device_id = @device_id
        `)
}

export async function deleteDevice(transaction: any, device_id: string, action_by: number, datetime: object) {
    return await transaction.request()
        .input('device_id', sql.INT, device_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_device @device_id = @device_id, @action_by = @action_by, @action_date = @action_date
        `)
}

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