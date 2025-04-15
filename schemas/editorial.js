import { z } from "zod";

export const editorialSchema = z.object({
    "nombre": z.string({
        required_error: "El nombre de la editorial es obligatorio."
    }).min(3, {
        message: "El nombre debe tener al menos 3 caracteres."
    }),
    "pais": z.string({
        required_error: "El país de la editorial es obligatorio."
    }).min(4, {
        message: "El país debe tener al menos 4 caracteres."
    }),
})

// Validar editorial de forma completa
export const validateEditorial = (data) => editorialSchema.safeParse(data);