const devConfig = require('../config/dbconfig')
const sql = require('mssql')

async function getContactTable(index: number, filterValue: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .input('value', sql.NVARCHAR, "%" + filterValue + "%")
            .query(`
                EXEC DevelopERP..getContactTable @value = @value, @firstIndex= @firstIndex, @lastIndex= @lastIndex

                SELECT COUNT(*) AS count_data
                FROM DevelopERP..Contact
                WHERE value LIKE @value
            `)
        return {
            contact: result.recordsets[0],
            count_data: result.recordsets[1][0].count_data,
        }
    } catch (err) {
        throw err;
    }
}

async function getContactData(contactId: string) {
    try {
        let pool = await sql.connect(devConfig)
        let result = await pool.request()
            .input('contact_id', sql.INT, contactId)
            .query(`
                SELECT 
                    ct.contact_id,
                    ct.value,
                    ct.contact_code_id,
                    m.value AS contact_type,
                    CASE
                        WHEN ct.person_id IS NULL
                        THEN c.customer_name
                        WHEN ct.customer_id IS NULL
                        THEN COALESCE(p.firstname + ' ', '') + COALESCE(p.lastname + ' ', '') + COALESCE('(' + p.nickname + ')', '')
                    END AS owner_name,
                    CASE
                        WHEN ct.person_id IS NULL
                        THEN 'ลูกค้า'
                        WHEN ct.customer_id IS NULL
                        THEN 'บุคคล'
                    END AS owner_type
                FROM DevelopERP..Contact ct
                LEFT JOIN DevelopERP..Customer c
                ON ct.customer_id = c.customer_id
                LEFT JOIN DevelopERP..Person p
                ON ct.person_id = p.person_id
                LEFT JOIN DevelopERP..MasterCode m
                ON ct.contact_code_id = m.code_id
                WHERE ct.contact_id = @contact_id
            `)
        return result.recordsets[0][0]
    } catch (err) {
        throw err;
    }
}

export default { getContactTable, getContactData }