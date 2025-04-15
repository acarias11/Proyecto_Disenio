import sql from 'mssql';
import db from '../config/database.js';
import { nullable } from 'zod';


// Función para registrar en bitácora mejorada
export async function registrarEnBitácora(usuarioEmail, suceso) {
    try {
        const pool = await db.connect();

        // Si no hay usuarioEmail, no registramos en bitácora
        if (!usuarioEmail) {
            console.log('No se registró en bitácora: usuarioEmail no proporcionado');
            return;
        }
        
        // Si usuarioEmail es un email, buscar el ID real del usuario
        if (typeof usuarioEmail === 'string' && usuarioEmail.includes('@')) {
            const userQuery = await pool.request()
            .input('email', sql.NVarChar, usuarioEmail)
            .query('SELECT UsuarioID FROM Usuarios WHERE Email = @email');
            
            if (userQuery.recordset.length > 0) {
                usuarioEmail = userQuery.recordset[0].UsuarioID;
            } else {
                console.log(`No se encontró usuario con email: ${usuarioEmail}`);
                return;
            }
        }
        
        // Convertir el ID de usuario al formato binario correcto
        let usuarioIdBinary;
        
        if (Buffer.isBuffer(usuarioEmail)) {
            // Ya es un Buffer, asegurar que sea de 16 bytes
            usuarioIdBinary = usuarioEmail.length === 16 ? usuarioEmail : Buffer.alloc(16).fill(usuarioEmail, 0, Math.min(16, usuarioEmail.length));
        } 
        else if (typeof usuarioEmail === 'string') {
            if (usuarioEmail.match(/^[0-9a-fA-F]+$/)) {
                // Es hexadecimal, normalizar a 32 caracteres (16 bytes)
                const normalizedHex = usuarioEmail.padStart(32, '0').substring(0, 32);
                usuarioIdBinary = Buffer.from(normalizedHex, 'hex');
            } 
            else {
                // No es hexadecimal, convertir a buffer de 16 bytes
                usuarioIdBinary = Buffer.alloc(16).fill(usuarioEmail, 0, Math.min(16, usuarioEmail.length));
            }
        } 
        else {
            // Otro tipo, convertir a string y luego a buffer
            const strValue = String(usuarioEmail);
            usuarioIdBinary = Buffer.alloc(16).fill(strValue, 0, Math.min(16, strValue.length));
        }
        
        // Verificar que el buffer sea válido y tenga la longitud correcta
        if (!Buffer.isBuffer(usuarioIdBinary) || usuarioIdBinary.length !== 16) {
            console.error('Error: Buffer inválido para usuarioEmail:', usuarioIdBinary);
            return;
        }

        const request = pool.request();
        
        request.input('usuarioEmail', sql.Binary(16), usuarioIdBinary);
        request.input('suceso', sql.NVarChar, suceso);
        
        const query = `
            INSERT INTO Bitacora (UsuarioID, Sucesos, Fecha)
            VALUES (@usuarioEmail, @suceso, GETDATE())
        `;
        
        await request.query(query);
        console.log('Registro en bitácora exitoso:', suceso);
    } catch (error) {
        console.error('Error al registrar en bitácora:', error);
        // No propagar el error para que no interrumpa la operación principal
    }
}

// Modificar getAllBooks para manejar el caso de email
export async function getAllBooks(usuarioEmail, { genre = null, author = null, editorial = null }) {
        const pool = await db.connect();

        const request = pool.request();
        
        const filtros = [];
        
        if (genre){
            const genreRequest = pool.request()
            
            genreRequest.input('genre', sql.NVarChar, genre);

            const genreQuery = `SELECT DISTINCT LibroID FROM GeneroLibro AS GL
            INNER JOIN Genero AS G ON GL.GeneroID = G.GeneroID
            WHERE G.Nombre = @genre`;
            
            const genreResult = await genreRequest.query(genreQuery);

            const libroIds = genreResult.recordset.map(row => `'${row.LibroID}'`).join(', ');

            if (libroIds.length > 0) {
                filtros.push(`L.LibroID IN (${libroIds})`);
            }
        }
        if (author) {
            filtros.push(`A.Nombre LIKE @author`);
            request.input('author', sql.NVarChar, `%${author}%`);
        }
        if (editorial) {
            filtros.push(`E.Nombre LIKE @editorial`);
            request.input('editorial', sql.NVarChar, `%${editorial}%`);   
        }
        
        let condicion = ``;

        if (filtros.length > 0) {
            condicion = ` WHERE ` + filtros.join(' AND ');
        }

        const query = `
            SELECT 
                L.LibroID, 
                L.Nombre, 
                CONCAT(A.Nombre, ' ', A.Apellido) AS Autor, 
                E.Nombre AS Editorial,
                L.Estado,
                L.Rating,
                LD.Descripcion,
                LD.fecha_publicacion,
                ED.Paginas,
                ED.Idioma
            FROM Libro L
            JOIN Autor A ON L.AutorID = A.AutorID
            JOIN Editorial E ON L.EditorialID = E.EditorialID
            LEFT JOIN LibroDetalle LD ON L.LibroID = LD.LibroID
            LEFT JOIN Edicion ED ON L.LibroID = ED.LibroID
        ${condicion}`;

        const result = await request.query(query);
        
        // Intentar registrar en bitácora, pero capturar errores para que no interrumpan
        if (usuarioEmail) {
            await registrarEnBitácora(usuarioEmail, 'Consulta de los libros');
        }
            
        return result.recordset;
}

