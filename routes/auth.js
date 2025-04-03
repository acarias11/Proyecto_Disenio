import { Router } from "express";
import AuthController from "../controllers/auth.js";
import { isAdmin } from "../middlewares/is_admin.js";
import { isAuth } from "../middlewares/is_auth.js";

const authRoutes = Router();

// Iniciar sesión
authRoutes.post("/login", AuthController.login);

// Registrar un usuario
authRoutes.post("/register", AuthController.register);

// Registrar un administrador
authRoutes.post("/registerAdmin", [isAuth, isAdmin], AuthController.registerAdmin);

// Obtener los usuarios registrados
authRoutes.get("/registeredUsers", [isAuth, isAdmin], AuthController.getAllUsers);

export default authRoutes;
