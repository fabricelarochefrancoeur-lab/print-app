export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPEG, PNG and WebP images are allowed";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image must be 5MB or less";
  }
  return null;
}
