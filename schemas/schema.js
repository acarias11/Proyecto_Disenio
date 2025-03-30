import { z } from 'zod'

export const bookSchema = z.object({
    "nombre": z.string({
        required_error: "El nombre es obligatorio."
    }).min(6).max(100),
    "autor": z.string.min(6).max(200),
    "editorial": z.string({
        required_error: "El nombre de la editorial es obligatorio."
    }).min(3).max(100),
    "estado": z.enum(['Disponible','Prestado']),
    "paginas": z.int({
        required_error: "El numero de páginas es obligatorio."
    }),
    "idioma": z.string({
        required_error: "El idioma del libro es obligatorio."
    }),
    "descripcion": z.string({
        required_error: "La descripción del libro es obligatorio."
    }).min(8).max(300),
    "fecha_publicacion": z.date()
})

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
    "rol": z.enum(['Admin','User'])
})

// Validar libros de forma completa o parcial
export const validateBook = (data) => bookSchema.safeParse(data);
export const validateBookPartial = (data) => bookSchema.partial().safeParse(data);

// Validar usuario de forma completa 
export const validateUser = (data) => userSchema.safeParse(data);