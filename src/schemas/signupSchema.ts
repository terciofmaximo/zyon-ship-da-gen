import { z } from "zod";

const BLOCKED_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "bol.com.br",
  "uol.com.br",
];

export const signupSchema = z.object({
  fullName: z.string().trim().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .refine((email) => {
      const domain = email.split("@")[1]?.toLowerCase();
      return !BLOCKED_DOMAINS.includes(domain);
    }, "Use um email corporativo. Emails pessoais não são permitidos."),
  companyName: z.string().trim().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, "CNPJ inválido. Use formato: XX.XXX.XXX/XXXX-XX"),
  companyType: z.enum(["Armador", "Agente", "Broker"]),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type SignupData = z.infer<typeof signupSchema>;
