import express, {Router} from 'express';
import contactController from '../controller/contactController';

const router: Router = express.Router();

router.get('/contact', contactController.getContactTable)
router.get('/contact/:id', contactController.getContactData)
router.delete('/contact/:id', contactController.deleteContact)
router.post('/contact', contactController.createContactData)

export default router