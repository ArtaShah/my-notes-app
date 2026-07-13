"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import {
  type User,
  getMe,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from "@/lib/notes-api"

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, ask the backend who we are via GET /me.
  useEffect(() => {
    let active = true
    console.log("[v0] AuthProvider effect — calling getMe()")
    getMe()
      .then((u) => {
        console.log("[v0] getMe resolved:", u)
        if (active) setUser(u)
      })
      .catch((e) => {
        console.log("[v0] getMe rejected:", e?.message)
        if (active) setUser(null)
      })
      .finally(() => {
        console.log("[v0] getMe finally — setting loading false")
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const u = await apiLogin(username, password)
    setUser(u)
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const u = await apiRegister(username, password)
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
