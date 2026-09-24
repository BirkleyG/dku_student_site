import { z } from "zod";

export const groupTypes = ["CLUB", "ORGANIZATION"] as const;

export const groupTypeLabels: Record<(typeof groupTypes)[number], string> = {
  CLUB: "Club",
  ORGANIZATION: "Organization",
};

export const clubCategories = [
  "ACADEMIC",
  "ARTS",
  "CULTURAL",
  "SERVICE",
  "SOCIAL",
  "PROFESSIONAL",
  "ATHLETIC",
  "OTHER",
] as const;

export const clubCategoryLabels: Record<(typeof clubCategories)[number], string> = {
  ACADEMIC: "Academic",
  ARTS: "Arts",
  CULTURAL: "Cultural",
  SERVICE: "Service",
  SOCIAL: "Social",
  PROFESSIONAL: "Professional",
  ATHLETIC: "Athletic",
  OTHER: "Other",
};

export const athleticKinds = ["VARSITY_TEAM", "SPORTS_CLUB"] as const;

export const athleticKindLabels: Record<(typeof athleticKinds)[number], string> = {
  VARSITY_TEAM: "DKU Sports Team",
  SPORTS_CLUB: "Sports Club",
};

export const contactMethods = ["EMAIL", "WECHAT", "PHONE", "OTHER"] as const;

export const contactMethodLabels: Record<(typeof contactMethods)[number], string> = {
  EMAIL: "Email",
  WECHAT: "WeChat QR code",
  PHONE: "Phone",
  OTHER: "Other",
};

const officerSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(120),
  title: z.string().trim().min(1, "Enter a title").max(80),
  contact: z.string().trim().max(200).optional().or(z.literal("")),
});

export type OfficerInput = z.infer<typeof officerSchema>;

export const clubSchema = z
  .object({
    type: z.enum(groupTypes),
    name: z.string().trim().min(2, "Name is too short").max(120),
    category: z.enum(clubCategories),
    athleticKind: z.enum(athleticKinds).optional(),
    sportName: z.string().trim().max(80).optional().or(z.literal("")),
    description: z.string().trim().min(10, "Tell people what this is about").max(2000),
    contactMethod: z.enum(contactMethods),
    contactValue: z.string().trim().max(200).optional().or(z.literal("")),
    contactQrUrl: z.string().trim().url().optional().or(z.literal("")),
    website: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
    logoUrl: z.string().trim().url().optional().or(z.literal("")),
    openJoin: z.boolean(),
    officers: z.array(officerSchema).max(10),
  })
  .superRefine((data, ctx) => {
    if (data.category === "ATHLETIC" && !data.athleticKind) {
      ctx.addIssue({ code: "custom", path: ["athleticKind"], message: "Choose a team or sports club" });
    }
    if (data.contactMethod === "WECHAT" && !data.contactQrUrl) {
      ctx.addIssue({ code: "custom", path: ["contactQrUrl"], message: "Upload a WeChat QR code" });
    }
    if ((data.contactMethod === "EMAIL" || data.contactMethod === "PHONE" || data.contactMethod === "OTHER") && !data.contactValue) {
      ctx.addIssue({ code: "custom", path: ["contactValue"], message: "Enter contact info" });
    }
  });

export type ClubInput = z.infer<typeof clubSchema>;
