import express, { Router, Request, Response, NextFunction } from 'express';
import cardController from '../controller/cardController';

const router: Router = express.Router();

router.get('/card', cardController.getCardTable);

export default router