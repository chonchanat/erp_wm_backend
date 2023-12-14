const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../ultis/datetime";

import * as operation from "../operation/index"
import { Package, PackageType } from "../interfaces/package";

async function getPackageTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getPackageTable(pool, index, filter)

        return {
            package: result.recordsets[0],
            count_date: result.recordsets[1][0].count_data,
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getPackageData(package_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getPackageData(pool, package_id);

        return {
            packge: result.recordsets[0][0],
            vehicle: result.recordsets[1],
            device: result.recordsets[2],
            installation: result.recordsets[3],
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function createPackageData(body: PackageType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let packageResult = await operation.createPackageNew(transaction, body.package, body.vehicleCurrent[0], action_by, datetime);
        let package_id = packageResult.recordset[0].package_id

        for (const device of body.deviceCurrent) {
            await operation.linkPackageHistory(transaction, package_id, body.vehicleCurrent[0], device, datetime);
        }

        await transaction.commit();
    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

async function updatePackageData(package_id: string, body: PackageType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updatePackage(transaction, package_id, body.package, action_by, datetime);

        if (body.vehicleDelete.length === 0) {
            let vehicle_id = body.vehicleCurrent[0];
            for (const device of body.deviceDelete) {
                await operation.unlinkPackageHistory(transaction, package_id, vehicle_id, device, datetime);
            }
            for (const device of body.deviceCurrent) {
                await operation.linkPackageHistory(transaction, package_id, vehicle_id, device, datetime);
            }
        } else {
            let vehicle_id = body.vehicleDelete[0];
            await operation.unlinkPackageHistoryVehicle(transaction, package_id, vehicle_id, datetime);
            vehicle_id = body.vehicleCurrent[0];
            for (const device of body.deviceCurrent) {
                await operation.linkPackageHistory(transaction, package_id, vehicle_id, device, datetime);
            }
        }

        await transaction.commit();
    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

async function deletePackageData(package_id: string, body: PackageType) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        await operation.deletePackage(pool, package_id, action_by, datetime);

    } catch (err) {
        console.log(err);
        throw err;
    }


}

export default { getPackageTable, getPackageData, createPackageData, updatePackageData, deletePackageData };