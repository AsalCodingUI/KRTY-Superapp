/**
 * A friendly line under an email's headline, for the notices that are only
 * a headline ("Pengajuan cuti tahunan kamu disetujui"). Each kind has a few
 * to pick from, so the same notice doesn't always read the same. The tone
 * follows the news: a rejection never gets "selamat liburan".
 *
 * Add lines freely: short, warm, like a teammate talking, never a system
 * voice. One or two sentences.
 */

type Notice = { type: string; title: string; message: string }

const LINES: Record<string, string[]> = {
  leave_approved: [
    "Asik, cutinya aman! Lupain dulu kerjaan, nikmatin waktunya ya.",
    "Udah di-acc nih. Selamat istirahat, semoga pulang-pulang fresh lagi.",
    "Yeay, tinggal packing atau rebahan. Have fun ya!",
    "Cuti aman, kerjaan biar kita yang jaga. Enjoy!",
  ],
  leave_rejected: [
    "Yah, belum bisa kali ini. Coba obrolin bareng atasanmu, siapa tahu ada tanggal yang lebih pas.",
    "Belum di-acc dulu ya. Alasannya bisa kamu cek di halaman Cuti.",
    "Sayang banget belum bisa. Kamu tetap bisa ajuin tanggal lain kok.",
  ],
  leave_request: [
    "Ada yang lagi nunggu kabar nih. Cek bentar ya pas sempat.",
    "Biar dia bisa siap-siap, kasih keputusannya secepatnya ya.",
    "Satu pengajuan nunggu kamu. Nggak lama kok ngeceknya.",
  ],
  attendance_decision: [
    "Kalau ada yang janggal, colek admin aja ya.",
    "Cuma kabar kecil soal absenmu. Kalau ada yang nggak pas, bilang aja.",
  ],
  task_assigned: [
    "Ada kerjaan baru buat kamu. Santai aja, yang penting jalan.",
    "Tugas baru mendarat! Kalau ada yang bingung, tanya aja di komentar.",
    "Satu lagi buat dikerjain. Semangat, kamu pasti bisa!",
  ],
  task_due_tomorrow: [
    "Besok tenggatnya nih. Masih ada waktu, pelan-pelan aja tapi pasti.",
    "Satu hari lagi. Kalau butuh bantuan, colek timnya ya.",
  ],
  task_due_today: [
    "Hari ini tenggatnya. Semangat, tinggal dikit lagi!",
    "Waktunya finishing. Kalau udah beres, jangan lupa tandain selesai ya.",
  ],
  task_due: [
    "Tenang, masih bisa dikejar kok. Kalau butuh waktu lagi, bilang aja ke timnya.",
    "Yang ini udah lewat tenggat nih. Kalau ternyata udah beres, tandain selesai ya.",
    "Nggak apa-apa telat dikit, yang penting dikabarin. Ada kendala?",
  ],
  task_status_done: [
    "Satu lagi beres. Mantap!",
    "Selesai! Makasih udah ngerjain sampai tuntas.",
  ],
  task_status_review: [
    "Lagi dicek nih. Tunggu kabar selanjutnya ya.",
    "Masuk review. Siap-siap kalau ada masukan kecil.",
  ],
  task_status: [
    "Cek bentar buat tahu kenapa dipindah, siapa tahu ada catatan.",
    "Biar sama-sama update, intip detail tugasnya ya.",
  ],
  invoice_due: [
    "Biar nggak telat, cek lagi status pembayarannya ya.",
    "Mungkin perlu kirim pengingat sopan ke klien.",
  ],
  invoice_overdue: [
    "Udah lewat jatuh tempo. Waktunya follow up ke klien.",
    "Coba sapa kliennya, siapa tahu cuma kelupaan.",
  ],
  invoice_paid: [
    "Asik, satu invoice beres! Kerja bagus, tim.",
    "Pembayaran masuk. Makasih udah ngawal sampai lunas.",
  ],
  attendance_reminder: [
    "Kalau lagi di jalan atau ada urusan, santai aja. Tinggal clock in pas udah mulai.",
    "Pagi! Jangan lupa clock in biar jam kerjamu kecatat.",
    "Kalau hari ini cuti atau sakit, ajukan aja biar nggak diingetin lagi.",
  ],
  project_assignment: [
    "Selamat datang di tim! Intip dulu briefnya biar langsung nyambung.",
    "Project baru, petualangan baru. Semoga seru dan lancar ya!",
    "Yuk kenalan dulu sama timnya, mereka udah nunggu.",
  ],
  project_lead: [
    "Sekarang kamu yang pegang kemudi. Kita percaya kamu bisa!",
    "Wah, jadi lead nih. Tim ada di belakangmu, gas!",
    "Tanggung jawab baru, kesempatan baru. Semangat mimpinnya!",
  ],
  calendar_event: [
    "Udah masuk kalender ya. Sampai ketemu di sana!",
    "Catat jamnya biar nggak kelewat. Sampai jumpa!",
  ],
  one_on_one: [
    "Waktunya ngobrol santai. Bawa aja apa yang lagi kepikiran.",
    "Nggak perlu formal, anggap aja ngopi bareng sambil cerita.",
    "Ada yang mau kamu obrolin? Ini waktu yang pas.",
  ],
  review_cycle: [
    "Masukan darimu berarti banget buat teman-teman. Jujur aja, tapi tetap baik ya.",
    "Sempetin bentar buat ngisi ya. Masukan kecil bisa bantu banyak.",
  ],
  review_summary: [
    "Apa pun hasilnya, kamu udah berusaha keras. Bangga sama kamu!",
    "Ambil yang bikin senyum, pelajari sisanya pelan-pelan.",
    "Hasilnya bisa jadi bahan obrolan seru di 1:1 berikutnya.",
  ],
  santuy_presenter: [
    "Siapin topik favoritmu, santai aja, yang penting seru dan berbagi.",
    "Nggak harus sempurna kok, cerita aja hal yang lagi kamu pelajari.",
    "Butuh ide? Proyek terakhir, tools baru, atau hobi juga boleh banget.",
  ],
  santuy_today_presenter: [
    "Semangat ya! Kita semua siap dengerin.",
    "Tarik napas, nikmatin aja. Pasti seru!",
  ],
  santuy_today: [
    "Sempetin mampir ya, siapa tahu dapet ilmu baru.",
    "Bawa kopi atau teh, kita dengerin bareng-bareng.",
    "Dateng tepat waktu ya, biar yang sharing makin semangat.",
  ],
  santuy_change: [
    "Catat ya biar nggak salah jadwal.",
    "Info kecil biar kita semua tetap di jadwal yang sama.",
  ],
  kpi_scored: [
    "Makasih banyak udah kerja keras di project ini!",
    "Lihat rinciannya yuk, ada yang patut kamu banggain di situ.",
  ],
}

