import { Request, Response } from 'express';
import contactModel from '../model/contactModel';

async function getContactTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filterValue = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await contactModel.getContactTable(index, filterValue);
        res.status(200).json({ status: 1, message: 'ok', response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: 'failed from server', response: err })
    }
}

async function getContactData(req: Request, res: Response) {
    try {
        const result = await contactModel.getContactData(req.params.id);
        if (result === undefined) {
            res.status(422).json({ status: 0, message: "Data not found in the database" })
        } else {
            res.status(200).json({ status: 1, message: 'ok', response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: 'failed from server', response: err })
    }
}

async function deleteContact(req: Request, res: Response) {
    try {
        await contactModel.deleteContact(req.params.id)
        res.status(200).json({ status: 1, message: 'deleted successfully' })
    } catch (err) {
        res.status(500).json({ status: 0, message: 'failed from server', response: err })
    }
}

export default { getContactTable, getContactData, deleteContact }