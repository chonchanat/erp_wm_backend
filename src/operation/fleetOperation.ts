const sql = require('mssql')
import { Fleet } from "../interfaces/fleet"

export async function createFleetNew(transaction: any, fleet: Fleet, action_by: string | number, datetime: object) {
    return await transaction.request()
    .input('fleet_name', sql.NVARCHAR, fleet.fleet_name)
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
    .input('fleet_name', sql.NVARCHAR, fleet.fleet_name)
    .input('parent_fleet_id', sql.INT, fleet.parent_fleet_id)
    .input('action_by', sql.INT, action)
    .input('action_date', sql.DATETIME, datetime)
    .query(`
        EXEC DevelopERP_Clear..sp_update_fleet @fleet_id = @fleet_id, @fleet_name = @fleet_name,
            @parent_fleet_id = @parent_fleet_id, @action_by = @action_by, @action_date = @action_date
    `)
}