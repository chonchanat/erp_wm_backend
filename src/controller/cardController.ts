import { NextFunction, Request, Response } from "express";
import cardModel from "../model/cardModel";

async function getCardTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await cardModel.getCardTable(index, filter);
        res.status(200).json({ status: 1, message: "ok", response: result });
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getCardData(req: Request, res: Response) {
    try {
        const result = await cardModel.getCardData(req.params.id);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function deleteCardData(req: Request, res: Response) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await cardModel.deleteCardData(req.params.id, body)
        res.status(200).json({ status: 1, message: "deleted successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createCardData(req: Request, res: Response, next: NextFunction) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await cardModel.createCardData(body);
        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        next(err);
    }
}

async function updateCardData(req: Request, res: Response, next: NextFunction) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await cardModel.updateCardData(req.params.id, body);
        res.status(200).json({ status: 1, message: "updated successfully" })
    } catch (err) {
        next(err);
    }
}

export default { getCardTable, getCardData, deleteCardData, createCardData, updateCardData }