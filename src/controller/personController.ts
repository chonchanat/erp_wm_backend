import { NextFunction, Request, Response } from "express";
import personModel from "../model/personModel";

async function getPersonTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await personModel.getPersonTable(index, filter);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getPersonName(req: Request, res: Response) {
    try {
        const result = await personModel.getPersonName();
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getPersonData(req: Request, res: Response) {
    try {
        const result = await personModel.getPersonData(req.params.id);
        if (result.person.person_id === undefined) {
            res.status(404).json({ status: 0, message: "Data not found in the Database"})
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function daletePerson(req: Request, res: Response) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await personModel.deletePerson(req.params.id, body)
        res.status(200).json({ status: 1, message: "deleted successfully"})
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createPersonData(req: Request, res: Response, next: NextFunction) {
    try {
        const body = JSON.parse(req.body.jsonData);
        const files = req.files;

        const result = await personModel.createPersonData(body, files)
        res.status(201).json({ status: 1, message: "created successfully"})
    } catch (err) {
        next(err);
    }
}

async function updatePersonDate(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        const body = JSON.parse(req.body.jsonData);
        const files = req.files;

        const result = await personModel.updatePersonDate(id, body, files);
        res.status(200).json({ status: 1, message: "updated successfully"})
    } catch (err) {
        next(err);
    }
}

export default { getPersonTable, getPersonName, getPersonData, daletePerson, createPersonData, updatePersonDate }