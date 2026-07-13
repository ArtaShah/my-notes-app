"use client"

import { useState } from "react"
import { Pencil, Trash2, Check, X, Loader2 } from "lucide-react"
import type { Note } from "@/lib/notes-api"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type NoteCardProps = {
  note: Note
  onUpdate: (id: Note["id"], note: string) => Promise<void>
  onDelete: (id: Note["id"]) => Promise<void>
}

export function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.note)
  const [busy, setBusy] = useState(false)

  async function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      await onUpdate(note.id, trimmed)
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (busy) return
    setBusy(true)
    try {
      await onDelete(note.id)
    } finally {
      setBusy(false)
    }
  }

  function cancelEdit() {
    setDraft(note.note)
    setEditing(false)
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1">
        {editing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Edit note"
            className="min-h-24 resize-none"
            autoFocus
          />
        ) : (
          <p className="whitespace-pre-wrap text-pretty leading-relaxed text-card-foreground">
            {note.note}
          </p>
        )}
      </CardContent>

      <CardFooter className="justify-end gap-2">
        {editing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              disabled={busy}
              className="gap-1.5"
            >
              <X className="size-4" aria-hidden="true" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={busy || !draft.trim()}
              className="gap-1.5"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )}
              Save
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              disabled={busy}
              className="gap-1.5"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={busy}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Delete
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
