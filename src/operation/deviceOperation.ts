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
            EXEC DevelopERP_Clear..sp_filterDevice @device_id = @device_id, @device_serial_id = NULL, @package_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
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
            SELECT 
                D.device_id, 
                COALESCE(D.veh_id, '') AS veh_id, 
                D.device_serial_id, 
                COALESCE(DS.serial_id, '') serial_id, 
                D.create_date
            FROM DevelopERP_Clear..Device D
            LEFT JOIN DevelopERP_Clear..DeviceSerial DS
            ON D.device_serial_id = DS.device_serial_id
            WHERE D.device_id = @device_id

            SELECT 
                DC.loop_time_engine_on_code_id, 
                COALESCE(M_loop_time_engine_on.value, '') AS loop_time_engine_on,
                DC.loop_time_engine_off_code_id, 
                COALESCE(M_loop_time_engine_off.value, '') AS loop_time_engine_off,
                DC.software_version_code_id, 
                COALESCE(M_software_version.value, '') AS software_version,
                DC.ip_address_code_id,
                COALESCE(M_ip_address.value, '') AS ip_address,
                DC.gateway_port_code_id, 
                COALESCE(M_gateway_port.value, '') AS gateway_port,
                DC.sms_server_number_code_id, 
                COALESCE(M_sms_server_number.value, '') AS sms_server_number,
                DC.sms_message_center_code_id, 
                COALESCE(M_sms_message_center.value, '') AS sms_message_center,
                COALESCE(DC.sim_serial, '') AS sim_serial, 
                COALESCE(DC.mobile_number, '') AS mobile_number, 
                DC.sim_type_code_id, 
                COALESCE(M_sim_type.value, '') AS sim_type,
                COALESCE(DC.description, '') AS description
            FROM DevelopERP_Clear..DeviceConfig DC
            LEFT JOIN DevelopERP_Clear..MasterCode M_loop_time_engine_on
            ON DC.loop_time_engine_on_code_id = M_loop_time_engine_on.code_id
            LEFT JOIN DevelopERP_Clear..MasterCode M_loop_time_engine_off
            ON DC.loop_time_engine_off_code_id = M_loop_time_engine_off.code_id
            LEFT JOIN DevelopERP_Clear..MasterCOde M_software_version
            ON DC.software_version_code_id = M_software_version.code_id
            LEFT JOIN DevelopERP_Clear..MasterCode M_ip_address
            ON DC.ip_address_code_id = M_ip_address.code_id
            LEFT JOIN DevelopERP_Clear..MasterCode M_gateway_port
            ON DC.gateway_port_code_id = M_gateway_port.code_id
            LEFT JOIN DevelopERP_Clear..MasterCode M_sms_server_number
            ON DC.sms_server_number_code_id = M_sms_server_number.code_id
            LEFT JOIN DevelopERP_Clear..MasterCode M_sms_message_center
            ON DC.sms_message_center_code_id = M_sms_message_center.code_id
            LEFT JOIN DevelopERP_Clear..MasterCode M_sim_type
            ON DC.sim_type_code_id = M_sim_type.code_id
            WHERE device_id = @device_id
        `)
}

export async function deleteDevice(transaction: any, device_id: string | number, action_by: number, datetime: object) {
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
        .input('veh_id', sql.NVARCHAR, device.veh_id !== "" ? device.veh_id : null)
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
        .input('loop_time_engine_on_code_id', sql.INT, deviceConfig.loop_time_engine_on_code_id)
        .input('loop_time_engine_off_code_id', sql.INT, deviceConfig.loop_time_engine_off_code_id)
        .input('software_version_code_id', sql.INT, deviceConfig.software_version_code_id)
        .input('ip_address_code_id', sql.INT, deviceConfig.ip_address_code_id)
        .input('gateway_port_code_id', sql.INT, deviceConfig.gateway_port_code_id)
        .input('sms_server_number_code_id', sql.INT, deviceConfig.sms_server_number_code_id)
        .input('sms_message_center_code_id', sql.INT, deviceConfig.sms_message_center_code_id)
        .input('sim_serial', sql.NVARCHAR, deviceConfig.sim_serial !== "" ? deviceConfig.sim_serial : null)
        .input('mobile_number', sql.NVARCHAR, deviceConfig.mobile_number !== "" ? deviceConfig.mobile_number : null)
        .input('sim_type_code_id', sql.INT, deviceConfig.sim_type_code_id)
        .input('network', sql.NVARCHAR, deviceConfig.network !== "" ? deviceConfig.network : null)
        .input('username', sql.NVARCHAR, deviceConfig.username !== "" ? deviceConfig.username : null)
        .input('password', sql.NVARCHAR, deviceConfig.password !== "" ? deviceConfig.password : null)
        .input('description', sql.NVARCHAR, deviceConfig.description !== "" ? deviceConfig.description : null)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_deviceConfig @device_id = @device_id, @loop_time_engine_on_code_id = @loop_time_engine_on_code_id,
                @loop_time_engine_off_code_id = @loop_time_engine_off_code_id, @software_version_code_id = @software_version_code_id,
                @ip_address_code_id = @ip_address_code_id, @gateway_port_code_id = @gateway_port_code_id, @sms_server_number_code_id = @sms_server_number_code_id,
                @sms_message_center_code_id = @sms_message_center_code_id, @sim_serial = @sim_serial, @mobile_number = @mobile_number,
                @sim_type_code_id = @sim_type_code_id, @network = @network, @username = @username, @password = @password, @description = @description,
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function updateDevice(transaction: any, device_id: string | number, device: Device, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('device_id', sql.INT, device_id)
        .input('veh_id', sql.NVARCHAR, device.veh_id !== "" ? device.veh_id : null)
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
        .input('loop_time_engine_on_code_id', sql.INT, deviceConfig.loop_time_engine_on_code_id)
        .input('loop_time_engine_off_code_id', sql.INT, deviceConfig.loop_time_engine_off_code_id)
        .input('software_version_code_id', sql.INT, deviceConfig.software_version_code_id)
        .input('ip_address_code_id', sql.INT, deviceConfig.ip_address_code_id)
        .input('gateway_port_code_id', sql.INT, deviceConfig.gateway_port_code_id)
        .input('sms_server_number_code_id', sql.INT, deviceConfig.sms_server_number_code_id)
        .input('sms_message_center_code_id', sql.INT, deviceConfig.sms_message_center_code_id)
        .input('sim_serial', sql.NVARCHAR, deviceConfig.sim_serial !== "" ? deviceConfig.sim_serial : null)
        .input('mobile_number', sql.NVARCHAR, deviceConfig.mobile_number !== "" ? deviceConfig.mobile_number : null)
        .input('sim_type_code_id', sql.INT, deviceConfig.sim_type_code_id)
        .input('network', sql.NVARCHAR, deviceConfig.network !== "" ? deviceConfig.network : null)
        .input('username', sql.NVARCHAR, deviceConfig.username !== "" ? deviceConfig.username : null)
        .input('password', sql.NVARCHAR, deviceConfig.password !== "" ? deviceConfig.password : null)
        .input('description', sql.NVARCHAR, deviceConfig.description !== "" ? deviceConfig.description : null)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_deviceConfig @device_id = @device_id, @loop_time_engine_on_code_id = @loop_time_engine_on_code_id,
            @loop_time_engine_off_code_id = @loop_time_engine_off_code_id, @software_version_code_id = @software_version_code_id,
            @ip_address_code_id = @ip_address_code_id, @gateway_port_code_id = @gateway_port_code_id, @sms_server_number_code_id = @sms_server_number_code_id,
            @sms_message_center_code_id = @sms_message_center_code_id, @sim_serial = @sim_serial, @mobile_number = @mobile_number,
            @sim_type_code_id = @sim_type_code_id, @network = @network, @username = @username, @password = @password, @description = @description,
            @action_by = @action_by, @action_date = @action_date
        `)
}