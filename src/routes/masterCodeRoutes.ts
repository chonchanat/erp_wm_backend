import express, {Router} from "express";
import masterCodeController from "../controller/masterCodeController";
const router: Router = express.Router();

router.get('/select/master_code', masterCodeController.getMasterCode)

router.get('/master_code', masterCodeController.getMasterCodeTable)
router.get('/select/master_code/category', masterCodeController.getMasterCodeCategory)
router.get('/select/master_code/class', masterCodeController.getMasterCodeClass)
router.get('/master_code/:id', masterCodeController.getMasterCodeData)
router.post('/master_code', masterCodeController.createMasterCodeData)
router.put('/master_code/:id', masterCodeController.updateMasterCodeData)
router.delete('/master_code/:id', masterCodeController.deleteMasterCode)

export default router
