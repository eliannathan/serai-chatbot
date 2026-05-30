// Shared helper for pre-filling guest details from the active demo persona.
//
// App.jsx stores the full persona object in sessionStorage under `serai_persona`,
// so it carries `name` and `email` directly. We return those for pre-filling
// booking/checkout forms, or null when no persona is set, the stored value is
// corrupt, or the persona has no email (e.g. the "visitor" persona) — so
// first-time guests always start with blank fields.
export function getPersonaDefaults() {
  try {
    const stored = sessionStorage.getItem('serai_persona')
    if (!stored) return null
    const persona = JSON.parse(stored)
    if (!persona?.name || !persona?.email) return null
    return { name: persona.name, email: persona.email }
  } catch {
    return null
  }
}
