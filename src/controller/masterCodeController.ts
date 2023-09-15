import { Request, Response } from "express";
import masterCodeModel from "../model/masterCodeModel";

async function getMasterCode(req: Request, res: Response) {
    try {
        let body = req.query
        let result = await masterCodeModel.getMasterCode(body);
        res.status(200).json({ status: 1, message: "ok", response: result})
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { getMasterCode}