// Poster uploads are downscaled in the browser first (see ImageUpload), so
// real files land well under this cap. Vercel functions reject request bodies
// over ~4.5MB anyway.
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

// Course materials (syllabuses, notes, past exams) aren't downscaled like
// images, so the cap sits a bit under Vercel's ~4.5MB request-body ceiling.
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

export const UPLOAD_URL_PREFIX = "/api/uploads/";
