const sql = require('mssql')

export async function getPackageTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .query(`
            DECLARE @packageTable IdType
            INSERT INTO @packageTable
            EXEC DevelopERP_Clear..sp_filterPackage @package_name = '%', @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_Clear..sp_formatPackage @packageTable = @packageTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data
            FROM DevelopERP_Clear..Package
            WHERE active = 1
        `)
}

export async function getPackageData(transaction: any, package_id: string) {
    return await transaction.request()
        .input('package_id', sql.INT, package_id)
        .query(`
            SELECT 
                P.package_id, 
                P.package_name_code_id, M_name.value AS package_name,
                P.package_type_code_id, M_type.value AS package_type,
                P.package_price,
                P.package_start_date,
                P.package_end_date,
                P.package_cancel_date
            FROM Package P
            LEFT JOIN MasterCode M_name
            ON P.package_name_code_id = M_name.code_id
            LEFT JOIN MasterCode M_type
            ON P.package_type_code_id = M_type.code_id
            WHERE P.package_id = @package_id

            DECLARE @vehicleTable IdType
            INSERT INTO @vehicleTable 
            EXEC DevelopERP_Clear..sp_filterVehicle @license_plate = '%', @customer_id = NULL, @fleet_id = NULL, @package_id = @package_id, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatVehicleTable @vehicleTable = @vehicleTable, @firstIndex = 1

            DECLARE @deviceTable IdType
            INSERT INTO @deviceTable
            EXEC DevelopERP_Clear..sp_filterDevice @device_id = '%', @device_serial_id = NULL, @package_id = @package_id, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatDeviceTable @deviceTable = @deviceTable, @firstIndex = 1

            DECLARE @packageHistoryTable IdType
            INSERT INTO @packageHistoryTable
            EXEC sp_filterInstallation @vehicle_id = null, @device_serial_id = null, @package_id = @package_id, @firstIndex = 0, @lastIndex = 0
            EXEC sp_formatInstallationTable @packageHistoryTable = @packageHistoryTable, @firstIndex = 1
        `)
}