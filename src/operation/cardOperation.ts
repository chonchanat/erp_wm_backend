const sql = require('mssql')
import { Card } from "../interfaces/card"

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

export async function deleteCard(transaction: any, card_id: string | number, action_by: string | number, datetime: object) {
    return await transaction.request()
        .input('card_id', sql.INT, card_id)
        .input('action_by', sql.INT, action_by)
        .input('action_date', sql.DATETIME, datetime)
        .query(`
            EXEC DevelopERP_Clear..sp_delete_card @card_id = @card_id, @action_by = @action_by, @action_date = @action_date    
        `)
}