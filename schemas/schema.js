import { z } from 'zod';

export const bookSchema = z.object({
    "nombre": z.string({
        required_error: "El nombre es obligatorio."
    }).min(6, {
        message: "El nombre debe tener al menos 6 caracteres."
    }).max(100, {
        message: "El nombre no puede exceder los 100 caracteres."
    }),
    "autor": z.string().min(6, {
        message: "El nombre del autor debe tener al menos 6 caracteres."
    }).max(200, {
        message: "El nombre del autor no puede exceder los 200 caracteres."
    }),
    "editorial": z.string({
        required_error: "El nombre de la editorial es obligatorio."
    }).min(3, {
        message: "El nombre de la editorial debe tener al menos 3 caracteres."
    }).max(100, {
        message: "El nombre de la editorial no puede exceder los 100 caracteres."
    }),
    "estado": z.enum(['Disponible', 'Prestado']),
    "paginas": z.number({
        required_error: "El número de páginas es obligatorio."
    }).int({
        message: "El número de páginas debe ser un número entero."
    }).positive({
        message: "El número de páginas debe ser mayor que 0."
    }), 
    "idioma": z.string({
        required_error: "El idioma del libro es obligatorio."
    }),
    "descripcion": z.string({
        required_error: "La descripción del libro es obligatoria."
    }).min(8, {
        message: "La descripción debe tener al menos 8 caracteres."
    }).max(300, {
        message: "La descripción no puede exceder los 300 caracteres."
    }),
    "fecha_publicacion": z.preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        required_error: "La fecha de publicación es obligatoria."
    })),
    "rating": z.number().gte(0, {
        message: "El rating debe ser mayor o igual a 0."
    }).lte(5, {
        message: "El rating debe ser menor o igual a 5."
    }).optional()
    // ,"generos": z.array(z.string(), {
    //     required_error: "Los géneros son obligatorios."
    // }).min(1, {
    //     message: "Debes seleccionar al menos un género."
    // })
});

export const userSchema = z.object({
    "nombre": z.string({
        required_error: "El nombre del usuario es obligatorio."
    }).min(3, {
        message: "El nombre debe tener al menos 3 caracteres."
    }).max(100),
    "password": z.string({
        required_error: "La contraseña es obligatoria."
    }).min(5, {
        message: "La contraseña debe tener al menos 5 caracteres."
    }),
    "email": z.string({
        required_error: "El email es obligatorio."
    }).email({
        invalid_type_error: "El email no es válido."
    }),
    "rol": z.enum(['Admin', 'User'], )
});

// Validar libros de forma completa o parcial
export const validateBook = (data) => bookSchema.safeParse(data);
export const validateBookPartial = (data) => bookSchema.partial().safeParse(data);

// Validar usuario de forma completa 
export const validateUser = (data) => userSchema.safeParse(data);
export const validateUserPartial = (data) => userSchema.partial().safeParse(data);