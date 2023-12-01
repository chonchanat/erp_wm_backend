import express, { Router, Request, Response, NextFunction } from 'express';

function duplicateError(err: any, req: Request, res: Response, next: NextFunction) {

    const message = err.originalError.message

    if (message.includes('UC_CustomerName') && message.includes('duplicate key')) {
        res.status(409).json({ status: 0, message: "Cannot insert duplicate customer_name" })
    } else if (message.includes('UC_FleetName') && message.includes('duplicate key')) {
        res.status(409).json({ status: 0, message: "Cannot insert duplicate fleet_name" })
    } else if (message.includes('UC_FrameNo') && message.includes('duplicate key')) {
        res.status(409).json({ status: 0, message: "Cannot insert duplicate frame_no" })
    } else if (message.includes('UC_SerialId') && message.includes('duplicate key')) {
        res.status(409).json({ status: 0, message: "Cannot insert duplicate serial_id" })
    } else if (message.includes('UC_Address_Customer') && message.includes('duplicate key')) {
        res.status(409).json({ status: 0, message: "Cannot insert duplicate value for customer and address" })
    } else if (message.includes('UC_Address_MasterCode') && message.includes('duplicate key')) {
        res.status(409).json({ status: 0, message: "Cannot insert duplicate vlaue for address and mastercode" })
    } else if (message.includes('UC_Address_Person') && message.includes('duplicate key')) {
        res.status(409).json({ status: 0, message: "Cannot insert duplicate value for address and person" })
    } else if (message.includes('UC_Customer_Person') && message.includes('duplicate key')) {
        res.status(409).json({ status: 0, message: "Cannot insert duplicate value for customer and person" })
    } else if (message.includes('UC_Person_Role') && message.includes('duplicate key')) {
        res.status(409).json({ status: 0, message: "Cannot insert duplicate value for person and role" })
    } else if (message.includes('UC_Fleet_Customer') && message.includes('duplicate key')) {
        res.status(409).json({ status: 0, message: "Cannot insert duplicate value for customer and fleet" })
    } else {
        res.status(500).json({ status: 0, message: "failed from server (by handleError middleware)", response: err })
    }
}

export default { duplicateError }