// Modificar getBookById para registrar en bitácora
export async function getBookById(id, usuarioEmail) {
    
        const pool = await db.connect();
        
        const request = pool.request();
        request.input('id', sql.UniqueIdentifier, id);
        
        const query = `
            SELECT 
                L.LibroID, 
                L.Nombre, 
                CONCAT(A.Nombre, ' ', A.Apellido) AS Autor, 
                A.AutorID,
                E.Nombre AS Editorial,
                E.EditorialID,
                L.Estado,
                L.Rating,
                LD.Descripcion,
                LD.fecha_publicacion,
                ED.Paginas,
                ED.Idioma
            FROM Libro L
            JOIN Autor A ON L.AutorID = A.AutorID
            JOIN Editorial E ON L.EditorialID = E.EditorialID
            LEFT JOIN LibroDetalle LD ON L.LibroID = LD.LibroID
            LEFT JOIN Edicion ED ON L.LibroID = ED.LibroID
            WHERE L.LibroID = @id
        `;

        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return null;
        }
        
        // Registrar en bitácora
        if (usuarioEmail) {
            await registrarEnBitácora(usuarioEmail, `Consulta del libro: ${result.recordset[0].Nombre}`);
        }
        
        return result.recordset[0];
}

// Modificar createBook para hacerla más robusta
export async function createBook(bookData, usuarioEmail) {
    try {
        
        const pool = await db.connect();

        const transaction = new sql.Transaction(db);
        
        await transaction.begin();
        
        try {
            console.log("Iniciando creación de libro:", bookData.nombre);
            
            // 1. Obtener AutorID
            console.log("Buscando autor:", bookData.autor);
            const autorQuery = `
                SELECT AutorID FROM Autor 
                WHERE CONCAT(Nombre, ' ', Apellido) = @autor
            `;
            const autorRequest = new sql.Request(transaction);
            autorRequest.input('autor', sql.NVarChar, bookData.autor);
            const autorResult = await autorRequest.query(autorQuery);
            
            if (autorResult.recordset.length === 0) {
                throw new Error('Autor no encontrado');
            }
            const autorId = autorResult.recordset[0].AutorID;
            console.log("AutorID encontrado:", autorId);
            
            // 2. Obtener EditorialID
            console.log("Buscando editorial:", bookData.editorial);
            const editorialQuery = `
                SELECT EditorialID FROM Editorial 
                WHERE Nombre = @editorial
            `;
            const editorialRequest = new sql.Request(transaction);
            editorialRequest.input('editorial', sql.NVarChar, bookData.editorial);
            const editorialResult = await editorialRequest.query(editorialQuery);
            
            if (editorialResult.recordset.length === 0) {
                throw new Error('Editorial no encontrada');
            }
            const editorialId = editorialResult.recordset[0].EditorialID;
            console.log("EditorialID encontrado:", editorialId);
            
            // 3. Insertar en la tabla Libro
            console.log("Insertando en tabla Libro");
            const insertLibroQuery = `
                INSERT INTO Libro (Nombre, AutorID, EditorialID, Estado, Rating)
                OUTPUT INSERTED.LibroID
                VALUES (@nombre, @autorId, @editorialId, @estado, @rating)
            `;
            const libroRequest = new sql.Request(transaction);
            libroRequest.input('nombre', sql.NVarChar, bookData.nombre);
            libroRequest.input('autorId', sql.Int, autorId);
            libroRequest.input('editorialId', sql.Int, editorialId);
            libroRequest.input('estado', sql.NVarChar, bookData.estado || 'Disponible');
            libroRequest.input('rating', sql.Numeric(3, 2), bookData.rating || 0);
            
            const libroResult = await libroRequest.query(insertLibroQuery);
            const libroId = libroResult.recordset[0].LibroID;
            console.log("Libro insertado con ID:", libroId);
            
            // 4. Insertar en LibroDetalle
            console.log("Insertando en tabla LibroDetalle");
            const insertDetalleQuery = `
                INSERT INTO LibroDetalle (LibroID, Descripcion, fecha_publicacion)
                VALUES (@libroId, @descripcion, @fechaPublicacion)
            `;
            const detalleRequest = new sql.Request(transaction);
            detalleRequest.input('libroId', sql.UniqueIdentifier, libroId);
            detalleRequest.input('descripcion', sql.NVarChar, bookData.descripcion);
            detalleRequest.input('fechaPublicacion', sql.Date, new Date(bookData.fecha_publicacion));
            
            await detalleRequest.query(insertDetalleQuery);
            
            // 5. Insertar en Edicion
            console.log("Insertando en tabla Edicion");
            const insertEdicionQuery = `
                INSERT INTO Edicion (LibroID, Paginas, Idioma)
                VALUES (@libroId, @paginas, @idioma)
            `;
            const edicionRequest = new sql.Request(transaction);
            edicionRequest.input('libroId', sql.UniqueIdentifier, libroId);
            edicionRequest.input('paginas', sql.Int, bookData.paginas);
            edicionRequest.input('idioma', sql.NVarChar, bookData.idioma);
            
            await edicionRequest.query(insertEdicionQuery);
            
            // 6. Registrar en bitácora (solo si usuarioEmail está disponible y de forma opcional)
            if (usuarioEmail) {
                try {
                    console.log("Registrando en bitácora");
                    // Buscar el ID binario del usuario si se proporciona un email
                    let usuarioIdBinary;
                    
                    if (typeof usuarioEmail === 'string' && usuarioEmail.includes('@')) {
                        const userQuery = await transaction.request()
                            .input('email', sql.NVarChar, usuarioEmail)
                            .query('SELECT UsuarioID FROM Usuarios WHERE Email = @email');
                            
                        if (userQuery.recordset.length > 0) {
                            usuarioIdBinary = userQuery.recordset[0].UsuarioID;
                        } else {
                            console.log('No se encontró usuario con email:', usuarioEmail);
                            // Continuamos sin registrar en bitácora
                        }
                    } else {
                        // Intentar convertir a buffer con la longitud correcta
                        try {
                            if (Buffer.isBuffer(usuarioEmail)) {
                                usuarioIdBinary = usuarioEmail;
                            } else if (typeof usuarioEmail === 'string') {
                                if (usuarioEmail.startsWith('0x')) {
                                    usuarioIdBinary = Buffer.from(usuarioEmail.substring(2), 'hex');
                                } else {
                                    usuarioIdBinary = Buffer.from(usuarioEmail, 'hex');
                                }
                            }
                            
                            if (usuarioIdBinary && usuarioIdBinary.length !== 16) {
                                // Ajustar a 16 bytes
                                const newBuffer = Buffer.alloc(16);
                                usuarioIdBinary.copy(newBuffer, 0, 0, Math.min(usuarioIdBinary.length, 16));
                                usuarioIdBinary = newBuffer;
                            }
                        } catch (bufferError) {
                            console.log('Error al convertir usuarioEmail a buffer:', bufferError);
                            // Continuamos sin registrar en bitácora
                        }
                    }
                    
                    if (usuarioIdBinary) {
                        const bitacoraRequest = new sql.Request(transaction);
                        bitacoraRequest.input('usuarioEmail', sql.Binary(16), usuarioIdBinary);
                        bitacoraRequest.input('suceso', sql.NVarChar, `Creación del libro: ${bookData.nombre}`);
                        
                        await bitacoraRequest.query(`
                            INSERT INTO Bitacora (UsuarioID, Sucesos, Fecha)
                            VALUES (@usuarioEmail, @suceso, GETDATE())
                        `);
                    }
                } catch (bitacoraError) {
                    // Si falla la bitácora, solo lo registramos pero no interrumpimos la transacción
                    console.log('Error al registrar en bitácora, continuando con la transacción:', bitacoraError);
                }
            }
            
            await transaction.commit();
            console.log("Transacción completada con éxito");
            
            // Obtener el libro creado
            return await getBookById(libroId);
            
        } catch (error) {
            console.error("Error durante la transacción:", error);
            if (transaction._aborted) {
                console.log("La transacción ya ha sido abortada");
            } else {
                await transaction.rollback();
                console.log("Transacción cancelada (rollback)");
            }
        }
    } catch (error) {
        console.error('Error al crear libro:', error);
    }
}

