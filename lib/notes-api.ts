// Centralized API layer for talking to the existing Express backend.
//
// By default requests are sent to the same origin (relative paths like
// "/notes"). If your Express server runs on a different host/port, set
// NEXT_PUBLIC_API_URL (e.g. "http://localhost:4000") and it will be used
// as the base for every request.

// 1. UPDATED: Hardcoded fallback to your VPS backend IP and port
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://91.239.211.48:3001"

export type Note = {
  id: string | number
  note: string
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

// 2. NEW: Helper function to map your database 'content' column to your UI's 'note' property
function mapDbToUI(item: any): Note {
  return {
    id: item.id,
    note: item.content || item.note || ""
  }
}

// GET /notes -> Note[]
export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(url("/notes"))
  if (!res.ok) throw new Error(`Failed to load notes (${res.status})`)
  const data = await parseJson(res)
  return Array.isArray(data) ? data.map(mapDbToUI) : []
}

// POST /write  body: { note: string }
export async function createNote(noteText: string): Promise<Note> {
  const res = await fetch(url("/write"), {
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
  const res = await fetch(url(`/notes/${id}`), { method: "DELETE" })
  if (!res.ok) throw new Error(`Failed to delete note (${res.status})`)
}