import express, { Router } from "express";
import fleetController from "../controller/fleetController";

const router: Router = express.Router();

router.get('/fleet', fleetController.getFleetTable);
router.get('/fleet/:id', fleetController.getFleetData);

export default router;