// Mejorar updateBookState para mostrar mensaje de eliminación de solicitud
export async function updateBookState(id, estado, usuarioEmail, solicitudId = null) {
    try {
        const pool = await db.connect();

        const transaction = new sql.Transaction(db);
        
        await transaction.begin();
        
        try {
            // Actualizar estado del libro
            const updateRequest = new sql.Request(transaction);
            updateRequest.input('id', sql.UniqueIdentifier, id);
            updateRequest.input('estado', sql.NVarChar, estado);
            
            const updateQuery = `
                UPDATE Libro
                SET Estado = @estado
                OUTPUT INSERTED.*
                WHERE LibroID = @id
            `;
            
            const result = await updateRequest.query(updateQuery);
            
            if (result.recordset.length === 0) {
                await transaction.rollback();
                return { success: false, message: "Libro no encontrado" };
            }
            
            let solicitudEliminada = false;
            
            // Si hay una solicitud, eliminarla
            if (solicitudId) {
                const deleteSolicitudRequest = new sql.Request(transaction);
                deleteSolicitudRequest.input('solicitudId', sql.Int, solicitudId);
                
                const deleteResult = await deleteSolicitudRequest.query(`
                    DELETE FROM Solicitud WHERE SolicitudID = @solicitudId
                `);
                
                solicitudEliminada = deleteResult.rowsAffected[0] > 0;
            }
            
            // Registrar en bitácora
            if (usuarioEmail) {
                const bitacoraRequest = new sql.Request(transaction);
                
                // Convertir el ID de usuario a formato binario si es necesario
                let usuarioIdBinary;
                if (typeof usuarioEmail === 'string' && usuarioEmail.match(/^[0-9a-fA-F]+$/)) {
                    // Es un string hexadecimal, conviértelo a Buffer
                    const normalizedHex = usuarioEmail.replace(/^0x/, '').padStart(32, '0').substring(0, 32);
                    usuarioIdBinary = Buffer.from(normalizedHex, 'hex');
                } else if (typeof usuarioEmail === 'string' && usuarioEmail.includes('@')) {
                    // Es un email, buscar el ID real
                    const userQuery = await pool.request()
                        .input('email', sql.NVarChar, usuarioEmail)
                        .query('SELECT UsuarioID FROM Usuarios WHERE Email = @email');
                        
                    if (userQuery.recordset.length > 0) {
                        usuarioIdBinary = userQuery.recordset[0].UsuarioID;
                    }
                } else {
                    // Ya es un Buffer o un valor binario
                    usuarioIdBinary = usuarioEmail;
                }
                
                if (usuarioIdBinary) {
                    bitacoraRequest.input('usuarioEmail', sql.Binary(16), usuarioIdBinary);
                    bitacoraRequest.input('suceso', sql.NVarChar, `Actualización del estado del libro ID ${id} a "${estado}"`);
                    
                    await bitacoraRequest.query(`
                        INSERT INTO Bitacora (UsuarioID, Sucesos, Fecha)
                        VALUES (@usuarioEmail, @suceso, GETDATE())
                    `);
                }
            }
            
            await transaction.commit();
            
            const libro = await getBookById(id);
            return { 
                success: true, 
                libro, 
                message: "Estado actualizado correctamente", 
                solicitudEliminada,
                solicitudId: solicitudEliminada ? solicitudId : null
            };
        } catch (error) {
            console.error("Error durante la transacción:", error);
            if (!transaction._aborted) {
                await transaction.rollback();
            }
        }
    } catch (error) {
        console.error('Error al actualizar estado del libro:', error);
    }
}

