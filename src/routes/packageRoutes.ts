import express, {Router} from "express";
import packageController from "../controller/packageController"

const router: Router = express.Router();

router.get('/package', packageController.getPackageTable);
router.get('/package/:id', packageController.getPackageData);
router.post('/package', packageController.createPackageData);
router.put('/package/:id', packageController.updatePackageData);
router.delete('/package/:id', packageController.deletePackageData);

export default router