const sql = require('mssql')
import { Address } from "../interfaces/address"

export async function createAddressNew(transaction: any, address: Address, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('name', sql.NVARCHAR, address.name === "" ? null : address.name)
        .input('house_no', sql.NVARCHAR, address.house_no === "" ? null : address.house_no)
        .input('village_no', sql.NVARCHAR, address.village_no === "" ? null : address.village_no)
        .input('alley', sql.NVARCHAR, address.alley === "" ? null : address.alley)
        .input('road', sql.NVARCHAR, address.road === "" ? null : address.road)
        .input('sub_district', sql.NVARCHAR, address.sub_district === "" ? null : address.sub_district)
        .input('district', sql.NVARCHAR, address.district === "" ? null : address.district)
        .input('province', sql.NVARCHAR, address.province === "" ? null : address.province)
        .input('postal_code', sql.NVARCHAR, address.postal_code === "" ? null : address.postal_code)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_insert_address @name = @name, @house_no = @house_no, @village_no = @village_no,
                @alley = @alley, @road = @road, @sub_district = @sub_district, @district = @district,
                @province = @province, @postal_code = @postal_code, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function updateAddress(transaction: any, address_id: string | number, address: Address, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('address_id', sql.INT, address_id)
        .input('name', sql.NVARCHAR, address.name === "" ? null : address.name)
        .input('house_no', sql.NVARCHAR, address.house_no === "" ? null : address.house_no)
        .input('village_no', sql.NVARCHAR, address.village_no === "" ? null : address.village_no)
        .input('alley', sql.NVARCHAR, address.alley === "" ? null : address.alley)
        .input('road', sql.NVARCHAR, address.road === "" ? null : address.road)
        .input('sub_district', sql.NVARCHAR, address.sub_district === "" ? null : address.sub_district)
        .input('district', sql.NVARCHAR, address.district === "" ? null : address.district)
        .input('province', sql.NVARCHAR, address.province === "" ? null : address.province)
        .input('postal_code', sql.NVARCHAR, address.postal_code === "" ? null : address.postal_code)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_address @address_id = @address_id, @name = @name, @house_no = @house_no,
                @village_no = @village_no, @alley = @alley, @road = @road, @sub_district = @sub_district, @district = @district,
                @province = @province, @postal_code = @postal_code, @action_by = @action_by, @action_date = @action_date
        `)
}