import express, { Router } from 'express';
import authController from '../controllers/auth-controller';

const router: Router = express.Router();

router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

router.put('/verify/:verifyId', authController.verify);

export default module.exports = router;
