import db from '../config/database.js'

// Función para obtener todos los usuarios
export const getAllUsersDB = async () => {
    try {
        const pool = await db.connect()
        
        const result = await pool.request().query(`
            SELECT CONVERT(UNIQUEIDENTIFIER, UsuarioID) AS UsuarioID, Nombre, Email, Rol FROM Usuarios
        `);

        return result.recordset[0]

    } catch (error) {
        console.error('Error en getAllUsersDB:', error);
        throw error
    }
};

