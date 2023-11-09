import express, { Router } from "express";
import documentController from "../controller/documentController";

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = express.Router();

// router.post('/document', upload.array('files'), (req: any, res) => {
//     const result = req.files
//     console.log(result)
//     res.json({files: result})
// });
// router.post('/document', upload.none(), documentController.createDocumentData);
router.post('/document', upload.array('files'), documentController.createDocumentData);

export default router