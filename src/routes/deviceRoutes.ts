import express, { Router } from "express";
import deviceController from "../controller/deviceController";

const router: Router = express.Router();

router.get('/device', deviceController.getDeviceTable);
router.get('/device/:id', deviceController.getDeviceData);
router.delete('/device/:id', deviceController.deleteDevice);

export default router