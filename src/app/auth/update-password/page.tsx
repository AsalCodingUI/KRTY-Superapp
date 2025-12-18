"use client"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function UpdatePasswordPage() {
    const router = useRouter()
    const supabase = createClient()

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setSuccess(true)
            // Redirect ke dashboard/login setelah 2 detik
            setTimeout(() => {
                router.push("/login")
            }, 2000)

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update password"
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-1 flex-col justify-center px-4 lg:px-6 bg-surface dark:bg-surface">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">

                <h3 className="mt-6 text-center text-lg font-semibold text-content dark:text-content">
                    Update your password
                </h3>
                <p className="mt-2 text-center text-sm text-content-subtle dark:text-content-subtle">
                    Please enter your new password below.
                </p>

                <div className="mt-6">
                    <form onSubmit={handleUpdatePassword} className="space-y-6">

                        {/* Success Message */}
                        {success && (
                            <div className="rounded-md bg-success/10 p-3 text-sm text-success ring-1 ring-inset ring-success/20">
                                Password updated successfully! Redirecting...
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger ring-1 ring-inset ring-danger/20">
                                {error}
                            </div>
                        )}

                        <div>
                            <Label
                                htmlFor="password"
                                className="text-sm font-medium text-content dark:text-content"
                            >
                                New Password
                            </Label>
                            <Input
                                type="password"
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="mt-2"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <Label
                                htmlFor="confirm-password"
                                className="text-sm font-medium text-content dark:text-content"
                            >
                                Confirm Password
                            </Label>
                            <Input
                                type="password"
                                id="confirm-password"
                                name="confirm-password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="mt-2"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <Button type="submit" className="w-full" isLoading={loading} disabled={loading}>
                            Update password
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-content-subtle dark:text-content-subtle">
                        Remember your password?{' '}
                        <a
                            href="/login"
                            className="font-medium text-primary hover:text-primary/80"
                        >
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}