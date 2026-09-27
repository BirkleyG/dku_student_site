import { z } from "zod";

export const dearDkuCategories = ["OPINION", "ESSAY", "CREATIVE_WRITING", "ART", "CAMPUS_LIFE", "OTHER"] as const;

export const dearDkuCategoryLabels: Record<(typeof dearDkuCategories)[number], string> = {
  OPINION: "Opinion",
  ESSAY: "Essay",
  CREATIVE_WRITING: "Creative writing",
  ART: "Art",
  CAMPUS_LIFE: "Campus life",
  OTHER: "Other",
};

export const dearDkuSubmissionTypes = ["GOOGLE_DOC", "FILE"] as const;

/** New blank Google Doc for the signed-in user — the button next to the doc-link field points here. */
export const DEAR_DKU_BLANK_DOC_URL = "https://doc.new";

export const dearDkuPostSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short").max(140),
    summary: z.string().trim().min(10, "Give a bit more of a summary").max(600),
    category: z.enum(dearDkuCategories),
    submissionType: z.enum(dearDkuSubmissionTypes),
    docUrl: z.string().trim().max(500).optional().or(z.literal("")),
    fileUrl: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => data.submissionType !== "GOOGLE_DOC" || Boolean(data.docUrl), {
    message: "Paste your Google Docs link",
    path: ["docUrl"],
  })
  .refine((data) => data.submissionType !== "GOOGLE_DOC" || /^https:\/\/docs\.google\.com\//.test(data.docUrl ?? ""), {
    message: "That doesn't look like a Google Docs link",
    path: ["docUrl"],
  })
  .refine((data) => data.submissionType !== "FILE" || Boolean(data.fileUrl), {
    message: "Upload your document",
    path: ["fileUrl"],
  });

export type DearDkuPostInput = z.infer<typeof dearDkuPostSchema>;

export const dearDkuCommentSchema = z.object({
  body: z.string().trim().min(2, "Say a bit more").max(3000),
});

export type DearDkuCommentInput = z.infer<typeof dearDkuCommentSchema>;
