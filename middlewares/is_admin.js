import { errorResponse } from '../utils/response.js';

export const isAdmin = (req, res, next) => {
    // Verificar si existe req.user desde el middleware anterior (is_auth.js)
    if (!req.user) {
        return errorResponse(res, 401, 'No autorizado: Falta información de usuario');
    }
    
    // Verificar si el usuario es administrador
    // Acceder a la propiedad 'role' que estamos incluyendo en el token
    if (!req.user.Rol || req.user.Rol !== 'Admin') {
        return errorResponse(res, 403, 'Acceso denegado: Se requieren privilegios de administrador');
    }
    
    // Si el usuario es administrador, continuar
    next();
};
