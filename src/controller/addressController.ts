import { Request, Response } from 'express';
import addressModel from '../model/addressModel';

async function getAddressTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
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

export default { getAddressTable, getAddressData }