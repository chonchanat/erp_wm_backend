import { NextFunction, Request, Response } from 'express';
import customerModel from '../model/customerModel';

async function getCustomerTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filterCustomerName = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await customerModel.getCustomerTable(index, filterCustomerName);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getCustomerData(req: Request, res: Response) {
    try {
        const result = await customerModel.getCustomerData(req.params.id);
        if (result.customer === undefined) {
            res.status(422).json({ status: 0, message: "Data not found in the database" })
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function deleteCustomer(req: Request, res: Response) {
    try {
        await customerModel.deleteCustomer(req.params.id, req.body);
        res.status(200).json({ status: 1, message: "deleted successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createCustomerData(req: Request, res: Response, next: NextFunction) {
    try {
        const body = JSON.parse(req.body.jsonData);
        const files = req.files;
        await customerModel.createCustomerData(body, files)
        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        next(err);
    }
}

async function updateCustomerData(req: Request, res: Response, next: NextFunction) {
    try {
        await customerModel.updateCustomerData(req.params.id, req.body);
        res.status(200).json({ status: 1, message: "updated successfully" })
    } catch (err) {
        next(err);
    }
}

export default { getCustomerTable, getCustomerData, deleteCustomer, createCustomerData, updateCustomerData } 