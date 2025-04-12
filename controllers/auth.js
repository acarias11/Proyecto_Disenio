import jsonwebtoken from 'jsonwebtoken';
import { errorResponse, successResponse } from '../utils/response.js';
import * as AuthModel from '../models/auth.js';
import { validateUser } from '../schemas/schema.js';

export default class AuthController {
    static login = async (req, res) => {
        const { email, password } = req.body;

        if(!email){
            errorResponse(res, 400, 'El email es requerido');
        }

        try {
            const userData = await AuthModel.verifyUser(email);
            if(!userData){
                errorResponse(res, 400, 'El email no está registrado');
            }
            
            // Procesar la contraseña almacenada1.
            let storedPassword;
            
            if (Buffer.isBuffer(userData.Password)) {
                storedPassword = userData.Password.toString('utf8').replace(/\0+$/, '');
            } 
            else if (typeof userData.Password === 'string') {
                if (userData.Password.startsWith('0x')) {
                    const hex = userData.Password.substring(2);
                    storedPassword = Buffer.from(hex, 'hex').toString('utf8').replace(/\0+$/, '');
                } else {
                    storedPassword = userData.Password.replace(/\0+$/, '');
                }
            } else {
                storedPassword = String(userData.Password).replace(/\0+$/, '');
            }

            // Comparar sin distinción de mayúsculas/minúsculas
            if (storedPassword.toLowerCase() !== password.toLowerCase()) {
                errorResponse(res, 400, 'La contraseña es incorrecta');
            }

            const token = jsonwebtoken.sign({
                'email': email,
                "rol": userData.Rol  
            }, process.env.SECRET_KEY, {
                expiresIn: '0.5h'
            });
            

            successResponse(res, 200, {
                name: userData.Nombre,
                email: email,
                role: userData.Rol
            }, 'Usuario logueado correctamente', token);

        } catch (error) {
            console.error('Error en login:', error);
            errorResponse(res, 500, 'Error interno del servidor');
        }
    }


    static register = async (req, res) => {
        try {
            const userData = req.body;

            const validation = validateUser(userData);

            if (!validation.success) {
                errorResponse(res, 400, 'Datos inválidos', validation.error.format());
            }

            const existingUser = await AuthModel.verifyUser(userData.email);

            if (existingUser) {
                errorResponse(res, 400, 'El email ya está registrado');
            }

            await AuthModel.createUser(userData);

            const token = jsonwebtoken.sign({
                email: userData.email,
                rol: userData.Rol
            }, process.env.SECRET_KEY, {
                expiresIn: '0.5h'
            })

            successResponse(res, 201, {
                name: userData.nombre,
                email: userData.email,
                role: userData.Rol
            }, 'Usuario registrado correctamente', token)

        } catch (error) {
            console.error('Error en register:', error);
            errorResponse(res, 500, 'Error al registrar el usuario')
        }
    }

    static registerAdmin = async (req, res) => {
        try {
            const userData = req.body;
            
            const validation = validateUser(userData)
            if (!validation.success) {
                errorResponse(res, 400, 'Datos inválidos', validation.error.format());
            }

            const existingUser = await AuthModel.verifyUser(userData.email)
            if (existingUser) {
                errorResponse(res, 400, 'El email ya está registrado');
            }

            await AuthModel.createUser(userData);

            const token = jsonwebtoken.sign({
                email: userData.email,
                rol: userData.Rol
            }, process.env.SECRET_KEY, {
                expiresIn: '0.5h'
            });

            successResponse(res, 201, {
                name: userData.nombre,
                email: userData.email,
                role: userData.Rol
            }, 'Administrador registrado correctamente', token)

        } catch (error) {
            console.error('Error en registerAdmin:', error);
            errorResponse(res, 500, 'Error al registrar el administrador');
        }
    }
}
