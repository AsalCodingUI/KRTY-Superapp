/**
 * "desktopApp" strings: Kretya Flow (the Mac app) in the web app: the
 * sidebar's update / download cards, the how-to dialog and the app's
 * settings page (/settings/app). `id` is the source of truth; `en` must
 * have every key.
 */
const id = {
  // Sidebar cards
  updateTitle: "Update tersedia",
  updateSubtitle: "Versi {version} · lihat yang baru",
  macTitle: "Kretya Flow untuk Mac",
  macSubtitle: "Notifikasi, menubar, shortcut",
  windowsTitle: "Kretya Flow untuk Windows",
  windowsSubtitle: "Notifikasi, tray, shortcut",
  dismiss: "Sembunyikan",
  download: "Download",
  downloadFailed: "Gagal nyiapin download, coba lagi",
  noRelease: "Belum ada versi app yang bisa di-download",

  // Update notification (macOS)
  notifyUpdateTitle: "Kretya Flow versi {version} siap",
  notifyUpdateBody: "Klik buat download versi barunya.",

  // How-to dialog
  howUpdateTitle: "Cara update",
  howUpdateDescription:
    "Kretya Flow {version} lagi di-download di browser. Tinggal 3 langkah:",
  howUpdateStep1: "Buka file DMG-nya dari folder Downloads.",
  howUpdateStep2:
    "Drag Kretya Flow ke folder Applications, terus pilih Replace.",
  howUpdateStep3: "Buka lagi Kretya Flow. Beres!",
  howInstallTitle: "Cara pasang",
  howInstallDescription:
    "Kretya Flow {version} lagi di-download. Tinggal 3 langkah:",
  howInstallStep1: "Buka file DMG-nya dari folder Downloads.",
  howInstallStep2: "Drag Kretya Flow ke folder Applications.",
  howInstallStep3:
    "Buka Kretya Flow dari Applications, terus masuk pakai akunmu.",
  howUpdateStep1Windows: "Buka file setup-nya dari folder Downloads.",
  howUpdateStep2Windows:
    "Kalau muncul Windows SmartScreen, klik More info → Run anyway.",
  howUpdateStep3Windows: "Tunggu selesai, Kretya Flow kebuka lagi. Beres!",
  howInstallStep1Windows: "Buka file setup-nya dari folder Downloads.",
  howInstallStep2Windows:
    "Kalau muncul Windows SmartScreen, klik More info → Run anyway.",
  howInstallStep3Windows:
    "Buka Kretya Flow dari Start, terus masuk pakai akunmu.",
  seeWhatsNew: "Lihat yang baru",
  downloadAgain: "Download lagi",
  gotIt: "Oke",

  // User menu
  menuDownloadMac: "Download app Mac",
  menuDownloadWindows: "Download app Windows",
  menuAppSettings: "Setelan app",

  // Settings page
  pageTitle: "Setelan app",
  macOnlyTitle: "Khusus app Mac",
  macOnlyBody:
    "Setelan ini buat Kretya Flow, app Mac-nya Kretya. Download dulu, terus buka halaman ini dari app-nya.",
  downloadMac: "Download untuk Mac",

  notifSection: "Notifikasi",
  notifDescription:
    "Biar pengumuman, tugas, approval, dan pengingat jadwal muncul di pojok layar.",
  statusOn: "Aktif",
  statusOff: "Belum diizinkan",
  statusDenied: "Ditolak",
  statusUnknown: "Belum kebaca",
  statusOnHint: "Kretya Flow bisa kirim notifikasi.",
  statusOffHint: "macOS belum nanya izin. Klik Nyalakan.",
  statusDeniedHint: "Notifikasi Kretya Flow dimatiin di Pengaturan Sistem.",
  turnOn: "Nyalakan",
  openNotifSettings: "Buka Pengaturan Notifikasi",
  sendTest: "Kirim notifikasi tes",
  testTitle: "Tes notifikasi",
  testBody: "Kalau ini muncul, notifikasi Kretya Flow udah jalan.",
  testSent: "Notifikasi tes dikirim",
  styleLabel: "Gaya",
  styleBanner: "Banners",
  styleAlert: "Alerts",
  styleNone: "Mati",
  badgesLabel: "Badges",
  soundsLabel: "Suara",
  settingOn: "Nyala",
  settingOff: "Mati",
  notifHowTitle: "Cara nyalain di macOS",
  notifStep1:
    "Klik Buka Pengaturan Notifikasi (atau Pengaturan Sistem → Notifikasi → Kretya Flow).",
  notifStep2: "Nyalakan Allow notifications.",
  notifStep3:
    "Pilih Banners (hilang sendiri) atau Alerts (nunggu diklik), terus nyalakan Badges dan Play sound.",

  bgSection: "Jalan di background",
  bgDescription:
    "Nutup jendela nggak bikin Kretya Flow berhenti: app-nya tetap jalan di menubar, jadi notifikasi dan pengingat tetap masuk. Buat keluar beneran, klik kanan ikon menubar → Keluar, atau tekan ⌘Q.",
  bgMenubar: "Tetap jalan di menubar",
  bgMenubarHint: "Tutup jendela = sembunyi, bukan keluar",
  loginLabel: "Buka saat login",
  loginOnHint: "Kretya Flow kebuka sendiri tiap Mac nyala.",
  loginOffHint: "Buka manual dari Applications.",
  loginHowTitle: "Cek di Pengaturan Sistem",
  loginStep1:
    "Klik Buka Login Items (Pengaturan Sistem → Umum → Login Items & Extensions).",
  loginStep2: "Pastikan Kretya Flow ada di daftar Open at Login.",
  loginStep3: "Di Allow in the Background, Kretya Flow harus nyala.",
  openLoginItems: "Buka Login Items",

  aboutSection: "Tentang",
  versionLabel: "Versi {version}",
  checkUpdate: "Cek update",
  checking: "Ngecek…",
  upToDate: "Udah versi terbaru",
  updateReady: "Versi {version} tersedia",
  downloadUpdate: "Download update",

  // In-place updater (0.2.0 and later)
  readyTitle: "Update siap",
  readySubtitle: "Restart buat pasang versi {version}",
  restartToUpdate: "Restart buat update",
  installing: "Lagi masang…",
  notifyReadyTitle: "Kretya Flow {version} siap",
  notifyReadyBody: "Restart buat update",
  downloadingUpdate: "Lagi download versi {version}…",
  downloadProgress: "{done} dari {total}",
  readyHint: "Versi {version} udah ke-download. Restart buat pasang.",
  autoUpdateHint:
    "Update dicek otomatis tiap 6 jam dan di-download di background.",
  lastChecked: "Terakhir dicek {time}",
  neverChecked: "Belum pernah dicek",
  errorNetwork:
    "Nggak bisa nyambung ke server update. Cek VPN atau internetnya, terus coba lagi.",
  errorSignature:
    "File update-nya nggak lolos cek keamanan, jadi nggak dipasang. Coba lagi nanti.",
  errorInstall:
    "Update-nya gagal dipasang. Coba lagi, atau pasang manual dari DMG.",
  errorOther: "Ngecek update-nya gagal. Coba lagi bentar lagi.",
  downloadDmg: "Download DMG",
  latestCheckUpToDate: "Kretya Flow udah versi terbaru",
  errClockIn: "Gagal clock in",
  errBreak: "Gagal mengubah istirahat",
  errClockOut: "Gagal clock out",
  errCompleteTask: "Gagal menandai tugas selesai",
  errApprove: "Gagal menyetujui",
  errReject: "Gagal menolak",
  leaveApproved: "Pengajuan disetujui",
  leaveRejected: "Pengajuan ditolak",
}

