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
}