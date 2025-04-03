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
    server: process.env.DB_HOST,  // Obtenido desde variables de entorno
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true 
    },
    connectionTimeout: 10000 
};

// Verificación para asegurar que server es un string
if (!db.server || typeof db.server !== 'string') {
    console.error('Error: DB_HOST debe ser una cadena de texto válida');
    // No establecer valores por defecto para datos sensibles
}

export default db;