import { NextFunction, Request, Response } from 'express';
import addressModel from '../model/addressModel';

async function getAddressTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "1" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filterLocation = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await addressModel.getAddressTable(index, filterLocation);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getAddressData(req: Request, res: Response) {
    try {
        const result = await addressModel.getAddressData(req.params.id)
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createAddressData(req: Request, res: Response) {
    try {
        let body = req.body;
        await addressModel.createAddressData(body)
        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function updateAddressData(req: Request, res: Response, next: NextFunction) { 
    try {
        let body = req.body;
        await addressModel.updateAddressData(body, req.params.id)
        res.status(200).json({ status: 1, message: "updated successfully"})
    } catch (err) {
        next(err);
    }
}

async function deleteAddress(req: Request, res: Response) {
    try {
        await addressModel.deleteAddress(req.params.id)
        res.status(200).json({ status: 1, message: "deleted successfully"})
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { getAddressTable, getAddressData, createAddressData, updateAddressData, deleteAddress }