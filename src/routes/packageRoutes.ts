import express, {Router} from "express";
import packageController from "../controller/packageController"

const router: Router = express.Router();

router.get('/package', packageController.getPackageTable);
router.get('/package/:id', packageController.getPackageData);

export default router