import express, {Router} from 'express';
import addressController from '../controller/addressController';

const router: Router = express.Router();

router.get('/address', addressController.getAddressTable)
router.get('/address/:id', addressController.getAddressData)

export default router