"use client"

import { useState } from "react"
import useSWR from "swr"
import { NotebookPen, AlertCircle, Loader2, LogOut } from "lucide-react"
import {
  type Note,
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/notes-api"
import { useAuth } from "@/hooks/use-auth"
import { NoteForm } from "@/components/note-form"
import { NoteCard } from "@/components/note-card"
import { Button } from "@/components/ui/button"

export function NotesView() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const {
    data: notes,
    error,
    isLoading,
    mutate,
  } = useSWR<Note[]>("notes", fetchNotes)

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  // Create: optimistically prepend the new note, then revalidate.
  async function handleCreate(text: string) {
    const optimistic: Note = { id: `temp-${Date.now()}`, note: text }
    await mutate(
      async (current = []) => {
        const saved = await createNote(text)
        return [saved, ...current]
      },
      {
        optimisticData: (current = []) => [optimistic, ...current],
        rollbackOnError: true,
        revalidate: false,
      },
    )
  }

  // Update: optimistically swap the edited note's text.
  async function handleUpdate(id: Note["id"], text: string) {
    await mutate(
      async (current = []) => {
        const saved = await updateNote(id, text)
        return current.map((n) => (n.id === id ? { ...n, ...saved, note: text } : n))
      },
      {
        optimisticData: (current = []) =>
          current.map((n) => (n.id === id ? { ...n, note: text } : n)),
        rollbackOnError: true,
        revalidate: false,
      },
    )
  }

  // Delete: optimistically remove the note from the list.
  async function handleDelete(id: Note["id"]) {
    await mutate(
      async (current = []) => {
        await deleteNote(id)
        return current.filter((n) => n.id !== id)
      },
      {
        optimisticData: (current = []) => current.filter((n) => n.id !== id),
        rollbackOnError: true,
        revalidate: false,
      },
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <header className="mb-8 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <NotebookPen className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            My Notes
          </h1>
          <p className="text-sm text-muted-foreground">
            {user?.username
              ? `Signed in as ${user.username}`
              : "Capture quick thoughts and keep them organized."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
          className="ml-auto gap-1.5"
        >
          {loggingOut ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
          Logout
        </Button>
      </header>

      <section className="mb-10 rounded-xl border bg-card p-4 shadow-sm">
        <NoteForm onSave={handleCreate} />
      </section>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>Could not load your notes. Please try again.</span>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          <span className="text-sm">Loading notes...</span>
        </div>
      ) : !notes || notes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground text-pretty">
            No notes yet. Add your first one above to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
