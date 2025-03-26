import express from 'express';
import sql from 'mssql';
import db from './config/database.js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();

app.use(express.json());

// Crear pool de conexiones
const pool = new sql.ConnectionPool(db);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.error('Error en el pool de conexiones:', err);
});

app.get('/', (req, res) => {
    res.send('Bienvenido a mi API');
});

// Mostrar la tabla usuarios
app.get('/users', async (req, res) => {
    try {
        await poolConnect; // Asegurarse de que el pool esté conectado
        const request = pool.request();
        const result = await request.query('SELECT * FROM USUARIOS');
        // Convertir IDs binarias a números enteros
        const users = result.recordset.map(user => ({
            ...user,
            UsuarioID: user.UsuarioID ? parseInt(Buffer.from(user.UsuarioID).toString('hex'), 16) : null
        }));
        res.send(users);
    } catch (err) {
        console.error('Error al obtener datos de LOS usuarios:', err);
        res.status(500).send('Error al obtener datos de los usuarios');
    }
});

// Mostrar la tabla libros con nombres de autor y editorial
app.get('/libros', async (req, res) => {
    try {
        await poolConnect; // Asegurarse de que el pool esté conectado
        const request = pool.request();
        const query = `
            SELECT 
                LIBRO.*, 
                CONCAT(AUTOR.Nombre, ' ', AUTOR.Apellido) AS AutorNombreCompleto, 
                EDITORIAL.Nombre AS EditorialNombre 
            FROM LIBRO
            JOIN AUTOR ON LIBRO.AutorID = AUTOR.AutorID
            JOIN EDITORIAL ON LIBRO.EditorialID = EDITORIAL.EditorialID
        `;
        const result = await request.query(query);
        // Agregar nombres de autor y editorial
        const libros = result.recordset.map(libro => ({
            ...libro,
            AutorNombreCompleto: libro.AutorNombreCompleto,
            EditorialNombre: libro.EditorialNombre
        }));
        // Eliminar AutorID y EditorialID de la respuesta
        libros.forEach(libro => {
            delete libro.AutorID;
            delete libro.EditorialID;
        });
        res.send(libros);
    } catch (err) {
        console.error('Error al obtener datos de los libros:', err);
        res.status(500).send('Error al obtener datos de los libros');
    }
});

// correr el programa en el puerto 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});