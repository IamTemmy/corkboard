// The J-number is the local part of a JSU email (j00931199@students.jsums.edu).
// It's the fallback identity shown before a student chooses a display name, and
// the value used if they explicitly pick "use my J-number".
export function jnumberOf(email: string | null | undefined): string {
  return email?.split("@")[0] ?? "student";
}
