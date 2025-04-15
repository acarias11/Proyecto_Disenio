import jsonwebtoken from 'jsonwebtoken';
import { errorResponse, successResponse } from '../utils/response.js';
import * as AuthModel from '../models/auth.js';
import { validateUser, validateUserPartial } from '../schemas/user.js';

export default class AuthController {
    static login = async (req, res) => {
        const { email, password } = req.body;

        if(!email || !password){
            return errorResponse(res, 400, 'Los datos ingresados son inválidos');
        }

        try {
            const userData = await AuthModel.verifyUser({ email });
            if(!userData){
                return errorResponse(res, 400, 'El email no está registrado');
            }

            // Verificar si el usuario está verificado
            if (!userData.Verificado) {
                return errorResponse(res, 400, 'El usuario no está verificado');
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
                return errorResponse(res, 400, 'La contraseña es incorrecta');
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
        }
    }


    static register = async (req, res) => {
        try {
            const userData = req.body;

            const validation = validateUserPartial(userData);

            if (!validation.success) {
                return errorResponse(res, 400, 'Datos inválidos', 
                    `${validation.error.errors[0].path}: ${validation.error.errors[0].message}`
                );
            }

            const email = userData.email;

            const existingUser = await AuthModel.verifyUser({ email });

            if (existingUser) {
                return errorResponse(res, 400, 'El email ya está registrado');
            }

            const newUser = await AuthModel.createUser(userData);

            const token = jsonwebtoken.sign({
                email: newUser.email,
                rol: newUser.Rol
            }, process.env.SECRET_KEY, {
                expiresIn: '0.5h'
            })

            successResponse(res, 201, {
                name: newUser.nombre,
                email: newUser.email,
                role: newUser.Rol
            }, 'Usuario registrado correctamente', token)

        } catch (error) {
            console.error('Error en register:', error);
        }
    }

    static registerAdmin = async (req, res) => {
        try {
            const userData = req.body;
            
            const validation = validateUser(userData)
            if (!validation.success) {
                return errorResponse(res, 400, 'Datos inválidos', 
                    `${validation.error.errors[0].path}: ${validation.error.errors[0].message}`);
            }

            const email = userData.email

            const existingUser = await AuthModel.verifyUser({ email })
            if (existingUser) {
                return errorResponse(res, 400, 'El email ya está registrado');
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
        }
    }
}
