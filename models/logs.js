import db from "../config/database.js";
import sql from "mssql";
import { registrarEnBitácora } from "./books.js";

// Función para obtener todos los eventos de la bitácora
export async function getAllLogs(adminEmail) {

    const pool = await db.connect()

    const result = await pool.request().query(`
        SELECT BitacoraID, CONVERT(UNIQUEIDENTIFIER, UsuarioID) AS UsuarioID, Sucesos, Fecha FROM Bitacora
    `)

    // Registrar en bitácora
    await registrarEnBitácora(adminEmail, "Consulta todos los eventos de la bitácora")

    return result.recordset
}

// Función para obtener un log en base al usuario ID
export async function getLogByUserId(usuarioID, adminEmail) {

    const pool = await db.connect()

    const request = pool.request()

    request.input("UsuarioID", sql.UniqueIdentifier, usuarioID)
    
    const result = await request.query(`
        SELECT BitacoraID, Sucesos, Fecha FROM Bitacora WHERE CONVERT(UNIQUEIDENTIFIER, UsuarioID) = @UsuarioID
    `)

    // Registrar en bitácora
    await registrarEnBitácora(adminEmail, `Consulta los eventos de la bitácora del usuario ${usuarioID}`)

    return result.recordset
}