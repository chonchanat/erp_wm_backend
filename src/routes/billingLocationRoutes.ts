import express, { Router, Request, Response, NextFunction } from 'express';
import billingLocationController from '../controller/billingLocationController';

const router: Router = express.Router();

router.get('/billinglocation', billingLocationController.getBillingLocationTable)
router.get('/billinglocation/:id', billingLocationController.getBillingLocationData)
router.delete('/billinglocation/:id', billingLocationController.deleteBillingLocation)
router.post('/billinglocation', billingLocationController.createBillingLocationData)
router.put('/billinglocation/:id', billingLocationController.updateBillingLocationData)

export default router