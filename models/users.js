import db from '../config/database.js'
import sql from 'mssql'
import { registrarEnBitácora } from './books.js';

// Función para obtener todos los usuarios
export const getAllUsersDB = async (usuarioEmail) => {

        const pool = await db.connect()
        
        const result = await pool.request().query(`
            SELECT CONVERT(UNIQUEIDENTIFIER, UsuarioID) AS UsuarioID, Nombre, Email, Rol, Verificado FROM Usuarios
        `);

        // Registrar en la bitácora
        await registrarEnBitácora(usuarioEmail, 'Consulta de usuarios registrados')
        
        return result.recordset
};

export const verificarUsuario = async ({id, usuarioEmail}) => {

    const pool = await db.connect()

    const request = pool.request()
    request.input('usuarioID', sql.UniqueIdentifier, id)

    await request.query(`
        UPDATE Usuarios SET Verificado = 1 WHERE CONVERT(UNIQUEIDENTIFIER, UsuarioID) = @usuarioID
    `)

    // Registrar en bitácora
    await registrarEnBitácora(usuarioEmail, 'Verificación de usuario')

    return true
}

