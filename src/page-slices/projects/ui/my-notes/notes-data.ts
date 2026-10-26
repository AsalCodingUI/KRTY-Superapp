"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../workspace/data"

/**
 * My notes: private notes with a to-do list (personal_notes, RLS: owner
 * only). Edits are optimistic and saved in place; the list re-sorts by
 * pinned, then last edit.
 */

export type NoteTodo = { id: string; text: string; done: boolean }

export type Note = {
  id: string
  title: string
  body: string
  todos: NoteTodo[]
  pinned: boolean
  created_at: string
  updated_at: string
}

export type NotePatch = Partial<
  Pick<Note, "title" | "body" | "todos" | "pinned">
>

const keyOf = (ownerId: string | null) => ["my-notes", ownerId] as const
// Not in the generated types yet.
const TABLE = "personal_notes" as never

export function sortNotes(notes: Note[]) {
  return [...notes].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      b.updated_at.localeCompare(a.updated_at),
  )
}

/**
 * One person's notes. Always filtered by owner: super admins can read
 * everyone's (for "Lihat sebagai"), so their own page must not list the rest.
 */
export function useNotes(ownerId: string | null) {
  return useQuery({
    queryKey: keyOf(ownerId),
    enabled: Boolean(ownerId),
    queryFn: async () => {
      const { data, error } = await supabase()
        .from(TABLE)
        .select("id, title, body, todos, pinned, created_at, updated_at")
        .eq("user_id" as never, ownerId! as never)
        .order("updated_at", { ascending: false })
      if (error) throw error
      return sortNotes((data ?? []) as unknown as Note[])
    },
  })
}

export function useNoteWriter(ownerId: string | null, onError: () => void) {
  const queryClient = useQueryClient()
  const KEY = keyOf(ownerId)
  const setNotes = (fn: (notes: Note[]) => Note[]) =>
    queryClient.setQueryData<Note[]>(KEY, (prev) => fn(prev ?? []))

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase()
        .from(TABLE)
        .insert({} as never)
        .select("id, title, body, todos, pinned, created_at, updated_at")
        .single()
      if (error) throw error
      return data as unknown as Note
    },
    onSuccess: (note) => setNotes((notes) => sortNotes([note, ...notes])),
    onError,
  })

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: NotePatch }) => {
      const { error } = await supabase()
        .from(TABLE)
        .update(patch as never)
        .eq("id", id)
      if (error) throw error
    },
    onMutate: ({ id, patch }) =>
      setNotes((notes) =>
        sortNotes(
          notes.map((n) =>
            n.id === id
              ? { ...n, ...patch, updated_at: new Date().toISOString() }
              : n,
          ),
        ),
      ),
    onError: () => {
      onError()
      queryClient.invalidateQueries({ queryKey: KEY })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase().from(TABLE).delete().eq("id", id)
      if (error) throw error
    },
    onMutate: (id) => setNotes((notes) => notes.filter((n) => n.id !== id)),
    onError: () => {
      onError()
      queryClient.invalidateQueries({ queryKey: KEY })
    },
  })

  return { create, update, remove }
}
