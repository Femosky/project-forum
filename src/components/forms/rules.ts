// Field rules shared by the sign-in and account forms. They mirror the API's (backend shared/validation and
// auth/passwordPolicy), so most mistakes show up before anything is sent; the API still has the final word.

export const PASSWORD_MIN = 10;
const USERNAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export function emailError(value: string) {
    const email = value.trim();
    if (!email) return 'Enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address, like you@example.com.';
}

export function usernameError(value: string) {
    const username = value.trim().toLowerCase();
    if (!username) return 'Choose a username.';
    if (!/^[a-z]/.test(username)) return 'Start with a letter.';
    if (!USERNAME_PATTERN.test(username)) return 'Use only letters, numbers and underscores.';
    if (username.length < 3) return 'Use at least 3 characters.';
    if (username.length > 20) return 'Use at most 20 characters.';
}

// The parts of a username or email someone might reuse as a password
function personalParts(username?: string, email?: string) {
    const local = email?.trim().split('@')[0];
    return [username, local, ...(local?.split(/[._+-]/) ?? [])]
        .map((part) => part?.toLowerCase().trim())
        .filter((part): part is string => Boolean(part && part.length >= 3));
}

export function newPasswordError(value: string, who: { username?: string; email?: string } = {}) {
    if (!value) return 'Choose a password.';
    if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
    if (value.length > 128) return 'Use at most 128 characters.';
    const lower = value.toLowerCase();
    if (personalParts(who.username, who.email).some((part) => lower.includes(part))) return "Don't use your username or email in it.";
}

// A rough 0-4 score for the meter: length and variety, minus obvious patterns. The API's breach check catches the
// common passwords this can't know about.
export function passwordScore(value: string): 0 | 1 | 2 | 3 | 4 {
    if (!value) return 0;
    let score = 0;
    if (value.length >= PASSWORD_MIN) score++;
    if (value.length >= 14) score++;
    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;
    if (kinds >= 2) score++;
    if (kinds >= 3 || value.length >= 18) score++;
    if (/(.)\1{2,}/.test(value) || /^(?:123|abc|qwerty|password)/i.test(value)) score--;
    if (value.length < PASSWORD_MIN) score = Math.min(score, 1);
    return Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;
}
