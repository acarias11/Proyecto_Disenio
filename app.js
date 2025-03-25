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

// Mostrar la tabla factura
app.get('/factura', (req, res) => {
    const request = new sql.Request();
    request.query('SELECT * FROM FACTURA', (err, result) => {
        if (err) {
            console.error('Error al obtener datos de la factura:', err);
            res.status(500).send('Error al obtener datos de la factura');
            return;
        }
        res.send(result.recordset);
    });
});

// correr el programa en el puerto 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});