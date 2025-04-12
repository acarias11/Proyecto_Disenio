import db from '../config/database.js'
import sql from 'mssql'

// Funcion para verificar si el usuario existe
export const verifyUser = async (email) => {
    try {
        const pool = await db.connect() 

        const request = pool.request();
        
        request.input('email', sql.NVarChar, email);
        
        const result = await request.query(`
            SELECT UsuarioID, Nombre, Email, 
                   Password,
                   Rol 
            FROM USUARIOS 
            WHERE Email = @email
        `);
        
        
        return result.recordset[0];
        
        
    } catch (error) {
        console.error('Error en verifyUser:', error);
        throw error;
    }
};

// Función para crear un nuevo usuario
export const createUser = async (userData) => {
    try {
        const pool = await db.connect()

        const request = pool.request()

        request.input('nombre', sql.NVarChar, userData.nombre)
        request.input('email', sql.NVarChar, userData.email)
        request.input('passoword', sql.Binary , userData.password)
        request.input('rol', sql.NVarChar, userData.rol || 'User')

        await request.query(`
            INSERT INTO USUARIOS (Nombre, Email, Password, Rol)
            VALUES (@nombre, @email, @password, @rol)
        `)

    } catch(error){
        console.error('Error en createUser', error)
        throw error
    }
}