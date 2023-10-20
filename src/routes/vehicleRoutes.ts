import express, { Router, Request, Response, NextFunction } from 'express';
import vehicleController from '../controller/vehicleController';

const router: Router = express.Router();

router.get('/vehicle', vehicleController.getVehicleTable);
router.get('/vehicle/:id', vehicleController.getVehicleData);
router.delete('/vehicle/:id', vehicleController.deleteVehicle);
router.post('/vehicle', vehicleController.createVehicleData);

export default router