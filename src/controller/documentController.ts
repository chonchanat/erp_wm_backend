import { NextFunction, Request, Response } from "express";
import documentModel from "../model/documentModel";

async function createDocumentData(req: any, res: Response, next: NextFunction) {
    try {
        const files = req.files
        console.log(req.files)
        console.log(req.body.jsonData)

        // await documentModel.createDocumentData(files)
        
        // if (files && files.buffer) {
        //     files.buffer = null; // Set buffer to null to release memory
        // }
        
        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { createDocumentData }