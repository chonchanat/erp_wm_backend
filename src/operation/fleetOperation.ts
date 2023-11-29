const sql = require('mssql')
import { Fleet } from "../interfaces/fleet"

export async function getFleetTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .input('fleet_name', sql.NVARCHAR, "%" + filter + "%")
        .query(`
            DECLARE @fleetTable IdType
            INSERT INTO @fleetTable
            EXEC DevelopERP_Clear..sp_filterFleet @fleet_name = @fleet_name, @customer_id = NULL, @vehicle_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_Clear..sp_formatFleetTable @fleetTable = @fleetTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data
            FROM DevelopERP_Clear..Fleet
            WHERE fleet_name LIKE @fleet_name AND parent_fleet_id IS NULL AND active = 1
        `)
}

export async function getFleetChild(transaction: any, fleet_id: string) {
    return await transaction.request()
        .input('fleet_id', sql.INT, fleet_id)
        .query(`
            DECLARE @fleetTable IdType
            INSERT INTO @fleetTable
            SELECT fleet_id
            FROM DevelopERP_Clear..Fleet
            WHERE parent_fleet_id = @fleet_id
            EXEC DevelopERP_Clear..sp_formatFleetTable @fleetTable = @fleetTable, @firstIndex = 1
        `)
}

export async function getFleetName(transaction: any) {
    return await transaction.request()
        .query(`
            SELECT fleet_id, fleet_name
            FROM DevelopERP_Clear..Fleet
            WHERE active = 1
            ORDER BY fleet_name
        `)
}

export async function getFleetData(transaction: any, fleet_id: string) {
    return await transaction.request()
        .input('fleet_id', sql.INT, fleet_id)
        .query(`
            SELECT F.fleet_id, F.fleet_name, PF.fleet_id AS parent_fleet_id, PF.fleet_name AS parent_fleet_name
            FROM DevelopERP_Clear..Fleet F
            LEFT JOIN DevelopERP_Clear..Fleet PF
            ON F.parent_fleet_id = PF.fleet_id
            WHERE F.fleet_id = @fleet_id

            DECLARE @customerTable IdType
            INSERT INTO @customerTable
            EXEC DevelopERP_Clear..sp_filterCustomer @customer_name = '%',@fleet_id = @fleet_id, @person_id = NULL, @vehicle_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatCustomerTable @customerTable = @customerTable, @firstIndex = 1

            DECLARE @personTable IdType
            INSERT INTO @personTable
            EXEC DevelopERP_Clear..sp_filterPerson @fullname = '%', @customer_id = NULL, @fleet_id = @fleet_id, @vehicle_id = NULL, @user_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatPersonTable @personTable = @personTable, @firstIndex = 1

            DECLARE @vehicleTable IdType
            INSERT INTO @vehicleTable 
            EXEC DevelopERP_Clear..sp_filterVehicle @license_plate = '%', @customer_id = NULL, @fleet_id = @fleet_id, @package_id = NULL, @firstIndex = 0, @lastIndex = 0
            EXEC DevelopERP_Clear..sp_formatVehicleTable @vehicleTable = @vehicleTable, @firstIndex = 1
        `)
}

export async function deleteFleet(transaction: any, fleet_id: string, action_by: number, datetime: object) {
    return await transaction.request()
        .input('fleet_id', sql.INT, fleet_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_fleet @fleet_id = @fleet_id, 
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function createFleetNew(transaction: any, fleet: Fleet, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('fleet_name', sql.NVARCHAR, fleet.fleet_name !== "" ? fleet.fleet_name : null)
        .input('parent_fleet_id', sql.INT, fleet.parent_fleet_id ? fleet.parent_fleet_id : null)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_Clear..sp_insert_fleet @fleet_name = @fleet_name, @parent_fleet_id = @parent_fleet_id,
            @action_by = @action_by, @action_date = @action_date
    `)
}

export async function updateFleet(transaction: any, fleet_id: string | number, fleet: Fleet, action: string | number, datetime: object) {
    return await transaction.request()
        .input('fleet_id', sql.INT, fleet_id)
        .input('fleet_name', sql.NVARCHAR, fleet.fleet_name !== "" ? fleet.fleet_name : null)
        .input('parent_fleet_id', sql.INT, fleet.parent_fleet_id ? fleet.parent_fleet_id : null)
        .input('action_by', sql.INT, action)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_Clear..sp_update_fleet @fleet_id = @fleet_id, @fleet_name = @fleet_name,
            @parent_fleet_id = @parent_fleet_id, @action_by = @action_by, @action_date = @action_date
    `)
}