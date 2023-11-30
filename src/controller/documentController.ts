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
        if (result.document === undefined) {
            res.status(422).json({ status: 0, message: "Data not found in the Database" })
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createDocumentData(req: any, res: Response, next: NextFunction) {
    try {
        const body = JSON.parse(req.body.jsonData);
        const files = req.body.files;
        // console.log(req.body.files)
        await documentModel.createDocumentData(body, files);

        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        next(err);
    }
}

async function updateDocumentData(req: Request, res: Response, next: NextFunction) {
    try {
        await documentModel.updateDocumentData(req.params.id, req.body)
        res.status(200).json({ status: 1, message: "updated successfully" })
    } catch (err) {
        next(err);
    }
}

async function deleteDocumentData(req: Request, res: Response) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await documentModel.deleteDocumentData(req.params.id, body)
        res.status(200).json({ status: 1, message: "deleted successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function downloadDocument(req: Request, res: Response) {
    try {
        const result = await documentModel.downloadDocument(req.params.id)
        res.status(200).json({ status: 1, message: "ok", response: result})
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { getDocumentTable, getDocumentData, createDocumentData, updateDocumentData, deleteDocumentData, downloadDocument }