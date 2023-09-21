import express, {Router} from 'express';
import addressController from '../controller/addressController';

const router: Router = express.Router();

router.get('/address', addressController.getAddressTable)
router.get('/address/:id', addressController.getAddressData)
router.post('/address', addressController.createAddressData)
router.put('/address/:id', addressController.updateAddressData)
router.delete('/address/:id', addressController.deleteAddress)

export default router