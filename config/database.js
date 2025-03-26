import sql from 'mssql';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
if (process.env.DB_HOST === undefined) {
    dotenv.config();
}

// Configuración de la base de datos
const db = new sql.ConnectionPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true 
    },
    connectionTimeout: 10000 
})

export default db