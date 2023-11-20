const sql = require('mssql')
import { Card } from "../interfaces/card"

export async function getCardTable(transaction: any, index: number, filter: string) {
    return await transaction.request()
        .input('value', sql.NVARCHAR, "%" + filter + "%")
        .input('firstIndex', sql.INT, index)
        .input('lastIndex', sql.INT, index + 9)
        .query(`
            DECLARE @cardTable IdType
            INSERT @cardTable
            EXEC DevelopERP_Clear..sp_filterCard @value = @value, @firstIndex = @firstIndex, @lastIndex = @lastIndex
            EXEC DevelopERP_Clear..sp_formatCardTable @cardTable = @cardTable, @firstIndex = @firstIndex

            SELECT COUNT(*) AS count_date
            FROM Card
            WHERE value LIKE @value AND active = 1
        `)
}

export async function getCardData(transaction: any, card_id: string) {
    return await transaction.request()
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
}

export async function createCardNew(transaction: any, card: Card, person_id: string | number | null, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('card_code_id', sql.INT, card.card_code_id)
        .input('value', sql.NVARCHAR, card.value)
        .input('person_id', sql.INT, person_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
        EXEC DevelopERP_Clear..sp_insert_card @card_code_id = @card_code_id, @value = @value, @person_id = @person_id,
            @action_by = @action_by, @action_date = @action_date
    `)
}

export async function updateCard(transaction: any, card_id: string | number, card: Card, person_id: string | number | null, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('card_id', sql.INT, card_id)
        .input('card_code_id', sql.INT, card.card_code_id)
        .input('value', sql.NVARCHAR, card.value)
        .input('person_id', sql.INT, card.person_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_update_card @card_id = @card_id, @card_code_id = @card_code_id, 
                @value = @value, @person_id = @person_id,
                @action_by = @action_by, @action_date = @action_date
        `)
}

export async function deleteCard(transaction: any, card_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('card_id', sql.INT, card_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_card @card_id = @card_id, @action_by = @action_by, @action_date = @action_date    
        `)
}