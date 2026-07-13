"use client"

import type React from "react"
import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type NoteFormProps = {
  onSave: (note: string) => Promise<void>
}

export function NoteForm({ onSave }: NoteFormProps) {
  const [value, setValue] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || saving) return

    setSaving(true)
    try {
      await onSave(trimmed)
      setValue("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write a new note..."
        aria-label="New note"
        className="h-11 flex-1"
      />
      <Button
        type="submit"
        disabled={!value.trim() || saving}
        className="h-11 gap-2"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="size-4" aria-hidden="true" />
        )}
        Save
      </Button>
    </form>
  )
}
