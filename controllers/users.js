import { errorResponse, successResponse } from '../utils/response.js';
import { verifyUser } from '../models/auth.js';
import * as UserModel from '../models/users.js';

export default class UserController {
  static getAllUsers = async (req, res) => {

    const userEmail = req.params.email

    try {
        const users = await UserModel.getAllUsersDB(userEmail);

        if (!users) {
            return errorResponse(res, 404, 'No se encontraron usuarios');
        }

        successResponse(res, 200, users, 'Usuarios obtenidos correctamente');
        
    } catch (error) {
        console.error('Error al obtener los usuarios:', error)
        // return errorResponse(res, 500, 'Error al obtener los usuarios');
    } }

    static verificarUsuario = async (req, res) => {

        const { id } = req.body;
        const usuarioEmail = req.params.email

        try {
            const userExists = await verifyUser({ id });

        if (!userExists) {
            return errorResponse(res, 404, 'El usuario ingresado no existe');
        }

        if (userExists.verificado) {
            return errorResponse(res, 400, 'El usuario ya está verificado');
        }

        const verificarUsuario = await UserModel.verificarUsuario({id, usuarioEmail});

        successResponse(res, 204, null, 'Usuario verificado correctamente');

        } catch (error) {
            console.error('Error al verificar el usuario:', error);
        }
}}
