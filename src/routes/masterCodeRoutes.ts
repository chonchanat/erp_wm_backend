import express, {Router} from "express";
import masterCodeController from "../controller/masterCodeController";
const router: Router = express.Router();

router.get('/master_code', masterCodeController.getMasterCode)

export default router
