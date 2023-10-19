import express, { Router } from "express";
import deviceSerialController from "../controller/deviceSerialController";

const router: Router = express.Router();

router.get('/deviceserial', deviceSerialController.getDeviceSerialTable);

export default router