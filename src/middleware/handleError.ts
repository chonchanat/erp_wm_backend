import express, { Router, Request, Response, NextFunction } from 'express';

function duplicateError(err: any, req: Request, res: Response, next: NextFunction) {

    const errMessage = err.originalError.message
    let response  = {
        status: 0,
        message: {
            en: "",
            th: "",
            ch: "",
        }
    }

    if (errMessage.includes('UC_Address_Customer') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate value for customer and address";
        response.message.th = "มีการเชื่อมโยงระหว่างลูกค้ากับที่อยู่นี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_Address_MasterCode') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate vlaue for address and mastercode";
        response.message.th = "มีการเชื่อมโยงระหว่างที่อยู่กับประเภทที่อยู่นี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_Address_Person') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate value for address and person";
        response.message.th = "มีการเชื่อมโยงระหว่างที่อยู่กับบุคคลนี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_CustomerName') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate customer name";
        response.message.th = "มีชื่อลูกค้านี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_Customer_Person') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate value for customer and person";
        response.message.th = "มีการเชื่อมโยงระหว่างลูกค้ากับบุคคลนี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_DeviceId') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate device id";
        response.message.th = "มีรหัสอุปกรณ์นี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_SerialId') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate serial id";
        response.message.th = "มีรหัสชุดอุปกรณ์นี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_FleetName') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate fleet name";
        response.message.th = "มีชื่อกลุ่มยานยนต์นี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_Fleet_Customer') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate value for customer and fleet";
        response.message.th = "มีการเชื่อมโยงระหว่างลูกค้ากับกลุ่มยานยนต์นี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_Fleet_Person') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate value for fleet and person";
        response.message.th = "มีการเชื่อมโยงระหว่างกลุ่มยานยนต์กับบุคคลนี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_Fleet_Vehicle') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate value for fleet and vehicle";
        response.message.th = "มีการเชื่อมโยงระหว่างกลุ่มยานยนต์กับยานพาหนะนี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_CategoryClassValue') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate category, class and value";
        response.message.th = "มีชื่อหมวดหมู่ ประเภทและชื่อ master code นี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_FirstnameLastname') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate fistname and lastname";
        response.message.th = "มีชื่อจริงและนามสกุลนี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_Person_Role') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate value for person and role";
        response.message.th = "มีการเชื่อมโยงระหว่างบุคคลกับตำแหน่งนี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_ProfileName') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate profile name";
        response.message.th = "มีชื่อโปรไฟล์นี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_FrameNo') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate frame no";
        response.message.th = "มีหมายเลขตัวถังนี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_Vehicle_Customer') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate value for vehicle and customer";
        response.message.th = "มีการเชื่อมโยงระหว่างยานพาหนะกับลูกค้านี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_Vehicle_Person') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate value for vehicle and person";
        response.message.th = "มีการเชื่อมโยงระหว่างยานพาหนะกับบุคคลนี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_VehicleIdConfig') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate vehicle id in vehicleConfig";
        response.message.th = "มีพาหนะนี้อยู่ในค่ากำหนดยานพาหนะแล้ว";

    } else if (errMessage.includes('UC_BrandModel') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate brand and model";
        response.message.th = "มีชื่อยี่ห้อและรุ่นยานพาหนะนี้อยู่ในระบบแล้ว";

    } else if (errMessage.includes('UC_VehicleIdPermit') && errMessage.includes('duplicate key')) {
        response.message.en = "Cannot insert duplicate vehicle id in vehiclePermit";
        response.message.th = "มีพาหนะนี้อยู่ในการส่งต่อข้อมูลยานพาหนะแล้ว";

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

    res.status(409).json(response);

}

export default { duplicateError }