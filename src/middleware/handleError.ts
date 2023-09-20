import express, { Router, Request, Response, NextFunction } from 'express';

function duplicateError(err: any, req: Request, res: Response, next: NextFunction) {

    const message = err.originalError.message

    if (message.includes('UC_CustomerName') && message.includes('duplicate key')) {
        res.status(422).json({ status: 0, message: "Cannot update duplicate customer_name", response: err })
    } else if (message.includes('UC_Address_Customer') && message.includes('duplicate key')) {
        res.status(422).json({ status: 0, message: "Cannot insert duplicate value for customer and address", response: err })
    } else if (message.includes('UC_Address_MasterCode') && message.includes('duplicate key')) {
        res.status(422).json({ status: 0, message: "Cannot insert duplicate vlaue for address and mastercode", response: err })
    } else if (message.includes('UC_Address_Person') && message.includes('duplicate key')) {
        res.status(422).json({ status: 0, message: "Cannot insert duplicate value for address and person", response: err })
    } else if (message.includes('UC_Customer_Person') && message.includes('duplicate key')) {
        res.status(422).json({ status: 0, message: "Cannot insert duplicate value for customer and person", response: err })
    } else if (message.includes('UC_Person_Role') && message.includes('duplicate key')) {
        res.status(422).json({ status: 0, message: "Cannot insert duplicate value for person and role", response: err })
    } else {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

export default { duplicateError }