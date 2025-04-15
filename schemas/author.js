import { z } from "zod";

export const authorSchema = z.object({
    "nombre": z.string({
        required_error: "El nombre del autor es obligatorio."
    }).min(3, {
        message: "El nombre debe tener al menos 3 caracteres."
    }),
    "apellido": z.string({
        required_error: "El apellido del autor es obligatorio."
    }).min(3, {
        message: "El apellido debe tener al menos 3 caracteres."
    }),
    "fecha_nacimiento": z.string().date(),
    "nacionalidad": z.string().length(3,{
        message: "La nacionalidad debe tener exactamente 3 caracteres. (EJEMPLO: COL, ARG...)"
    }),
})

// Validar autor de forma completa
export const validateAuthor = (data) => authorSchema.safeParse(data);
