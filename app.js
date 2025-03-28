import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import booksRoutes from './routes/books.js';
import authRoutes from './routes/auth.js';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();

// Deshabilitar la cabecera X-Powered-By
app.disable('x-powered-by');

// Middlewares
app.use(express.json())
app.use(cors())

// Rutas
app.use(booksRoutes)
app.use(authRoutes)

app.get('/', (req, res) => {
    res.send('Bienvenido a mi API');
});


// Correr el programa en el puerto 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});