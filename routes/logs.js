import { Router } from "express";
import { isAdmin } from "../middlewares/is_admin.js";
import { isAuth } from "../middlewares/is_auth.js";
import LogController from "../controllers/logs.js";

const logRoutes = Router();

// Obtener el historial completo
logRoutes.get("/", [isAuth, isAdmin], LogController.getAll);

// Obtener el historial de un usuario
logRoutes.get("/:id", [isAuth, isAdmin], LogController.getById);

export default logRoutes;