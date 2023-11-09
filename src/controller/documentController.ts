import { NextFunction, Request, Response } from "express";
import documentModel from "../model/documentModel";

async function getDocumentData(req: Request, res: Response) {
    try {
        const result = await documentModel.getDocumentData(req.params.id)
        res.status(200).json({ status: 1, message: "ok", response: result})
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

export default { getDocumentData, createDocumentData }