import express, { Router } from "express";
import documentController from "../controller/documentController";

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = express.Router();

router.get('/document', documentController.getDocumentTable);
router.get('/document/:id', documentController.getDocumentData);
router.post('/document', upload.array('files'), documentController.createDocumentData);

export default router