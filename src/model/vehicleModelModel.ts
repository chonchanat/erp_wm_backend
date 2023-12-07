import { getDateTime } from "../ultis/datetime";
import { VehicleModelType } from "../interfaces/vehicleModel";
const devConfig = require("../config/dbconfig")
const sql = require("mssql")

import * as operation from "../operation/index"

async function getVehicleModelTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getVehicleModelTable(pool, index, filter);

        return {
            vehicleModel: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data,
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getVehicleModelData(vehicle_model_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getVehicleModelData(pool, vehicle_model_id);
        return {
            vehicleModel: result.recordsets[0][0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function createVehicleModelData(body: VehicleModelType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.createVehicleModelData(transaction, body.vehicleModel, action_by, datetime)

        await transaction.commit();
    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

async function updateVehicleModelData(vehicle_model_id: string, body: VehicleModelType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updateVehicleModelData(transaction, vehicle_model_id, body.vehicleModel, action_by, datetime);

        await transaction.commit();
    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

async function deleteVehicleModelData(vehicle_model_id: string, body: VehicleModelType) {
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        
        await operation.deleteVehicleModelData(pool, vehicle_model_id, action_by, datetime);
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getVehicleModelBrand() {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getVehicleModelBrand(pool);

        return {
            brands: result.recordsets[0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getVehicleModelModel(brand: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getVehicleModelModel(pool, brand);

        return {
            models: result.recordsets[0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default { getVehicleModelTable, getVehicleModelData, createVehicleModelData, updateVehicleModelData, deleteVehicleModelData, getVehicleModelBrand, getVehicleModelModel }