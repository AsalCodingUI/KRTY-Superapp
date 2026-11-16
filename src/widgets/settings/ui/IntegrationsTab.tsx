"use client"

import { Copy, RefreshCW } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { createClient } from "@/shared/api/supabase/client"
import { copyText } from "@/shared/context-menu/actions"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import { Row, SectionLabel } from "./settings-rows"

type Health = {
  status:
    | "ok"
    | "model_missing"
    | "auth_failed"
    | "unreachable"
    | "error"
    | "not_configured"
  host: string | null
  model: string | null
  latencyMs?: number
  models?: number
  httpStatus?: number
}

type Token = {
  id: string
  name: string
  prefix: string
  scope: "read" | "write"
  expires_at: string | null
  last_used_at: string | null
  created_at: string
}

const TOKENS_KEY = ["api-tokens"] as const
const EXPIRY_DAYS = ["30", "90", "365", "0"] as const

/** The status dot: green, amber or red. */
function Dot({ tone }: { tone: "ok" | "warn" | "bad" | "idle" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        tone === "ok" && "bg-success",
        tone === "warn" && "bg-warning",
        tone === "bad" && "bg-destructive",
        tone === "idle" && "bg-muted-foreground/40",
      )}
    />
  )
}

function AiRouterRow() {
  const t = useT("prefs")
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["ai-health"],
    queryFn: async (): Promise<Health> => {
      const res = await fetch("/api/ai/health", { cache: "no-store" })
      if (!res.ok) throw new Error(String(res.status))
      return res.json()
    },
    staleTime: 0,
    gcTime: 0,
    meta: { persist: false },
  })
  const tone = !data
    ? "idle"
    : data.status === "ok"
      ? "ok"
      : data.status === "model_missing"
        ? "warn"
        : "bad"
  const text = !data
    ? t("aiChecking")
    : data.status === "ok"
      ? t("aiOk", { ms: data.latencyMs ?? 0, count: data.models ?? 0 })
      : data.status === "model_missing"
        ? t("aiModelMissing", { model: data.model ?? "" })
        : data.status === "auth_failed"
          ? t("aiAuthFailed")
          : data.status === "unreachable"
            ? t("aiUnreachable")
            : data.status === "error"
              ? t("aiError", { code: data.httpStatus ?? "" })
              : t("aiNotConfigured")
  return (
    <Row
      label={
        <span className="flex items-center gap-2">
          {t("aiRouter")}
          {data?.host && (
            <span className="text-muted-foreground text-meta">{data.host}</span>
          )}
        </span>
      }
      hint={
        <span className="flex flex-col">
          <span className="flex items-center gap-2">
            <Dot tone={isFetching ? "idle" : tone} />
            {isFetching ? t("aiChecking") : text}
          </span>
          {data?.model && <span>{t("aiModel", { model: data.model })}</span>}
        </span>
      }
    >
      <Button
        variant="outline"
        size="sm"
        disabled={isFetching}
        onClick={() => void refetch()}
      >
        {isFetching ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <RefreshCW data-icon="inline-start" />
        )}
        {t("aiRecheck")}
      </Button>
    </Row>
  )
}

function McpRow() {
  const t = useT("prefs")
  const url =
    typeof window === "undefined"
      ? "/api/mcp"
      : `${window.location.origin}/api/mcp`
  const config = JSON.stringify(
    {
      mcpServers: {
        kretya: {
          type: "http",
          url,
          headers: { Authorization: "Bearer krty_…" },
        },
      },
    },
    null,
    2,
  )
  const copy = async (text: string) => {
    if (await copyText(text)) toast.success(t("copied"))
  }
  return (
    <Row label={t("mcpUrl")} hint={t("mcpUrlHint")}>
      <div className="flex flex-col items-end gap-1.5">
        <Button variant="outline" size="sm" onClick={() => void copy(url)}>
          <Copy data-icon="inline-start" />
          {t("copy")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => void copy(config)}
        >
          {t("copyConfig")}
        </Button>
      </div>
    </Row>
  )
}

