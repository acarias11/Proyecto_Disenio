import { Router } from "express";
import BookController from "../controllers/books.js";

const booksRoutes = Router();

// Mostrar la tabla libros con nombres de autor y editorial
booksRoutes.get('/libros', BookController.getAll)

export default booksRoutes;