import { Request, Response } from "express";
import packageModel from "../model/packageModel";

async function getPackageTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await packageModel.getPackageTable(index, filter);
        res.status(200).json({ status: 1, message: "ok", response: result});
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getPackageData(req: Request, res: Response) {
    try {
        const result = await packageModel.getPackageData(req.params.id);
        if (result.packge === undefined) {
            res.status(404).json({ status: 0, message: "Data not found in the Database" })
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createPackageData(req: Request, res: Response) {
    try {
        await packageModel.createPackageData(req.body);
        res.status(201).json({ status: 1, message: "created successfully"});
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function updatePackageData(req: Request, res: Response) {
    try {
        await packageModel.updatePackageData(req.params.id, req.body);
        res.status(200).json({ status: 1, message: "updated successfully"});
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function deletePackageData(req: Request, res: Response) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await packageModel.deletePackageData(req.params.id, body);
        res.status(200).json({ status: 1, message: "deleted successfully"});
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { getPackageTable, getPackageData, createPackageData, updatePackageData, deletePackageData }