import { Router } from "express";
import AuthController from "../controllers/auth.js";
import { isAdmin } from "../middlewares/is_admin.js";
import { isAuth } from "../middlewares/is_auth.js";
import { rateLimit } from 'express-rate-limit'

const authRoutes = Router();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        message: 'Numero de intentos excedido, intente mas tarde',
        error: null
    }
})

// Iniciar sesión
authRoutes.post("/login", limiter, AuthController.login);

// Registrar un usuario
authRoutes.post("/register", AuthController.register);

// Registrar un administrador
authRoutes.post("/registerAdmin", [isAuth, isAdmin], AuthController.registerAdmin);


export default authRoutes;
