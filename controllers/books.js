import { validateBook, validateBookPartial } from "../schemas/book.js"
import { validateAuthor } from "../schemas/author.js"
import { validateEditorial } from "../schemas/editorial.js"
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
            // return errorResponse(res, 500, 'Error al obtener datos de los libros', err.message)
            console.error(`Error al obtener datos de los libros ${err}`)
        }
    }

    static getById = async (req, res) => {
        const { id } = req.params
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;

        try {
            const result = await BookModel.getBookById(id, usuarioEmail)

            if (!result) {
                return errorResponse(res, 404, 'Libro no encontrado')
                            }
            successResponse(res, 200, result, 'Libro obtenido correctamente')
        } catch(err) {
            // return errorResponse(res, 500, 'Error al obtener el libro', err.message)
            console.error(`Error al obtener el libro ${err}`)
        }
    }

    static create = async (req, res) => {
        const data = req.body
        const validation = validateBook(data)
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;

        if (!validation.success) {
            return errorResponse(res, 400, 'Datos del libro inválidos', 
                `${validation.error.errors[0].path}: ${validation.error.errors[0].message}`
            )
        }

        try {
            const result = await BookModel.createBook(data, usuarioEmail)
            successResponse(res, 201, result, 'Libro creado exitosamente');
        } catch (err) {
            // return errorResponse(res, 500, 'Error al crear libro', err.message);
            console.error(`Error al crear libro ${err}`)
        }
    }


    static update = async (req, res) => {
        const id = req.params.id
        const data = req.body
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;
        
        const validation = validateBookPartial(data)
        
        if (!validation.success) {
            return errorResponse(res, 400, 'Datos del libro inválidos', validation.error.errors)
        }

        try {
            const result = await BookModel.updateBook(id, data, usuarioEmail)
            if (!result) {
                return errorResponse(res, 404, 'Libro no encontrado')
            }
            successResponse(res, 200, result, 'Libro actualizado correctamente')
        } catch(error){
            console.error(`Error al actualizar libro ${error}`)
        }
    }

    static delete = async (req, res) => {
        const { id } = req.params
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;

        try {
            const result = await BookModel.deleteBook(id, usuarioEmail)
            
            if (!result) {
                return errorResponse(res, 404, 'Libro no encontrado')
            }
            
            successResponse(res, 200, null, 'Libro eliminado correctamente')
        } catch (err) {
            console.error(`Error al eliminar libro ${err}`)
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
            // return errorResponse(res, 500, 'Error al obtener las solicitudes', err.message);
            console.error(`Error al obtener las solicitudes ${err}`);
        }
    }

    static createAuthor = async (req, res) => {
        const authorData = req.body
        
        try {
            const author = validateAuthor(authorData)
            const usuarioEmail = req.params.email

            if (!author.success) {
                return errorResponse(res, 400, 'Datos del autor inválidos',
                     `${author.error.errors[0].path}: ${author.error.errors[0].message}`)
            }

            const result = await BookModel.createAuthor(authorData, usuarioEmail)

            successResponse(res, 201, null, 'Autor creado exitosamente')
        } catch (error) {
            console.log(`Error al crear autor ${error}`)
        }
        
    }

    static createEditorial = async (req, res) => {
        const editorialData = req.body
        const usuarioEmail = req.params.email
        
        try {
            const editorial = validateEditorial(editorialData)

            if (!editorial.success) {
                return errorResponse(res, 400, 'Datos de la editorial inválidos',
                     `${editorial.error.errors[0].path}: ${editorial.error.errors[0].message}`)
            }

            const editorialExists = await BookModel.editorialExists(editorialData)

            if (editorialExists) {
                return errorResponse(res, 400, 'La editorial ya existe')
            }

            const result = await BookModel.createEditorial(editorialData, usuarioEmail)

            successResponse(res, 201, null, 'Editorial creada exitosamente')
        } catch (error) {
            console.log(`Error al crear editorial ${error}`)
        }
        
    }

    static updateState = async (req, res) => {
        try {
            const { solicitudId, estado, libroID } = req.body;
            
            if (!solicitudId || !estado) {
                return res.status(400).json({
                    success: false, 
                    message: 'Faltan datos requeridos: solicitudId y estado'
                });
            }
            
            // Obtener email del token
            const usuarioEmail = req.params.email;
            
            // Llamar al modelo con el libroID adicional
            const result = await BookModel.updateBookState(solicitudId, estado, usuarioEmail, libroID);
            
            return res.status(result.success ? 200 : 400).json(result);
            
        } catch (error) {
            console.error('Error en updateState:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
        
}
