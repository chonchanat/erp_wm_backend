import { getDateTime } from "../utils"

const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getDeviceTable (index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
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
                WHERE device_id LIKE @device_id AND is_archived = 0    
            `)
        return {
            device: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        }
    } catch (err) {
        throw err;
    }
}

async function getDeviceData(device_id: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('device_id', sql.INT, device_id)
            .query(`
                SELECT device_id, veh_id, create_date
                FROM DevelopERP_Clear..Device
                WHERE device_id = @device_id

                DECLARE @deviceSerialTable IdType
                INSERT INTO @deviceSerialTable 
                EXEC DevelopERP_Clear..sp_filterDeviceSerial @serial_id = '%', @device_id = @device_id, @firstIndex = 0, @lastIndex = 0
                EXEC DevelopERP_Clear..sp_formatDeviceSerialTable @deviceSerialTable = @deviceSerialTable, @firstIndex = 1

                SELECT DC.device_config_id, DC.device_id, DC.config_name, DC.software_version, DC.ip_address, DC.gateway_port, DC.sms_server_number, DC.sms_message_center, DC.sim_serial, DC.mobile_number, DC.sim_type_code_id, M_simtype.value AS sim_type, DC.network, DC.username ,DC.password
                FROM DevelopERP_Clear..DeviceConfig DC
                LEFT JOIN DevelopERP_Clear..MasterCode M_simtype
                ON DC.sim_type_code_id = M_simtype.code_id
                WHERE device_id = @device_id
            `)
        return {
            device: result.recordsets[0][0],
            deviceSerial: result.recordsets[1],
            deviceConfig: result.recordsets[2],
        }
    } catch (err) {
        throw err;
    }
}

async function deleteDevice(device_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('device_id', sql.INT, device_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_delete_device @device_id = @device_id, @action_by = @action_by, @action_date = @action_date
            `)
    } catch (err) {
        throw err;
    }
}

async function createDeviceData(body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let deviceResult = await transaction.request()
            .input('veh_id', sql.INT, body.device.veh_id)
            .input('device_serial_id', sql.INT, body.device.device_serial_id)
            .input('action_by', sql.INT, body.create_by)
            .input('create_date', sql.DATETIME, datetime)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_insert_device @veh_id = @veh_id, @device_serial_id = @device_serial_id,
                    @action_by = @action_by, @create_date = @create_date, @action_date = @action_date
            `)
        let device_id = await deviceResult.recordset[0].device_id

        let deviceConfigResult = await transaction.request()
            .input('device_id', sql.INT, device_id)
            .input('config_name', sql.NVARCHAR, body.deviceConfig.config_name)
            .input('software_version', sql.NVARCHAR, body.deviceConfig.software_version)
            .input('ip_address', sql.NVARCHAR, body.deviceConfig.ip_address)
            .input('gateway_port', sql.NVARCHAR, body.deviceConfig.gateway_port)
            .input('sms_server_number', sql.NVARCHAR, body.deviceConfig.sms_server_number)
            .input('sms_message_center', sql.NVARCHAR, body.deviceConfig.sms_message_center)
            .input('sim_serial', sql.NVARCHAR, body.deviceConfig.sim_serial)
            .input('mobile_number', sql.NVARCHAR, body.deviceConfig.mobile_number)
            .input('sim_type_code_id', sql.INT, body.deviceConfig.sim_type_code_id)
            .input('network', sql.NVARCHAR, body.deviceConfig.network)
            .input('username', sql.NVARCHAR, body.deviceConfig.username)
            .input('password', sql.NVARCHAR, body.deviceConfig.password)
            .input('action_by', sql.INT, body.create_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_insert_deviceConfig @device_id = @device_id, @config_name = @config_name, 
                @software_version = @software_version, @ip_address = @ip_address, @gateway_port = @gateway_port, 
                @sms_server_number = @sms_server_number, @sms_message_center = @sms_message_center, 
                @sim_serial = @sim_serial, @mobile_number = @mobile_number, @sim_type_code_id = @sim_type_code_id, 
                @network = @network, @username = @username, @password = @password,
                @action_by = @action_by, @action_date = @action_date
            `)

        await transaction.commit();
    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

async function updateDeviceData (device_id: string, body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let deviceResult = await transaction.request()
            .input('device_id', sql.INT, device_id)
            .input('veh_id', sql.INT, body.device.veh_id)
            .input('device_serial_id', sql.INT, body.device.device_serial_id)
            .input('action_by', sql.INT, body.update_by)
            .input('create_date', sql.DATETIME, body.device.create_date)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_update_device @device_id = @device_id, @veh_id = @veh_id, 
                    @device_serial_id = @device_serial_id, @action_by = @action_by, 
                    @create_date = @create_date, @action_date = @action_date
            `)

        let deviceConfigResult = await transaction.request()
            .input('device_id', sql.INT, device_id)
            .input('config_name', sql.NVARCHAR, body.deviceConfig.config_name)
            .input('software_version', sql.NVARCHAR, body.deviceConfig.software_version)
            .input('ip_address', sql.NVARCHAR, body.deviceConfig.ip_address)
            .input('gateway_port', sql.NVARCHAR, body.deviceConfig.gateway_port)
            .input('sms_server_number', sql.NVARCHAR, body.deviceConfig.sms_server_number)
            .input('sms_message_center', sql.NVARCHAR, body.deviceConfig.sms_message_center)
            .input('sim_serial', sql.NVARCHAR, body.deviceConfig.sim_serial)
            .input('mobile_number', sql.NVARCHAR, body.deviceConfig.mobile_number)
            .input('sim_type_code_id', sql.INT, body.deviceConfig.sim_type_code_id)
            .input('network', sql.NVARCHAR, body.deviceConfig.network)
            .input('username', sql.NVARCHAR, body.deviceConfig.username)
            .input('password', sql.NVARCHAR, body.deviceConfig.password)
            .input('action_by', sql.INT, body.update_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_update_deviceConfig @device_id = @device_id, @config_name = @config_name, 
                    @software_version = @software_version, @ip_address = @ip_address, @gateway_port = @gateway_port, 
                    @sms_server_number = @sms_server_number, @sms_message_center = @sms_message_center, 
                    @sim_serial = @sim_serial, @mobile_number = @mobile_number, @sim_type_code_id = @sim_type_code_id, 
                    @network = @network, @username = @username, @password = @password,
                    @action_by = @action_by, @action_date = @action_date
            `)

        await transaction.commit();
    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

export default { getDeviceTable, getDeviceData, deleteDevice, createDeviceData, updateDeviceData }