const sql = require('mssql')
import { VehicleModel } from "../interfaces/vehicleModel"

export async function getVehicleModelTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('filter', sql.NVARCHAR, "%" + filter + "%")
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .query(`
            DECLARE @vehicleModelTable IdType
            INSERT INTO @vehicleModelTable 
            EXEC DevelopERP_Clear..sp_filterVehicleModel @filter = @filter, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_Clear..sp_formatVehicleModelTable @vehicleModelTable = @vehicleModelTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data
            FROM DevelopERP_Clear..VehicleModel
            WHERE brand LIKE @filter OR model LIKE @filter AND active = 1
        `)
}

export async function getVehicleModelData(transaction: any, vehicle_model_id: string) {
    return await transaction.request()
        .input('vehicle_model_id', sql.INT, vehicle_model_id)
        .query(`
            SELECT
                vehicle_model_id,
                COALESCE(brand, '') AS brand,
                COALESCE(model, '') AS model
            FROM DevelopERP_Clear..VehicleModel
            WHERE vehicle_model_id = @vehicle_model_id AND active = 1
        `)
}

export async function createVehicleModelData(transaction: any, vehicleModel: VehicleModel, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('brand', sql.NVARCHAR, vehicleModel.brand !== "" ? vehicleModel.brand : null)
        .input('model', sql.NVARCHAR, vehicleModel.model !== "" ? vehicleModel.model : null)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_vehicleModel @brand = @brand, @model = @model, 
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function updateVehicleModelData(transaction: any, vehicle_model_id: string, vehicleModel: VehicleModel, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('vehicle_model_id', sql.INT, vehicle_model_id)
        .input('brand', sql.NVARCHAR, vehicleModel.brand !== "" ? vehicleModel.brand : null)
        .input('model', sql.NVARCHAR, vehicleModel.model !== "" ? vehicleModel.model : null)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_vehicleModel @vehicle_model_id = @vehicle_model_id, @brand = @brand, @model = @model,
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function deleteVehicleModelData(transaction: any, vehicle_model_id: string, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('vehicle_model_id', sql.INT, vehicle_model_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_vehicleModel @vehicle_model_id = @vehicle_model_id, 
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function getVehicleModelBrand(transaction: any) {
    return await transaction.request()
        .query(`
            SELECT distinct brand
            FROM DevelopERP_Clear..VehicleModel
            ORDER BY brand
        `)
}

export async function getVehicleModelModel(transaction: any, brand: string) {
    return await transaction.request()
        .input('brand', sql.NVARCHAR, brand)
        .query(`
            SELECT vehicle_model_id, model
            FROM DevelopERP_Clear..VehicleModel
            WHERE brand LIKE @brand
            ORDER BY model
        `)
}