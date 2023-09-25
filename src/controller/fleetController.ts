import { NextFunction, Request, Response } from "express";
import fleetModel from "../model/fleetModel";

async function getFleetTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "1" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filterFleetName = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await fleetModel.getFleetTable(index, filterFleetName)
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getFleetData(req: Request, res: Response) {
    try {
        const result = await fleetModel.getFleetData(req.params.id);
        res.status(200).json({status: 1, message: "ok", response: result})
    } catch (err) {
        res.status(500).json({status: 0, message: "failed from server", response: err})
    }
}

export default { getFleetTable, getFleetData }