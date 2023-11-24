const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../utils";

import * as operation from "../operation/index"

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

export default { getPackageTable, getPackageData };