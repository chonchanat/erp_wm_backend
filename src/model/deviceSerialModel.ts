import { getDateTime } from "../utils"

const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getDeviceSerialTable (index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result  = await pool.request()
            .input('serial_id', sql.NVARCHAR, "%" + filter + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                DECLARE @deviceSerialTable DeviceSerialType
                INSERT INTO @deviceSerialTable 
                SELECT *
                FROM DevelopERP_ForTesting..DeviceSerial
                EXEC DevelopERP_ForTesting..formatDeviceSerialTable @deviceSerialTable =  @deviceSerialTable, @serial_id =@serial_id, @firstIndex = @firstIndex, @lastIndex = @lastIndex

                SELECT COUNT(*) AS count_data 
                FROM DevelopERP_ForTesting..DeviceSerial
                WHERE serial_id LIKE @serial_id AND is_archived = 0
            `)
        return {
            deviceSerial: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        }
    } catch (err) {
        throw err;
    }
}

export default { getDeviceSerialTable }