import express from 'express';
import sql from 'mssql';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();

app.use(express.json());

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Change to true for local dev / self-signed certs
    },
    connectionTimeout: 10000 // Aumenta el tiempo de espera a 10 segundos
};

// Probar conexión
sql.connect(dbConfig, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos');
});

app.get('/', (req, res) => {
    res.send('Bienvenido a mi API');
});

// Mostrar la tabla usuarios
app.get('/users', (req, res) => {
    const request = new sql.Request();
    request.query('SELECT * FROM USUARIOS', (err, result) => {
        if (err) {
            console.error('Error al obtener datos de LOS usuarios:', err);
            res.status(500).send('Error al obtener datos de los usuarios');
            return;
        }
        // Convertir IDs binarias a números enteros
        const users = result.recordset.map(user => ({
            ...user,
            UsuarioID: user.UsuarioID ? parseInt(Buffer.from(user.UsuarioID).toString('hex'), 16) : null
        }));
        res.send(users);
    });
});

// Mostrar la tabla libros con nombres de autor y editorial
app.get('/libros', (req, res) => {
    const request = new sql.Request();
    const query = `
        SELECT 
            LIBRO.*, 
            AUTOR.Nombre AS AutorNombre, 
            EDITORIAL.Nombre AS EditorialNombre 
        FROM LIBRO
        JOIN AUTOR ON LIBRO.AutorID = AUTOR.AutorID
        JOIN EDITORIAL ON LIBRO.EditorialID = EDITORIAL.EditorialID
    `;
    request.query(query, (err, result) => {
        if (err) {
            console.error('Error al obtener datos de los libros:', err);
            res.status(500).send('Error al obtener datos de los libros');
            return;
        }
        // Convertir IDs binarias a números enteros y agregar nombres de autor y editorial
        const libros = result.recordset.map(libro => ({
            ...libro,
            LibroID: libro.LibroID ? parseInt(Buffer.from(libro.LibroID).toString('hex'), 16) : null,
            AutorNombre: libro.AutorNombre,
            EditorialNombre: libro.EditorialNombre
        }));
        // Eliminar AutorID y EditorialID de la respuesta
        libros.forEach(libro => {
            delete libro.AutorID;
            delete libro.EditorialID;
        });
        res.send(libros);
    });
});

// correr el programa en el puerto 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});