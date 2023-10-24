import { NextFunction, Request, Response } from "express";
import deviceModel from "../model/deviceModel";

async function getDeviceTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await deviceModel.getDeviceTable(index, filter)
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getDeviceData(req: Request, res: Response) {
    try {
        const result = await deviceModel.getDeviceData(req.params.id);
        if (result.device === undefined) {
            res.status(422).json({ status: 0, message: "Data not found in the database" })
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function deleteDevice(req: Request, res: Response) {
    try {
        await deviceModel.deleteDevice(req.params.id)
        res.status(200).json({ status: 1, message: "deleted succesfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createDeviceData(req: Request, res: Response, next: NextFunction) {
    try {
        await deviceModel.createDeviceData(req.body)
        res.status(201).json({ status: 1, message: "created succesfully" })
    } catch (err) {
        next(err);
    }
}

export default { getDeviceTable, getDeviceData, deleteDevice, createDeviceData }