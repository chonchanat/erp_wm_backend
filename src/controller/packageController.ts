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
        res.status(200).json({ status: 1, message: "ok", response: result});
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { getPackageTable, getPackageData }