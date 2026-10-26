/**
 * "auth" strings: sign-in, password update and the admin API's error
 * messages. `id` is the source of truth; `en` must have every key.
 */
const id = {
  loginTitle: "Masuk ke Kretya",
  loginSubtitle: "Pakai akun Google Workspace atau Gmail.",
  loginGoogleFailed: "Gagal masuk dengan Google. Coba lagi.",
  loginConnecting: "Menghubungkan…",
  loginWithGoogle: "Lanjutkan dengan Google",

  updatePasswordTitle: "Perbarui password",
  passwordsMismatch: "Password tidak sama",
  updatePasswordFailed: "Gagal memperbarui password",
  updatePasswordSuccess: "Password berhasil diperbarui! Mengalihkan…",
  newPassword: "Password baru",
  confirmPassword: "Konfirmasi password",
  updatingPassword: "Memperbarui…",
  updatePassword: "Perbarui password",
  rememberPassword: "Ingat password kamu?",
  signIn: "Masuk",

  apiUnauthorized: "Kamu belum masuk.",
  apiForbidden: "Kamu tidak punya akses untuk ini.",
  apiUserNotFound: "Pengguna tidak ditemukan.",
  apiServerError: "Terjadi kesalahan di server.",
  apiInvalidPayload: "Data tidak valid.",
  apiFullNameRequired: "Nama lengkap wajib diisi.",
  apiInvalidEmail: "Masukkan email yang valid.",
  apiMemberEmailExists: "Sudah ada anggota tim dengan email ini.",
  apiCreateMemberFailed: "Gagal menambah anggota tim.",
  apiCannotDeleteSelf: "Kamu tidak bisa menghapus akun yang sedang kamu pakai.",
  apiDeleteLinked:
    "Akun ini masih terhubung ke data lain, jadi belum bisa dihapus.",
  apiDeleteAccountFailed: "Gagal menghapus akun ini.",
  apiDeleteMemberFailed: "Gagal menghapus anggota tim.",
}

const en: Record<keyof typeof id, string> = {
  loginTitle: "Sign in to Kretya",
  loginSubtitle: "Use your Google Workspace or Gmail account.",
  loginGoogleFailed: "Google sign-in failed. Please try again.",
  loginConnecting: "Connecting…",
  loginWithGoogle: "Continue with Google",

  updatePasswordTitle: "Update your password",
  passwordsMismatch: "Passwords do not match",
  updatePasswordFailed: "Failed to update password",
  updatePasswordSuccess: "Password updated successfully! Redirecting…",
  newPassword: "New password",
  confirmPassword: "Confirm password",
  updatingPassword: "Updating…",
  updatePassword: "Update password",
  rememberPassword: "Remember your password?",
  signIn: "Sign in",

  apiUnauthorized: "Unauthorized.",
  apiForbidden: "You don't have access to this.",
  apiUserNotFound: "User not found.",
  apiServerError: "Internal server error.",
  apiInvalidPayload: "Invalid payload.",
  apiFullNameRequired: "Full name is required.",
  apiInvalidEmail: "Please enter a valid email.",
  apiMemberEmailExists: "A team member with this email already exists.",
  apiCreateMemberFailed: "Failed to create team member.",
  apiCannotDeleteSelf: "You cannot delete the account you are currently using.",
  apiDeleteLinked:
    "This account is still linked to other records and cannot be deleted yet.",
  apiDeleteAccountFailed: "Failed to delete this account.",
  apiDeleteMemberFailed: "Failed to delete team member.",
}

export const auth = { id, en }
