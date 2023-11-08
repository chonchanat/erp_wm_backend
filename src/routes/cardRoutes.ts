import express, { Router, Request, Response, NextFunction } from 'express';
import cardController from '../controller/cardController';

const router: Router = express.Router();

router.get('/card', cardController.getCardTable);
router.get('/card/:id', cardController.getCardData);
router.delete('/card/:id', cardController.deleteCardData);
router.post('/card', cardController.createCardData);
router.put('/card/:id', cardController.updateCardData);

export default router