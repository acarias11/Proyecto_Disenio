import { Router } from "express";
import BookController from "../controllers/books.js";
import { isAuth } from "../middlewares/is_auth.js";
import { isAdmin } from "../middlewares/is_admin.js";

const booksRoutes = Router();

// Mostrar la tabla libros en la base de datos
booksRoutes.get('/libros', isAuth, BookController.getAll) 

// Mostrar un libro por id 
booksRoutes.get('/libros/:id', isAuth, BookController.getById)

// Crear un libro
booksRoutes.post('/libros', [isAuth, isAdmin], BookController.create)

// Actualizar un libro por id
booksRoutes.patch('/libros/:id', [isAuth, isAdmin], BookController.update)

//Eliminar un libro por id
booksRoutes.delete('/libros/:id', [isAuth, isAdmin], BookController.delete)

// Solicitar un libro por id
booksRoutes.post('/libros/:id/solicitar', isAuth, BookController.requestBook)


export default booksRoutes;