/** Which set of lines fits this notice (null: it needs none). */
function kindOf(n: Notice) {
  const text = `${n.title} ${n.message}`.toLowerCase()
  if (n.type === "leave_status")
    return /ditolak|rejected|dibatalkan|cancel/.test(text)
      ? "leave_rejected"
      : /disetujui|approved/.test(text)
        ? "leave_approved"
        : null
  if (n.type === "task_due")
    return /besok/i.test(n.title)
      ? "task_due_tomorrow"
      : /hari ini/i.test(n.title)
        ? "task_due_today"
        : "task_due"
  if (n.type === "task_status")
    return /selesai/i.test(n.title)
      ? "task_status_done"
      : /review/i.test(n.title)
        ? "task_status_review"
        : "task_status"
  if (n.type === "invoice_due")
    return /lewat/i.test(n.title) ? "invoice_overdue" : "invoice_due"
  if (n.type === "santuy_today" && /kamu yang sharing/i.test(n.title))
    return "santuy_today_presenter"
  return n.type in LINES ? n.type : null
}

/** Same notice, same line (a cheap hash of its text); different notices
 *  spread across the set. */
function hash(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function friendlyLine(n: Notice & { id?: string }) {
  const kind = kindOf(n)
  if (!kind) return null
  const lines = LINES[kind]
  return lines[hash(n.id ?? `${n.title}|${n.message}`) % lines.length]
}
