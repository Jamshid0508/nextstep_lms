import { z } from 'zod';

export const loginSchema = z.object({
  login: z.string().min(3, "Login (telefon yoki email) kiritilishi shart"),
  password: z.string().min(6, "Parol kamida 6 belgidan iborat bo'lishi kerak"),
});

export const forgotPasswordSchema = z.object({
  login: z.string().min(3),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});
