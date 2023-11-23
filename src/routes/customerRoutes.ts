import express, { Router } from "express";
import customerController from "../controller/customerController";

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = express.Router();

router.get('/customer', customerController.getCustomerTable)
router.get('/select/customer', customerController.getCustomerName)
router.get('/customer/:id', customerController.getCustomerData)
router.delete('/customer/:id', customerController.deleteCustomer)
router.post('/customer', upload.array('files'), customerController.createCustomerData)
router.put('/customer/:id', upload.array('files'), customerController.updateCustomerData)

export default router;