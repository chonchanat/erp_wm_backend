import { getDateTime } from "../utils";

const devConfig = require("../config/dbconfig")
const sql = require("mssql")

async function getCardTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('value', sql.NVARCHAR, "%" + filter + "%")
            .input('firstIndex', sql.INT, index)
            .input('lastIndex', sql.INT, index + 9)
            .query(`
                DECLARE @cardTable IdType
                INSERT @cardTable
                EXEC DevelopERP_Clear..sp_filterCard @value = @value, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_Clear..sp_formatCard @cardTable = @cardTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_date
                FROM Card
                WHERE value LIKE @value AND is_archived = 0
            `)

        return {
            card: result.recordsets[0],
            count_date: result.recordsets[1][0].count_date,
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default { getCardTable }