const en: Record<keyof typeof id, string> = {
  updateTitle: "Update available",
  updateSubtitle: "Version {version} · see what's new",
  macTitle: "Kretya Flow for Mac",
  macSubtitle: "Notifications, menu bar, shortcuts",
  windowsTitle: "Kretya Flow for Windows",
  windowsSubtitle: "Notifications, tray, shortcuts",
  dismiss: "Hide",
  download: "Download",
  downloadFailed: "Couldn't prepare the download, try again",
  noRelease: "No version of the app to download yet",

  notifyUpdateTitle: "Kretya Flow {version} is ready",
  notifyUpdateBody: "Click to download the new version.",

  howUpdateTitle: "How to update",
  howUpdateDescription:
    "Kretya Flow {version} is downloading in your browser. Three steps:",
  howUpdateStep1: "Open the DMG from your Downloads folder.",
  howUpdateStep2: "Drag Kretya Flow to Applications and choose Replace.",
  howUpdateStep3: "Open Kretya Flow again. Done!",
  howInstallTitle: "How to install",
  howInstallDescription: "Kretya Flow {version} is downloading. Three steps:",
  howInstallStep1: "Open the DMG from your Downloads folder.",
  howInstallStep2: "Drag Kretya Flow to Applications.",
  howInstallStep3: "Open Kretya Flow from Applications and sign in.",
  howUpdateStep1Windows: "Open the setup file from your Downloads folder.",
  howUpdateStep2Windows:
    "If Windows SmartScreen shows up, click More info → Run anyway.",
  howUpdateStep3Windows: "Wait for it to finish; Kretya Flow opens again.",
  howInstallStep1Windows: "Open the setup file from your Downloads folder.",
  howInstallStep2Windows:
    "If Windows SmartScreen shows up, click More info → Run anyway.",
  howInstallStep3Windows: "Open Kretya Flow from Start and sign in.",
  seeWhatsNew: "See what's new",
  downloadAgain: "Download again",
  gotIt: "Got it",

  menuDownloadMac: "Download Mac app",
  menuDownloadWindows: "Download Windows app",
  menuAppSettings: "App settings",

  pageTitle: "App settings",
  macOnlyTitle: "Mac app only",
  macOnlyBody:
    "These settings are for Kretya Flow, Kretya's Mac app. Download it, then open this page from the app.",
  downloadMac: "Download for Mac",

  notifSection: "Notifications",
  notifDescription:
    "So announcements, tasks, approvals and schedule reminders show up in the corner of your screen.",
  statusOn: "On",
  statusOff: "Not allowed yet",
  statusDenied: "Denied",
  statusUnknown: "Unknown",
  statusOnHint: "Kretya Flow can send notifications.",
  statusOffHint: "macOS hasn't asked yet. Click Turn on.",
  statusDeniedHint: "Kretya Flow's notifications are off in System Settings.",
  turnOn: "Turn on",
  openNotifSettings: "Open Notification Settings",
  sendTest: "Send a test notification",
  testTitle: "Test notification",
  testBody: "If you see this, Kretya Flow notifications work.",
  testSent: "Test notification sent",
  styleLabel: "Style",
  styleBanner: "Banners",
  styleAlert: "Alerts",
  styleNone: "Off",
  badgesLabel: "Badges",
  soundsLabel: "Sounds",
  settingOn: "On",
  settingOff: "Off",
  notifHowTitle: "Turning them on in macOS",
  notifStep1:
    "Click Open Notification Settings (or System Settings → Notifications → Kretya Flow).",
  notifStep2: "Turn on Allow notifications.",
  notifStep3:
    "Pick Banners (go away by themselves) or Alerts (stay until clicked), then turn on Badges and Play sound.",

  bgSection: "Runs in the background",
  bgDescription:
    "Closing the window doesn't stop Kretya Flow: it keeps running in the menu bar, so notifications and reminders still arrive. To really quit, right-click the menu bar icon → Quit, or press ⌘Q.",
  bgMenubar: "Keeps running in the menu bar",
  bgMenubarHint: "Closing the window hides it, it doesn't quit",
  loginLabel: "Open at login",
  loginOnHint: "Kretya Flow opens by itself when your Mac starts.",
  loginOffHint: "Open it yourself from Applications.",
  loginHowTitle: "Check in System Settings",
  loginStep1:
    "Click Open Login Items (System Settings → General → Login Items & Extensions).",
  loginStep2: "Make sure Kretya Flow is listed under Open at Login.",
  loginStep3: "Under Allow in the Background, Kretya Flow should be on.",
  openLoginItems: "Open Login Items",

  aboutSection: "About",
  versionLabel: "Version {version}",
  checkUpdate: "Check for updates",
  checking: "Checking…",
  upToDate: "You're on the latest version",
  updateReady: "Version {version} available",
  downloadUpdate: "Download update",

  readyTitle: "Update ready",
  readySubtitle: "Restart to install version {version}",
  restartToUpdate: "Restart to update",
  installing: "Installing…",
  notifyReadyTitle: "Kretya Flow {version} is ready",
  notifyReadyBody: "Restart to update",
  downloadingUpdate: "Downloading version {version}…",
  downloadProgress: "{done} of {total}",
  readyHint: "Version {version} is downloaded. Restart to install it.",
  autoUpdateHint:
    "Updates are checked every 6 hours and downloaded in the background.",
  lastChecked: "Last checked {time}",
  neverChecked: "Not checked yet",
  errorNetwork:
    "Couldn't reach the update server. Check the VPN or your internet, then try again.",
  errorSignature:
    "The update didn't pass the security check, so it wasn't installed. Try again later.",
  errorInstall:
    "The update couldn't be installed. Try again, or install it from the DMG.",
  errorOther: "Checking for updates failed. Try again in a bit.",
  downloadDmg: "Download DMG",
  latestCheckUpToDate: "Kretya Flow is up to date",
  errClockIn: "Couldn't clock in",
  errBreak: "Couldn't change the break",
  errClockOut: "Couldn't clock out",
  errCompleteTask: "Couldn't mark the task done",
  errApprove: "Couldn't approve",
  errReject: "Couldn't reject",
  leaveApproved: "Request approved",
  leaveRejected: "Request rejected",
}

export const desktopApp = { id, en }
