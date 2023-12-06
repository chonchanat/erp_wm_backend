import { NextFunction, Request, Response } from "express";
import vehicleModelModel from "../model/vehicleModelModel";

async function getVehicleModelTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await vehicleModelModel.getVehicleModelTable(index, filter);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server" })
    }
}

async function getVehicleModelData(req: Request, res: Response) {
    try {
        const result = await vehicleModelModel.getVehicleModelData(req.params.id);
        if (result.vehicleModel.vehicle_model_id === undefined) {
            res.status(404).json({ status: 0, message: "Data not found in the Database" })
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server" })
    }
}

async function createVehicleModelData(req: Request, res: Response, next: NextFunction) {
    try {
        const body = req.body.jsonData;
        // const body = JSON.parse(req.body.jsonData);

        await vehicleModelModel.createVehicleModelData(body);
        res.status(201).json({ status: 1, message: "created seccessfully" })
    } catch (err) {
        next(err);
    }
}

async function updateVehicleModelData(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        const body = req.body.jsonData;
        // const body = JSON.parse(req.body.jsonData);

        await vehicleModelModel.updateVehicleModelData(id, body);
        res.status(200).json({ status: 1, message: "updated seccessfully" })
    } catch (err) {
        next(err);
    }
}

async function deleteVehicleModelData(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        const body = req.body.jsonData

        await vehicleModelModel.deleteVehicleModelData(id, body)
        res.status(200).json({ status: 1, message: "deleted seccessfully" })
    } catch (err) {
        next(err);
    }
}

export default { getVehicleModelTable, getVehicleModelData, createVehicleModelData, updateVehicleModelData, deleteVehicleModelData }