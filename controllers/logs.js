import * as LogsModel from "../models/logs.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { verifyUser } from "../models/auth.js";

export default class LogsController {

    static getAll = async (req, res) => {
        const userEmail = req.params.email;
        
        try {
            
            const result = await LogsModel.getAllLogs(userEmail);

            if (!result) {
                return errorResponse(res, 404, 'No se encontraron eventos de la bitácora');
            }

            successResponse(res, 200, result, 'Eventos de la bitácora obtenidos correctamente');

        } catch (err) {
            console.error(err);
        }
    }

    static getById = async (req, res) => {
        
        const { id } = req.params;
        const userEmail = req.params.email;

        try {
            // Verificar si el usuario existe
            const userData = await verifyUser({ id });

            if (!userData) {
                return errorResponse(res, 400, 'El usuario no existe');
            }

            const result = await LogsModel.getLogByUserId(id, userEmail);
            
            if (!result) {
                return errorResponse(res, 404, 'No se encontraron eventos de la bitácora para el usuario');
            }

            successResponse(res, 200, result, 'Eventos de la bitácora obtenidos correctamente');

        } catch (err) {
            console.error(err);
        }
    }
}