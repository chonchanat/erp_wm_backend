import { NextFunction, Request, Response } from "express";
import deviceSerialModel from "../model/deviceSerialModel";

async function getDeviceSerialTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await deviceSerialModel.getDeviceSerialTable(index, filter)
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getDeviceSerialId(req: Request, res: Response) {
    try {
        const result = await deviceSerialModel.getDeviceSerialId();
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getDeviceSerialData(req: Request, res: Response) {
    try {
        const result = await deviceSerialModel.getDeviceSerialData(req.params.id);
        if (result.deviceSerial === undefined) {
            res.status(404).json({ status: 0, message: "Data not found in the database" })
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function deleteDeviceSerial(req: Request, res: Response) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await deviceSerialModel.deleteDeviceSerial(req.params.id, body);
        res.status(200).json({ status: 1, message: "deleted successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createDeviceSerialData(req: Request, res: Response, next: NextFunction) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await deviceSerialModel.createDeviceSerialData(body);
        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        next(err);
    }
}

async function updateDeviceSerialData(req: Request, res: Response, next: NextFunction) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await deviceSerialModel.updateDeviceSerialData(req.params.id, body);
        res.status(200).json({ status: 1, message: "updated successfully" })
    } catch (err) {
        next(err);
    }
}

export default { getDeviceSerialTable, getDeviceSerialId, getDeviceSerialData, deleteDeviceSerial, createDeviceSerialData, updateDeviceSerialData }