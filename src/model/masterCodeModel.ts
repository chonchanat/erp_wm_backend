const devConfig = require('../config/dbconfig')
const sql = require('mssql')

function masterCodeQuery(categoryQuery: string, classQuery: string) {
    return `
        SELECT *
        FROM DevelopERP_Clear..MasterCode
        WHERE category ${categoryQuery != "null" ? "LIKE '" + categoryQuery + "'" : "IS NULL"} AND class ${classQuery != "null" ? "LIKE '" + classQuery + "'" : "IS NULL"}
    `
}
async function getMasterCode(body: any) {
    try {
        let query = ""

        let pool = await sql.connect(devConfig)
        let request = await pool.request()

        if (body.category === undefined && body.class === undefined) {
            query += `
                SELECT *
                FROM DevelopERP_Clear..MasterCode
            `
            const result = await request.query(query)
            return result.recordsets[0]
        } else if (typeof (body.category) === typeof ("")) {
            request.input(`category`, sql.NVARCHAR, body.category)
            request.input(`class`, sql.NVARCHAR, body.class)
            query += masterCodeQuery(body.category, body.class)
        } else {
            for (let i = 0; i < body.category.length; i++) {
                request.input(`category${i}`, sql.NVARCHAR, body.category[i])
                request.input(`class${i}`, sql.NVARCHAR, body.class[i])
                query += masterCodeQuery(body.category[i], body.class[i])
            }
        }

        const result = await request.query(query)
        return result.recordsets
    } catch (err) {
        throw err
    }
}

export default { getMasterCode }