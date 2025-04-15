import { z } from "zod";

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

// Validar usuario de forma completa 
export const validateUser = (data) => userSchema.safeParse(data);
export const validateUserPartial = (data) => userSchema.partial().safeParse(data);