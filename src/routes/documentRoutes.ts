import express, { Router } from "express";
import documentController from "../controller/documentController";

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = express.Router();

router.post('/document', upload.array('files'), (req: any, res) => {
    console.log(req.files)
    res.json({msg: 'ok'})
});

export default router