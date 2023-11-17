import { getDateTime } from "../utils";
import { CardType } from "../interfaces/card";
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
                EXEC DevelopERP_ForTesting2..sp_filterCard @value = @value, @firstIndex = @firstIndex, @lastIndex = @lastIndex
                EXEC DevelopERP_ForTesting2..sp_formatCardTable @cardTable = @cardTable, @firstIndex = @firstIndex

                SELECT COUNT(*) AS count_date
                FROM Card
                WHERE value LIKE @value AND active = 1
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

async function getCardData(card_id: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('card_id', sql.INT, card_id)
            .query(`
                SELECT 
                    C.card_id, 
                    C.value, 
                    C.card_code_id, 
                    COALESCE(M.value, '-') AS card_type,
                    'ลูกค้า' AS owner_type,
                    RTRIM(COALESCE(P.firstname + ' ', '') + COALESCE(P.lastname + ' ', '') + COALESCE('(' + P.nickname + ')', '-')) AS owner_name
                FROM Card C
                LEFT JOIN Person P
                ON C.person_id = p.person_id
                LEFT JOIN MasterCode M
                ON C.card_code_id = M.code_id
                WHERE C.card_id = @card_id AND C.active = 1
            `)

        return {
            card: result.recordsets[0][0]
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function deleteCardData(card_id: string, body: any) {
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        let result = await pool.request()
            .input('card_id', sql.INT, card_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_delete_card @card_id = @card_id, @action_by = @action_by, @action_date = @action_date
            `)
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function createCardData(body: CardType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        let cardResult = await transaction.request()
            .input('card_code_id', sql.INT, body.card.card_code_id)
            .input('value', sql.NVARCHAR, body.card.value)
            .input('person_id', sql.INT, body.card.person_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_insert_card @card_code_id = @card_code_id, @value = @value, @person_id = @person_id,
                    @action_by = @action_by, @action_date = @action_date
            `)

        await transaction.commit();

    } catch (err) {
        console.log(err)
        await transaction.rollback();
        throw err;
    }
}

async function updateCardData(card_id: string, body: CardType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();

        await transaction.begin();

        let cardResult = await transaction.request()
            .input('card_id', sql.INT, card_id)
            .input('card_code_id', sql.INT, body.card.card_code_id)
            .input('value', sql.NVARCHAR, body.card.value)
            .input('person_id', sql.INT, body.card.person_id)
            .input('action_by', sql.INT, body.action_by)
            .input('action_date', sql.DATETIME, datetime)
            .query(`
                EXEC DevelopERP_ForTesting2..sp_update_card @card_id = @card_id, @card_code_id = @card_code_id, 
                    @value = @value, @person_id = @person_id,
                    @action_by = @action_by, @action_date = @action_date
            `)

        await transaction.commit();

    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

export default { getCardTable, getCardData, deleteCardData, createCardData, updateCardData }