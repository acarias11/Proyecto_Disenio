import { errorResponse, successResponse } from '../utils/response.js';
import * as UserModel from '../models/users.js';

export default class UserController {
  static getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.getAllUsersDB();

        if (!users) {
            errorResponse(res, 404, 'No se encontraron usuarios');
        }

        successResponse(res, 200, users, 'Usuarios obtenidos correctamente');
        
    } catch (error) {
        console.error('Error al obtener los usuarios:', error)
        // errorResponse(res, 500, 'Error al obtener los usuarios');
    }
}
}
