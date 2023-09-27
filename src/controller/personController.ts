import { NextFunction, Request, Response } from "express";
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
        if (result.person.person_id === undefined) {
            res.status(422).json({ status: 0, message: "Data not found in the Database"})
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function daletePerson(req: Request, res: Response) {
    try {
        await personModel.deletePerson(req.params.id)
        res.status(200).json({ status: 1, message: "deleted successfully"})
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createPersonData(req: Request, res: Response) {
    try {
        const body = req.body;
        const result = await personModel.createPersonData(body)
        res.status(201).json({ status: 1, message: "created successfully"})
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function updatePersonDate(req: Request, res: Response, next: NextFunction) {
    try {
        const body = req.body;
        const result = await personModel.updatePersonDate(req.params.id, body);
        res.status(200).json({ status: 1, message: "updated successfully"})
    } catch (err) {
        next(err);
    }
}

export default { getPersonTable, getPersonData, daletePerson, createPersonData, updatePersonDate }