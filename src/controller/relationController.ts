import { Request, Response } from "express";
import relationModel from "../model/relationModel";

async function deleteCustomerAddress(req: Request, res: Response) {
    try {
        await relationModel.deleteCustomerAddress(req.params.customerId, req.params.addressId);
        res.status(200).json({ status: 1, message: "delete customer-address relation" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function deleteCustomerPerson(req: Request, res: Response) {
    try {
        await relationModel.deleteCustomerPerson(req.params.customerId, req.params.personId);
        res.status(200).json({ status: 1, message: "delete customer-person relation" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "fail from server", response: err })
    }
}

async function deleteCustomerContact(req: Request, res: Response) {
    try {
        await relationModel.deleteCustomerContact(req.params.customerId, req.params.contactId);
        res.status(200).json({ status: 1, message: "delete customer-contact relation" })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { deleteCustomerAddress, deleteCustomerPerson, deleteCustomerContact }