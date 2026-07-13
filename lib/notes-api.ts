// Centralized API layer for talking to the existing Express backend.
//
// By default requests are sent to the VPS backend. If your Express server
// runs elsewhere, set NEXT_PUBLIC_API_URL and it will be used as the base
// for every request.
//
// IMPORTANT: Every request below passes `credentials: "include"` so the
// browser sends/stores the express-session cookie. Without it the session
// cookie is dropped and authentication silently fails.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://91.239.211.48:3001"

// Shared fetch options that guarantee cookies are always included.
const withCredentials: RequestInit = { credentials: "include" }

export type Note = {
  id: string | number
  note: string
}

export type User = {
  id: string | number
  username: string
}

function url(path: string) {
  return `${API_BASE}${path}`
}

async function parseJson(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// Map the DB 'content' column to the UI's 'note' property.
function mapDbToUI(item: any): Note {
  return {
    id: item.id,
    note: item.content || item.note || "",
  }
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

// GET /me -> current user (200) or null when not authenticated (401).
// A network failure or timeout is treated as "not logged in" so the UI
// always resolves to the login screen instead of hanging on load.
export async function getMe(): Promise<User | null> {
  try {
    const res = await fetch(url("/me"), {
      ...withCredentials,
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 401 || res.status === 403) return null
    if (!res.ok) return null
    const data = await parseJson(res)
    return data ? (data.user ?? data) : null
  } catch {
    // Backend unreachable / timed out / blocked — assume unauthenticated.
    return null
  }
}

// POST /login  body: { username, password }
export async function login(username: string, password: string): Promise<User> {
  const res = await fetch(url("/login"), {
    ...withCredentials,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = await parseJson(res)
    throw new Error(data?.message || "Invalid username or password")
  }
  const data = await parseJson(res)
  return data?.user ?? data ?? { id: username, username }
}

// POST /register  body: { username, password }
export async function register(username: string, password: string): Promise<User> {
  const res = await fetch(url("/register"), {
    ...withCredentials,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = await parseJson(res)
    throw new Error(data?.message || "Could not create account")
  }
  const data = await parseJson(res)
  return data?.user ?? data ?? { id: username, username }
}

// POST /logout
export async function logout(): Promise<void> {
  const res = await fetch(url("/logout"), {
    ...withCredentials,
    method: "POST",
  })
  if (!res.ok) throw new Error(`Failed to log out (${res.status})`)
}

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

// GET /notes -> Note[]
export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(url("/notes"), { ...withCredentials })
  if (!res.ok) throw new Error(`Failed to load notes (${res.status})`)
  const data = await parseJson(res)
  return Array.isArray(data) ? data.map(mapDbToUI) : []
}

// POST /write  body: { note: string }
export async function createNote(noteText: string): Promise<Note> {
  const res = await fetch(url("/write"), {
    ...withCredentials,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note: noteText }),
  })
  if (!res.ok) throw new Error(`Failed to save note (${res.status})`)
  const data = await parseJson(res)
  return mapDbToUI(data)
}

// PUT /notes/:id  body: { note: string }
export async function updateNote(id: Note["id"], noteText: string): Promise<Note> {
  const res = await fetch(url(`/notes/${id}`), {
    ...withCredentials,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note: noteText }),
  })
  if (!res.ok) throw new Error(`Failed to update note (${res.status})`)
  const data = await parseJson(res)
  return mapDbToUI(data)
}

// DELETE /notes/:id
export async function deleteNote(id: Note["id"]): Promise<void> {
  const res = await fetch(url(`/notes/${id}`), {
    ...withCredentials,
    method: "DELETE",
  })
  if (!res.ok) throw new Error(`Failed to delete note (${res.status})`)
}
