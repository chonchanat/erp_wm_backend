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

export default { getVehicleModelTable, getVehicleModelData }