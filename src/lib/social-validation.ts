import { z } from "zod";

/** Days in each month, letting Feb have 29 (birthdays have no year). */
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const socialPreferencesSchema = z
  .object({
    birthdayMonth: z.number().int().min(1).max(12).nullable(),
    birthdayDay: z.number().int().min(1).max(31).nullable(),
    showBirthday: z.boolean(),
    shareActivity: z.boolean(),
    showOnlineStatus: z.boolean(),
  })
  .refine((v) => (v.birthdayMonth === null) === (v.birthdayDay === null), { message: "Pick both a month and a day", path: ["birthdayDay"] })
  .refine((v) => v.birthdayMonth === null || v.birthdayDay === null || v.birthdayDay <= DAYS_IN_MONTH[v.birthdayMonth - 1], {
    message: "That date doesn't exist",
    path: ["birthdayDay"],
  });

export type SocialPreferences = z.infer<typeof socialPreferencesSchema>;
