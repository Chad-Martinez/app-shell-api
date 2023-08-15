import express, { Router } from 'express';
import adminController from '../controllers/admin-controller';
import { isAuth } from '../middleware/is-auth';

const router: Router = express.Router();

router.get('/resource', isAuth, adminController.getResource);

export default module.exports = router;
