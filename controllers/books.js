import { validateBook, validateBookPartial } from "../schemas/schema.js"
import { errorResponse, successResponse } from "../utils/response.js"
import * as BookModel from "../models/books.js"

export default class BookController {

    static getAll = async (req, res) => {
        try {
            // Obtener el ID del usuario desde el token
            const usuarioId = req.params.email;
            
            const result = await BookModel.getAllBooks(usuarioId)
            successResponse(res, 200, result, 'Datos de libros obtenidos correctamente')
        } catch (err){
            errorResponse(res, 500, 'Error al obtener datos de los libros', err.message)
        }
    }

    static getById = async (req, res) => {
        const { id } = req.params
        // Obtener el ID del usuario desde el token
        const usuarioId = req.params.email;

        try {
            const result = await BookModel.getBookById(id, usuarioId)

            if (!result) {
                errorResponse(res, 404, 'Libro no encontrado')
                return
            }
            successResponse(res, 200, result, 'Libro obtenido correctamente')
        } catch(err) {
            errorResponse(res, 500, 'Error al obtener el libro', err.message)
        }
    }

    static create = async (req, res) => {
        const data = req.body
        const validation = validateBook(data)
        // Obtener el ID del usuario desde el token
        const usuarioId = req.params.email;

        if (!validation.success) {
            return errorResponse(res, 400, 'Datos del libro inválidos', validation.error.errors)
        }

        try {
            const result = await BookModel.createBook(data, usuarioId)
            return successResponse(res, 201, result, 'Libro creado exitosamente');
        } catch (err) {
            return errorResponse(res, 500, 'Error al crear libro', err.message);
        }
    }

    static updateState = async (req, res) => {
        const id = req.params.id;
        const { estado, solicitudId } = req.body;
        // Obtener el ID del usuario desde el token
        const usuarioId = req.params.email;

        if (!estado || !['Disponible', 'Prestado'].includes(estado)) {
            return errorResponse(res, 400, 'Estado inválido. Debe ser "Disponible" o "Prestado"');
        }

        try {
            const result = await BookModel.updateBookState(id, estado, usuarioId, solicitudId);
            
            if (!result.success) {
                return errorResponse(res, 404, result.message);
            }
            
            // Personalizar el mensaje según si se eliminó una solicitud
            let mensaje = 'Estado del libro actualizado correctamente';
            if (result.solicitudEliminada) {
                mensaje += `. Solicitud #${result.solicitudId} eliminada con éxito.`;
            }
            
            successResponse(res, 200, result.libro, mensaje);
        }
        catch(err){
            errorResponse(res, 500, 'Error al actualizar el estado del libro', err.message);
        }
    }

    static update = async (req, res) => {
        const id = req.params.id
        const data = req.body
        // Obtener el ID del usuario desde el token
        const usuarioId = req.params.email;
        
        const validation = validateBookPartial(data)
        
        if (!validation.success) {
            return errorResponse(res, 400, 'Datos del libro inválidos', validation.error.errors)
        }

        try {
            const result = await BookModel.updateBook(id, data, usuarioId)
            if (!result) {
                return errorResponse(res, 404, 'Libro no encontrado')
            }
            successResponse(res, 200, result, 'Libro actualizado correctamente')
        } catch(error){
            errorResponse(res, 500, 'Error al actualizar el libro', error.message)
        }
    }

    static delete = async (req, res) => {
        const { id } = req.params
        // Obtener el ID del usuario desde el token
        const usuarioId = req.params.email;

        try {
            const result = await BookModel.deleteBook(id, usuarioId)
            if (!result) {
                return errorResponse(res, 404, 'Libro no encontrado')
            }
            successResponse(res, 200, null, 'Libro eliminado correctamente')
        } catch (err) {
            errorResponse(res, 500, 'Error al eliminar el libro', err.message)
        }
    }

    static requestBook = async (req, res) => {
        const { id } = req.params;
        const { usuarioId } = req.body;

        if (!usuarioId) {
            return errorResponse(res, 400, 'ID de usuario requerido');
        }

        try {
            const result = await BookModel.requestBook(id, usuarioId);
            
            if (!result.success) {
                return errorResponse(res, 404, result.message);
            }
            
            successResponse(res, 200, result, 'Solicitud de libro registrada correctamente');
        } catch (err) {
            errorResponse(res, 500, 'Error al procesar la solicitud del libro', err.message);
        }
    }

    static getAllSolicitudes = async (req, res) => {
        try {
            const solicitudes = await BookModel.getAllSolicitudes();
            successResponse(res, 200, solicitudes, 'Solicitudes obtenidas correctamente');
        } catch (err) {
            errorResponse(res, 500, 'Error al obtener las solicitudes', err.message);
        }
    }
}