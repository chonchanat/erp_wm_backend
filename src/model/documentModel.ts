import { getDateTime } from "../utils"

const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function createDocumentData(files: any) {
    try {
        // let datetime = getDateTime();
        // let pool = await sql.connect(devConfig);
        // let result  = await pool.Request()

        console.log(files)

    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default {createDocumentData}