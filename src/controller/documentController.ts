import { NextFunction, Request, Response } from "express";
import documentModel from "../model/documentModel";

async function createDocumentData(req: any, res: Response, next: NextFunction) {
    try {
        console.log('HI')
        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { createDocumentData }