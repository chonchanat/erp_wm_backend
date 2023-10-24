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
        await customerModel.deleteCustomer(req.params.id);
        res.status(200).json({ status: 1, message: "deleted successfully" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createCustomerData(req: Request, res: Response, next: NextFunction) {
    try {
        const body = req.body;
        const result = await customerModel.createCustomerData(body)
        res.status(201).json({ status: 1, message: "created successfully" })
    } catch (err) {
        next(err);
    }
}

async function updateCustomerData(req: Request, res: Response, next: NextFunction) {
    try {
        const customerId = req.params.id;
        const body = req.body;
        // const result = await customerModel.updateCustomerDataSecure(
        //     {
        //         customer: {
        //             customer_id: 2,
        //             customer_name: "บริษัท สมหวัง จำกัด",
        //             sales_type_code_id: 29,
        //             customer_type_code_id: 32,
        //         },
        //         contact: [
        //             {
        //                 contact_code_id: 1,
        //                 value: "30320502"
        //             }
        //         ],
        //         addressNew: [],
        //         addressExist: [],
        //         personNew: [
        //             {
        //                 person: {
        //                     nickname: "เฮียตี๋",
        //                     title_code_id: 1,
        //                     firstname: "จักรพันธ์",
        //                     lastname: "",
        //                     description: "เจ้าของธุรกิจ"
        //                 },
        //                 contact: [
        //                     {
        //                         contact_code_id: 1,
        //                         value: "034241221"
        //                     }
        //                 ],
        //                 addressNew: [],
        //                 addressExist: []
        //             },
        //         ],
        //         personExist: [5],
        //     }
        // )
        const result = await customerModel.updateCustomerData(customerId, body);
        res.status(200).json({ status: 1, message: "updated successfully" })
    } catch (err) {
        next(err);
    }
}

export default { getCustomerTable, getCustomerData, deleteCustomer, createCustomerData, updateCustomerData } 