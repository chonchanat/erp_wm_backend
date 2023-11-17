import { getDateTime } from "../utils"
import { DeviceType } from "../interfaces/device";
const devConfig = require('../config/dbconfig')
const sql = require('mssql')

import * as operation from "../operation/index";

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
                WHERE device_id LIKE @device_id AND active = 1    
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
            deviceConfig: result.recordsets[2][0],
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

async function createDeviceData(body: DeviceType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let deviceResult = await operation.createDeviceNew(transaction, body.device, action_by, datetime)
        let device_id = await deviceResult.recordset[0].device_id

        await operation.createDeviceConfigNew(transaction, device_id, body.deviceConfig, action_by, datetime)

        await transaction.commit();
    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

async function updateDeviceData (device_id: string, body: DeviceType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updateDevice(transaction, device_id, body.device, action_by, datetime)

        await operation.updateDeviceConfig(transaction, device_id, body.deviceConfig, action_by, datetime)

        await transaction.commit();
    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

export default { getDeviceTable, getDeviceData, deleteDevice, createDeviceData, updateDeviceData }