import { NextFunction, Request, Response } from 'express';
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

async function getAddressLocation(req: Request, res: Response) {
    try {
        const result = await addressModel.getAddressLocation();
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getAddressData(req: Request, res: Response) {
    try {
        const result = await addressModel.getAddressData(req.params.id)
        if (result.address.name === undefined) {
            res.status(422).json({ status: 0, message: "Data not found in the Database" })
        } else {
            res.status(200).json({ status: 1, message: "ok", response: result })
        }
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createAddressData(req: Request, res: Response) {
    try {
        const body = JSON.parse(req.body.jsonData);
        const files = req.files;
        // console.log(body, files)
        await addressModel.createAddressData(body, files)
        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function updateAddressData(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        const body = JSON.parse(req.body.jsonData);
        const files = req.files;

        await addressModel.updateAddressData(id, body, files)
        res.status(200).json({ status: 1, message: "updated successfully" })
    } catch (err) {
        next(err);
    }
}

async function deleteAddress(req: Request, res: Response) {
    try {
        await addressModel.deleteAddress(req.params.id, req.body)
        res.status(200).json({ status: 1, message: "deleted successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getAddressProvince(req: Request, res: Response) {
    try {
        const result = await addressModel.getAddressProvince();
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getAddressDistrict(req: Request, res: Response) {
    try {
        const province = req.query.province !== undefined ? req.query.province as string : "%";
        const result = await addressModel.getAddressDistrict(province);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getAddressSubDistrict(req: Request, res: Response) {
    try {
        const province = req.query.province !== undefined ? req.query.province as string : "%";
        const district = req.query.district !== undefined ? req.query.district as string : "%";
        const result = await addressModel.getAddressSubDistrict(province, district);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default {
    getAddressTable,
    getAddressLocation,
    getAddressData,
    createAddressData,
    updateAddressData,
    deleteAddress,
    getAddressProvince,
    getAddressDistrict,
    getAddressSubDistrict,
}