import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';

export const isAuth = (req, res, next) => {
    try {
        // Obtener el encabezado de autorización
        const authHeader = req.headers.authorization;
        
        // Verificar si existe el encabezado de autorización
        if (!authHeader) {
            errorResponse(res, 401, 'No autorizado: Token no proporcionado');
        }
        
        // Extraer el token del encabezado (Bearer [token])
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            errorResponse(res, 401, 'No autorizado: Formato de token inválido');
        }
        
        // Verificar y decodificar el token
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        // Agregar la información del usuario al objeto request para uso en otros middlewares
        req.params.role = decodedToken.rol;
        req.params.email = decodedToken.email;
        
        // Continuar con la solicitud
        next();
    } catch (error) {
        console.error('Error en autenticación:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            errorResponse(res, 401, 'No autorizado: Token expirado');
        }
        
        errorResponse(res, 401, 'No autorizado: Token inválido');
    }
};
