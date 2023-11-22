import express, { Router, Request, Response, NextFunction } from 'express';
import personController from '../controller/personController';

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = express.Router();

router.get('/person', personController.getPersonTable);
router.get('/select/person', personController.getPersonName);
router.get('/person/:id', personController.getPersonData);
router.delete('/person/:id', personController.daletePerson);
router.post('/person', upload.array('files'), personController.createPersonData);
router.put('/person/:id', upload.array('files'), personController.updatePersonDate);

export default router