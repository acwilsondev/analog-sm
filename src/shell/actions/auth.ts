'use server';

import prisma from "@/shell/db/client";
import { hashPassword } from "@/core/auth";
import { ActionResult } from "@/core/types";
import { z } from "zod";
import { USERNAME_MAX_LENGTH } from "@/core/validation";

const RegisterSchema = z.object({
  username: z.string().min(3).max(USERNAME_MAX_LENGTH),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function registerAction(
  formData: FormData
): Promise<ActionResult<void>> {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validation = RegisterSchema.safeParse({ username, email, password });
  if (!validation.success) {
    return { success: false, error: "Validation failed", fieldErrors: validation.error.flatten().fieldErrors };
  }

  try {
    const regSetting = await prisma.globalSetting.findUnique({ where: { key: 'registrations_open' } });
    if (regSetting?.value === 'false') {
      return { success: false, error: 'Registrations are currently closed' };
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: validation.data.email }, { username: validation.data.username }] },
    });

    if (existing) {
      return { success: false, error: "User already exists" };
    }

    const passwordHash = await hashPassword(validation.data.password);

    await prisma.user.create({
      data: {
        username: validation.data.username,
        email: validation.data.email,
        passwordHash,
      },
    });

    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: "Registration failed" };
  }
}
