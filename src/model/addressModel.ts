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

async function createAddressData(body: any, files: any) {
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
            .input('action_by', sql.INT, body.create_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_insert_address @name = @name, @house_no = @house_no, @village_no = @village_no,
                    @alley = @alley, @road = @road, @sub_district = @sub_district, @district = @district,
                    @province = @province, @postal_code = @postal_code, @action_by = @action_by, @action_date = @action_date
            `)
        let address_id = addressResult.recordset[0].address_id

        for (const addressType of body.address.address_type) {
            let addressMasterCodeResult = await transaction.request()
                .input('address_id', sql.INT, address_id)
                .input('address_type_code_id', sql.INT, addressType)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_mastercode @address_id = @address_id, @address_type_code_id = @address_type_code_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            let documentResult = await transaction.request()
                .input('document_code_id', sql.INT, body.documentCodeNew[i])
                .input('customer_id', sql.INT, null)
                .input('person_id', sql.INT, null)
                .input('address_id', sql.INT, address_id)
                .input('vehicle_id', sql.INT, null)
                .input('document_name', sql.NVARCHAR, files[i].originalname)
                .input('value', sql.VARBINARY, files[i].buffer)
                .input('create_date', sql.DATETIME, datetime)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_document @document_code_id = @document_code_id, @customer_id = @customer_id,
                        @person_id = @person_id, @address_id = @address_id, @vehicle_id = @vehicle_id,
                        @document_name = @document_name, @value = @value, @create_date = @create_date, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        transaction.commit();

    } catch (err) {
        transaction.rollback();
        throw err
    }
}

async function updateAddressData( addressId: string, body: any, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig)
        transaction = pool.transaction();
        await transaction.begin();

        let addressResult = await transaction.request()
            .input('address_id', sql.INT, addressId)
            .input('name', sql.NVARCHAR, body.address.name === "" ? null : body.address.name)
            .input('house_no', sql.NVARCHAR, body.address.house_no === "" ? null : body.address.house_no)
            .input('village_no', sql.NVARCHAR, body.address.village_no === "" ? null : body.address.village_no)
            .input('alley', sql.NVARCHAR, body.address.alley === "" ? null : body.address.alley)
            .input('road', sql.NVARCHAR, body.address.road === "" ? null : body.address.road)
            .input('sub_district', sql.NVARCHAR, body.address.sub_district === "" ? null : body.address.sub_district)
            .input('district', sql.NVARCHAR, body.address.district === "" ? null : body.address.district)
            .input('province', sql.NVARCHAR, body.address.province === "" ? null : body.address.province)
            .input('postal_code', sql.NVARCHAR, body.address.postal_code === "" ? null : body.address.postal_code)
            .input('action_by', sql.INT, body.update_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_Clear..sp_update_address @address_id = @address_id, @name = @name, @house_no = @house_no,
                    @village_no = @village_no, @alley = @alley, @road = @road, @sub_district = @sub_district, @district = @district,
                    @province = @province, @postal_code = @postal_code, @action_by = @action_by, @action_date = @action_date
            `)

        for (const addressType of body.address.address_typeDelete) {
            let addressMasterCodeResult = await transaction.request()
                .input('address_id', sql.INT, addressId)
                .input('address_type_code_id', sql.INT, addressType)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_address_mastercode @address_id = @address_id, @address_type_code_id = @address_type_code_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const addressType of body.address.address_type) {
            let addressMasterCodeResult = await transaction.request()
                .input('address_id', sql.INT, addressId)
                .input('address_type_code_id', sql.INT, addressType)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_address_mastercode @address_id = @address_id, @address_type_code_id = @address_type_code_id, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            let documentResult = await transaction.request()
                .input('document_code_id', sql.INT, body.documentCodeNew[i])
                .input('customer_id', sql.INT, null)
                .input('person_id', sql.INT, null)
                .input('address_id', sql.INT, addressId)
                .input('vehicle_id', sql.INT, null)
                .input('document_name', sql.NVARCHAR, files[i].originalname)
                .input('value', sql.VARBINARY, files[i].buffer)
                .input('create_date', sql.DATETIME, datetime)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_insert_document @document_code_id = @document_code_id, @customer_id = @customer_id,
                        @person_id = @person_id, @address_id = @address_id, @vehicle_id = @vehicle_id,
                        @document_name = @document_name, @value = @value, @create_date = @create_date, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        for (const document of body.documentDelete) {
            let documentResult = await transaction.request()
                .input('document_id', sql.INT, document)
                .input('action_by', sql.INT, body.update_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_Clear..sp_delete_document @document_id = @document_id, @action_by = @action_by, @action_date = @action_date
                `)
        }

        transaction.commit();

    } catch (err) {
        console.log(err)
        transaction.rollback();
        throw err;
    }
}

async function deleteAddress(addressId: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('address_id', sql.INT, addressId)
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

export default { getAddressTable, getAddressData, createAddressData, updateAddressData, deleteAddress }