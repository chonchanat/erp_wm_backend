import express, { Router, Request, Response, NextFunction } from 'express';
import vehicleModelController from '../controller/vehicleModelController';

const router: Router = express.Router();

router.get('/vehicle_model', vehicleModelController.getVehicleModelTable);
router.get('/select/vehicle_model/brand', vehicleModelController.getVehicleModelBrand)
router.get('/select/vehicle_model/model', vehicleModelController.getVehicleModelModel)
router.get('/vehicle_model/:id', vehicleModelController.getVehicleModelData);
router.post('/vehicle_model', vehicleModelController.createVehicleModelData);
router.put('/vehicle_model/:id', vehicleModelController.updateVehicleModelData);
router.delete('/vehicle_model/:id', vehicleModelController.deleteVehicleModelData);

export default router;