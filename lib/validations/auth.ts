import { z } from "zod";

// Password rules: ≥8 chars, upper + lower + digit + special
const passwordSchema = z
  .string()
  .min(8, "La password deve contenere almeno 8 caratteri")
  .regex(/[A-Z]/, "La password deve contenere almeno una lettera maiuscola")
  .regex(/[a-z]/, "La password deve contenere almeno una lettera minuscola")
  .regex(/\d/, "La password deve contenere almeno un numero")
  .regex(/[^A-Za-z0-9]/, "La password deve contenere almeno un carattere speciale");

export const registerSchema = z.object({
  email: z
    .string()
    .email("Email non valida")
    .max(254, "Email troppo lunga")
    .transform((e) => e.toLowerCase().trim()),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Email non valida")
    .transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1, "Password obbligatoria"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
