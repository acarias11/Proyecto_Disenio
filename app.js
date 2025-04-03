import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRouter from './routes/auth.js';
import booksRouter from './routes/books.js';
import { userRouter } from './routes/users.js';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();

// Deshabilitar la cabecera X-Powered-By
app.disable('x-powered-by');

// Middlewares
app.use(cors());
app.use(express.json());

// Registrar rutas
app.use('/', authRouter);
app.use('/libros', booksRouter);
app.use('/users', userRouter);

app.get('/', (req, res) => {
    res.send('Bienvenido a mi biblioteca virtual!');
});

// Correr el programa en el puerto 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});