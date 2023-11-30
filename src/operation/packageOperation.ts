const sql = require('mssql')
import { Package, PackageType } from "../interfaces/package"

export async function getPackageTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .query(`
            DECLARE @packageTable IdType
            INSERT INTO @packageTable
            EXEC DevelopERP_ForTesting2..sp_filterPackage @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_ForTesting2..sp_formatPackage @packageTable = @packageTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data
            FROM DevelopERP_ForTesting2..Package
            WHERE active = 1
        `)
}

export async function getPackageData(transaction: any, package_id: string) {
    return await transaction.request()
        .input('package_id', sql.INT, package_id)
        .query(`
            SELECT 
                P.package_id, 
                P.package_name_code_id, COALESCE(M_name.value, '') AS package_name,
                P.package_type_code_id, COALESCE(M_type.value, '') AS package_type,
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
            EXEC DevelopERP_ForTesting2..sp_filterVehicle @license_plate = '%', @customer_id = NULL, @fleet_id = NULL, @package_id = @package_id, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_ForTesting2..sp_formatVehicleTable @vehicleTable = @vehicleTable, @firstIndex = 1

            DECLARE @deviceTable IdType
            INSERT INTO @deviceTable
            EXEC DevelopERP_ForTesting2..sp_filterDevice @device_id = '%', @device_serial_id = NULL, @package_id = @package_id, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_ForTesting2..sp_formatDeviceTable @deviceTable = @deviceTable, @firstIndex = 1

            DECLARE @packageHistoryTable IdType
            INSERT INTO @packageHistoryTable
            EXEC sp_filterInstallation @vehicle_id = null, @device_serial_id = null, @package_id = @package_id, @firstIndex = 0, @lastIndex = 0
            EXEC sp_formatInstallationTable @packageHistoryTable = @packageHistoryTable, @firstIndex = 1
        `)
}

export async function createPackageNew(transaction: any, packages: Package, vehicle_id: string | number, action_by: number, datetime: object) {
    return await transaction.request()
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('package_name_code_id', sql.INT, packages.package_name_code_id)
        .input('package_type_code_id', sql.INT, packages.package_type_code_id)
        .input('package_price', sql.INT, packages.package_price)
        .input('package_start_date', sql.DATETIME, packages.package_start_date)
        .input('package_end_date', sql.DATETIME, packages.package_end_date)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_ForTesting2..sp_insert_package @vehicle_id = @vehicle_id, @package_name_code_id = @package_name_code_id,
                @package_type_code_id = @package_type_code_id, @package_price = @package_price, @package_start_date = @package_start_date,
                @package_end_date = @package_end_date, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function linkPackageHistory(transaction: any, package_id: string | number, vehicle_id: string | number, device_id: string | number) {
    return await transaction.request()
        .input('package_id', sql.INT, package_id)
        .input('vehicle_id', sql.INT, vehicle_id)
        .input('device_id', sql.INT, device_id)
        .query(`
            UPDATE DevelopERP_ForTesting2..PackageHistory
            SET package_id = @package_id
            WHERE vehicle_id = @vehicle_id AND device_id = @device_id
        `)
}

export async function updatePackage(transaction: any, package_id: string, packages: Package, action_by: number, datetime: object) {
    return await transaction.request()
        .input('package_id', sql.INT, package_id)
        .input('package_name_code_id', sql.INT, packages.package_name_code_id)
        .input('package_type_code_id', sql.INT, packages.package_type_code_id)
        .input('package_price', sql.INT, packages.package_price)
        .input('package_start_date', sql.DATETIME, packages.package_start_date)
        .input('package_end_date', sql.DATETIME, packages.package_end_date)
        .input('package_cancel_date', sql.DATETIME, packages.package_cancel_date)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_ForTesting2..sp_update_package @package_id = @package_id, @package_name_code_id = @package_name_code_id,
                @package_type_code_id = @package_type_code_id, @package_price = @package_price,
                @package_start_date = @package_start_date, @package_end_date = @package_end_date, @package_cancel_date = @package_cancel_date,
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function deletePackage(transaction: any, package_id: string, action_by: number, datetime: object) {
    return await transaction.request()
        .input('package_id', sql.INT, package_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_ForTesting2..sp_delete_package @package_id = @package_id, @action_by = @action_by, @action_date = @action_date
        `)
}