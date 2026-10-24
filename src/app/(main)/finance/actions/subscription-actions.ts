"use server"

import { getAdminContext } from "@/shared/lib/admin-server"
import { getT } from "@/shared/i18n/server"
import { revalidatePath } from "next/cache"

/** Finance is stakeholder-only; RLS enforces the same. */

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

export type SubscriptionInput = {
  name: string
  category: string
  /** In `currency` units. */
  amount: number
  currency: string
  /** IDR per 1 unit actually charged (markup included); null = default rate. */
  fxRate: number | null
  cycle: "monthly" | "yearly"
  /** yyyy-MM-dd of the first charge */
  anchorDate: string
  /** yyyy-MM-dd of the last charge, or null while running */
  endsOn: string | null
  notes: string
}

const admin = getAdminContext

const DATE = /^\d{4}-\d{2}-\d{2}$/

type T = Awaited<ReturnType<typeof getT<"finance">>>

function validate(input: SubscriptionInput, t: T): string | null {
  if (!input.name.trim()) return t("errNameRequired")
  if (input.name.trim().length > 120) return t("errNameTooLong")
  if (!input.category.trim()) return t("errCategoryRequired")
  if (!Number.isFinite(input.amount) || input.amount < 0)
    return t("errAmountInvalid")
  if (input.amount >= 1e13) return t("errAmountTooLarge")
  if (!/^[A-Z]{3}$/.test(input.currency)) return t("errCurrencyInvalid")
  if (
    input.fxRate !== null &&
    (!Number.isFinite(input.fxRate) || input.fxRate <= 0 || input.fxRate > 1e9)
  )
    return t("errRateInvalid")
  if (input.cycle !== "monthly" && input.cycle !== "yearly")
    return t("errCycleRequired")
  if (!DATE.test(input.anchorDate)) return t("errAnchorRequired")
  if (input.endsOn && !DATE.test(input.endsOn)) return t("errEndsInvalid")
  if (input.endsOn && input.endsOn < input.anchorDate)
    return t("errEndsBeforeAnchor")
  if (input.notes.length > 1000) return t("errNotesTooLong")
  return null
}

export async function saveSubscription(
  id: string | null,
  input: SubscriptionInput,
): Promise<Result<{ id: string }>> {
  const [t, ctx] = await Promise.all([getT("finance"), admin()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const invalid = validate(input, t)
  if (invalid) return { success: false, error: invalid }

  const row = {
    name: input.name.trim(),
    category: input.category.trim(),
    // Legacy column name: holds the amount in `currency` units.
    amount_idr:
      input.currency === "IDR"
        ? Math.round(input.amount)
        : Math.round(input.amount * 100) / 100,
    currency: input.currency,
    fx_rate: input.currency === "IDR" ? null : input.fxRate,
    cycle: input.cycle,
    anchor_date: input.anchorDate,
    ends_on: input.endsOn || null,
    notes: input.notes.trim() || null,
  }
  const { data, error } = id
    ? await ctx.supabase
        .from("finance_subscriptions")
        .update(row)
        .eq("id", id)
        .select("id")
        .single()
    : await ctx.supabase
        .from("finance_subscriptions")
        .insert({ ...row, created_by: ctx.userId })
        .select("id")
        .single()
  if (error || !data) return { success: false, error: t("errSaveFailed") }
  revalidatePath("/finance")
  return { success: true, data: { id: data.id } }
}

export async function deleteSubscription(id: string): Promise<Result> {
  const [t, ctx] = await Promise.all([getT("finance"), admin()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const { error } = await ctx.supabase
    .from("finance_subscriptions")
    .delete()
    .eq("id", id)
  if (error) return { success: false, error: t("errDeleteFailed") }
  revalidatePath("/finance")
  return { success: true }
}

/** Yearly income goal, kept in app_settings under finance_goal_<year>. */
export async function setFinanceGoal(
  year: number,
  amountIdr: number | null,
): Promise<Result> {
  const [t, ctx] = await Promise.all([getT("finance"), admin()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  if (!Number.isInteger(year) || year < 2000 || year > 2100)
    return { success: false, error: t("errYearInvalid") }
  const key = `finance_goal_${year}`
  if (amountIdr === null) {
    const { error } = await ctx.supabase
      .from("app_settings")
      .delete()
      .eq("key", key)
    if (error) return { success: false, error: t("errGoalDeleteFailed") }
  } else {
    if (!Number.isFinite(amountIdr) || amountIdr <= 0 || amountIdr >= 1e13)
      return { success: false, error: t("errGoalInvalid") }
    const { error } = await ctx.supabase.from("app_settings").upsert({
      key,
      value: { amount_idr: Math.round(amountIdr) },
      updated_by: ctx.userId,
      updated_at: new Date().toISOString(),
    })
    if (error) return { success: false, error: t("errGoalSaveFailed") }
  }
  revalidatePath("/finance")
  return { success: true }
}

/** Default rates per currency: IDR per 1 unit, markup included. */
export async function setFxRates(
  rates: Record<string, number>,
): Promise<Result> {
  const [t, ctx] = await Promise.all([getT("finance"), admin()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const clean: Record<string, number> = {}
  for (const [code, rate] of Object.entries(rates)) {
    if (!/^[A-Z]{3}$/.test(code) || code === "IDR") continue
    if (!Number.isFinite(rate) || rate <= 0 || rate > 1e9)
      return { success: false, error: t("errRateCodeInvalid", { code }) }
    clean[code] = Math.round(rate * 100) / 100
  }
  const { error } = await ctx.supabase.from("app_settings").upsert({
    key: "finance_fx_rates",
    value: clean,
    updated_by: ctx.userId,
    updated_at: new Date().toISOString(),
  })
  if (error) return { success: false, error: t("errRatesSaveFailed") }
  revalidatePath("/finance")
  return { success: true }
}
