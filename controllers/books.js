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
            console.error(`Error al obtener el libro: ${err}`)
            errorResponse(res, 500, 'Error al obtener el libro')
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
            console.error(`Error al crear libro ${err}`)
            errorResponse(res, 500, 'Error al crear libro');
        }
    }


    static updatePartial = async (req, res, next) => {

        // Verificar que la ruta no sea '/estado'
        // Esto es para evitar que la ruta '/estado' sea manejada por este método
        if (req.path !== '/estado'){
        
            const id = req.params.id
        const data = req.body
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;
        
        try {
        const validation = validateBookPartial(data)
        
        if (!validation.success) {
            return errorResponse(res, 400, 'Datos del libro inválidos', {
                message: `${validation.error.errors[0].path}: ${validation.error.errors[0].message}`
            })
        }

            const result = await BookModel.updateBookPartial(id, data, usuarioEmail)
            
            if (result.success === false) {
                return errorResponse(res, 404, result.message)
            }

            successResponse(res, 200, result.libro, 'Libro actualizado correctamente')
        } catch(error){
            console.error(`Error al actualizar libro ${error}`)
            errorResponse(res, 500, 'Error al actualizar libro')
        }
        } else{
            next()
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
            
            successResponse(res, 204, null, 'Libro eliminado correctamente')
        } catch (err) {
            console.error(`Error al eliminar libro ${err}`)
            errorResponse(res, 500, 'Error al eliminar libro')
        }
    }

    static requestBook = async (req, res) => {
        const { id } = req.body; // ID del libro
        
        // Obtener email del usuario autenticado (del token JWT)
        // Nota: Debe ser req.user.email, no req.params.email (a menos que tu middleware lo configure así)
        const usuarioEmail = req.params.email;
        
        if (!usuarioEmail) {
            return errorResponse(res, 401, 'Usuario no autenticado o email no disponible');
        }

        try {
            // Ya no necesitamos enviar nombreUsuario, usamos el email del token
            const result = await BookModel.request(id, usuarioEmail);
            
            if (!result.success) {
                return errorResponse(res, 404, result.message);
            }
            
            successResponse(res, 200, result.data, 'Solicitud de libro registrada correctamente');
        } catch (err) {
            console.error(`Error al procesar la solicitud del libro: ${err}`);
            errorResponse(res, 500, 'Error al procesar la solicitud del libro');
        }
    }

    static getAllSolicitudes = async (req, res) => {
        try {
            const solicitudes = await BookModel.getAllSolicitudes();

            successResponse(res, 200, solicitudes, 'Solicitudes obtenidas correctamente');

        } catch (err) {
            console.error(`Error al obtener las solicitudes ${err}`);
            errorResponse(res, 500, 'Error al obtener las solicitudes');
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
            console.error(`Error al crear autor ${error}`)
            errorResponse(res, 500, 'Error al crear autor')
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

            const editorialExists = await BookModel.editorialExists(editorialData.nombre)

            if (editorialExists) {
                return errorResponse(res, 400, 'La editorial ya existe')
            }

            const result = await BookModel.createEditorial(editorialData, usuarioEmail)

            successResponse(res, 201, null, 'Editorial creada exitosamente')
        } catch (error) {
            console.error(`Error al crear editorial ${error}`)
            errorResponse(res, 500, 'Error al crear editorial')
        }
        
    }

    static updateState = async (req, res) => {
            
            const { solicitudId, estado, libroID } = req.body;
            // Obtener email del token
            const usuarioEmail = req.params.email;
        
        try {
            // Verificar que el ID de la solicitud y el estado no sean nulos o indefinidos
            if (!solicitudId || !estado) {
                return errorResponse(res, 400, 'Faltan datos requeridos: solicitudId y estado')
            }
            
            // Validar el ID de la solicitud
            if (isNaN(solicitudId))  {
                return errorResponse(res, 400, 'ID de solicitud no válido')
            }

            // Llamar al modelo con el libroID adicional
            const result = await BookModel.updateBookState(solicitudId, estado, usuarioEmail, libroID);
            
            if (result.success === false) {
                return errorResponse(res, 404, result.message);
            }

            successResponse(res, 200, result.data, 'Estado de la solicitud actualizado correctamente');

        } catch (error) {
            console.error('Error en updateState:', error);
            errorResponse(res, 500, 'Error interno del servidor')
        }
    }

    static updateComplete = async (req, res) => {
        
        // Obtener el id del libro
        const id = req.params.id

        const libro = req.body
        
        // Obtener el email del usuario desde el token
        const usuarioEmail = req.params.email;
    
        try {

            // Validar que el libro exista
            const libroExistente = await BookModel.getBookById(id)  
            
            if (!libroExistente) {
                return errorResponse(res, 404, 'El Libro ingresado no existe');
            }

            // Agregar el mismo estado que en la BD a la nueva información del libro
            libro.libroId = libroExistente.LibroID
            libro.estado = libroExistente.Estado

            // Validar que la información recibida sea correcta
            const validation = validateBook(libro);

            if (!validation.success){
                return errorResponse(res, 400, 'Los Datos ingresados no son válidos', {
                    message: `${validation.error.errors[0].path}: ${validation.error.errors[0].message}`
                })
            }

            // Verificar que el autor y la editorial existan
            const autorExistente = await BookModel.authorExists(libro.autor)

            if (!autorExistente) {
                return errorResponse(res, 404, 'El Autor ingresado no existe en la BD')
            }

            libro.autorId = autorExistente.AutorID

            const editorialExistente = await BookModel.editorialExists(libro.editorial)

            if (!editorialExistente) {
                return errorResponse(res, 404, 'La Editorial ingresada no existe en la BD')
            }

            libro.editorialId = editorialExistente.EditorialID

            // Actualizar el libro en la base de datos
            const result = await BookModel.updateBookComplete(libro, usuarioEmail)
            
            successResponse(res, 204, null, 'Libro actualizado correctamente')

        } catch (error) {
            console.error(`Error al actualizar libro: ${error}`)
            errorResponse(res, 500, 'Error al actualizar libro')
        }
        
    }
        
}
