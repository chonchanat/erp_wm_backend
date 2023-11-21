const sql = require('mssql')
import { Address } from "../interfaces/address"

export async function getAddressTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('location', sql.NVARCHAR, "%" + filter + "%")
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .query(`
            DECLARE @addressTable IdType
            INSERT INTO @addressTable
            EXEC DevelopERP_ForTesting2..sp_filterAddress @location = @location, @customer_id = NULL, @person_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_ForTesting2..sp_formatAddressTable @addressTable = @addressTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_data
            FROM (
                    SELECT 
                        COALESCE(name + ', ', '') +
                        COALESCE(house_no + ', ', '') +
                        COALESCE('หมู่ที่ ' + village_no + ', ', '') + 
                        COALESCE('ซอย' + alley + ', ', '') +
                        COALESCE('ถนน' + road + ', ', '') + 
                        COALESCE(sub_district + ', ', '') +
                        COALESCE(district + ', ', '') +
                        COALESCE(province + ', ', '') +
                        COALESCE(postal_code , '') as location,
                        active
                    FROM DevelopERP_ForTesting2..Address
            ) t
            WHERE location LIKE @location AND active = 1
        `)
}

export async function getAddressData(transaction: any, address_id: string) {
    return await transaction.request()
        .input('address_id', sql.INT, address_id)
        .query(`
            SELECT
                COALESCE(A.name, '') AS name,
                COALESCE(A.house_no, '') AS house_no,
                COALESCE(A.village_no, '') AS village_no,
                COALESCE(A.alley, '') AS alley,
                COALESCE(A.road, '') AS road,
                COALESCE(A.sub_district, '') AS sub_district,
                COALESCE(A.district, '') AS district,
                COALESCE(A.province, '') AS province,
                COALESCE(A.postal_code, '') AS postal_code
            FROM DevelopERP_ForTesting2..Address A
            WHERE A.address_id = @address_id

            SELECT
                am.address_type_code_id,
                m.value as address_type
            FROM DevelopERP_ForTesting2..Address_MasterCode am
            LEFT JOIN DevelopERP_ForTesting2..MasterCode m
            ON am.address_type_code_id = m.code_id
            WHERE am.address_id = @address_id
        `)
}

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
            EXEC DevelopERP_ForTesting2..sp_insert_address @name = @name, @house_no = @house_no, @village_no = @village_no,
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
            EXEC DevelopERP_ForTesting2..sp_update_address @address_id = @address_id, @name = @name, @house_no = @house_no,
                @village_no = @village_no, @alley = @alley, @road = @road, @sub_district = @sub_district, @district = @district,
                @province = @province, @postal_code = @postal_code, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function deleteAddressData(transaction: any, address_id: string, action_by: number, datetime: object) {
    return await transaction.request()
        .input('address_id', sql.INT, address_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_ForTesting2..sp_delete_address @address_id = @address_id, @action_by = @action_by, @action_date = @action_date
        `)
}

export async function getAddressProvince(transaction: any) {
    return await transaction.request()
        .query(`
            SELECT DISTINCT province_th
            FROM DevelopERP_ForTesting2..AddressModel
            ORDER BY province_th
        `)
}

export async function getAddressDistrict(transaction: any, province: string) {
    return await transaction.request()
        .input('province_th', sql.NVARCHAR, province)
        .query(`
            SELECT DISTINCT district_th
            FROM DevelopERP_ForTesting2..AddressModel
            WHERE province_th LIKE @province_th
            ORDER BY district_th
        `)
}

export async function getAddressSubDistrict(transaction: any, province: string, district: string) {
    return await transaction.request()
        .input('province_th', sql.NVARCHAR, province)
        .input('district_th', sql.NVARCHAR, district)
        .query(`
            SELECT DISTINCT address_model_id, sub_district_th, postal_code
            FROM DevelopERP_ForTesting2..AddressModel
            WHERE province_th LIKE @province_th AND district_th LIKE @district_th
            ORDER BY sub_district_th
        `)
}