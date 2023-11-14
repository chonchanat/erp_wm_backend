import express, {Router} from 'express';
import addressController from '../controller/addressController';

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = express.Router();

router.get('/address', addressController.getAddressTable)
router.get('/address/province', addressController.getAddressProvince)
router.get('/address/district', addressController.getAddressDistrict)
router.get('/address/sub_district', addressController.getAddressSubDistrict)
router.get('/address/:id', addressController.getAddressData)
router.post('/address', upload.array('files'), addressController.createAddressData)
router.put('/address/:id', upload.array('files'), addressController.updateAddressData)
router.delete('/address/:id', addressController.deleteAddress)

export default router