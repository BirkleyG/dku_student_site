// Poster uploads are downscaled in the browser first (see ImageUpload), so
// real files land well under this cap. Vercel functions reject request bodies
// over ~4.5MB anyway.
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const UPLOAD_URL_PREFIX = "/api/uploads/";
