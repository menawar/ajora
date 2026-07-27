import { z } from "zod";

export const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address format");

export const ContributedEventSchema = z.object({
  user: AddressSchema,
  periodId: z.bigint().nonnegative(),
  amount: z.bigint().positive(),
  ticketsMinted: z.bigint().nonnegative(),
});

export const NumberPickedEventSchema = z.object({
  user: AddressSchema,
  periodId: z.bigint().nonnegative(),
  number: z.number().int().min(0).max(9),
  weight: z.bigint().nonnegative(),
});

export const DrawResolvedEventSchema = z.object({
  periodId: z.bigint().nonnegative(),
  winningNumber: z.number().int().min(0).max(9),
  seed: z.string(),
  pot: z.bigint().nonnegative(),
  totalWinningWeight: z.bigint().nonnegative(),
});

export const CrewCreatedEventSchema = z.object({
  crewId: z.string().min(1),
  founder: AddressSchema,
  code: z.string().min(1),
});

export function validateEventPayload<T>(schema: z.ZodSchema<T>, payload: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors.map(e => e.message).join(", ") };
}
