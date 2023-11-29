import { getDateTime } from "../ultis/datetime"
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

async function getDeviceSerialId() {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getDeviceSerialId(pool);

        return {
            deviceSerials: result.recordsets[0],
        }
    } catch (err) {
        console.log(err);
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

        let deviceSerialResult = await operation.createDeviceSerialNew(transaction, body.deviceSerial, action_by, datetime)
        let device_serial_id = deviceSerialResult.recordset[0].device_serial_id

        for (const device of body.deviceNew) {
            let deviceWithDeviceSerialId = device
            deviceWithDeviceSerialId.device['device_serial_id'] = device_serial_id 

            let deviceResult = await operation.createDeviceNew(transaction, deviceWithDeviceSerialId.device, action_by, datetime)
            let device_id = deviceResult.recordset[0].device_id

            await operation.createDeviceConfigNew(transaction, device_id, deviceWithDeviceSerialId.deviceConfig, action_by, datetime)
        }

        await transaction.commit();
    } catch (err) {
        console.log(err);
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

        for (const device of body.deviceNew) {
            let deviceWithDeviceSerialId = device
            deviceWithDeviceSerialId.device['device_serial_id'] = parseInt(device_serial_id) 

            let deviceResult = await operation.createDeviceNew(transaction, deviceWithDeviceSerialId.device, action_by, datetime)
            let device_id = deviceResult.recordset[0].device_id

            await operation.createDeviceConfigNew(transaction, device_id, deviceWithDeviceSerialId.deviceConfig, action_by, datetime)
        }

        await transaction.commit();
    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

export default { getDeviceSerialTable, getDeviceSerialId, getDeviceSerialData, deleteDeviceSerial, createDeviceSerialData, updateDeviceSerialData }