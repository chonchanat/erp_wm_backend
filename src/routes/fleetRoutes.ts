import express, { Router } from "express";
import fleetController from "../controller/fleetController";

const router: Router = express.Router();

router.get('/fleet', fleetController.getFleetTable);
router.get('/select/fleet', fleetController.getFleetName)
router.get('/fleet/:id', fleetController.getFleetData);
router.delete('/fleet/:id', fleetController.deleteFleet);
router.post('/fleet', fleetController.createFleetData);
router.put('/fleet/:id', fleetController.updateFleetData);

export default router;