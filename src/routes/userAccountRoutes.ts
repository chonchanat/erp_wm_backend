import express, { Router, Request, Response, NextFunction } from 'express';
import userAccountController from '../controller/userAccountController';

const router: Router = express.Router();

router.get('/useraccount', userAccountController.getUserAccountTable);

export default router