// Modificar requestBook para que NO cambie el estado del libro
export async function requestBook(id, usuarioEmail) {
        const pool = await db.connect();

        const transaction = new sql.Transaction(db);
        
        await transaction.begin();
        
        try {
            // Verificar si el libro existe
            const checkRequest = new sql.Request(transaction);
            checkRequest.input('id', sql.UniqueIdentifier, id);
            
            const checkQuery = `
                SELECT LibroID, Nombre, Estado FROM Libro 
                WHERE LibroID = @id
            `;
            const checkResult = await checkRequest.query(checkQuery);
            
            if (checkResult.recordset.length === 0) {
                await transaction.rollback();
                return { success: false, message: "Libro no encontrado" };
            }
            
            const nombreLibro = checkResult.recordset[0].Nombre;
            const estadoActual = checkResult.recordset[0].Estado;
            
            // Verificar si el libro está disponible
            if (estadoActual !== 'Disponible') {
                await transaction.rollback();
                return { success: false, message: "El libro no está disponible actualmente" };
            }
            
            // Convertir el ID de usuario a formato binario si viene en formato hexadecimal
            let usuarioIdBinary;
            if (typeof usuarioEmail === 'string' && usuarioEmail.match(/^[0-9a-fA-F]+$/)) {
                // Es un string hexadecimal, conviértelo a Buffer
                const normalizedHex = usuarioEmail.replace(/^0x/, '').padStart(32, '0').substring(0, 32);
                usuarioIdBinary = Buffer.from(normalizedHex, 'hex');
            } else {
                // Ya es un Buffer o un valor binario
                usuarioIdBinary = usuarioEmail;
            }
            
            // Insertar en la tabla Solicitud
            const solicitudRequest = new sql.Request(transaction);
            solicitudRequest.input('usuarioEmail', sql.Binary(16), usuarioIdBinary);
            solicitudRequest.input('libroId', sql.UniqueIdentifier, id);
            
            const solicitudQuery = `
                INSERT INTO Solicitud (UsuarioID, LibroID, FechaSolicitud)
                OUTPUT INSERTED.SolicitudID
                VALUES (@usuarioEmail, @libroId, GETDATE())
            `;
            const solicitudResult = await solicitudRequest.query(solicitudQuery);
            const solicitudId = solicitudResult.recordset[0].SolicitudID;
            
            // Registrar en Bitacora
            const bitacoraRequest = new sql.Request(transaction);
            bitacoraRequest.input('usuarioEmail', sql.Binary(16), usuarioIdBinary);
            bitacoraRequest.input('suceso', sql.NVarChar, `Solicitud del libro: ${nombreLibro} (ID: ${id})`);
            
            const bitacoraQuery = `
                INSERT INTO Bitacora (UsuarioID, Sucesos, Fecha)
                VALUES (@usuarioEmail, @suceso, GETDATE())
            `;
            await bitacoraRequest.query(bitacoraQuery);
            
            await transaction.commit();
            
            // Devolver el resultado exitoso con el ID de solicitud
            return { 
                success: true, 
                message: "Solicitud registrada correctamente", 
                solicitudId,
                nombreLibro,
                libroId: id
            };
            
        } catch (error) {
            console.error("Error durante la transacción:", error);
            if (!transaction._aborted) {
                await transaction.rollback();
            }
        }

}

