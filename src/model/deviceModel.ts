import { getDateTime } from "../utils"
import { DeviceType } from "../interfaces/device";
const devConfig = require('../config/dbconfig')
const sql = require('mssql')

import * as operation from "../operation/index";

async function getDeviceTable (index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getDeviceTable(pool, index, filter);

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
        let result = await operation.getDeviceData(pool, device_id);

        return {
            device: result.recordsets[0][0],
            deviceConfig: result.recordsets[1][0],
        }
    } catch (err) {
        throw err;
    }
}

async function deleteDevice(device_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number
        let pool = await sql.connect(devConfig);
        await operation.deleteDevice(pool, device_id, action_by, datetime);

    } catch (err) {
        throw err;
    }
}

async function createDeviceData(body: DeviceType) {
    let transaction;
    try {
        // let datetime = getDateTime();
        let datetime = body.device.create_date
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
        // let datetime = getDateTime();
        let datetime = body.device.create_date
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