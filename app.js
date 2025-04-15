import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import booksRoutes from './routes/books.js';
import userRoutes from './routes/users.js';
import logRoutes from './routes/logs.js';
import helmet from 'helmet';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();

// Deshabilitar la cabecera X-Powered-By
app.disable('x-powered-by');

// Middlewares
// Configuración de CORS
app.use(cors({
    origin: '*', // Origen permitido
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] // Encabezados permitidos
}));
// Configuración de body-parser para manejar JSON
app.use(express.json());
// Configuración de Helmet para mejorar la seguridad
app.use(helmet());

// Registrar rutas
app.use('/', authRoutes);
app.use('/libros', booksRoutes);
app.use('/users', userRoutes);
app.use('/logs', logRoutes);

app.get('/', (req, res) => {
    res.send('Bienvenido a mi biblioteca virtual!');
});

// Correr el programa en el puerto 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});