// Función para obtener todas las solicitudes (solo para administradores)
export async function getAllSolicitudes() {
        const pool = await db.connect();
        
        const query = `
            SELECT 
                S.SolicitudID,
                S.FechaSolicitud,
                L.LibroID,
                L.Nombre AS NombreLibro,
                L.Estado AS EstadoLibro,
                CONCAT(A.Nombre, ' ', A.Apellido) AS Autor,
                U.UsuarioID,
                U.Nombre AS NombreUsuario,
                U.Email
            FROM Solicitud S
            JOIN Libro L ON S.LibroID = L.LibroID
            JOIN Autor A ON L.AutorID = A.AutorID
            JOIN Usuarios U ON S.UsuarioID = U.UsuarioID
            ORDER BY S.FechaSolicitud DESC
        `;

        const result = await pool.request().query(query);
        
        // Convertir UsuarioID a formato hexadecimal para facilitar su uso
        const solicitudes = result.recordset.map(solicitud => ({
            ...solicitud,
            UsuarioID: Buffer.isBuffer(solicitud.UsuarioID) 
                ? solicitud.UsuarioID.toString('hex').toUpperCase() 
                : solicitud.UsuarioID
        }));
        
        return solicitudes;
}

export async function deleteBook(id, usuarioEmail) {

    const pool = await db.connect();

    const request = pool.request()

    request.input('id', sql.UniqueIdentifier, id);
    
    const result = await request.query(`
        SELECT LibroID FROM Libro WHERE LibroID = @id
        `)

    // Verificar si el libro existe
    if (result.recordset.length === 0) {
        return false;
    }
    
    // Registrar en bitácora
    if (usuarioEmail) {
        await registrarEnBitácora(usuarioEmail, `Se ha eliminado el libro con id: ${result.recordset[0].LibroID}`);
    }

    const pool2 = await db.connect();

    const request2 = pool2.request()

    request2.input('id', sql.UniqueIdentifier, id);

    const query = `
        DELETE FROM Edicion
        WHERE LibroID = @id;
        DELETE FROM LibroDetalle
        WHERE LibroID = @id;
        DELETE FROM GeneroLibro
        WHERE LibroID = @id;
        DELETE FROM Libro
        WHERE LibroID = @id;
    `;

    const result2 = await request2.query(query);

    return true;
}