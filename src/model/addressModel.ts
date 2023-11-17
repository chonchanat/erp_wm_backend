const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../utils";
import { AddressType } from "../interfaces/address"

import * as operation from "../operation/index"

async function getAddressTable(index: number, filterLocation: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('location', sql.NVARCHAR, "%" + filterLocation + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            // .query('EXEC DevelopERP_Clear..getAddressTable @index');
            .query(`
            DECLARE @addressTable IdType
            INSERT INTO @addressTable
            EXEC DevelopERP_Clear..sp_filterAddress @location = @location, @customer_id = NULL, @person_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_Clear..sp_formatAddressTable @addressTable = @addressTable, @firstIndex = @firstIndex

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
                    FROM DevelopERP_Clear..Address
            ) t
            WHERE location LIKE @location AND active = 1
            `)
        return {
            address: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function getAddressData(address_id: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
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
                FROM DevelopERP_Clear..Address A
                WHERE A.address_id = @address_id

                SELECT
                    am.address_type_code_id,
                    m.value as address_type
                FROM DevelopERP_Clear..Address_MasterCode am
                LEFT JOIN DevelopERP_Clear..MasterCode m
                ON am.address_type_code_id = m.code_id
                WHERE am.address_id = @address_id
            `)
        return {
            address: {
                ...result.recordsets[0][0],
                address_type: result.recordsets[1],
            }
        };
    } catch (err) {
        throw err;
    }
}

async function createAddressData(body: AddressType, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin();

        let addressResult = await operation.createAddressNew(transaction, body.address, action_by, datetime)
        let address_id = addressResult.recordset[0].address_id

        for (const addressMasterCode of body.address.address_type_code_id) {
            await operation.linkAddressMasterCode(transaction, address_id, addressMasterCode, action_by, datetime)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            await operation.createDocumentNew(transaction, body.documentCodeNew[i], files[i].originalname, files[i].buffer,
                null, null, address_id, null, action_by, datetime)
        }

        transaction.commit();

    } catch (err) {
        transaction.rollback();
        throw err
    }
}

async function updateAddressData(address_id: string, body: AddressType, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin();

        await operation.updateAddress(transaction, address_id, body.address, action_by, datetime)

        for (const addressMasterCode of body.address.address_type_code_idDelete) {
            await operation.unlinkAddressMasterCode(transaction, address_id, addressMasterCode, action_by, datetime)
        }
        for (const addressMasterCode of body.address.address_type_code_id) {
            await operation.linkAddressMasterCode(transaction, address_id, addressMasterCode, action_by, datetime)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            await operation.createDocumentNew(transaction, body.documentCodeNew[i], files[i].originalname, files[i].buffer,
                null, null, address_id, null, action_by, datetime)
        }
        for (const document of body.documentDelete) {
            await operation.deleteDocument(transaction, document, action_by, datetime)
        }

        transaction.commit();

    } catch (err) {
        console.log(err)
        transaction.rollback();
        throw err;
    }
}

async function deleteAddress(address_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('address_id', sql.INT, address_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_delete_address @address_id = @address_id, @action_by = @action_by, @action_date = @action_date
            `)

    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function getAddressProvince() {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .query(`
                SELECT DISTINCT province_th
                FROM DevelopERP_Clear..AddressModel
                ORDER BY province_th
            `)
        return {
            provinces: result.recordsets[0],
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getAddressDistrict(province: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('province_th', sql.NVARCHAR, province)
            .query(`
                SELECT DISTINCT district_th
                FROM DevelopERP_Clear..AddressModel
                WHERE province_th LIKE @province_th
                ORDER BY district_th
            `)
        return {
            districts: result.recordsets[0],
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getAddressSubDistrict(province: string, district: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('province_th', sql.NVARCHAR, province)
            .input('district_th', sql.NVARCHAR, district)
            .query(`
                SELECT DISTINCT address_model_id, sub_district_th, postal_code
                FROM DevelopERP_Clear..AddressModel
                WHERE province_th LIKE @province_th AND district_th LIKE @district_th
                ORDER BY sub_district_th
            `)
            return {
                sub_districts: result.recordsets[0],
            }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default {
    getAddressTable,
    getAddressData,
    createAddressData,
    updateAddressData,
    deleteAddress,
    getAddressProvince,
    getAddressDistrict,
    getAddressSubDistrict,
}