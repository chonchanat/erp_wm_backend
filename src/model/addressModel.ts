const devConfig = require('../config/dbconfig')
const sql = require('mssql')
import { getDateTime } from "../ultis/datetime";
import { AddressType } from "../interfaces/address"

import * as operation from "../operation/index"

async function getAddressTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await operation.getAddressTable(pool, index, filter);

        return {
            address: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        };
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function getAddressLocation() {
    try {
        let pool = await sql.connect(devConfig)
        let result = await operation.getAddressLocation(pool)

        return {
            addresses: result.recordsets[0],
        }
    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function getAddressData(address_id: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await operation.getAddressData(pool, address_id);

        return {
            address: {
                ...result.recordsets[0][0],
                address_type: result.recordsets[1],
            },
            document: result.recordsets[2],
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
            let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            await operation.createDocumentNew(transaction, body.documentCodeNew[i], fileNameUTF8, files[i].buffer,
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
            let fileNameUTF8 = Buffer.from(files[i].originalname, 'latin1').toString('utf8');

            await operation.createDocumentNew(transaction, body.documentCodeNew[i], fileNameUTF8, files[i].buffer,
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
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        await operation.deleteAddressData(pool, address_id, action_by, datetime)

    } catch (err) {
        console.log(err)
        throw err;
    }
}

async function getAddressProvince() {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getAddressProvince(pool);

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
        let result = await operation.getAddressDistrict(pool, province)

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
        let result = await operation.getAddressSubDistrict(pool, province, district);

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
    getAddressLocation,
    getAddressData,
    createAddressData,
    updateAddressData,
    deleteAddress,
    getAddressProvince,
    getAddressDistrict,
    getAddressSubDistrict,
}