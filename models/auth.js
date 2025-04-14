import db from '../config/database.js'
import sql from 'mssql'
import { registrarEnBitácora } from './books.js';

// Funcion para verificar si el usuario existe
export const verifyUser = async (email) => {
    const pool = await db.connect() 

        const request = pool.request();
        
        request.input('email', sql.NVarChar, email);
        
        const result = await request.query(`
            SELECT UsuarioID, 
                Nombre, Email, 
                Password,
                Rol,
                Verificado 
                FROM USUARIOS 
                WHERE Email = @email
        `);
        
        return result.recordset[0];
};

// Función para crear un nuevo usuario
export const createUser = async (userData) => {
        const pool = await db.connect()

        const request = pool.request()

        if (!userData.rol)
            userData.rol = 'User'

        if (!userData.verificado)
            userData.verificado = 0

        request.input('nombre', sql.VarChar, userData.nombre)
        request.input('email', sql.VarChar, userData.email)
        request.input('password', sql.VarChar , userData.password)
        request.input('rol', sql.VarChar, userData.rol)
        request.input('verificado', sql.Bit, userData.verificado)

        await request.query(`
            INSERT INTO USUARIOS (UsuarioID ,Nombre, Email, Password, Rol, Verificado)
            VALUES (NEWID(), @nombre, @email, CAST(@password AS BINARY(16)), @rol, @verificado)
        `)

        // Registrar en bitácora
        await registrarEnBitácora(userData.email, 'Registro de usuario')

        return userData
}