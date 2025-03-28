import jwt from 'jsonwebtoken'
import { errorResponse } from '../utils/response.js';

export const isAuth = (req, res, next) => {

    const authHeader = req.headers.authorization
    
    if (!authHeader) {
        errorResponse(res, 401, 'No se ha proporcionado el token de autorización')
    }

    const token = authHeader.split(' ')[1];

    try {
        const { rol } = jwt.verify(token, process.env.SECRET_KEY)

        req.params.rol = rol

        next();

    } catch (error) {
        errorResponse(res, 401, message = 'Token no válido', error.message)
    }
}
