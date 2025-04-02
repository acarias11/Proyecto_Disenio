import { validateBook, validateBookPartial } from "../schemas/schema.js"
import { errorResponse, successResponse } from "../utils/response.js"
import * as BookModel from "../models/books.js"

export default class BookController {

    static getAll = async (req, res) => {
    
        try {
            const result = await BookModel.getAllBooks()

            successResponse(res, 200, result, 'Datos de libros obtenidos correctamente')

        } catch (err){
            errorResponse(res, 500, 'Error al obtener datos de los libros', err.message)
        }
    }

    static getById = async (req, res) => {
        // const { id } = req.params

        // try {
        //     const result = await BookModel.getBookbyId(id)

        //     if (!result) {
        //         errorResponse(res, 404, 'Libro no encontrado')
        //         return
        //     }
        //     successResponse(res, 200, result, 'Libro obtenido correctamente')
        // } catch(err) {
        //     errorResponse(res, 500, 'Error al obtener el libro', err.message)
        // }
    }

    static create = async (req, res) => {
        // const data = req.getBookbyId

        // const result = await validateBook(data)

        // try {
        //     return successResponse(res, 201, result, 'Libro creado exitosamente');
        // } catch (err) {
        //     return errorResponse(res, 500, 'Error al crear libro', err);
        // }

    }

    static updateState = async (req, res) => {
        // const id = req.params.id
        // const {Estado } = req.body

        // try {
        //     const result = await BookModel.updateState(id, Estado)
        //     if (!result) {
        //         errorResponse(res, 404, 'Libro no encontrado')
        //     }
        //     successResponse(res, 200, result, 'Estado del libro actualizado correctamente')
        // }
        // catch(err){
        //     errorResponse(res, 500, 'Error al actualizar el estado del libro', err.message)
        // }
    }

    static update = async (req, res) => {
        // const id = req.params.id
        // const data = req.body

        // try {
        //     const result = await BookModel.updateBook(id, data)
        //     if (!result) {
        //         errorResponse(res, 404, 'Libro no encontrado')
        //     }
        //     successResponse(res, 200, result, 'Libro actualizado correctamente')
        // } catch(error){
        //     errorResponse(res, 500, 'Error al actualizar el libro', error.message)
        // }
    }

    static delete = (req, res) => {
        

    }


    static requestBook = (req, res) => {
        
        
    }
}