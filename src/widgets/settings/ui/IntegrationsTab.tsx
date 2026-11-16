"use client"

import { Copy, RefreshCW } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
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
import { RiAddLine, RiMoreFill } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Row } from "./settings-rows"

type Provider = {
  id: string
  name: string
  host: string
  model: string
  is_default: boolean
}

type Health = {
  status:
    | "ok"
    | "model_missing"
    | "auth_failed"
    | "unreachable"
    | "error"
    | "not_configured"
  latencyMs?: number
  httpStatus?: number
}

type Token = {
  id: string
  name: string
  prefix: string
  scope: "read" | "write"
  expires_at: string | null
  last_used_at: string | null
}

const PROVIDERS_KEY = ["ai-providers"] as const
const TOKENS_KEY = ["api-tokens"] as const
const EXPIRY_DAYS = ["30", "90", "365", "0"] as const
const NO_PERSIST = { persist: false }

const send = (url: string, method: string, body?: unknown) =>
  fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

/** A section's title, its action on the right. */
function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mt-8 flex flex-col first:mt-0">
      <div className="flex h-8 items-center justify-between">
        <h3 className="text-muted-foreground text-meta font-medium">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground py-4 text-sm">{children}</p>
}

function useHealthText() {
  const t = useT("prefs")
  return (h: Health | undefined) =>
    !h
      ? t("aiChecking")
      : h.status === "ok"
        ? t("aiOk", { ms: h.latencyMs ?? 0 })
        : h.status === "model_missing"
          ? t("aiModelMissing")
          : h.status === "auth_failed"
            ? t("aiAuthFailed")
            : h.status === "unreachable"
              ? t("aiUnreachable")
              : h.status === "error"
                ? t("aiError", { code: h.httpStatus ?? "" })
                : t("aiNotConfigured")
}

function Status({ health, busy }: { health?: Health; busy?: boolean }) {
  const text = useHealthText()
  const tone = busy || !health ? "idle" : health.status
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          tone === "idle" && "bg-muted-foreground/40",
          tone === "ok" && "bg-success",
          tone === "model_missing" && "bg-warning",
          !["idle", "ok", "model_missing"].includes(tone) && "bg-destructive",
        )}
      />
      {busy ? text(undefined) : text(health)}
    </span>
  )
}

// --- AI ----------------------------------------------------------------

