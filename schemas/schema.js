import { z } from 'zod';

export const bookSchema = z.object({
    "nombre": z.string({
        required_error: "El nombre es obligatorio."
    }).min(6).max(100),
    "autor": z.string().min(6).max(200),
    "editorial": z.string({
        required_error: "El nombre de la editorial es obligatorio."
    }).min(3).max(100),
    "estado": z.enum(['Disponible', 'Prestado']),
    "paginas": z.number({
        required_error: "El número de páginas es obligatorio."
    }).int(), // Asegura que sea un número entero
    "idioma": z.string({
        required_error: "El idioma del libro es obligatorio."
    }),
    "descripcion": z.string({
        required_error: "La descripción del libro es obligatoria."
    }).min(8).max(300),
    "fecha_publicacion": z.preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) {
            return new Date(arg);
        }
        return arg;
    }, z.date({
        required_error: "La fecha de publicación es obligatoria."
    }))
});

export const userSchema = z.object({
    "nombre": z.string({
        required_error: "El nombre del usuario es obligatorio."
    }).min(3).max(100),
    "password": z.string({
        required_error: "La contraseña es obligatoria."
    }).min(5),
    "email": z.string({
        required_error: "El email es obligatorio."
    }).email({
        invalid_type_error: "El email no es válido."
    }),
    "rol": z.enum(['Admin', 'User'])
});

// Validar libros de forma completa o parcial
export const validateBook = (data) => bookSchema.safeParse(data);
export const validateBookPartial = (data) => bookSchema.partial().safeParse(data);

// Validar usuario de forma completa 
export const validateUser = (data) => userSchema.safeParse(data);