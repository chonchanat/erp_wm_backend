import express, { Router, Request, Response, NextFunction } from 'express';
import vehicleController from '../controller/vehicleController';

const router: Router = express.Router();

router.get('/vehicle', vehicleController.getVehicleTable);
router.get('/vehicle/:id', vehicleController.getVehicleData);

export default router