import { Router } from "express";
import BookController from "../controllers/books.js";
// import { isAuth } from '../middlewares/is_auth.js'

const booksRoutes = Router();

// Mostrar la tabla libros con nombres de autor y editorial
booksRoutes.get('/libros', BookController.getAll) //Agregar isAuth


export default booksRoutes;