import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import booksRoutes from './routes/books.js';
import userRoutes from './routes/users.js';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();

// Deshabilitar la cabecera X-Powered-By
app.disable('x-powered-by');

// Middlewares
app.use(cors());
app.use(express.json());

// Registrar rutas
app.use('/', authRoutes);
app.use('/libros', booksRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
    res.send('Bienvenido a mi biblioteca virtual!');
});

// Correr el programa en el puerto 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});