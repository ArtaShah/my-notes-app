"use client"

import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AuthScreen } from "@/components/auth-screen"
import { NotesView } from "@/components/notes-view"

export default function Page() {
  const { user, loading } = useAuth()

  return (
    <main className="min-h-screen bg-background">
      {loading ? (
        <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : user ? (
        <NotesView />
      ) : (
        <AuthScreen />
      )}
    </main>
  )
}
