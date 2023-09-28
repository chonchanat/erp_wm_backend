import { NextFunction, Request, Response } from "express";
import vehicleModel from "../model/vehicleModel";

async function getVehicleTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await vehicleModel.getVehicleTable(index, filter)
        res.status(200).json({ status: 1, message: "ok", response: result})
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server" })
    }
}

async function getVehicleData(req: Request, res: Response) {
    try {
        const result = await vehicleModel.getVehicleData(req.params.id);
        res.status(200).json({ status: 1, message: "ok", response: result})
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server" })
    }
}

export default { getVehicleTable, getVehicleData }