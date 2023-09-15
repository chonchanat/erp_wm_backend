import express, { Router } from 'express';
import personController from '../controller/personController';
const router: Router = express.Router();

router.get('/person', personController.getPersonTable);
router.get('/person/:id', personController.getPersonData);

export default router