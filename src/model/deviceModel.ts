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
                EXEC DevelopERP_ForTesting..sp_formatDeviceTable @deviceTable = @deviceTable, @device_id = @device_id, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            
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

async function getDeviceData(device_id: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('device_id', sql.INT, device_id)
            .query(`
                SELECT device_id, veh_id, create_date
                FROM DevelopERP_ForTesting..Device
                WHERE device_id = @device_id

                DECLARE @deviceSerialTable DeviceSerialType
                INSERT INTO @deviceSerialTable
                EXEC DevelopERP_ForTesting..sp_filterDeviceSerial @device_id = @device_id
                EXEC DevelopERP_ForTesting..sp_formatDeviceSerialTable @deviceSerialTable =  @deviceSerialTable, @serial_id ='%', @firstIndex = 0, @lastIndex = 0
            
                SELECT DC.device_config_id, DC.device_id, DC.mobile_number, DC.sim_serial, DC.sim_type_code_id, M_simtype.value AS sim_type, DC.ip_address, DC.software_version
                FROM DevelopERP_ForTesting..DeviceConfig DC
                LEFT JOIN DevelopERP_ForTesting..MasterCode M_simtype
                ON DC.sim_type_code_id = M_simtype.code_id
                WHERE device_id = @device_id
            `)
        return {
            device: result.recordsets[0][0],
            deviceSerial: result.recordsets[1],
            deviceConfig: result.recordsets[2],
        }
    } catch (err) {
        throw err;
    }
}

export default { getDeviceTable, getDeviceData }