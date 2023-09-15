import { Request, Response } from "express";
import personModel from "../model/personModel";

async function getPersonTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filterPersonName = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await personModel.getPersonTable(index, filterPersonName);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getPersonData(req: Request, res: Response) {
    try {
        const result = await personModel.getPersonData(req.params.id);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { getPersonTable, getPersonData }