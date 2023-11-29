import { Request, Response } from "express";
import masterCodeModel from "../model/masterCodeModel";

async function getMasterCode(req: Request, res: Response) {
    try {
        let body: any = req.query
        let result = await masterCodeModel.getMasterCode(body);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getMasterCodeTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await masterCodeModel.getMasterCodeTable(index, filter);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getMasterCodeData(req: Request, res: Response) {
    try {
        let result = await masterCodeModel.getMasterCodeData(req.params.id);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createMasterCodeData(req: Request, res: Response) {
    try {
        await masterCodeModel.createMasterCodeData(req.body);
        res.status(201).json({ status: 1, message: "created seccessfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function updateMasterCodeData(req: Request, res: Response) {
    try {
        await masterCodeModel.updateMasterCodeData(req.params.id, req.body)
        res.status(200).json({ status: 1, message: "updated seccessfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function deleteMasterCode(req: Request, res: Response) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await masterCodeModel.deleteMasterCode(req.params.id, body)
        res.status(200).json({ status: 1, message: "deleted seccessfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getMasterCodeCategory(req: Request, res: Response) {
    try {
        let result = await masterCodeModel.getMasterCodeCategory();
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getMasterCodeClass(req: Request, res: Response) {
    try {
        const category = req.query.category !== undefined ? req.query.category as string : "%";
        let result = await masterCodeModel.getMasterCodeClass(category);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default {
    getMasterCode,
    getMasterCodeTable,
    getMasterCodeData,
    createMasterCodeData,
    updateMasterCodeData,
    deleteMasterCode,
    getMasterCodeCategory,
    getMasterCodeClass
}