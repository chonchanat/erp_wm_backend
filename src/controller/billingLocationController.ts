import { NextFunction, Request, Response } from "express";
import billingLocationModel from "../model/billingLocationModel";

async function getBillingLocationTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await billingLocationModel.getBillingLocationTable(index, filter);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server" })
    }
}

async function getBillingLocationData(req: Request, res: Response) {
    try {
        const result = await billingLocationModel.getBillingLocationData(req.params.id);
        if (result.billingLocation === undefined) {
            res.status(422).json({ status: 0, message: "Data not found in the database" })
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server" })
    }
}

async function deleteBillingLocation(req: Request, res: Response) {
    try {
        await billingLocationModel.deleteBillingLocation(req.params.id)
        res.status(200).json({ status: 1, message: "deleted successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server" })
    }
}

async function createBillingLocationData(req: Request, res: Response, next: NextFunction) {
    try {
        let body = req.body;

        await billingLocationModel.createBillingLocationData(body)
        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        next(err)
    }
}

async function updateBillingLocationData(req: Request, res: Response, next: NextFunction) {
    try {
        let body = req.body;

        await billingLocationModel.updateBillingLocationData(req.params.id, body)
        res.status(200).json({ status: 1, message: "updated successfully" })
    } catch (err) {
        // res.status(500).json({ status: 0, message: "failed from server", response: err })
        next(err)
    }
}

export default { getBillingLocationTable, getBillingLocationData, deleteBillingLocation, createBillingLocationData, updateBillingLocationData }