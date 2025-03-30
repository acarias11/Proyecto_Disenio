import { Router } from "express";
import { isAdmin } from "../middlewares/is_admin";
import { isAuth } from "../middlewares/is_auth";

const logRoutes = Router();

// Obtener el historial completo
// logRoutes.get("/logs", [isAuth, isAdmin], LogController.getAll);

// Obtener el historial de un usuario
// logRoutes.get("/logs/:id", [isAuth, isAdmin], LogController.getById);

export default logRoutes;