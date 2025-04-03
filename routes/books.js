import express from 'express';
import BookController from '../controllers/books.js';
import { isAuth } from '../middlewares/is_auth.js';
import { isAdmin } from '../middlewares/is_admin.js';

const router = express.Router();

// Rutas públicas
router.get('/', isAuth, BookController.getAll);
router.get('/:id', isAuth, BookController.getById);

// Rutas protegidas para administradores
router.post('/', isAuth, isAdmin, BookController.create);
router.put('/:id', isAuth, isAdmin, BookController.update);
router.delete('/:id', isAuth, isAdmin, BookController.delete);

// Actualizar estado de un libro (corregir la ruta)
router.patch('/estado/:id', isAuth, isAdmin, BookController.updateState);

// Nueva ruta para ver solicitudes (solo administradores)
router.get('/solicitudes/all', isAuth, isAdmin, BookController.getAllSolicitudes);

// Solicitar un libro (cualquier usuario autenticado)
router.post('/:id/solicitar', isAuth, BookController.requestBook);

export default router;