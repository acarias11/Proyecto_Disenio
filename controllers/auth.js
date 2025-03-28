// importar donde se obtendran los usuarios
import jsonwebtoken from 'jsonwebtoken';
import { errorResponse, successResponse } from '../utils/response.js';
import { verifyUser } from '../models/books.js';

export default class AuthController {
    static login = async (req, res) => {
        const { email, password } = req.body;

        if(!email){
            errorResponse(res, 400, 'El email es requerido')
        }

        const userData = await verifyUser(email)

        if(!userData){
            errorResponse(res, 400, 'El email no está registrado')
        }

        const DBPassword = userData.Password.split(`\\x00`)[0].toString().substring(0, password.length)

        if(DBPassword !== password){
            errorResponse(res, 400, 'La contraseña es incorrecta')
        }

        const token = jsonwebtoken.sign({
            'email': email,
            "role": userData.rol
        }, process.env.SECRET_KEY, {
            expiresIn: '0.5h'})
        
        successResponse(res, 200, data = {
            name: userData.Nombre,
            email: email,
            role: userData.Rol
        } ,message = 'Usuario logueado correctamente' ,token);
    }
}
