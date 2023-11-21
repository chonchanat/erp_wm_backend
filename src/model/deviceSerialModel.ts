import { getDateTime } from "../utils"
import { DeviceSerialType } from "../interfaces/deviceSerial"
const devConfig = require('../config/dbconfig')
const sql = require('mssql')

import * as operation from "../operation/index"

async function getDeviceSerialTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await operation.getDeviceSerialTable(pool, index, filter);

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
        let result = await operation.getDeviceSerialData(pool, device_serial_id);

        return {
            deviceSerial: result.recordsets[0][0],
            device: result.recordsets[1],
            installation: result.recordsets[2],
        };
    } catch (err) {
        throw err;
    }
}

async function deleteDeviceSerial(device_serial_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        await operation.deleteDeviceSerial(pool, device_serial_id, action_by, datetime);

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