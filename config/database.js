import sql from 'mssql';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
if (process.env.DB_HOST === undefined) {
    dotenv.config();
}

// Configuración de la base de datos
const db = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true 
    },
    connectionTimeout: 10000 
};

// Crear pool de conexiones, en sql se crea asi
const pool = new sql.ConnectionPool(db);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.error('Error en el pool de conexiones:', err);
});

export default db