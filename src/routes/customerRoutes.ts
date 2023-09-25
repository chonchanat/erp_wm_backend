import express, { Router } from "express";
import customerController from "../controller/customerController";
const router: Router = express.Router();

router.get('/customer', customerController.getCustomerTable)
router.get('/customer/:id', customerController.getCustomerData)
router.delete('/customer/:id', customerController.deleteCustomer)
router.post('/customer', customerController.createCustomerData)
router.put('/customer/:id', customerController.updateCustomerData)

export default router;