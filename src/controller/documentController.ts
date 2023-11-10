import { NextFunction, Request, Response } from "express";
import documentModel from "../model/documentModel";

async function getDocumentTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await documentModel.getDocumentTable(index, filter);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getDocumentData(req: Request, res: Response) {
    try {
        const result = await documentModel.getDocumentData(req.params.id)
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createDocumentData(req: any, res: Response, next: NextFunction) {
    try {
        const body = JSON.parse(req.body.jsonData);
        const files = req.files;
        await documentModel.createDocumentData(body, files);

        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { getDocumentTable, getDocumentData, createDocumentData }