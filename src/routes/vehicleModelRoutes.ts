import express, { Router, Request, Response, NextFunction } from 'express';
import vehicleModelController from '../controller/vehicleModelController';

const router: Router = express.Router();

router.get('/vehicle_model', vehicleModelController.getVehicleModelTable);
router.get('/vehicle_model/:id', vehicleModelController.getVehicleModelData);

export default router;