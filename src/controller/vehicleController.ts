import { NextFunction, Request, Response } from "express";
import vehicleModel from "../model/vehicleModel";

async function getVehicleTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await vehicleModel.getVehicleTable(index, filter)
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server" })
    }
}

async function getVehicleData(req: Request, res: Response) {
    try {
        const result = await vehicleModel.getVehicleData(req.params.id);
        if (result.vehicle === undefined) {
            res.status(422).json({ status: 0, message: "Data not found in the Database" })
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server" })
    }
}

async function deleteVehicle(req: Request, res: Response) {
    try {
        await vehicleModel.deleteVehicle(req.params.id, req.body)
        res.status(200).json({ status: 1, message: "deleted successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server" })
    }
}

async function createVehicleData(req: Request, res: Response, next: NextFunction) {
    try {
        await vehicleModel.createVehicleData(req.body)
        res.status(201).json({ status: 1, message: "created seccessfully" })
    } catch (err) {
        next(err);
    }
}

async function updateVehicleData(req: Request, res: Response, next: NextFunction) {
    try {
        await vehicleModel.updateVehicleData(req.params.id, req.body)
        res.status(200).json({ status: 1, message: "updated successfully" })
    } catch (err) {
        next(err);
    }
}

export default { getVehicleTable, getVehicleData, deleteVehicle, createVehicleData, updateVehicleData }