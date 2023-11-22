import { NextFunction, Request, Response } from "express";
import fleetModel from "../model/fleetModel";

async function getFleetTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filterFleetName = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await fleetModel.getFleetTable(index, filterFleetName)
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getFleetName(req: Request, res: Response) {
    try {
        const result = await fleetModel.getFleetName()
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getFleetData(req: Request, res: Response) {
    try {
        const result = await fleetModel.getFleetData(req.params.id);
        if (result.fleet === undefined) {
            res.status(422).json({ status: 0, message: "Data not found in the Database"})
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function deleteFleet(req: Request, res: Response) {
    try {
        await fleetModel.deleteFleet(req.params.id, req.body);
        res.status(200).json({ status: 1, message: "deleted successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, meesage: "failed from serverss", response: err })
    }
}

async function createFleetData(req: Request, res: Response, next: NextFunction) {
    try {
        const body = req.body;

        await fleetModel.createFleetData(body);
        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        next(err);
    }
}

async function updateFleetData(req: Request, res: Response, next: NextFunction) {
    try {
        const body = req.body;

        await fleetModel.updateFleetData(req.params.id, body);
        res.status(200).json({ status: 1, message: "updated successfully" })
    } catch (err) {
        next(err);
    }
}

export default { getFleetTable, getFleetName, getFleetData, deleteFleet, createFleetData, updateFleetData }