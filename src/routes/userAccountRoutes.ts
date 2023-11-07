import express, { Router, Request, Response, NextFunction } from 'express';
import userAccountController from '../controller/userAccountController';

const router: Router = express.Router();

router.get('/useraccount', userAccountController.getUserAccountTable);
router.get('/useraccount/:id', userAccountController.getUserAccountData);
router.delete('/useraccount/:id', userAccountController.deleteUserAccountData);
router.post('/useraccount', userAccountController.createUserAccountData);
router.put('/useraccount/:id', userAccountController.updateUserAccountData);

export default router