import sql from 'mssql';
import { errorResponse, successResponse } from '../utils/response.js';
import db from '../config/database.js';

// Crear una conexión a la base de datos
const pool = new sql.ConnectionPool(db);
const poolConnect = pool.connect();

export default class UserController {
  static getAll = async (req, res) => {
    try {
      await poolConnect;
      
      // Consultar usuarios y convertir el BINARY a string hexadecimal
      // Usando solo las columnas que existen en la tabla
      const query = `
        SELECT 
          CONVERT(VARCHAR(32), UsuarioID, 2) AS UsuarioID,
          Nombre,
          Email,
          Rol
        FROM Usuarios
      `;
      
      const result = await pool.request().query(query);
      
      // Transformar los resultados para que sean más fáciles de usar
      const usuarios = result.recordset.map(user => ({
        usuarioId: user.UsuarioID,
        nombre: user.Nombre,
        email: user.Email,
        rol: user.Rol
      }));
      
      successResponse(res, 200, usuarios, 'Datos de usuarios obtenidos correctamente');
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      errorResponse(res, 500, 'Error al obtener datos de los usuarios', err.message);
    }
  };
}