function NewToken({ onCreated }: { onCreated: (token: string) => void }) {
  const t = useT("prefs")
  const [name, setName] = useState("")
  const [scope, setScope] = useState<"read" | "write">("read")
  const [days, setDays] = useState<(typeof EXPIRY_DAYS)[number]>("90")
  const [busy, setBusy] = useState(false)
  const create = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          scope,
          expiresInDays: Number(days),
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.token) throw new Error()
      setName("")
      onCreated(json.token)
    } catch {
      toast.error(t("tokenCreateFailed"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-wrap items-end gap-2 py-3">
      <label className="flex min-w-40 flex-1 flex-col gap-1">
        <span className="text-muted-foreground text-meta">
          {t("tokenName")}
        </span>
        <Input
          value={name}
          maxLength={80}
          placeholder={t("tokenNamePlaceholder")}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-meta">
          {t("tokenScope")}
        </span>
        <Select
          value={scope}
          onValueChange={(v) => v && setScope(v as "read" | "write")}
        >
          <SelectTrigger className="w-36">
            <SelectValue>
              {scope === "write" ? t("tokenWrite") : t("tokenRead")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="read">{t("tokenRead")}</SelectItem>
            <SelectItem value="write">{t("tokenWrite")}</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-meta">
          {t("tokenExpiry")}
        </span>
        <Select
          value={days}
          onValueChange={(v) => v && setDays(v as typeof days)}
        >
          <SelectTrigger className="w-32">
            <SelectValue>
              {days === "0" ? t("tokenNever") : t("tokenDays", { count: days })}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EXPIRY_DAYS.map((d) => (
              <SelectItem key={d} value={d}>
                {d === "0" ? t("tokenNever") : t("tokenDays", { count: d })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <Button disabled={busy || !name.trim()} onClick={() => void create()}>
        {busy && <Spinner data-icon="inline-start" />}
        {t("tokenCreate")}
      </Button>
    </div>
  )
}

function TokenRow({ token }: { token: Token }) {
  const t = useT("prefs")
  const locale = useDateLocale()
  const queryClient = useQueryClient()
  const [confirm, setConfirm] = useState(false)
  const expired =
    token.expires_at && new Date(token.expires_at).getTime() < Date.now()
  const revoke = async () => {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
      return
    }
    const { error } = await createClient()
      .from("api_tokens")
      .delete()
      .eq("id", token.id)
    if (error) return
    toast.success(t("tokenRevoked"))
    await queryClient.invalidateQueries({ queryKey: TOKENS_KEY })
  }
  return (
    <Row
      label={
        <span className="flex items-center gap-2">
          {token.name}
          <span className="text-muted-foreground text-meta font-mono">
            {token.prefix}…
          </span>
        </span>
      }
      hint={[
        token.scope === "write" ? t("tokenWrite") : t("tokenRead"),
        token.last_used_at
          ? t("tokenUsed", {
              time: formatDistanceToNow(new Date(token.last_used_at), {
                addSuffix: true,
                locale,
              }),
            })
          : t("tokenNeverUsed"),
        expired
          ? t("tokenExpired")
          : token.expires_at
            ? t("tokenExpires", {
                date: format(new Date(token.expires_at), "d MMM yyyy", {
                  locale,
                }),
              })
            : t("tokenNever"),
      ].join(" · ")}
    >
      <Button
        variant={confirm ? "destructive" : "outline"}
        size="sm"
        onClick={() => void revoke()}
      >
        {confirm ? t("tokenRevokeConfirm") : t("tokenRevoke")}
      </Button>
    </Row>
  )
}

/**
 * Setelan → API & MCP (stakeholders): the AI router's health, the MCP
 * server's address, and personal API tokens (app/api/mcp, api_tokens.sql).
 */
export function IntegrationsTab() {
  const t = useT("prefs")
  const queryClient = useQueryClient()
  const [fresh, setFresh] = useState<string | null>(null)
  const { data: tokens = [], isPending } = useQuery({
    queryKey: TOKENS_KEY,
    meta: { persist: false },
    queryFn: async (): Promise<Token[]> => {
      const { data, error } = await createClient()
        .from("api_tokens")
        .select("id, name, prefix, scope, expires_at, last_used_at, created_at")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as Token[]
    },
  })

  return (
    <div className="flex flex-col">
      <SectionLabel>{t("aiSection")}</SectionLabel>
      <AiRouterRow />

      <SectionLabel>{t("mcpSection")}</SectionLabel>
      <McpRow />

      <SectionLabel>{t("tokensSection")}</SectionLabel>
      <p className="text-muted-foreground text-meta leading-5">
        {t("tokensHint")}
      </p>
      <NewToken
        onCreated={(token) => {
          setFresh(token)
          void queryClient.invalidateQueries({ queryKey: TOKENS_KEY })
        }}
      />
      {fresh && (
        <div className="bg-muted rounded-card mb-2 flex flex-col gap-2 p-3">
          <span className="text-meta">{t("tokenCreated")}</span>
          <div className="flex items-center gap-2">
            <code className="bg-background rounded-control min-w-0 flex-1 truncate px-2 py-1.5 font-mono text-xs select-all">
              {fresh}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (await copyText(fresh)) toast.success(t("copied"))
              }}
            >
              <Copy data-icon="inline-start" />
              {t("copy")}
            </Button>
          </div>
        </div>
      )}
      {isPending ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : tokens.length === 0 ? (
        <p className="text-muted-foreground py-3 text-sm">{t("tokenNone")}</p>
      ) : (
        tokens.map((token) => <TokenRow key={token.id} token={token} />)
      )}
    </div>
  )
}
