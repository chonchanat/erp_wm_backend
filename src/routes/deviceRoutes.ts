import express, { Router } from "express";
import deviceController from "../controller/deviceController";

const router : Router = express.Router();

router.get('/device', deviceController.getDeviceTable);

export default router