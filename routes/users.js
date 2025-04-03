import express from 'express';
import UserController from '../controllers/users.js';
import { isAuth } from '../middlewares/is_auth.js';
import { isAdmin } from '../middlewares/is_admin.js';

const router = express.Router();

// Solo administradores pueden ver la lista de usuarios
router.get('/', isAuth, isAdmin, UserController.getAll);

export const userRouter = router;