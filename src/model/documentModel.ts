import { getDateTime } from "../utils"
import { DocumentType } from "../interfaces/document";
const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getDocumentTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('document_name', sql.NVARCHAR, "%" + filter + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                DECLARE @documentTable IdType
                INSERT INTO @documentTable
                EXEC DevelopERP_ForTesting2..sp_filterDocument @document_name = @document_name, @customer_id = NULL, @person_id = NULL, 
                    @address_id = NULL, @vehicle_id = NULL, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_ForTesting2..sp_formatDocument @documentTable = @documentTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP_ForTesting2..Document
                WHERE document_name LIKE @document_name AND active = 1
            `)

        return {
            document: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data
        }

    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getDocumentData(document_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('document_id', sql.INT, document_id)
            .query(`
                SELECT 
                    D.document_id,
                    D.document_code_id,
                    D.document_name,
                    D.create_date,
                    CASE
                        WHEN D.customer_id IS NOT NULL
                        THEN 'ลูกค้า'
                        WHEN D.person_id IS NOT NULL
                        THEN 'บุคคล'
                        WHEN D.address_id IS NOT NULL
                        THEN 'ที่อยู่'
                        WHEN D.vehicle_id IS NOT NULL
                        THEN 'ยานยนต์'
                    END AS owner_type,
                    RTRIM(
                        CASE
                            WHEN D.customer_id IS NOT NULL
                            THEN C.customer_name
                            WHEN D.person_id IS NOT NULL
                            THEN COALESCE(P.firstname + ' ', '') + COALESCE(P.lastname + ' ', '') + COALESCE('(' + P.nickname + ')', '')
                            WHEN D.address_id IS NOT NULL
                            THEN 
                                COALESCE(A.name + ', ', '') + 
                                COALESCE(A.house_no + ', ', '') +
                                COALESCE('หมู่ที่ ' + A.village_no + ', ', '') + 
                                COALESCE('ซอย' + A.alley + ', ', '') +
                                COALESCE('ถนน' + A.road + ', ', '') + 
                                COALESCE(A.sub_district + ', ', '') +
                                COALESCE(A.district + ', ', '') +
                                COALESCE(A.province + ', ', '') +
                                COALESCE(A.postal_code, '')
                            WHEN D.vehicle_id IS NOT NULL
                            THEN COALESCE(V.license_plate, '-') + COALESCE(' (' + M_province.value + ')', '')
                        END
                    ) AS owner_name
                FROM DevelopERP_ForTesting2..Document D
                LEFT JOIN Customer C
                ON D.customer_id = C.customer_id
                LEFT JOIN Person P
                ON D.person_id = P.person_id
                LEFT JOIN Address A
                ON D.address_id = A.address_id
                LEFT JOIN Vehicle V
                ON D.vehicle_id = V.vehicle_id
                LEFT JOIN MasterCode M
                ON D.document_code_id = M.code_id
                LEFT JOIN MasterCode M_province
                ON V.registration_province_code_id = M.code_id
                WHERE D.document_id = @document_id AND D.active = 1
            `)

        return {
            document: result.recordsets[0][0],
        }

    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function createDocumentData(body: DocumentType, files: any) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        for (let i = 0; i < files.length; i++) {
            // let fileNameUTF8 = Buffer.from(file.originalname, 'latin1').toString('utf8');
            
            let documentResult = await pool.request()
                .input('document_code_id', sql.INT, body.document.document_code_id)
                .input('customer_id', sql.INT, body.document.customer_id)
                .input('person_id', sql.INT, body.document.person_id)
                .input('address_id', sql.INT, body.document.address_id)
                .input('vehicle_id', sql.INT, body.document.vehicle_id)
                .input('document_name', sql.NVARCHAR, files[i].originalname)
                .input('value', sql.VARBINARY, files[i].buffer)
                .input('create_date', sql.DATETIME, datetime)
                .input('action_by', sql.INT, body.create_by)
                .input('action_date', sql.DATETIME, datetime)
                .query(`
                    EXEC DevelopERP_ForTesting2..sp_insert_document @document_code_id = @document_code_id, @customer_id = @customer_id,
                        @person_id = @person_id, @address_id = @address_id, @vehicle_id = @vehicle_id,
                        @document_name = @document_name, @value = @value, @create_date = @create_date, 
                        @action_by = @action_by, @action_date = @action_date
                `)
        }

        await transaction.commit();
    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

async function updateDocumentData(document_id: string, body: DocumentType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let documentResult = await transaction.request()
            .input('document_id', sql.INT, document_id)
            .input('document_code_id', sql.INT, body.document.document_code_id)
            .input('document_name', sql.NVARCHAR, body.document.document_name)
            .input('action_by', sql.INT, body.update_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_update_document @document_id = @document_id, @document_code_id = @document_code_id,
                    @document_name = @document_name, @action_by = @action_by, @action_date = @action_date
            `)

        await transaction.commit();

    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

async function deleteDocumentData(document_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('document_id', sql.INT, document_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_delete_document @document_id = @document_id, @action_by = @action_by, @action_date = @action_date
            `)
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function downloadDocument(document_id: string) {
    console.log(document_id)
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('document_id', sql.INT, document_id)
            .query(`
                SELECT 
                    document_name, value
                FROM DevelopERP_ForTesting2..Document
                WHERE document_id = @document_id
            `)

        return {
            document: result.recordsets[0][0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default { getDocumentTable, getDocumentData, createDocumentData, updateDocumentData, deleteDocumentData, downloadDocument }