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
                EXEC DevelopERP_ForTesting..sp_filterDeviceSerial @device_id = NULL
                EXEC DevelopERP_ForTesting..sp_formatDeviceSerialTable @deviceSerialTable =  @deviceSerialTable, @serial_id =@serial_id, @firstIndex = @firstIndex, @lastIndex = @lastIndex

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

async function getDeviceSerialData (device_serial_id: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('device_serial_id', sql.NVARCHAR, device_serial_id)
            .  query(`
                SELECT DS.device_serial_id, DS.serial_id, COALESCE(DS.imei_serial, '-') AS imei_serial, M.value AS box_type, DS.create_date
                FROM DevelopERP_ForTesting..DeviceSerial DS
                LEFT JOIN DevelopERP_ForTesting..MasterCode M
                ON DS.device_type_code_id = M.code_id
                WHERE DS.device_serial_id = @device_serial_id

                DECLARE @deviceTable DeviceType
                INSERT INTO @deviceTable
                SELECT D.device_id, D.veh_id, D.device_serial_id, D.create_date, D.is_archived, D.create_by, D.update_date
                FROM DevelopERP_ForTesting..Device D
                LEFT JOIN DevelopERP_ForTesting..DeviceSerial DS
                ON D.device_serial_id = DS.device_serial_id
                WHERE DS.device_serial_id = @device_serial_id
                EXEC DevelopERP_ForTesting..sp_formatDeviceTable @deviceTable = @deviceTable, @device_id = '%', @firstIndex = 0, @lastIndex = 0

            `)
        return {
            deviceSerial: result.recordsets[0][0],
            device: result.recordsets[1],
        };
    } catch (err) {
        throw err;
    }
}

export default { getDeviceSerialTable, getDeviceSerialData }