import jsonwebtoken from 'jsonwebtoken';
import { errorResponse, successResponse } from '../utils/response.js';
import { verifyUser } from '../models/books.js';

export default class AuthController {
    static login = async (req, res) => {
        const { email, password } = req.body;

        if(!email){
            return errorResponse(res, 400, 'El email es requerido');
        }

        try {
            const userData = await verifyUser(email);
            
            if(!userData){
                return errorResponse(res, 400, 'El email no está registrado');
            }
            
            // Procesar la contraseña almacenada
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
                return errorResponse(res, 400, 'La contraseña es incorrecta');
            }

            const token = jsonwebtoken.sign({
                'email': email,
                "Rol": userData.Rol  
            }, process.env.SECRET_KEY || 'secretkey', {
                expiresIn: '0.5h'
            });
            
            successResponse(res, 200, {
                name: userData.Nombre,
                email: email,
                role: userData.Rol
            }, 'Usuario logueado correctamente', token);
        } catch (error) {
            console.error('Error en login:', error);
            return errorResponse(res, 500, 'Error interno del servidor');
        }
    }

    static register = async (req, res) => {
        try {
            const userData = req.body;
            // Aquí iría la lógica para registrar al usuario
            successResponse(res, 201, userData, 'Usuario registrado correctamente');
        } catch (error) {
            errorResponse(res, 500, 'Error al registrar el usuario');
        }
    }

    static registerAdmin = async (req, res) => {
        try {
            const userData = req.body;
            // Aquí iría la lógica para registrar al administrador
            successResponse(res, 201, userData, 'Administrador registrado correctamente');
        } catch (error) {
            errorResponse(res, 500, 'Error al registrar el administrador');
        }
    }

    static getAllUsers = async (req, res) => {
        try {
            // Aquí iría la lógica para obtener todos los usuarios
            const users = []; // Simula obtener usuarios de la base de datos
            successResponse(res, 200, users, 'Usuarios obtenidos correctamente');
        } catch (error) {
            errorResponse(res, 500, 'Error al obtener los usuarios');
        }
    }
}
