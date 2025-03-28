import { errorResponse } from "../utils/response";

export const isAdmin = (req, res, next) => {
    // Verifica si el usuario tiene el rol de admin
    if (req.user.role !== 'admin') {
        errorResponse(res, 403, 'No tiene permisos para realizar esta acción')
    }

    next();
}
