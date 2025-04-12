import express from 'express';
import UserController from '../controllers/users.js';
import { isAuth } from '../middlewares/is_auth.js';
import { isAdmin } from '../middlewares/is_admin.js';

const userRoutes = express.Router();

// Solo administradores pueden ver la lista de usuarios
userRoutes.get('/', [ isAuth, isAdmin ], UserController.getAllUsers);

export default userRoutes;