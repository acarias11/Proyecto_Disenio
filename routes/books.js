import express from 'express';
import BookController from '../controllers/books.js';
import { isAuth } from '../middlewares/is_auth.js';
import { isAdmin } from '../middlewares/is_admin.js';

const booksRoutes = express.Router();

// Rutas públicas
booksRoutes.get('/', isAuth, BookController.getAll);
booksRoutes.get('/:id', isAuth, BookController.getById);

// Rutas protegidas para administradores
booksRoutes.post('/', [ isAuth, isAdmin ], BookController.create);
booksRoutes.put('/:id', [ isAuth, isAdmin ], BookController.update);
booksRoutes.delete('/:id', [ isAuth, isAdmin ], BookController.delete);

// Actualizar estado de un libro (corregir la ruta)
booksRoutes.patch('/estado/:id', [ isAuth, isAdmin ], BookController.updateState);

// Nueva ruta para ver solicitudes (solo administradores)
booksRoutes.get('/solicitudes/all', [ isAuth, isAdmin ], BookController.getAllSolicitudes);

// Solicitar un libro (cualquier usuario autenticado)
booksRoutes.post('/:id/solicitar', isAuth, BookController.requestBook);

// Publicar un author (Solo administradores)
booksRoutes.post('/author', [ isAuth, isAdmin ], BookController.createAuthor);

// Publicar una editorial (Solo administradores)
booksRoutes.post('/editorial', [ isAuth, isAdmin ], BookController.createEditorial);

export default booksRoutes;