import { getDateTime } from "../utils"

const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getDeviceTable (index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('device_id', sql.NVARCHAR, "%" + filter + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                DECLARE @deviceTable DeviceType
                INSERT INTO @deviceTable
                SELECT *
                FROM DevelopERP_ForTesting..Device
                EXEC DevelopERP_ForTesting..formatDeviceTable @deviceTable = @deviceTable, @device_id = @device_id, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            
                SELECT COUNT(*) AS count_data 
                FROM DevelopERP_ForTesting..Device
                WHERE device_id LIKE @device_id AND is_archived = 0    
            `)
        return {
            device: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        }
    } catch (err) {
        throw err;
    }
}

export default { getDeviceTable }