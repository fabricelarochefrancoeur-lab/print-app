const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email)) {
    return "Invalid email format";
  }
  return null;
}

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return "Username must be 3-20 characters, alphanumeric and underscores only";
  }
  return null;
}

export function validatePrintTitle(title: string): string | null {
  if (title.length > 200) {
    return "Title must be 200 characters or less";
  }
  return null;
}

export function validatePrintContent(content: string): string | null {
  if (content.length > 10000) {
    return "Content must be 10,000 characters or less";
  }
  return null;
}

export function validateBio(bio: string): string | null {
  if (bio.length > 500) {
    return "Bio must be 500 characters or less";
  }
  return null;
}
