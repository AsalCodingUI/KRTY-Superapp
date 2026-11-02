/**
 * "ctxmenu" strings: the app-wide right-click menu (shared/context-menu).
 * `id` is the source of truth; `en` must have every key.
 */
const id = {
  // Group labels
  groupSelection: "Teks dipilih",
  groupLink: "Link",
  groupImage: "Gambar",
  groupVideo: "Video",
  groupAudio: "Audio",
  groupField: "Kolom isian",
  groupEdit: "Edit",
  groupCode: "Kode",
  groupTable: "Tabel",
  groupButton: "Tombol",
  groupEmail: "Email",
  groupPhone: "Nomor telepon",
  groupDate: "Tanggal",
  groupUrl: "Alamat web",
  groupPage: "Halaman",

  // Undo / redo (shared/undo)
  undo: "Urungkan",
  redo: "Ulangi",

  // Text / selection
  copy: "Salin",
  cut: "Potong",
  paste: "Tempel",
  selectAll: "Pilih semua",
  clearField: "Hapus isi",
  searchApp: "Cari “{text}” di app",

  // Links
  open: "Buka",
  openNewTab: "Buka di tab baru",
  openInBrowser: "Buka di browser",
  copyLink: "Salin link",
  copyLinkText: "Salin teks link",
  sendEmail: "Kirim email",
  copyEmail: "Salin email",
  call: "Telepon",
  whatsapp: "Chat WhatsApp",
  copyNumber: "Salin nomor",
  copyDate: "Salin tanggal",
  copyName: "Salin nama",

  // Images & media
  viewLarge: "Buka besar",
  copyImage: "Salin gambar",
  copyImageLink: "Salin link gambar",
  download: "Unduh",
  play: "Putar",
  pause: "Jeda",
  mute: "Bisukan",
  fullscreen: "Layar penuh",

  // Code & tables
  copyCode: "Salin kode",
  copyCell: "Salin sel",
  copyRow: "Salin baris",
  copyTable: "Salin tabel",

  // Buttons
  runButton: "Klik “{label}”",
  buttonDisabled: "Tombol ini lagi gak aktif",

  // Page
  back: "Kembali",
  forward: "Maju",
  reload: "Muat ulang",
  copyPageLink: "Salin link halaman",
  darkMode: "Mode gelap",
  language: "Bahasa",
  nativeHint: "⇧ + klik kanan: menu browser",

  // Toasts
  copied: "Disalin",
  linkCopied: "Link disalin",
  imageCopied: "Gambar disalin",
  imageCopyFallback: "Gambarnya gak bisa disalin, link-nya yang disalin",
  copyFailed: "Gagal menyalin",
  pasteFailed: "Gak bisa baca clipboard. Pakai ⌘V / Ctrl+V ya",
  downloadStarted: "Mengunduh…",
  actionFailed: "Gagal, coba lagi",

  // Menu chrome
  filterPlaceholder: "Ketik buat nyaring…",
  filterEmpty: "Gak ada yang cocok",
  loading: "Memuat…",
  loadFailed: "Gagal memuat",
  confirmAgain: "Klik lagi buat {label}",
  menuLabel: "Menu konteks",

  // Document editor
  docBlock: "Blok",
  docImage: "Gambar",
  docEmbed: "Embed",
  docPerson: "Orang",
  docTask: "Tugas",
  turnInto: "Ubah jadi",
  duplicate: "Duplikat",
  moveUp: "Pindah ke atas",
  moveDown: "Pindah ke bawah",
  copyMarkdown: "Salin sebagai Markdown",
  delete: "Hapus",
  imageSize: "Ukuran",
  replaceImage: "Ganti gambar",
  embedVersion: "Tampilan",
  openTask: "Buka tugas",
  aiBlock: "AI untuk blok ini",
}

const en: Record<keyof typeof id, string> = {
  groupSelection: "Selected text",
  groupLink: "Link",
  groupImage: "Image",
  groupVideo: "Video",
  groupAudio: "Audio",
  groupField: "Text field",
  groupEdit: "Edit",
  groupCode: "Code",
  groupTable: "Table",
  groupButton: "Button",
  groupEmail: "Email",
  groupPhone: "Phone number",
  groupDate: "Date",
  groupUrl: "Web address",
  groupPage: "Page",

  undo: "Undo",
  redo: "Redo",

  copy: "Copy",
  cut: "Cut",
  paste: "Paste",
  selectAll: "Select all",
  clearField: "Clear",
  searchApp: "Search “{text}” in the app",

  open: "Open",
  openNewTab: "Open in new tab",
  openInBrowser: "Open in browser",
  copyLink: "Copy link",
  copyLinkText: "Copy link text",
  sendEmail: "Send email",
  copyEmail: "Copy email",
  call: "Call",
  whatsapp: "Chat on WhatsApp",
  copyNumber: "Copy number",
  copyDate: "Copy date",
  copyName: "Copy name",

  viewLarge: "View large",
  copyImage: "Copy image",
  copyImageLink: "Copy image link",
  download: "Download",
  play: "Play",
  pause: "Pause",
  mute: "Mute",
  fullscreen: "Full screen",

  copyCode: "Copy code",
  copyCell: "Copy cell",
  copyRow: "Copy row",
  copyTable: "Copy table",

  runButton: "Click “{label}”",
  buttonDisabled: "This button is disabled right now",

  back: "Back",
  forward: "Forward",
  reload: "Reload",
  copyPageLink: "Copy page link",
  darkMode: "Dark mode",
  language: "Language",
  nativeHint: "⇧ + right-click: browser menu",

  copied: "Copied",
  linkCopied: "Link copied",
  imageCopied: "Image copied",
  imageCopyFallback: "Couldn't copy the image, copied its link instead",
  copyFailed: "Couldn't copy",
  pasteFailed: "Can't read the clipboard. Use ⌘V / Ctrl+V",
  downloadStarted: "Downloading…",
  actionFailed: "Something went wrong, try again",

  filterPlaceholder: "Type to filter…",
  filterEmpty: "Nothing matches",
  loading: "Loading…",
  loadFailed: "Couldn't load",
  confirmAgain: "Click again to {label}",
  menuLabel: "Context menu",

  docBlock: "Block",
  docImage: "Image",
  docEmbed: "Embed",
  docPerson: "Person",
  docTask: "Task",
  turnInto: "Turn into",
  duplicate: "Duplicate",
  moveUp: "Move up",
  moveDown: "Move down",
  copyMarkdown: "Copy as Markdown",
  delete: "Delete",
  imageSize: "Size",
  replaceImage: "Replace image",
  embedVersion: "Show as",
  openTask: "Open task",
  aiBlock: "AI on this block",
}

export const ctxmenu = { id, en }
