import { errorResponse } from '../utils/response.js';

export const isAdmin = (req, res, next) => {
    
    // Verificar si el usuario es administrador
    // Acceder a la propiedad 'role' que estamos incluyendo en el token
    if (req.params.role !== 'Admin') {
        errorResponse(res, 401, 'Acceso denegado: Se requieren privilegios de administrador');
    }
    
    // Si el usuario es administrador, continuar
    next();
};
