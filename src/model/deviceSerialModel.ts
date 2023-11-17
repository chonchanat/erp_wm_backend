import { getDateTime } from "../utils"
import { DeviceSerialType } from "../interfaces/deviceSerial"
const devConfig = require('../config/dbconfig')
const sql = require('mssql')

import * as operation from "../operation/index"

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

async function createDeviceSerialData(body: DeviceSerialType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.createDeviceSerialNew(transaction, body.deviceSerial, action_by, datetime)

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function updateDeviceSerialData(device_serial_id: string, body: DeviceSerialType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updateDeviceSerial(transaction, device_serial_id, body.deviceSerial, action_by, datetime)

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export default { getDeviceSerialTable, getDeviceSerialData, deleteDeviceSerial, createDeviceSerialData, updateDeviceSerialData }