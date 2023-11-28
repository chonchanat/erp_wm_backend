import { getDateTime } from "../ultis/datetime";
import { CardType } from "../interfaces/card";
const devConfig = require("../config/dbconfig")
const sql = require("mssql")

import * as operation from "../operation/index"

async function getCardTable(index: number, filter: string) {
    try {
        let pool = await sql.connect(devConfig);
        let result = await operation.getCardTable(pool, index, filter);

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
        let result = await operation.getCardData(pool, card_id);

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
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        await operation.deleteCard(pool, card_id, action_by, datetime);
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function createCardData(body: CardType) {
    let transaction;
    try {
        let datetime = getDateTime();
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();
        await transaction.begin();

        await operation.createCardNew(transaction, body.card, body.card.person_id, action_by, datetime)

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
        let action_by = body.action_by as number;
        let pool = await sql.connect(devConfig);
        transaction = pool.transaction();

        await transaction.begin();

        await operation.updateCard(transaction, card_id, body.card, action_by, datetime)

        await transaction.commit();

    } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
    }
}

export default { getCardTable, getCardData, deleteCardData, createCardData, updateCardData }