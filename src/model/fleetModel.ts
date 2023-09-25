const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../utils"

async function getFleetTable(index: number, filterFleet: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .input('fleet_name', sql.NVARCHAR, "%" + filterFleet + "%")
            .query(`
                SELECT fleet_id, fleet_name, parent_fleet_id
                FROM (
                    SELECT *,
                    CAST (ROW_NUMBER () OVER (ORDER BY fleet_id) AS INT) AS RowNum
                    FROM chonTest..Fleet
                    WHERE fleet_name LIKE @fleet_name AND isArchived = 0
                ) t1
                WHERE RowNum BETWEEN @firstIndex AND @lastIndex

                SELECT COUNT(*) AS count_data
                FROM chonTest..Fleet
                WHERE fleet_name LIKE @fleet_name AND isArchived = 0
            `)
        return {
            fleet: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getFleetData(fleetId: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('fleet_id', sql.INT, fleetId)
            .query(`
                SELECT *
                FROM chonTest..Fleet
                WHERE fleet_id = @fleet_id
            `)

        return result.recordsets[0]
    } catch (err) {
        throw err;
    }
}

export default { getFleetTable, getFleetData }