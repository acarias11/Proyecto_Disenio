import db from '../config/database.js'
import { successResponse } from '../utils/response.js';

export async function getAllBooks(param) {
    
        const pool = await db.connect();

        // Query para obtener los libros con nombres de autor y editorial
        const query = `
            SELECT 
                LIBRO.LibroID AS LibroID,
                LIBRO.Nombre AS Nombre, 
                CONCAT(AUTOR.Nombre, ' ', AUTOR.Apellido) AS Autor, 
                EDITORIAL.Nombre AS Editorial 
            FROM LIBRO
            JOIN AUTOR ON LIBRO.AutorID = AUTOR.AutorID
            JOIN EDITORIAL ON LIBRO.EditorialID = EDITORIAL.EditorialID
        `

        const result = await pool.request().query(query)

        // Almacenar los libros en una variable
        const libros = result.recordset

        return libros
}

export async function verifyUser(email){

    const pool = await db.connect()
    
    const query = `
        SELECT Nombre, CONVERT(VARCHAR(MAX),Password) AS Password, Rol FROM Usuarios WHERE Email LIKE '${email}'
    `

    const result = await pool.request().query(query)

    const userData = result.recordset[0]
    
    return userData
}