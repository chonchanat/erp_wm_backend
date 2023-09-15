import express, {Router} from "express";
import relationController from "../controller/relationController";
const router: Router = express.Router();

router.delete('/relation/customer/:customerId/address/:addressId', relationController.deleteCustomerAddress);
router.delete('/relation/customer/:customerId/person/:personId', relationController.deleteCustomerPerson);
router.delete('/relation/customer/:customerId/contact/:contactId', relationController.deleteCustomerContact);

export default router;