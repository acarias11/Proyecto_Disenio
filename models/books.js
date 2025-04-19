import sql from 'mssql';
import db from '../config/database.js';


// Reemplazar la función registrarEnBitácora actual con esta versión corregida
export async function registrarEnBitácora(usuarioId, suceso) {
    try {
        // CORRECCIÓN: Reemplazar la línea problemática con la conexión correcta
        const pool = await db.connect();
        const request = pool.request();
        
        // Si no hay usuarioId, no registramos en bitácora
        if (!usuarioId) {
            console.log('No se registró en bitácora: usuarioId no proporcionado');
            return;
        }

        // Si usuarioId es un email, buscar el ID real del usuario
        if (typeof usuarioId === 'string' && usuarioId.includes('@')) {
            const userQuery = await pool.request()
                .input('email', sql.NVarChar, usuarioId)
                .query('SELECT UsuarioID FROM Usuarios WHERE Email = @email');
                
            if (userQuery.recordset.length > 0) {
                usuarioId = userQuery.recordset[0].UsuarioID;
            } else {
                console.log(`No se encontró usuario con email: ${usuarioId}`);
                return;
            }
        }
        
        // Convertir el ID de usuario al formato binario correcto
        let usuarioIdBinary;
        
        if (Buffer.isBuffer(usuarioId)) {
            // Ya es un Buffer, asegurar que sea de 16 bytes
            usuarioIdBinary = usuarioId.length === 16 ? usuarioId : Buffer.alloc(16).fill(usuarioId, 0, Math.min(16, usuarioId.length));
        } 
        else if (typeof usuarioId === 'string') {
            if (usuarioId.match(/^[0-9a-fA-F]+$/)) {
                // Es hexadecimal, normalizar a 32 caracteres (16 bytes)
                const normalizedHex = usuarioId.padStart(32, '0').substring(0, 32);
                usuarioIdBinary = Buffer.from(normalizedHex, 'hex');
            } 
            else {
                // No es hexadecimal, convertir a buffer de 16 bytes
                usuarioIdBinary = Buffer.alloc(16).fill(usuarioId, 0, Math.min(16, usuarioId.length));
            }
        } 
        else {
            // Otro tipo, convertir a string y luego a buffer
            const strValue = String(usuarioId);
            usuarioIdBinary = Buffer.alloc(16).fill(strValue, 0, Math.min(16, strValue.length));
        }
        
        // Verificar que el buffer sea válido y tenga la longitud correcta
        if (!Buffer.isBuffer(usuarioIdBinary) || usuarioIdBinary.length !== 16) {
            console.error('Error: Buffer inválido para usuarioId:', usuarioIdBinary);
            return;
        }

        request.input('usuarioId', sql.Binary(16), usuarioIdBinary);
        request.input('suceso', sql.NVarChar, suceso);
        
        const query = `
            INSERT INTO Bitacora (UsuarioID, Sucesos, Fecha)
            VALUES (@usuarioId, @suceso, GETDATE())
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

        // Agregar generos a los libros
        const result2 = pool.request()

        for (let i = 0; i < result.recordset.length; i++) {
            const libroId = result.recordset[i].LibroID;
            const generoQuery = `SELECT G.Nombre FROM GeneroLibro AS GL
            INNER JOIN Genero AS G ON GL.GeneroID = G.GeneroID
            WHERE GL.LibroID = @libroId${i}`;
            
            result2.input(`libroId${i}`, sql.UniqueIdentifier, libroId);
            
            const generoResult = await result2.query(generoQuery);
            
            const generos = generoResult.recordset.map(row => row.Nombre).join(', ');
            
            result.recordset[i].Generos = generos;
        }

        
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
        
        // Agregar generos al libro
        const result2 = pool.request()

        const libroId = result.recordset[0].LibroID;
        const generoQuery = `SELECT G.Nombre FROM GeneroLibro AS GL
        INNER JOIN Genero AS G ON GL.GeneroID = G.GeneroID
        WHERE GL.LibroID = @libroId`;
        
        result2.input(`libroId`, sql.UniqueIdentifier, libroId);
            
        const generoResult = await result2.query(generoQuery);
            
        const generos = generoResult.recordset.map(row => row.Nombre).join(', ');
            
        result.recordset[0].Generos = generos;

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

//Ruta para editar libros especificos 
export async function updateBookPartial (id, bookData, usuarioEmail) {
    try {
        const pool = await db.connect();
        const transaction = new sql.Transaction(db);

        await transaction.begin();

        try {
            // Verificar si el libro existe
            const checkRequest = new sql.Request(transaction);
            checkRequest.input('id', sql.UniqueIdentifier, id);

            const checkQuery = `
                SELECT LibroID FROM Libro 
                WHERE LibroID = @id
            `;
            const checkResult = await checkRequest.query(checkQuery);

            if (checkResult.recordset.length === 0) {
                await transaction.rollback();
                return { success: false, message: "Libro no encontrado" };
            }

            // Construir dinámicamente la consulta de actualización
            const fieldsToUpdate = [];
            const updateRequest = new sql.Request(transaction);

            if (bookData.nombre) {
                fieldsToUpdate.push("Nombre = @nombre");
                updateRequest.input('nombre', sql.NVarChar, bookData.nombre);
            }
            if (bookData.rating) {
                fieldsToUpdate.push("Rating = @rating");
                updateRequest.input('rating', sql.Numeric(3, 2), bookData.rating);
            }
            if (bookData.autorId) {
                fieldsToUpdate.push("AutorID = @autorId");
                updateRequest.input('autorId', sql.Int, bookData.autorId);
            }
            if (bookData.editorialId) {
                fieldsToUpdate.push("EditorialID = @editorialId");
                updateRequest.input('editorialId', sql.Int, bookData.editorialId);
            }

            // Si no hay campos para actualizar, devolver un mensaje
            if (fieldsToUpdate.length === 0) {
                await transaction.rollback();
                return { success: false, message: "No hay campos válidos para actualizar" };
            }

            // Agregar el ID del libro
            updateRequest.input('id', sql.UniqueIdentifier, id);

            const updateQuery = `
                UPDATE Libro
                SET ${fieldsToUpdate.join(", ")}
                WHERE LibroID = @id
            `;

            await updateRequest.query(updateQuery);

            // Registrar en bitácora
            if (usuarioEmail) {
                await registrarEnBitácora(usuarioEmail, `Actualización del libro ID ${id}`);
            }

            await transaction.commit();
            console.log("Libro actualizado correctamente");

            // Retornar el libro actualizado
            const updatedBook = await getBookById(id);

            return { success: true, libro: updatedBook };
        } catch (error) {
            console.error('Error durante la transacción:', error);
            if (!transaction._aborted) {
                await transaction.rollback();
            }
        }
    } catch (error) {
        console.error('Error al actualizar libro:', error);
    }
}

// Modificar request para aceptar nombreUsuario en lugar de ID
export async function request(id, usuarioEmail) {
    try {
        console.log(`Procesando solicitud: Libro ${id}, Usuario por email ${usuarioEmail}`);
        const pool = await db.connect();
        const transaction = new sql.Transaction(pool);

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

            // Buscar el usuario por su email (que viene del token)
            const buscarUsuarioRequest = new sql.Request(transaction);
            buscarUsuarioRequest.input('email', sql.NVarChar, usuarioEmail);
            
            const buscarUsuarioQuery = `
                SELECT UsuarioID, Nombre, Email 
                FROM Usuarios 
                WHERE Email = @email
            `;
            
            const usuarioResult = await buscarUsuarioRequest.query(buscarUsuarioQuery);
            
            if (usuarioResult.recordset.length === 0) {
                await transaction.rollback();
                return { success: false, message: "Usuario no encontrado" };
            }
            
            const usuarioInfo = usuarioResult.recordset[0];
            const usuarioId = usuarioInfo.UsuarioID;

            // Insertar en la tabla Solicitud con el ID del usuario autenticado
            const solicitudRequest = new sql.Request(transaction);
            solicitudRequest.input('usuarioId', sql.Binary(16), usuarioId);
            solicitudRequest.input('libroId', sql.UniqueIdentifier, id);
            solicitudRequest.input('estado', sql.NVarChar, 'Pendiente');

            const solicitudQuery = `
                INSERT INTO Solicitud (UsuarioID, LibroID, Estado, FechaSolicitud)
                OUTPUT INSERTED.SolicitudID
                VALUES (@usuarioId, @libroId, @estado, GETDATE())
            `;
            const solicitudResult = await solicitudRequest.query(solicitudQuery);
            const solicitudId = solicitudResult.recordset[0].SolicitudID;

            // Actualizar estado del libro a "Prestado"
            const updateRequest = new sql.Request(transaction);
            updateRequest.input('libroId', sql.UniqueIdentifier, id);
            await updateRequest.query(`
                UPDATE Libro 
                SET Estado = 'Prestado' 
                WHERE LibroID = @libroId
            `);

            // Registrar en Bitácora
            await registrarEnBitácora(
                usuarioEmail,
                `Solicitud del libro "${nombreLibro}"`
            );

            await transaction.commit();

            // Devolver el resultado exitoso
            return {
                success: true, 
                data: { 
                    message: "Solicitud registrada correctamente", 
                    solicitudId,
                    nombreLibro,
                    libroId: id,
                    usuario: usuarioInfo.Nombre
                }
            };

        } catch (error) {
            console.error("Error durante la transacción:", error);
            if (!transaction._aborted) {
                await transaction.rollback();
            }
            return { 
                success: false, 
                message: "Error al registrar la solicitud", 
                error: error.message 
            };
        }
    } catch (error) {
        console.error('Error al solicitar libro:', error);
        return { 
            success: false, 
            message: "Error al conectar con la base de datos", 
            error: error.message 
        };
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
                U.Email,
                S.Estado AS EstadoSolicitud
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

// Función para eliminar un libro
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
    DELETE FROM Solicitud
    WHERE LibroID = @id;
    DELETE FROM Libro
    WHERE LibroID = @id;
    `;
    
    const result2 = await request2.query(query);
    
    // Registrar en bitácora
    if (usuarioEmail) {
        await registrarEnBitácora(usuarioEmail, `Se ha eliminado el libro con id: ${result.recordset[0].LibroID}`);
    }

    return true;
}

// Funcion para crear un autor
export async function createAuthor(author, usuarioEmail){

    const pool = await db.connect()

    const request = pool.request()

    request.input('nombre', sql.NVarChar, author.nombre)
    request.input('apellido', sql.NVarChar, author.apellido)
    request.input('nacionalidad', sql.VarChar(3), author.nacionalidad)
    request.input('fecha_nacimiento', sql.Date, author.fecha_nacimiento)
    
    const query = `
    INSERT INTO Autor (Nombre, Apellido, fecha_nacimiento, Nacionalidad)
    VALUES (@nombre, @apellido, @fecha_nacimiento, @nacionalidad)
    `
    const result = await request.query(query)

    // Registrar en bitácora
    await registrarEnBitácora(usuarioEmail, `Se ha creado el autor: ${author.nombre} ${author.apellido}`);
    
    return true
}

// Función para crear una editorial
export async function createEditorial(editorialData, usuarioEmail){

    const pool = await db.connect()

    const request = pool.request()

    request.input('nombre', sql.NVarChar, editorialData.nombre)
    request.input('pais', sql.NVarChar, editorialData.pais)

    const query = `
    INSERT INTO Editorial (Nombre, Pais)
    VALUES (@nombre, @pais)
    `

    const result = await request.query(query)

    // Registrar en bitácora
    await registrarEnBitácora(usuarioEmail, `Se ha creado la editorial: ${editorialData.nombre}`);

    return true
}

// Funcion para verificar si el autor existe
export async function authorExists(authorName) {
    const pool = await db.connect()

    const request = pool.request()

    let [nombre, ...apellido] = authorName.split(' ')

    if (typeof apellido !== 'string') {
        apellido = apellido.join(' ')   
    }

    request.input('nombre', sql.NVarChar, nombre)
    request.input('apellido', sql.NVarChar, apellido)

    const query = `
    SELECT AutorID FROM Autor WHERE Nombre LIKE @nombre AND Apellido LIKE @apellido`

    const result = await request.query(query)

    return result.recordset[0]
}

// Funcion para verificar si la editorial existe
export async function editorialExists(editorial) {
    const pool = await db.connect()

    const request = pool.request()

    request.input('nombre', sql.NVarChar, editorial)

    const query = `
    SELECT EditorialID FROM Editorial WHERE Nombre LIKE @nombre`

    const result = await request.query(query)

    return result.recordset[0]
}

// Nueva función completamente independiente
export async function updateBookState(solicitudId, estado, usuarioEmail, libroID) {

        console.log(`Iniciando actualización para solicitud ${solicitudId} a estado ${estado}`);
        
        // Conectar a la base de datos
        const pool = await db.connect();
        
        // Datos del libro y la solicitud
        let solicitudInfo, libroInfo;
        
        // Si se proporcionó un libroID, lo usamos directamente
        if (libroID) {
            console.log(`Usando libroID proporcionado: ${libroID}`);
            
            // 1. Verificar si la solicitud existe
            const checkSolicitud = await pool.request()
                .input('solicitudNum', sql.Int, solicitudId)
                .query('SELECT Estado FROM Solicitud WHERE SolicitudID = @solicitudNum');
                
            if (checkSolicitud.recordset.length === 0) {
                return { success: false, message: "Solicitud no encontrada" };
            }
            
            // 2. Obtener información del libro usando el libroID proporcionado
            const libroResult = await pool.request()
                .input('libroIdDirecto', sql.UniqueIdentifier, libroID) 
                .query(`
                    SELECT Nombre, Estado 
                    FROM Libro 
                    WHERE LibroID = @libroIdDirecto
                `);
                
            if (libroResult.recordset.length === 0) {
                return { success: false, message: "Libro no encontrado" };
            }
            
            libroInfo = libroResult.recordset[0];
            
            // 3. Ejecutar actualización directa del libro (sin usar parámetro UniqueIdentifier)
            await pool.request()
                .input('nuevoEstado', sql.NVarChar, estado)
                .input('libroIdTexto', sql.UniqueIdentifier, libroID)
                .query(`
                    UPDATE Libro
                    SET Estado = @nuevoEstado
                    WHERE LibroID = @libroIdTexto 
                `);
        } 
        else {
            console.log(`Buscando información de la solicitud ID: ${solicitudId}`);
    
            // 1. Obtener información de la solicitud incluyendo el LibroID
            const solicitudResult = await pool.request()
                .input('solicitudNum', sql.Int, solicitudId)
                .query(`
                    SELECT S.SolicitudID AS SolicitudID, S.LibroID AS LibroID, S.Estado AS EstadoSolicitud, 
                           L.Nombre AS Nombre, L.Estado AS EstadoLibro
                    FROM Solicitud S
                    JOIN Libro L ON S.LibroID = L.LibroID
                    WHERE S.SolicitudID = @solicitudNum
                `);
            

            if (solicitudResult.recordset.length === 0) {
                return { success: false, message: "Solicitud no encontrada" };
            }
            
            // 2. Obtener datos de la solicitud y del libro
            solicitudInfo = solicitudResult.recordset[0];
            libroInfo = {...solicitudInfo};
            
            // 3. Ejecutar actualización del libro usando el LibroID obtenido de la solicitud
            // Convertir el GUID a string para evitar problemas con el parámetro
            const solicitudLibroID = solicitudInfo.LibroID;
            
            console.log(`Actualizando libro ID ${solicitudLibroID} a estado ${estado}`);
            
            await pool.request()
                .input('nuevoEstado', sql.NVarChar, estado)
                .input('libroId', sql.UniqueIdentifier, solicitudLibroID)
                .query(`
                    UPDATE Libro
                    SET Estado = @nuevoEstado
                    WHERE LibroID = @libroId
                `);
        }
        
        // Actualizar la solicitud
        await pool.request()
            .input('solicitudNum', sql.Int, solicitudId)
            .query(`
                UPDATE Solicitud
                SET Estado = 'Completado'
                WHERE SolicitudID = @solicitudNum
            `);
            
        // Registrar en bitácora
        await registrarEnBitácora(usuarioEmail, `Actualización del libro "${libroInfo.Nombre}" de estado "${libroInfo.Estado}" a "${estado}"`);
        
        return { success: true, data: {
            solicitudId: solicitudId,
            libroId: libroID,
            nombreLibro: libroInfo.Nombre,
            estadoAnterior: libroInfo.Estado,
            nuevoEstado: estado
        } };
}

export async function updateBookComplete(libro, usuarioEmail){

    const pool = await db.connect();

    const request = pool.request()

    request.input('libroId', sql.UniqueIdentifier, libro.libroId)
    request.input('nombre', sql.NVarChar, libro.nombre)
    request.input('autorId', sql.Int, libro.autorId)
    request.input('editorialId', sql.Int, libro.editorialId)
    request.input('rating', sql.Numeric(3, 2), libro.rating)
    request.input('descripcion', sql.NVarChar, libro.descripcion)
    request.input('fecha_publicacion', sql.Date, libro.fecha_publicacion)
    request.input('paginas', sql.Int, libro.paginas)
    request.input('idioma', sql.NVarChar, libro.idioma)

    const query = `
    UPDATE Libro SET Nombre = @nombre, AutorID = @autorId, EditorialID = @editorialId, Rating = @rating WHERE LibroID = @libroId;
    UPDATE Edicion SET Paginas = @paginas, Idioma = @idioma WHERE LibroID = @libroId;
    UPDATE LibroDetalle SET Descripcion = @descripcion, fecha_publicacion = @fecha_publicacion WHERE LibroID = @libroId;`

    const result = await request.query(query);

    const deleteGenerosQuery = `DELETE FROM GeneroLibro WHERE LibroID = @libroId`;
    
    // Eliminar generos antiguos
    await pool.request().input('libroId', sql.UniqueIdentifier, libro.libroId).query(deleteGenerosQuery);
    
    // Actualizar generos
    const generos = libro.generos;

    const request2 = pool.request();

    request2.input('libroId', sql.UniqueIdentifier, libro.libroId);
    
    for (let i = 0; i < generos.length; i++) {
        
        const genero = generos[i];
        request2.input(`genero${i}`, sql.NVarChar, genero);

        const insertGeneroQuery = `
            INSERT INTO GeneroLibro (LibroID, GeneroID)
            VALUES (@libroId, (SELECT GeneroID FROM Genero WHERE Nombre = @genero${i}))
        `;

        await request2.query(insertGeneroQuery); 
    }
    
    // Registrar en bitácora
    await registrarEnBitácora(usuarioEmail, `Actualización completa del libro: ${libro.nombre}`);

    return true
}