function ProviderRow({ provider }: { provider: Provider }) {
  const t = useT("prefs")
  const queryClient = useQueryClient()
  const health = useQuery({
    queryKey: ["ai-health", provider.id],
    meta: NO_PERSIST,
    staleTime: 60_000,
    queryFn: async (): Promise<Health> => {
      const res = await fetch(`/api/ai/health?id=${provider.id}`, {
        cache: "no-store",
      })
      if (!res.ok) throw new Error(String(res.status))
      return res.json()
    },
  })
  const change = async (method: "PATCH" | "DELETE") => {
    await (method === "PATCH"
      ? send("/api/ai/providers", "PATCH", { id: provider.id })
      : send(`/api/ai/providers?id=${provider.id}`, "DELETE"))
    await queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY })
  }
  return (
    <Row
      label={
        <span className="flex items-center gap-2">
          {provider.name}
          {provider.is_default && (
            <Badge variant="secondary">{t("aiDefault")}</Badge>
          )}
        </span>
      }
      hint={
        <span className="flex flex-wrap items-center gap-x-2">
          <Status health={health.data} busy={health.isFetching} />
          <span>·</span>
          <span className="truncate">{provider.model}</span>
          <span>·</span>
          <span className="truncate">{provider.host}</span>
        </span>
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={provider.name}
              className="text-muted-foreground"
            />
          }
        >
          <RiMoreFill />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onClick={() => void health.refetch()}>
            <RefreshCW />
            {t("aiRecheck")}
          </DropdownMenuItem>
          {!provider.is_default && (
            <DropdownMenuItem onClick={() => void change("PATCH")}>
              {t("aiMakeDefault")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void change("DELETE")}
          >
            {t("aiRemove")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Row>
  )
}

function AddProviderDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("prefs")
  const text = useHealthText()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: "",
    base_url: "",
    api_key: "",
    model: "",
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))
  const ready = Object.values(form).every((v) => v.trim())

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await send("/api/ai/providers", "POST", form)
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setError(
          t("aiSaveFailed", {
            reason: json?.health
              ? text(json.health)
              : (json?.error ?? res.status),
          }),
        )
        return
      }
      await queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY })
      setForm({ name: "", base_url: "", api_key: "", model: "" })
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    type = "text",
  ) => (
    <Field>
      <FieldLabel htmlFor={`ai-${key}`}>{label}</FieldLabel>
      <Input
        id={`ai-${key}`}
        type={type}
        autoComplete="off"
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => set(key)(e.target.value)}
      />
    </Field>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("aiAddTitle")}</DialogTitle>
          <DialogDescription>{t("aiAddHint")}</DialogDescription>
        </DialogHeader>
        {field("name", t("aiName"), "9router")}
        {field("base_url", t("aiUrl"), "https://…/v1")}
        {field("api_key", t("aiKey"), "sk-…", "password")}
        {field("model", t("aiModelLabel"), "gpt-4o-mini")}
        {error && <FieldError>{error}</FieldError>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button disabled={!ready || busy} onClick={() => void save()}>
            {busy && <Spinner data-icon="inline-start" />}
            {t("aiSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AiSection() {
  const t = useT("prefs")
  const [adding, setAdding] = useState(false)
  const { data, isPending } = useQuery({
    queryKey: PROVIDERS_KEY,
    meta: NO_PERSIST,
    queryFn: async (): Promise<Provider[]> => {
      const res = await fetch("/api/ai/providers", { cache: "no-store" })
      if (!res.ok) throw new Error(String(res.status))
      return (await res.json()).providers
    },
  })
  return (
    <Section
      title={t("aiSection")}
      action={
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <RiAddLine data-icon="inline-start" />
          {t("aiAdd")}
        </Button>
      }
    >
      {isPending ? (
        <Spinner className="my-4 self-center" />
      ) : !data?.length ? (
        <Empty>{t("aiNone")}</Empty>
      ) : (
        data.map((p) => <ProviderRow key={p.id} provider={p} />)
      )}
      <AddProviderDialog open={adding} onOpenChange={setAdding} />
    </Section>
  )
}

// --- MCP ---------------------------------------------------------------

function McpSection() {
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
    <Section title={t("mcpSection")}>
      <Row
        label={t("mcpServer")}
        hint={<span className="font-mono break-all">{url}</span>}
      >
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Copy data-icon="inline-start" />
            {t("copy")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onClick={() => void copy(url)}>
              {t("copyUrl")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void copy(config)}>
              {t("copyConfig")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Row>
    </Section>
  )
}

// --- Tokens ------------------------------------------------------------

function NewTokenDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("prefs")
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [scope, setScope] = useState<"read" | "write">("read")
  const [days, setDays] = useState<(typeof EXPIRY_DAYS)[number]>("90")
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setToken(null)
      setName("")
    }
  }
  const create = async () => {
    setBusy(true)
    try {
      const res = await send("/api/tokens", "POST", {
        name: name.trim(),
        scope,
        expiresInDays: Number(days),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.token) throw new Error()
      setToken(json.token)
      await queryClient.invalidateQueries({ queryKey: TOKENS_KEY })
    } catch {
      toast.error(t("tokenCreateFailed"))
    } finally {
      setBusy(false)
    }
  }
  const dayLabel = (d: string) =>
    d === "0" ? t("tokenNever") : t("tokenDays", { count: d })

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("tokenNew")}</DialogTitle>
          <DialogDescription>
            {token ? t("tokenCreated") : t("tokenNewHint")}
          </DialogDescription>
        </DialogHeader>
        {token ? (
          <div className="flex items-center gap-2">
            <code className="bg-muted rounded-control min-w-0 flex-1 truncate px-2.5 py-2 font-mono text-xs select-all">
              {token}
            </code>
            <Button
              variant="outline"
              onClick={async () => {
                if (await copyText(token)) toast.success(t("copied"))
              }}
            >
              <Copy data-icon="inline-start" />
              {t("copy")}
            </Button>
          </div>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="token-name">{t("tokenName")}</FieldLabel>
              <Input
                id="token-name"
                value={name}
                maxLength={80}
                placeholder={t("tokenNamePlaceholder")}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>{t("tokenScope")}</FieldLabel>
                <Select
                  value={scope}
                  onValueChange={(v) => v && setScope(v as "read" | "write")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {scope === "write" ? t("tokenWrite") : t("tokenRead")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">{t("tokenRead")}</SelectItem>
                    <SelectItem value="write">{t("tokenWrite")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>{t("tokenExpiry")}</FieldLabel>
                <Select
                  value={days}
                  onValueChange={(v) => v && setDays(v as typeof days)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{dayLabel(days)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_DAYS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {dayLabel(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </>
        )}
        <DialogFooter>
          {token ? (
            <Button onClick={() => close(false)}>{t("tokenDone")}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => close(false)}>
                {t("close")}
              </Button>
              <Button
                disabled={busy || !name.trim()}
                onClick={() => void create()}
              >
                {busy && <Spinner data-icon="inline-start" />}
                {t("tokenCreate")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const meta = [
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
        ? t("tokenUntil", {
            date: format(new Date(token.expires_at), "d MMM yyyy", { locale }),
          })
        : null,
  ].filter(Boolean)
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
      hint={meta.join(" · ")}
    >
      <Button
        variant={confirm ? "destructive" : "ghost"}
        size="sm"
        className={confirm ? undefined : "text-muted-foreground"}
        onClick={() => void revoke()}
      >
        {confirm ? t("tokenRevokeConfirm") : t("tokenRevoke")}
      </Button>
    </Row>
  )
}

function TokensSection() {
  const t = useT("prefs")
  const [adding, setAdding] = useState(false)
  const { data = [], isPending } = useQuery({
    queryKey: TOKENS_KEY,
    meta: NO_PERSIST,
    queryFn: async (): Promise<Token[]> => {
      const { data, error } = await createClient()
        .from("api_tokens")
        .select("id, name, prefix, scope, expires_at, last_used_at")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as Token[]
    },
  })
  return (
    <Section
      title={t("tokensSection")}
      action={
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <RiAddLine data-icon="inline-start" />
          {t("tokenNew")}
        </Button>
      }
    >
      {isPending ? (
        <Spinner className="my-4 self-center" />
      ) : !data.length ? (
        <Empty>{t("tokenNone")}</Empty>
      ) : (
        data.map((token) => <TokenRow key={token.id} token={token} />)
      )}
      <NewTokenDialog open={adding} onOpenChange={setAdding} />
    </Section>
  )
}

/**
 * Setelan → API & MCP (stakeholders): the AI connections (add, remove, the
 * default one serves the editors' AI), the MCP server's address, and
 * personal API tokens (app/api/mcp, api_tokens.sql, ai_providers.sql).
 */
export function IntegrationsTab() {
  return (
    <div className="flex flex-col">
      <AiSection />
      <McpSection />
      <TokensSection />
    </div>
  )
}
