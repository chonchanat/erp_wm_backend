import express, { Router } from 'express';
import personController from '../controller/personController';
const router: Router = express.Router();

router.get('/person', personController.getPersonTable);
router.get('/person/:id', personController.getPersonData);
router.delete('/person/:id', personController.daletePerson);
router.post('/person', personController.createPersonData);
router.put('/person/:id', personController.updatePersonDate)

export default router