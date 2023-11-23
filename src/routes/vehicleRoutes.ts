import express, { Router, Request, Response, NextFunction } from 'express';
import vehicleController from '../controller/vehicleController';

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = express.Router();

router.get('/vehicle', vehicleController.getVehicleTable);
router.get('/select/vehicle', vehicleController.getVehicleLicensePlate)
router.get('/select/vehicle/brand', vehicleController.getVehicleBrand);
router.get('/select/vehicle/model', vehicleController.getVehicleModel);
router.get('/vehicle/:id', vehicleController.getVehicleData);
router.delete('/vehicle/:id', vehicleController.deleteVehicle);
router.post('/vehicle', upload.array('files'), vehicleController.createVehicleData);
router.put('/vehicle/:id', upload.array('files'), vehicleController.updateVehicleData);

export default router