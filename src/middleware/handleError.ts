import express, { Router, Request, Response, NextFunction } from 'express';

function duplicateError(err: any, req: Request, res: Response, next: NextFunction) {

    const message = err.originalError.message

    if (message.includes('UC_CustomerName') && message.includes('duplicate key')) {
        res.status(409).json({
            status: 0,
            message: {
                en: "Cannot insert duplicate customer name",
                th: "มีชื่อลูกค้านี้อยู่ในระบบแล้ว",
                ch: "",
            },
        })
    } else if (message.includes('UC_FleetName') && message.includes('duplicate key')) {
        res.status(409).json({ 
            status: 0, 
            message: {
                en: "Cannot insert duplicate fleet name",
                th: "มีชื่อกลุ่มยานยนต์นี้อยู่ในระบบแล้ว",
                ch: "",
            },
        })
    } else if (message.includes('UC_FrameNo') && message.includes('duplicate key')) {
        res.status(409).json({ 
            status: 0, 
            message: {
                en: "Cannot insert duplicate frame no",
                th: "มีหมายเลขตัวถังนี้อยู่ในระบบแล้ว",
                ch: "",
            },
        })
    } else if (message.includes('UC_SerialId') && message.includes('duplicate key')) {
        res.status(409).json({ 
            status: 0, 
            message: {
                en: "Cannot insert duplicate serial id",
                th: "มีรหัสชุดอุปกรณ์นี้อยู่ในระบบแล้ว",
                ch: "",
            },
        })
    } else if (message.includes('UC_Address_Customer') && message.includes('duplicate key')) {
        res.status(409).json({ 
            status: 0, 
            message: {
                en: "Cannot insert duplicate value for customer and address",
                th: "มีการเชื่อมโยงระหว่างลูกค้ากับที่อยู่นี้อยู่ในระบบแล้ว",
                ch: "",
            },
        })
    } else if (message.includes('UC_Address_MasterCode') && message.includes('duplicate key')) {
        res.status(409).json({ 
            status: 0, 
            message: {
                en: "Cannot insert duplicate vlaue for address and mastercode",
                th: "มีการเชื่อมโยงระหว่างที่อยู่กับประเภทที่อยู่นี้อยู่ในระบบแล้ว",
                ch: "",
            },
        })
    } else if (message.includes('UC_Address_Person') && message.includes('duplicate key')) {
        res.status(409).json({ 
            status: 0, 
            message: {
                en: "Cannot insert duplicate value for address and person",
                th: "มีการเชื่อมโยงระหว่างที่อยู่กับบุคคลนี้อยู่ในระบบแล้ว",
                ch: "",
            },
        })
    } else if (message.includes('UC_Customer_Person') && message.includes('duplicate key')) {
        res.status(409).json({ 
            status: 0, 
            message: {
                en: "Cannot insert duplicate value for customer and person",
                th: "มีการเชื่อมโยงระหว่างลูกค้ากับบุคคลนี้อยู่ในระบบแล้ว",
                ch: "",
            },
        })
    } else if (message.includes('UC_Person_Role') && message.includes('duplicate key')) {
        res.status(409).json({ 
            status: 0, 
            message: {
                en: "Cannot insert duplicate value for person and role",
                th: "มีการเชื่อมโยงระหว่างบุคคลกับตำแหน่งนี้อยู่ในระบบแล้ว",
                ch: "",
            },
        })
    } else if (message.includes('UC_Fleet_Customer') && message.includes('duplicate key')) {
        res.status(409).json({ 
            status: 0, 
            message: {
                en: "Cannot insert duplicate value for customer and fleet",
                th: "มีการเชื่อมโยงระหว่างลูกค้ากับกลุ่มยานยนต์นี้อยู่ในระบบแล้ว",
                ch: "",
            },
        })
    } else {
        res.status(500).json({ 
            status: 0, 
            message: {
                en: "failed from server (by handleError middleware)",
                th: "การประมวลผลเซิฟเวอร์ล้มเหลว (จาก middleware)",
                ch: "",
            },
            response: err 
        })
    }
}

export default { duplicateError }