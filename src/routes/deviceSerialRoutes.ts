import express, { Router } from "express";
import deviceSerialController from "../controller/deviceSerialController";

const router: Router = express.Router();

router.get('/deviceserial', deviceSerialController.getDeviceSerialTable);
router.get('/deviceserial/:id', deviceSerialController.getDeviceSerialData);

export default router