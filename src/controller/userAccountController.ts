import { NextFunction, Request, Response } from "express";
import userAccountModel from "../model/userAccountModel";

async function getUserAccountTable(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? "0" : req.query.page as string;
        const index = (10 * (parseInt(page) - 1)) + 1;
        const filter = req.query.filter !== undefined ? req.query.filter as string : "";

        const result = await userAccountModel.getUserAccountTable(index, filter);
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function getUserAccountData(req: Request, res: Response) {
    try {
        const result = await userAccountModel.getUserAccountData(req.params.id)
        res.status(200).json({ status: 1, message: "ok", response: result })
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function deleteUserAccountData (req: Request, res: Response) {
    try {
        let body = JSON.parse(req.body.jsonData)
        await userAccountModel.deleteUserAccountData(req.params.id, body);
        res.status(200).json({ status: 1, message: "deleted successfully"})
    } catch (err) {
        res.status(500).json({ status: 0, message: "failed from server", response: err })
    }
}

async function createUserAccountData (req: Request, res: Response, next: NextFunction) {
    try {
        await userAccountModel.createUserAccountData(req.body)
        res.status(201).json({ status: 1, message: "created successfully"})
    } catch (err) {
        next(err);
    }
}

async function updateUserAccountData (req: Request, res: Response, next: NextFunction) {
    try {
        await userAccountModel.updateUserAccount(req.params.id, req.body)
        res.status(200).json({ status: 1, message: "updated successfully"})
    } catch (err) {
        next(err);
    }
}

export default { getUserAccountTable, getUserAccountData, deleteUserAccountData, createUserAccountData, updateUserAccountData }