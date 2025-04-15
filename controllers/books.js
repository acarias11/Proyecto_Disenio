import { validateBook, validateBookPartial } from "../schemas/schema.js"
import { errorResponse, successResponse } from "../utils/response.js"
import * as BookModel from "../models/books.js"

export default class BookController {

    static getAll = async (req, res) => {
        try {
            // Obtener el email del usuario desde el token
            const usuarioEmail = req.params.email;

            let { genre, author, editorial } = req.query

            if (genre) genre = genre.replace(/%/g, " ")
            
            if (author) author = author.replace(/%/g, ' ')
             
            if(editorial) editorial = editorial.replace(/%/g, ' ')

            const result = await BookModel.getAllBooks(usuarioEmail, { genre, author, editorial })

            successResponse(res, 200, result, 'Datos de libros obtenidos correctamente')
        } catch (err){
            // errorResponse(res, 500, 'Error al obtener datos de los libros', err.message)
            console.error(err)
        }
    }

    static getById = async (req, res) => {
        const { id } = req.params
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;

        try {
            const result = await BookModel.getBookById(id, usuarioEmail)

            if (!result) {
                errorResponse(res, 404, 'Libro no encontrado')
                            }
            successResponse(res, 200, result, 'Libro obtenido correctamente')
        } catch(err) {
            // errorResponse(res, 500, 'Error al obtener el libro', err.message)
            console.error(err)
        }
    }

    static create = async (req, res) => {
        const data = req.body
        const validation = validateBook(data)
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;

        if (!validation.success) {
            errorResponse(res, 400, 'Datos del libro inválidos', 
                `${validation.error.errors[0].path}: ${validation.error.errors[0].message}`
            )
        }

        try {
            const result = await BookModel.createBook(data, usuarioEmail)
            successResponse(res, 201, result, 'Libro creado exitosamente');
        } catch (err) {
            // errorResponse(res, 500, 'Error al crear libro', err.message);
            console.error(err)
        }
    }

    static updateState = async (req, res) => {
        const id = req.params.id;
        const { estado, solicitudId } = req.body;
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;

        if (!estado || !['Disponible', 'Prestado'].includes(estado)) {
            errorResponse(res, 400, 'Estado inválido. Debe ser "Disponible" o "Prestado"');
        }

        try {
            const result = await BookModel.updateBookState(id, estado, usuarioEmail, solicitudId);
            
            if (!result.success) {
                errorResponse(res, 404, result.message);
            }
            
            // Personalizar el mensaje según si se eliminó una solicitud
            let mensaje = 'Estado del libro actualizado correctamente';
            if (result.solicitudEliminada) {
                mensaje += `. Solicitud #${result.solicitudId} eliminada con éxito.`;
            }
            
            successResponse(res, 200, result.libro, mensaje);
        }
        catch(err){
            // errorResponse(res, 500, 'Error al actualizar el estado del libro', err.message);
            console.error(err)
        }
    }

    static update = async (req, res) => {
        const id = req.params.id
        const data = req.body
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;
        
        const validation = validateBookPartial(data)
        
        if (!validation.success) {
            errorResponse(res, 400, 'Datos del libro inválidos', validation.error.errors)
        }

        try {
            const result = await BookModel.updateBook(id, data, usuarioEmail)
            if (!result) {
                errorResponse(res, 404, 'Libro no encontrado')
            }
            successResponse(res, 200, result, 'Libro actualizado correctamente')
        } catch(error){
            console.error(error)
        }
    }

    static delete = async (req, res) => {
        const { id } = req.params
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;

        try {
            const result = await BookModel.deleteBook(id, usuarioEmail)
            
            if (!result) {
                errorResponse(res, 404, 'Libro no encontrado')
            }
            
            successResponse(res, 200, null, 'Libro eliminado correctamente')
        } catch (err) {
            console.error(err)
        }
    }

    static requestBook = async (req, res) => {
        const { id } = req.params;
        const { usuarioEmail } = req.body;

        if (!usuarioEmail) {
            errorResponse(res, 400, 'ID de usuario requerido');
        }

        try {
            const result = await BookModel.requestBook(id, usuarioEmail);
            
            if (!result.success) {
                errorResponse(res, 404, result.message);
            }
            
            successResponse(res, 200, result, 'Solicitud de libro registrada correctamente');
        } catch (err) {
            console.error(err);
        }
    }

    static getAllSolicitudes = async (req, res) => {
        try {
            const solicitudes = await BookModel.getAllSolicitudes();
            successResponse(res, 200, solicitudes, 'Solicitudes obtenidas correctamente');
        } catch (err) {
            // errorResponse(res, 500, 'Error al obtener las solicitudes', err.message);
            console.error(err);
        }
    }
}