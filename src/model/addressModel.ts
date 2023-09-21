const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../utils";

async function getAddressTable(index: number, filterLocation: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('location', sql.NVARCHAR, "%" + filterLocation + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            // .query('EXEC chonTest..getAddressTable @index');
            .query(`
                EXEC chonTest..getAddressTable @location = @location, @firstIndex= @firstIndex, @lastIndex= @lastIndex

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
                        COALESCE(postal_code , '') as location
                        FROM chonTest..Address
                ) t
                WHERE location LIKE @location
            `)
        return {
            address: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        throw err;
    }
}

async function getAddressData(addressId: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('address_id', sql.INT, addressId)
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
                FROM chonTest..Address A
                WHERE A.address_id = @address_id

                SELECT
                    am.address_type_code_id,
                    m.value as address_type
                FROM chonTest..Address_MasterCode am
                LEFT JOIN chonTest..MasterCode m
                ON am.address_type_code_id = m.code_id
                WHERE am.address_id = @address_id
            `)
        return {
            // address: result.recordsets[0][0],
            // address_type: result.recordsets[1],
            address: {
                ...result.recordsets[0][0],
                address_type: result.recordsets[1],
            }
        };
    } catch (err) {
        throw err;
    }
}

async function createAddressData(body: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin();

        let addressResult = await transaction.request()
            .input('name', sql.NVARCHAR, body.address.name === "" ? null : body.address.name)
            .input('house_no', sql.NVARCHAR, body.address.house_no === "" ? null : body.address.house_no)
            .input('village_no', sql.NVARCHAR, body.address.village_no === "" ? null : body.address.village_no)
            .input('alley', sql.NVARCHAR, body.address.alley === "" ? null : body.address.alley)
            .input('road', sql.NVARCHAR, body.address.road === "" ? null : body.address.road)
            .input('sub_district', sql.NVARCHAR, body.address.sub_district === "" ? null : body.address.sub_district)
            .input('district', sql.NVARCHAR, body.address.district === "" ? null : body.address.district)
            .input('province', sql.NVARCHAR, body.address.province === "" ? null : body.address.province)
            .input('postal_code', sql.NVARCHAR, body.address.postal_code === "" ? null : body.address.postal_code)
            .input('create_by', sql.INT, body.create_by)
            .input('create_date', sql.DATETIME, datetime)
            .input('isArchived', sql.INT, 0)
            .query(`
                INSERT INTO chonTest..Address (name, house_no, village_no, alley, road, sub_district, district, province, postal_code, create_by, create_date, isArchived)
                OUTPUT INSERTED.address_id
                VALUES (@name, @house_no, @village_no, @alley, @road, @sub_district, @district, @province, @postal_code, @create_by, @create_date, @isArchived)
            `)
        let address_id = addressResult.recordset[0].address_id

        for (const addressType of body.address.address_type) {
            let addressMasterCodeResult = await transaction.request()
                .input('address_id', sql.INT, address_id)
                .input('address_type_code_id', sql.INT, addressType)
                .query(`
                    INSERT INTO chonTest..Address_MasterCode (address_id, address_type_code_id)
                    VALUES (@address_id, @address_type_code_id)
                `)
        }

        transaction.commit();

    } catch (err) {
        transaction.rollback();
        throw err
    }
}

async function updateAddressData(body: any, addressId: string) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin();

        let addressResult = await transaction.request()
            .input('name', sql.NVARCHAR, body.address.name === "" ? null : body.address.name)
            .input('house_no', sql.NVARCHAR, body.address.house_no === "" ? null : body.address.house_no)
            .input('village_no', sql.NVARCHAR, body.address.village_no === "" ? null : body.address.village_no)
            .input('alley', sql.NVARCHAR, body.address.alley === "" ? null : body.address.alley)
            .input('road', sql.NVARCHAR, body.address.road === "" ? null : body.address.road)
            .input('sub_district', sql.NVARCHAR, body.address.sub_district === "" ? null : body.address.sub_district)
            .input('district', sql.NVARCHAR, body.address.district === "" ? null : body.address.district)
            .input('province', sql.NVARCHAR, body.address.province === "" ? null : body.address.province)
            .input('postal_code', sql.NVARCHAR, body.address.postal_code === "" ? null : body.address.postal_code)
            .input('update_date', sql.DATETIME, datetime)
            .input('address_id', sql.INT, addressId)
            .query(`
                UPDATE chonTest..Address
                SET name = @name, house_no = @house_no, village_no = @village_no, alley = @alley,  road = @road, sub_district = @sub_district, district = @district, province = @province, postal_code = @postal_code, update_date = @update_date
                WHERE address_id = @address_id
            `)

        for (const addressType of body.address.address_typeDelete) {
            let addressMasterCodeResult = await transaction.request()
                .input('address_id', sql.INT, addressId)
                .input('address_type_code_id', sql.INT, addressType)
                .query(`
                    DELETE FROM chonTest..Address_MasterCode
                    WHERE address_id = @address_id AND address_type_code_id = @address_type_code_id
                `)
        }

        for (const addressType of body.address.address_type) {
            let addressMasterCodeResult = await transaction.request()
                .input('address_id', sql.INT, addressId)
                .input('address_type_code_id', sql.INT, addressType)
                .query(`
                    INSERT INTO chonTest..Address_MasterCode (address_id, address_type_code_id)
                    VALUES (@address_id, @address_type_code_id)
                `)
        }

        transaction.commit();

    } catch (err) {
        transaction.rollback();
        throw err;
    }
}

async function deleteAddress(addressId: string) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('address_id', sql.INT, addressId)
            .input('update_date', sql.DATETIME, datetime)
            .query(`
                UPDATE chonTest..Address
                SET isArchived = 1, update_date = @update_date
                WHERE address_id = @address_id
            `)

    } catch (err) {
        throw err;
    }
}

export default { getAddressTable, getAddressData, createAddressData, updateAddressData, deleteAddress }