-- Yang baru: the first entries (2 Nov 2026), generated from the guides
-- that shipped as typed content. Re-running leaves existing rows alone
-- (ON CONFLICT DO NOTHING), so edits made in the app stay.

INSERT INTO public.whats_new_entries
  (id, date, title, summary, tags, area, audience, surface, thumbnail_url, body, published, sort)
VALUES
('klik-kanan', '2026-11-02', 'Klik kanan di mana aja', 'Menu klik kanan sendiri di semua halaman: salin, buka di tab baru, unduh gambar, sampai aksi khusus tiap halaman. Bisa dari keyboard dan long-press di HP juga.', ARRAY['new']::text[], 'general', 'everyone', 'app', '/whats-new/ctx-menu-page.webp', '## Cara buka menunya

1. **Mouse / trackpad:** klik kanan (atau klik dua jari) di mana aja. Menunya muncul di posisi kursor.
2. **Keyboard:** fokus ke tombol atau baris yang kamu mau (pakai Tab), lalu tekan **Shift+F10** atau tombol **Menu** di keyboard. Menunya muncul di posisi kursor teks kalau ada, kalau nggak di pojok elemennya.
3. **HP / tablet:** tahan jari di kartu, baris, atau item sidebar sekitar setengah detik. Jangan digeser, nanti batal. Lepas jari nggak bakal ikut buka link di bawahnya.

Tutup menunya pakai **Esc**, klik di luar, atau scroll halaman.

> [!NOTE]
> Butuh menu bawaan browser (misalnya buat inspect atau ekstensi)? Tahan **Shift** (atau **⌥ Option**) waktu klik kanan. Di bawah menu juga ada pengingatnya: "⇧ + klik kanan: menu browser". Di dalam embed (Figma, YouTube, dll.) yang muncul tetap menu browser.

> [!NOTE]
> Di iPhone/iPad, teks biasa dan link tetap pakai long-press bawaan iOS (buat pilih teks). Long-press app cuma di kartu, baris, dan item sidebar.

## Yang bisa dilakukan di mana aja

Isi menunya ikut apa yang kamu klik. Yang paling spesifik ada paling atas, tiap kelompok ada judul kecilnya.

| Kamu klik kanan di… | Pilihan |
|---|---|
| Teks yang dipilih | **Salin**, **Cari "…" di app** (sama kayak ⌘K) |
| Link | **Buka**, **Buka di tab baru**, **Salin link**, **Salin teks link** |
| Email / nomor telepon di teks | **Kirim email**, **Salin email** · **Chat WhatsApp**, **Telepon**, **Salin nomor** |
| Tanggal di teks | **Salin tanggal**, cari tanggal itu di app |
| Gambar | **Buka besar**, **Salin gambar**, **Salin link gambar**, **Unduh** |
| Video / audio | **Putar** / **Jeda**, **Bisukan**, **Layar penuh**, **Unduh** |
| Kolom isian | **Potong**, **Salin**, **Tempel**, **Pilih semua**, **Hapus isi** |
| Blok kode | **Salin kode** |
| Tabel | **Salin sel**, **Salin baris**, **Salin tabel** (bisa langsung ditempel ke spreadsheet) |
| Tombol | **Klik "…"** (abu-abu kalau tombolnya lagi nggak aktif) |
| Halaman | **Kembali**, **Maju**, **Muat ulang**, **Salin link halaman**, **Mode gelap**, **Bahasa** |

Nomor 08… otomatis jadi 628… waktu dibuka di WhatsApp. Bagian **Halaman** muncul langsung kalau nggak ada yang lain; kalau ada, dia dilipat jadi satu submenu **Halaman** di paling bawah.

## Tips biar cepat

- **Ketik buat nyaring.** Kalau menunya panjang (10 pilihan ke atas), langsung ketik aja, misalnya "salin". Isi submenu ikut dicari dan ditampilkan kayak "Halaman › Muat ulang". Backspace hapus huruf, Esc kosongin filter.
- **Klik dua kali buat yang berisiko.** Pilihan kayak hapus atau keluar berubah jadi "Klik lagi buat …" dulu. Klik sekali lagi baru jalan, jadi nggak ada yang kehapus nggak sengaja.
- **Shortcut di kanan.** Pilihan yang punya shortcut nunjukin tombolnya (⌘C di Mac, Ctrl+C di Windows).
- **Arrow key** buat pindah pilihan, **Enter** buat pilih, **→ / ←** buat buka dan tutup submenu.

> [!NOTE]
> Menu klik kanan sengaja nggak ada AI-nya, karena AI makan kuota. AI cuma ada di editor (report, catatan, deskripsi tugas). Lihat catatan **AI buat nulis di editor**.', true, 0),
('klik-kanan-per-halaman', '2026-11-02', 'Menu klik kanan di tiap halaman', 'Selain menu umum, tiap halaman punya aksinya sendiri: project, tugas, editor, library, report, kalender, cuti, kehadiran, notifikasi, dan tim.', ARRAY['new']::text[], 'general', 'everyone', 'app', '/whats-new/task-menu.webp', '## Polanya sama di mana-mana

Semua yang bisa dibuka sebagai halaman (item sidebar, baris project, report, notifikasi…) punya tiga pilihan paling atas: **Buka**, **Buka di tab baru**, dan **Salin link**. Di app Mac, **Buka di tab baru** diganti **Buka di browser**.

Di bawahnya baru aksi khusus. Yang muncul ikut hak akses kamu: kalau tombolnya nggak ada buat kamu di halaman itu, di menu juga nggak ada.

Tombol akun di sidebar juga bisa diklik kanan: **Profil saya**, **Salin email**, **Hubungi admin**, dan **Keluar** (klik dua kali).

## Project

Di kartu (kanban), baris (list), atau tabel project:

- **Buka**, **Buka di tab baru**, **Salin link**, **Salin nama**
- **Pindahkan ke** → **Belum mulai**, **Berjalan**, **Review**, **Selesai**, **Diarsipkan** (PM dan stakeholder)
- **Ubah** dan **Hapus** (stakeholder)

Panduan lengkapnya di catatan **Project: bikin, pindahin status, geser antar kolom**.

## Tugas

Klik kanan kartu tugas di board, baris di list, atau tugas yang lagi dibuka:

1. **Salin judul** (dan **Buka project** di daftar lintas project kayak **Tugas saya**)
2. **Tandai selesai** / **Tandai belum selesai**
3. **Status** → **Akan dikerjakan**, **Dikerjakan**, **Review**, **Selesai**
4. **Assign ke** → anggota tim (kamu paling atas, ditandai **Kamu**), atau **Tanpa PIC**
5. **Tenggat** → **Hari ini**, **Besok**, **Minggu depan**, **Pilih tanggal…**, **Hapus tenggat**
6. **Pindah ke fase** → fase-fase project, atau **Tanpa fase** (nggak muncul di project tanpa fase dan di subtugas)
7. **Ubah judul**, **Tambah subtugas**, **Duplikat**, **Hapus tugas**

Subtugas punya menu sendiri (**Tandai selesai**, **Salin judul**, **Buka tugas induk**, **Hapus subtugas**). Komentar: **Salin komentar**, dan **Hapus komentar** buat yang nulis. Klik kanan judul kolom board buat **Tambah kartu**.

![Menu klik kanan di kartu tugas](/whats-new/task-menu.webp#size=wide)

## Editor (report, catatan, aturan)

- **Blok:** **Ubah jadi** (Teks, Judul 1–3, Daftar, Daftar bernomor, Checklist, Kutipan, Callout, Toggle), **Salin sebagai Markdown**, **AI untuk blok ini**, **Duplikat**, **Pindah ke atas**, **Pindah ke bawah**, **Hapus** (⌘Z buat batalin).
- **Gambar:** **Ukuran** (Kecil / Sedang / Lebar), **Buka besar**, **Ganti gambar**, **Salin link gambar**, **Unduh**.
- **Embed:** **Buka**, **Salin link**, **Tampilan** (Link / Kartu / Preview · Kecil / Preview · Lebar).
- **Mention:** tugas → **Buka tugas**, **Salin link**; orang → **Salin nama**.

Kalau dokumennya cuma dibaca (bukan lagi diedit), yang tersisa cuma aksi baca: salin, lihat, unduh.

## Library & Aset

- **File:** **Pratinjau** (atau **Buka** buat catatan), **Unduh**, **Salin link**, **Ubah nama**, **Pindah ke folder** (termasuk **Library (tanpa folder)**), **Duplikat**, **Hapus**.
- **Folder:** **Upload ke folder ini**, **Catatan baru di folder ini**, **Ubah nama folder**, **Hanya internal**, **Hapus**.
- **Ruang kosong:** **Upload**, **Upload resolusi asli (tanpa kompres)**, **Folder baru**, **Catatan baru**.

## Report

Di baris report (halaman Report project, atau report terbaru di Dashboard project):

- **Buka**, **Buka di tab baru**, **Salin link tim**
- **Bagikan** (penulis atau admin, kalau belum dibagikan; link klien langsung tersalin)
- **Salin link klien** (kalau udah dibagikan), **Matikan link**
- **Yang baca** → 10 kunjungan terakhir klien, lengkap sama perangkat dan sumbernya (**Link** / **Portal**)
- **Duplikat jadi report baru**, **Hapus**

## Kalender

- **Jadwal:** **Ubah** (jadwal kamu sendiri) atau **Lihat detail**, **Buka tugas** buat tenggat tugas, **Buka pengajuan** buat cuti, **Gabung Meet**, **Salin link Meet**, **Salin detail**. Buat jadwal yang bisa kamu ubah: **Duplikat**, **Pindah ke tanggal…** (jamnya tetap), **Hapus**.
- **Slot kosong:** **Jadwal baru di sini** (atau **Jadwal seharian di sini** di baris seharian), **Lihat minggu ini**, **Lihat bulan ini**, **Ke hari ini**, **Pergi ke tanggal…**.
- **Toolbar:** **Jadwal baru**, **Ke hari ini**, **Pergi ke tanggal…**, **Sebelumnya**, **Berikutnya**, **Tampilan**, dan **Yang tampil** (centang kalender mana yang muncul; menunya tetap kebuka selama kamu centang-centang).
- **Sharing Santuy:** **Atur jadwal**, dan **Tunjuk orang buat minggu ini** (PM dan stakeholder).

## Cuti & Kehadiran

- **Pengajuan cuti kamu:** **Lihat detail**, **Ubah tanggal** / **Ajukan ulang**, **Batalkan pengajuan**, **Salin rentang tanggal**, **Lihat di kalender** (kalau disetujui), **Lihat bukti**.
- **Riwayat kehadiran kamu:** **Minta hapus** (sesi yang udah selesai), **Salin jam**.

## Cuti & Kehadiran (yang menyetujui) (khusus stakeholder)

- **Pengajuan yang nunggu:** **Setujui**, **Tolak…**, **Tinjau di kotak masuk**, **Buka profil**, **Salin rentang tanggal**, **Hapus**.
- **Inbox approval:** baris cuti → **Setujui**, **Tolak…**, **Buka profil**, **Salin rentang tanggal**; baris hapus absen → **Hapus data** (klik dua kali), **Tolak permintaan**, **Buka profil**, **Salin jam**.
- **Riwayat kehadiran tim:** **Tinjau hapus**, **Tutup sesi**, **Edit**, **Buka profil**, **Salin jam**.
- **Saldo cuti:** **Buka profil**.

## Notifikasi

- **Satu notifikasi:** **Buka**, **Buka di tab baru**, **Salin link** (sekalian ditandai dibaca), **Tandai dibaca** / **Tandai belum dibaca**, **Hapus notifikasi**.
- **Ruang kosong di panel:** **Baca semua**, dan **Tampilkan** → **Belum dibaca** / **Semua**.

## Tim & akses (khusus stakeholder)

- **Direktori tim:** **Lihat KPI**, **Salin nama**, **Salin email**, **Kirim email**.
- **Anggota & akses:** **Lihat profil**, **Lihat sebagai**, **Lihat KPI**, **Ubah role** (Karyawan / Stakeholder), **Ubah jabatan**, **Ubah tim** (termasuk **Tanpa tim**), **Ubah status**, **Ganti foto**, **Hapus anggota**. **Lihat sebagai** dan **Hapus anggota** nggak muncul di akun kamu sendiri.
- Panel notifikasi juga punya **Pengumuman** di ruang kosongnya.

Halaman lain (Klien, Kontrak, Keuangan, Proses, Pembayaran, KPI tim) juga udah punya menu klik kanannya masing-masing. Coba aja klik kanan barisnya.', true, 1),
('project-pm', '2026-11-02', 'Project: bikin, pindahin status, geser antar kolom', 'PM sekarang bisa bikin project sendiri dan mindahin status project lewat menu Pindahkan ke atau tinggal digeser di kanban dan list.', ARRAY['new']::text[], 'projects', 'pm', 'app', '/whats-new/ctx-menu-project.webp', '## Siapa yang bisa

- **PM dan stakeholder:** bikin project baru dan mindahin status project.
- **PM** cuma bisa mindahin project yang dia ikut di dalamnya.
- **Stakeholder** tetap satu-satunya yang bisa **Ubah** (nama, tanggal, tim, status) dan **Hapus** project.

Karyawan tetap bisa buka project yang dia ikut, dan klik kanan buat **Buka**, **Buka di tab baru**, **Salin link**, atau **Salin nama**.

## Bikin project baru

1. Buka **Project** (ruang kerja **Project** di sidebar).
2. Klik **Project baru** di kanan atas. Di HP tombolnya cuma ikon +.
3. Isi **Nama** (wajib), misalnya "Website Westura".
4. Isi tanggal **Mulai** dan **Selesai** (wajib). Kuartalnya ikut tanggal selesai.
5. Pilih **Proses**. Fase, langkah, dan task disalin dari proses yang kamu pilih. Mau tanpa fase? Pilih **Tanpa fase** (lihat catatan **Project tanpa fase**).
6. Pilih **Kategori** kalau perlu (lihat catatan **Kategori project**), dan isi **Deskripsi**.
7. Di **Tim**, klik **Tambah anggota…**, pilih orangnya, atur perannya, dan nyalakan **Lead** buat yang mimpin. Peran menentukan kompetensi yang dinilai.
8. Klik **Buat project**. Muncul notifikasi "Project dibuat".

> [!NOTE]
![Dialog Project baru](/whats-new/projects-new.webp)

> Project baru selalu mulai di status **Belum mulai**. PM yang bikin otomatis masuk tim sebagai **Project Manager**.

## Pindahin status lewat menu

Urutan statusnya: **Belum mulai** → **Berjalan** → **Review** → **Selesai**, plus **Diarsipkan**.

Ada empat cara, hasilnya sama:

1. **Tombol ⋯** di kartu atau baris → **Pindahkan ke** → pilih status.
2. **Klik kanan** kartu atau baris → **Pindahkan ke** → pilih status. Status yang sekarang dicentang.
3. **Tampilan tabel:** klik kanan barisnya (di tabel nggak ada tombol ⋯ dan nggak bisa digeser).
4. **Di dalam project:** klik tombol status di header project.

Setelah dipindah muncul notifikasi kayak "Website Westura → Review".

![Menu Pindahkan ke di kartu project](/whats-new/ctx-menu-project.webp#size=wide)

## Geser antar kolom

**Kanban** (tampilan default):

1. Arahkan kursor ke kartu project, muncul pegangan (grip).
2. Tarik kartunya ke kolom lain (**Belum mulai**, **Berjalan**, **Review**, **Selesai**), lalu lepas.
3. Klik biasa tetap buka project. Geser baru kehitung setelah kursor gerak beberapa piksel, jadi nggak bakal kegeser nggak sengaja.

**List:**

1. Baris dikelompokkan per status, **Diarsipkan** awalnya tertutup.
2. Tarik barisnya ke grup status lain. Grup yang kosong muncul sebagai tempat jatuh dengan tulisan "Geser project ke sini".

> [!TIP]
> Perubahannya langsung kelihatan. Kalau gagal disimpan (misalnya koneksi putus), kartunya balik sendiri ke tempat semula.

> [!NOTE]
> Project yang diarsipkan nggak tampil di kanban. Di bawah board ada tautan "Lihat di tampilan list" buat lihat semuanya.', true, 2),
('project-urutkan-filter', '2026-11-02', 'Urutkan & filter project', 'Daftar project bisa diurutkan dan difilter: project saya aja, status, klien, proses, atau kategori. Pilihannya diingat di perangkat kamu.', ARRAY['new']::text[], 'projects', 'everyone', 'app', '/whats-new/projects-filter.webp', '## Cara pakai

1. Buka **Project**.
2. Klik **Filter** di samping kotak cari.
3. Di **Urutkan**, pilih salah satu: **Tenggat terdekat** (default), **Mulai terbaru**, **Terakhir diubah**, atau **Nama (A–Z)**.
4. Di **Filter**, centang **Project saya aja** buat lihat yang kamu ikut aja, atau buka **Status**, **Klien**, **Proses**, **Kategori** buat nyaring lebih jauh.
5. Tombol **Filter** nunjukin angka jumlah filter yang aktif. Klik **Hapus semua filter** buat balik ke semua.

Kotak cari ("Cari project atau klien…") juga ikut nyari nama kategori.

## Tiga tampilan

Pakai tombol tampilan di kanan atas:

- **Tampilan kanban:** kartu per status, bisa digeser (PM & stakeholder).
- **Tampilan list:** baris per grup status, dengan kolom **Project**, **Tim**, **Mulai**, **Tenggat**.
- **Tampilan tabel:** semua kolom (**Status**, **Kategori**, **Kuartal**, **Jadwal**, **Tim**).

Tampilan, urutan, dan filter yang kamu pilih diingat di browser kamu.

> [!TIP]
> Kartu yang lewat tenggat ada ikon peringatan "Lewat tenggat". Urutkan pakai **Tenggat terdekat** biar yang mepet kelihatan duluan.', true, 3),
('project-kategori', '2026-11-02', 'Kategori project', 'Project bisa dikasih kategori, misalnya Website atau Branding, buat dikelompokkan dan difilter.', ARRAY['new']::text[], 'projects', 'pm', 'app', NULL, '## Pilih atau bikin kategori

1. Waktu bikin project (atau waktu **Ubah** project, khusus stakeholder), buka kolom **Kategori**.
2. Ketik di "Cari atau tambah kategori…".
3. Kalau kategorinya udah ada, pilih aja. Kalau belum, pilih **Tambah "nama kategori"**. Kategori baru langsung bisa dipakai semua orang.
4. Mau kosong? Pilih **Tanpa kategori**.

Nama kategori maksimal 60 karakter dan nggak boleh dobel (besar-kecil huruf dianggap sama).

## Muncul di mana

- **Tampilan list:** di bawah nama project (kategori · klien · kuartal).
- **Tampilan tabel:** kolom **Kategori**.
- **Filter → Kategori:** nyaring project per kategori. Semua orang bisa pakai filter ini.

> [!NOTE]
> Untuk sekarang kategori belum bisa diganti nama atau dihapus dari app. Kalau perlu, kabari admin.', true, 4),
('project-tanpa-fase', '2026-11-02', 'Project tanpa fase', 'Buat side task atau klien retainer, project bisa jalan terus tanpa fase. Task tetap dikelola seperti biasa.', ARRAY['new']::text[], 'projects', 'pm', 'app', NULL, '## Bikin project tanpa fase

1. Klik **Project baru**.
2. Di **Proses**, pilih **Tanpa fase** (paling bawah, setelah garis).
3. Keterangannya berubah jadi "Proyek jalan terus tanpa fase, cocok buat side task atau klien retainer." Nggak ada yang disalin dari proses.
4. Isi sisanya, lalu **Buat project**.

![Pilihan Tanpa fase di kolom Proses](/whats-new/projects-no-phase.webp)

Di project ini, rel fase disembunyikan dan baris properti project nunjukin **Berjalan terus** (ikon ∞), bukan persentase progres.

## Matikan fase di project yang udah jalan (khusus stakeholder)

1. Buka project, lalu di **Dashboard** klik **⋯** di samping **Fase** → **Jangan pakai fase**. Bisa juga dari **Pengaturan** project → kartu **Proses** → pilih **Tanpa fase**.
2. Baca konfirmasinya: semua fase dan langkahnya dihapus, termasuk tenggat dan skor SLA-nya.
3. Klik **Hapus semua fase**.

Task nggak ada yang hilang. Semuanya tetap ada, cuma jadi **Tanpa fase**.

> [!WARNING]
> Tenggat fase dan skor SLA fase ikut kehapus dan nggak bisa dibalikin. Fasenya sendiri bisa dipakai lagi kapan aja.

## Pakai fase lagi (khusus stakeholder)

1. Di **Dashboard** project ada kartu **Tanpa fase**. Klik **Pakai fase**.
2. Pilih **Dari proses** → pilih prosesnya, atau **Tambah fase sendiri**.
3. Dari **Pengaturan** project juga bisa: pilih proses di kartu **Proses**, lalu konfirmasi **Pakai fase**.

Fase, langkah, dan task dari proses itu ditambahkan. Task yang udah ada tetap, tanpa fase. Pindahin satu-satu lewat klik kanan → **Pindah ke fase**.', true, 5),
('tugas-klik-kanan', '2026-11-02', 'Atur tugas tanpa buka tugasnya', 'Klik kanan tugas buat ganti status, assign, atur tenggat, pindah fase, duplikat, atau hapus. Semua anggota project bisa.', ARRAY['new']::text[], 'tasks', 'everyone', 'app', '/whats-new/task-menu.webp', '## Langkahnya

1. Buka **Tugas** di project, atau **Tugas saya** di sidebar.
2. Klik kanan kartu atau baris tugas (di HP: tahan jarinya).
3. Pilih yang kamu perlu:
   - **Tandai selesai** buat cepat beresin.
   - **Status** → pindahin ke **Akan dikerjakan**, **Dikerjakan**, **Review**, atau **Selesai**.
   - **Assign ke** → pilih orang. Kamu ada paling atas. **Tanpa PIC** buat ngosongin.
   - **Tenggat** → **Hari ini**, **Besok**, **Minggu depan**, atau **Pilih tanggal…**.
   - **Pindah ke fase** → pilih fase project.
4. Mau bikin mirip? **Duplikat**. Mau nambah langkah kecil? **Tambah subtugas**.

> [!TIP]
> Menunya panjang? Langsung ketik, misalnya "besok", nanti pilihannya kesaring.', true, 6),
('editor-embed', '2026-11-02', 'Embed Figma, Drive, YouTube, Loom di report', 'Tempel link di editor, lalu pilih tampil sebagai Link, Kartu, atau Preview yang bisa langsung diputar dan digeser.', ARRAY['new']::text[], 'editor', 'everyone', 'app', '/whats-new/editor-embed.webp', '## Bisa dipakai di mana

Di editor report project, catatan (**Catatan saya** dan catatan di Library), dan aturan (buat yang bisa nulis aturan). Klien yang buka report juga lihat embed-nya.

## Cara 1: lewat /embed

1. Di baris kosong, ketik **/** lalu "embed" (atau pilih **Embed** dari menu **Sisipkan blok**).
2. Tempel link di kotak "Tempel link Figma, Drive, Docs, YouTube, Loom…".
3. Tekan **Enter**.
4. Link yang punya preview langsung jadi **Preview** lebar. Link lain jadi **Kartu** dengan judul halamannya.

Link-nya harus diawali https://. Mau batal? Tekan **Esc**, atau hapus kotaknya waktu masih kosong.

## Cara 2: tempel langsung

1. Salin link dari Figma, Google Drive, YouTube, dll.
2. Tempel di baris kosong, sendirian (nggak ada teks lain di baris itu).
3. Link masuk sebagai link biasa dengan menu kecil di atasnya. Pilih **Kartu** atau **Preview**.

## Ganti tampilannya

Klik embed-nya, lalu pilih di menu kecil:

| Pilihan | Hasilnya |
|---|---|
| **Link** | Teks link biasa |
| **Kartu** | Kotak dengan judul dan alamat halamannya |
| **Preview** | Isinya tampil langsung (video bisa diputar, Figma bisa digeser). Pilih lebar **Kecil** atau **Lebar** |

Atau klik kanan embed-nya → **Tampilan** → **Link**, **Kartu**, **Preview · Kecil**, **Preview · Lebar**.

Kalau **Preview** abu-abu ("Link ini tidak punya preview"), situsnya nggak bisa ditampilkan langsung, jadi pakai **Kartu**.

![Pilihan tampilan embed](/whats-new/editor-embed.webp#size=wide)

## Situs yang bisa Preview

- **Figma:** file, design, prototype, board (FigJam), slides, deck, make
- **Google Drive:** file dan folder
- **Google Docs, Sheets, Slides, Forms**
- **YouTube:** video, Shorts, youtu.be
- **Loom** (link share) dan **Vimeo**

Situs lain tetap bisa jadi **Kartu**.

> [!NOTE]
> File Google Drive/Figma cuma kelihatan isinya buat yang punya akses ke file itu. Buat report klien, pastikan setelan share file-nya udah bener.', true, 7),
('editor-blok-baru', '2026-11-02', 'Callout, toggle, galeri, dan garis pemisah', 'Blok baru di editor: kotak berwarna buat info atau peringatan, bagian yang bisa dibuka-tutup, galeri gambar yang bisa digeser, dan gambar yang bisa dibuka besar.', ARRAY['new']::text[], 'editor', 'everyone', 'app', '/whats-new/editor-slash.webp', '## Menu / (Sisipkan blok)

Di baris kosong ketik **/**, menu **Sisipkan blok** muncul. Ketik buat nyaring (bisa bahasa Indonesia atau Inggris), **↑ ↓** buat pilih, **Enter** buat sisipkan, **Esc** buat tutup.

Isinya: **Teks**, **Judul 1/2/3**, **Daftar**, **Daftar bernomor**, **Checklist**, **Kutipan**, **Tabel**, **Garis pemisah**, **Blok kode**, **Gambar**, **Gambar (resolusi asli)**, **Embed**, **Callout**, **Toggle**, **Galeri**, dan **Lampiran**.

![Menu Sisipkan blok](/whats-new/editor-slash.webp)

## Callout

1. Ketik **/callout** lalu Enter. Teks yang udah ada di baris itu ikut masuk ke dalamnya.
2. Warnanya mulai dari **Info**. Klik ikon di kiri callout ("Ganti warna callout") buat ganti ke **Sukses**, **Peringatan**, atau **Bahaya**.
3. Mau ngeluarin isinya dari callout? Taruh kursor di awal, tekan **Backspace**.

> [!TIP]
> Kayak ini. Pakai callout buat hal yang nggak boleh kelewat, misalnya "Butuh dari klien".

## Toggle

1. Ketik **/toggle** lalu Enter. Teks di baris itu jadi judulnya ("Judul toggle").
2. Tekan **Enter** di judul buat mulai nulis isinya.
3. Klik panah di kiri buat buka atau tutup.
4. **Backspace** di awal judul ngilangin toggle-nya, teksnya tetap ada.

Buka-tutup nggak dihitung sebagai edit. Waktu dibaca (termasuk sama klien), toggle selalu mulai tertutup.

<details>
<summary>Contoh toggle</summary>

Isi yang panjang, kayak detail teknis atau log revisi, enak disimpan di sini biar report tetap ringkas.

</details>

## Galeri

1. Ketik **/galeri** lalu Enter, pilih beberapa gambar sekaligus.
2. Gambarnya diupload dan tampil dalam satu baris yang bisa digeser ke samping.
3. Tambah lagi lewat kotak **Tambah gambar** di ujung baris.
4. Ubah urutan dengan menyeret gambarnya ("Seret buat ganti urutan").
5. Arahkan kursor ke gambar buat **Buka** atau **Hapus gambar**. Hapus gambar terakhir = galerinya ikut hilang.

Di laptop pakai panah **Sebelumnya / Berikutnya** di sisi galeri, di HP tinggal geser.

## Ukuran gambar dan lihat besar

- **Ukuran:** klik gambar di editor, pilih **Kecil**, **Sedang** (default), atau **Lebar**. Bisa juga klik kanan → **Ukuran**.
- **Lihat besar:** waktu baca, klik gambarnya. Waktu edit, klik gambar → **Buka**.
- Di tampilan besar, semua gambar di dokumen (termasuk galeri) bisa dilewati satu-satu: tombol **‹ ›**, tombol panah **← →** di keyboard, atau geser di HP. Ada penghitung kayak "2 / 5".
- Tutup pakai **Esc**, tombol ×, atau klik di samping gambar.

## Garis pemisah

Dua cara:

1. Ketik **/garis** (atau "divider") → **Garis pemisah**.
2. Ketik **---** sendirian di satu baris, lalu tekan **Enter**. (*** atau ___ juga bisa.)

Garisnya baru muncul setelah Enter, jadi ngetik tanda minus biasa nggak bakal keganti.

## Pindahin blok

Arahkan kursor ke blok, muncul dua tombol di kiri:

- **+** ("Tambah blok di bawah"): bikin baris baru di bawahnya dan buka menu **/**.
- **Pegangan** (titik-titik): tarik buat mindahin blok. Garis biru nunjukin tempat jatuhnya, halaman ikut scroll kalau kamu tarik ke ujung. **Esc** buat batal. Klik pegangannya buat milih blok (jadi biru muda).

Tiap pindah = satu langkah undo (⌘Z). Bisa juga klik kanan blok → **Pindah ke atas** / **Pindah ke bawah**. Sekarang geser blok juga jalan di app Mac.', true, 8),
('editor-mention', '2026-11-02', 'Sebut orang atau tugas pakai @', 'Ketik @ di report buat nyebut orang atau tugas. Orang yang disebut di report dapat notifikasi, sekali per report.', ARRAY['new']::text[], 'editor', 'everyone', 'app', NULL, '## Cara nyebut

1. Ketik **@** di mana aja di teks.
2. Muncul daftar **Sebut orang atau tugas**, dibagi **Orang** dan **Tugas**.
3. Ketik beberapa huruf buat nyaring, misalnya "@desain" atau sebagian nama orang.
4. Pilih pakai klik atau **Enter**.

Di project, **Orang** isinya tim project dan **Tugas** isinya tugas project (yang belum selesai duluan). Di aturan, semua orang bisa disebut dan nggak ada tugas.

Hasilnya jadi "pil": orang dengan foto dan namanya, tugas dengan ikon status dan judulnya. Klik pil tugas buat buka tugasnya (waktu edit, kebuka di tab baru).

> [!NOTE]
> Yang buka daftar cuma **@**. Tugas yang disebut memang ditampilkan dengan tanda #, tapi ngetik # nggak buka apa-apa.

## Siapa yang dapat notifikasi

- Orang yang disebut di **report project** dapat notifikasi "Nama nyebut kamu di report Project", isinya judul report. Klik buat buka report-nya.
- Tiap orang cuma dikabari **sekali per report**. Hapus lalu sebut lagi nggak bikin notifikasi kedua.
- Yang nulis atau nyimpan report nggak dikabari soal dirinya sendiri.
- Nyebut tugas nggak ngirim notifikasi.

Di halaman klien, mention cuma tampil sebagai nama, nggak bisa diklik.', true, 9),
('report-template', '2026-11-02', 'Template report Harian & Mingguan', 'Report baru bisa mulai dari template Harian atau Mingguan, lengkap sama bagian-bagiannya, jadi tinggal isi.', ARRAY['new']::text[], 'reports', 'everyone', 'app', NULL, '## Cara pakai

1. Buka project → **Report** → **Report baru** (atau dari Dashboard project).
2. Selama isinya masih kosong, ada baris **Mulai dari template** dengan tombol **Harian**, **Mingguan**, dan **Kosong**.
3. Klik salah satu. Isinya terisi dan kursor langsung ada di baris kosong pertama.
4. Judul ikut diganti cuma kalau masih judul bawaan ("Report - @tanggal").

![Baris Mulai dari template di report baru](/whats-new/report-template.webp)

**Kosong** nyembunyiin baris template. Begitu kamu mulai nulis, barisnya hilang, jadi template nggak bakal nimpa tulisanmu.

## Isi templatenya

**Harian** — judul "Laporan harian · Senin, 2 Nov 2026":

- **Yang dikerjain** (daftar)
- **Next** (checklist)
- **Catatan**

**Mingguan** — judul "Laporan mingguan · 2–8 Nov 2026" (Senin sampai Minggu):

- **Ringkasan minggu ini**
- **Progress per bagian** (Desain, Development, Konten)
- **Minggu depan** (checklist)
- **Butuh dari klien** (callout peringatan)

Kalau app kamu pakai bahasa Inggris, templatenya juga versi Inggris.', true, 10),
('gambar-webp', '2026-11-02', 'Gambar otomatis jadi WebP', 'Gambar yang kamu upload di report, catatan, aturan, tugas, dan bukti cuti otomatis dikecilkan dan disimpan sebagai WebP, jadi lebih cepat dibuka.', ARRAY['improved']::text[], 'editor', 'everyone', 'app', NULL, '## Apa yang berubah

- Sisi terpanjang gambar dikecilkan ke maksimal **2560 px**.
- Disimpan sebagai **WebP** (kualitas sekitar 82%), targetnya di bawah **2 MB**.
- SVG dan GIF dibiarkan apa adanya. Kalau hasil WebP malah lebih besar, file aslinya yang dipakai.

Kamu nggak perlu ngapa-ngapain, upload kayak biasa.

> [!TIP]
> Butuh kualitas penuh, misalnya buat aset final ke klien? Pakai **/** → **Gambar (resolusi asli)**, atau di Library klik kanan → **Upload resolusi asli (tanpa kompres)**.', true, 11),
('ai-editor', '2026-11-02', 'AI buat nulis di editor', 'Pilih teks, klik Bantuan AI: terjemahin, bikin lebih santai, formal, singkat, rapi, atau detail. Di report ada tombol AI buat seluruh isi dan Ringkas report.', ARRAY['new']::text[], 'ai', 'everyone', 'app', '/whats-new/editor-ai.webp', '## Bisa dipakai di mana

Di editor **report project**, **catatan**, dan **deskripsi tugas**, waktu lagi diedit. Nggak ada di menu klik kanan umum, di halaman baca, atau di halaman klien.

> [!NOTE]
> Di editor aturan (**Aturan & Update**) AI belum jalan penuh, jadi pakai di report atau catatan dulu.

## Ubah sebagian teks

1. Blok (select) teks yang mau diubah.
2. Di menu kecil yang muncul di atas teks, klik **Bantuan AI** (ikon kilau). Atau klik kanan → **Bantuan AI**. Buat satu blok utuh: klik kanan blok → **AI untuk blok ini**.
3. Pilih aksinya:
   - **Terjemahkan** → **English**, **Indonesia**, atau **Bahasa lain** (日本語, 中文, 한국어, العربية, Español, Français, Deutsch, Nederlands)
   - **Lebih santai**, **Lebih formal**, **Lebih singkat**, **Lebih jelas & rapi**, **Lebih panjang & detail**
   - **Minta AI…**: tulis maumu sendiri, misalnya "jadikan poin-poin", lalu **Kirim** (maks. 500 karakter)
4. Tunggu sebentar ("AI lagi nulis…"). Mau berhenti? Klik **Stop**.

![Menu Bantuan AI](/whats-new/editor-ai.webp)

## Pakai hasilnya

Hasilnya muncul di kartu **Hasil**, dokumen kamu belum berubah. Pilih:

| Tombol | Fungsinya |
|---|---|
| **Ganti** | Ganti teks yang dipilih dengan hasil AI |
| **Sisipkan di bawah** | Taruh hasilnya di bawah, teks asli tetap |
| **Coba lagi** | Minta versi lain |
| **Buang** | Nggak jadi, tutup kartunya |

**Esc** juga nutup kartunya. Kalau ada link atau gambar yang berubah di hasilnya, kartu ngasih peringatan, jadi cek dulu sebelum dipakai.

> [!TIP]
> Nyesel udah diganti? Tekan **⌘Z** (Ctrl+Z) sekali, semuanya balik.

## Seluruh report dan Ringkas report

Di header editor report ada tombol **AI** ("AI untuk seluruh isi"):

1. Klik **AI**.
2. Pilih aksi yang sama kayak di atas buat ngubah seluruh isi, atau **Ringkas report** di paling atas.
3. **Ringkas report** bikin baris **Ringkasan** dan 2–4 poin. Pilih **Sisipkan di atas** (masuk sebagai callout di paling atas report), **Salin**, **Coba lagi**, atau **Buang**.

Cocok buat report panjang: ringkasan di atas bikin klien langsung nangkep intinya.

## Yang perlu diingat

- AI cuma jalan kalau kamu klik aksinya. Nggak ada yang jalan sendiri di belakang.
- AI disuruh nggak nambah fakta, angka, tanggal, atau nama, dan nama orang/brand dibiarkan apa adanya. Tetap baca ulang sebelum dikirim ke klien.
- Link dan alamat gambar disembunyikan dulu sebelum teks dikirim ke AI.
- Batasnya **15 permintaan per menit** dan **300 per hari** per orang, maksimal **20.000 karakter** sekali minta. Kalau kena batas: "Kebanyakan permintaan. Tunggu sebentar, ya."

## Pemakaian & biaya (khusus stakeholder)

- Tiap klik = satu permintaan ke AI (lewat 9router), kira-kira **~3 ribu token** buat teks seukuran report biasa. Teks yang panjang makan lebih banyak.
- **Ringkas report** jawabannya dibatasi 400 token. Permintaan dihentikan kalau lebih dari 120 detik.
- Server nyatat jumlah token tiap permintaan (aksi dan modelnya), **tanpa isi teksnya**.
- Batas harian dihitung di memori server, jadi ke-reset kalau server restart.
- Klien nggak pernah lihat kontrol AI.', true, 12),
('report-link-klien', '2026-11-02', 'Bagikan report ke klien, lihat kapan dibaca', 'Link report ke klien sekarang pendek dan ada nama project-nya. Kamu juga bisa lihat berapa kali klien buka report-nya.', ARRAY['new', 'improved']::text[], 'reports', 'everyone', 'app', '/whats-new/report-share.webp', '## Bagikan report

Yang bisa bagikan: **penulis report** atau **admin**.

1. Buka report di project → **Report**.
2. Klik **Bagikan** di header report (di HP cuma ikon link).
3. Di **Bagikan ke klien**, klik **Buat link**. Report baru disimpan dulu otomatis.
4. Link langsung tersalin ("Link dibuat dan disalin"), tombolnya berubah jadi **Dibagikan**.
5. Tempel link-nya ke WhatsApp atau email klien. Klien bisa buka tanpa login.

Mau salin lagi? Buka **Dibagikan** → **Salin link**, atau klik kanan baris report → **Salin link klien**.

![Bagikan report ke klien](/whats-new/report-share.webp)

## Link yang lebih pendek

Formatnya sekarang **nama-project-kode**, misalnya …/r/website-westura-k3x9q2m7wa1c. Klien langsung tahu ini report project apa.

- Kalau nama project diganti, link lama tetap jalan dan pindah ke nama baru.
- Link lama (cuma kode panjang) juga tetap bisa dibuka.

## Lihat kapan klien baca

1. Buka report yang udah dibagikan.
2. Di header ada tombol **Dibaca 3×** (atau **Belum dibuka** kalau belum ada yang buka).
3. Klik buat lihat **Kapan klien buka**: waktunya (arahkan kursor buat jam persisnya), perangkatnya (misalnya "iPhone · Safari"), negaranya, dan sumbernya (**Link** atau **Portal**).

Di daftar report, report yang udah dibaca ada ikon mata dengan angkanya. Klik kanan report → **Yang baca** juga nunjukin 10 kunjungan terakhir.

> [!NOTE]
> Yang dihitung cuma klien. Tim, bot (termasuk preview WhatsApp), dan buka ulang dalam 30 menit nggak dihitung.

## Matikan link

1. Klik **Dibagikan** di header report, atau klik kanan baris report.
2. Pilih **Matikan link** (di menu klik kanan, klik dua kali).
3. Link langsung mati: klien yang buka bakal dapat halaman tidak ditemukan.

Bisa dibagikan lagi kapan aja, nanti dapat link baru. Hapus report yang udah dibagikan juga bikin link-nya mati.', true, 13),
('report-halaman-klien', '2026-11-02', 'Halaman report buat klien: English, Translate, terang/gelap', 'Halaman report yang dibuka klien tampil dalam bahasa Inggris dulu, bisa diterjemahkan ke bahasa lain, ada mode terang/gelap, dan nggak lagi nunjukin nama penulis.', ARRAY['new', 'improved']::text[], 'reports', 'everyone', 'client', '/whats-new/client-report.webp', '## Yang klien lihat

- Header: logo dan nama Kretya Studio, nama project, judul report, dan tanggal.
- **Tanpa nama penulis.** Report tampil atas nama studio.
- Isi report lengkap: gambar, galeri (bisa dibuka besar), embed, callout, toggle. Mention cuma tampil sebagai nama.
- Halamannya nggak muncul di Google.

## Bahasa: English dulu, bisa diterjemahkan

Kalau klien belum pernah milih bahasa, report otomatis diterjemahkan ke **English**. Pilihannya diingat di perangkat klien.

Buat ganti bahasa:

1. Klik tombol bahasa di kanan atas (ikon globe + nama bahasa).
2. Di **Translate this page to**, pilih English, 日本語, 中文, 한국어, العربية, Español, Français, Deutsch, atau Nederlands.
3. Mau versi aslinya? Pilih **Original (Indonesian)**.

> [!TIP]
> Report tetap ditulis dalam bahasa Indonesia kayak biasa. Terjemahannya otomatis waktu klien buka. Buat istilah penting, cek dulu hasilnya sekali dengan buka link-nya sendiri.

![Halaman report klien](/whats-new/client-report.webp#size=wide)

## Mode terang / gelap

Di samping tombol bahasa ada tombol matahari/bulan. Klik buat pindah **Light** ↔ **Dark**. Di portal klien, temanya diatur dari pengalih tema di sidebar portal.

## Portal klien

Portal klien (link /p/… pakai PIN) juga dapat pengalih bahasa yang sama. Report yang dibuka dari portal ikut dihitung di **Dibaca n×** dengan sumber **Portal**.', true, 14),
('report-preview-link', '2026-11-02', 'Preview link yang rapi di WhatsApp', 'Link report dan portal yang dikirim ke WhatsApp, Slack, atau email sekarang muncul sebagai kartu bergambar dengan nama project dan judul report.', ARRAY['new']::text[], 'reports', 'everyone', 'client', NULL, '## Isi kartunya

- **Link report:** judulnya "Judul report · Project", deskripsinya potongan awal report. Gambarnya kartu gelap dengan label Kretya Studio, nama project, tanggal report, judul report, dan sampai 3 judul bagian (atau 1 judul + thumbnail gambar pertama di report).
- **Link portal:** "Client portal", nama project, dan daftar halamannya (Dashboard, Reports, Documents, Library & assets). Nggak ada isi project lain.
- **Link yang udah dimatikan atau salah:** kartu umum Kretya Studio, tanpa isi report apa pun.

Kartunya diperbarui tiap report diedit.

## Tips

1. Simpan report dulu sebelum bagikan, biar judul dan isi kartunya udah final.
2. Kalau WhatsApp masih nunjukin preview lama, itu cache WhatsApp. Kirim ulang link-nya di chat baru, atau tunggu sebentar.

> [!NOTE]
> Bot yang bikin preview (WhatsApp, Slack…) nggak dihitung sebagai klien yang baca.', true, 15),
('kalender-libur-nasional', '2026-11-02', 'Libur nasional & jadikan libur kantor', 'Libur nasional dan cuti bersama 2026–2027 (SKB) muncul di kalender stakeholder. Satu klik buat jadikan libur kantor, dan bisa dibatalkan.', ARRAY['new']::text[], 'calendar', 'stakeholder', 'app', '/whats-new/calendar-holiday.webp', '## Lihat libur nasional

1. Buka **Kalender**.
2. Libur nasional dan cuti bersama tampil sebagai jadwal seharian dengan kategori **Hari libur nasional**.
3. Klik salah satu buat lihat detailnya: nama, tanggal, label **Libur nasional** atau **Cuti bersama**, dan **Kenapa libur**.

Libur nasional ini cuma kelihatan buat stakeholder ("Cuma stakeholder yang lihat"). Tim lain baru lihat setelah kamu jadikan libur kantor.

## Jadikan libur kantor

1. Klik hari liburnya di kalender.
2. Klik **Jadikan libur kantor**.
3. Muncul notifikasi "… jadi libur kantor" dengan tombol **Urungkan** kalau salah klik.
4. Harinya jadi jadwal **Libur perusahaan** yang dilihat semua orang, dan tim dapat notifikasi.

Lewat klik kanan juga bisa: klik kanan hari liburnya → **Jadikan libur kantor** → klik sekali lagi ("Klik lagi, semua orang dikabari").

![Jadikan libur kantor](/whats-new/calendar-holiday.webp)

> [!WARNING]
> Semua orang langsung dikabari. Cek dulu tanggalnya, apalagi cuti bersama yang kadang kantor tetap jalan.

## Batalkan libur kantor

1. Klik hari liburnya lagi. Kotaknya sekarang nunjukin **Libur kantor** dan "Hari ini libur kantor, semua orang lihat di kalender."
2. Klik **Batalkan**. Muncul "Libur kantor dibatalkan" dengan **Urungkan**.

Atau klik kanan jadwal libur kantornya → **Batalkan libur kantor** (merah, klik dua kali).', true, 16),
('kalender-cuti-tim', '2026-11-02', 'Cuti tim di kalender pribadi', 'PM dan stakeholder sekarang lihat cuti dan WFH seluruh tim yang udah disetujui, langsung di kalender pribadi.', ARRAY['new']::text[], 'calendar', 'pm', 'app', NULL, '## Cara lihat

1. Buka **Kalender** di ruang kerja **Pribadi** (atau kalender di ruang kerja **Project**).
2. Cuti yang udah disetujui tampil sebagai jadwal seharian "Nama • jenis cuti", dengan kategori **Cuti** atau **Kerja dari Rumah**.
3. Klik kanan → **Lihat detail**, atau **Buka pengajuan** buat ke halaman cuti.

Karyawan tetap cuma lihat cutinya sendiri.

## Sembunyiin kalau rame

1. Klik tombol **Kalender** di toolbar kalender.
2. Hilangkan centang **Cuti** dan/atau **Kerja dari Rumah**.

Atau klik kanan toolbar → **Yang tampil**, lalu centang/hilangkan centang. Menunya tetap kebuka selama kamu milih.', true, 17),
('kalender-bulan-scroll', '2026-11-02', 'Tampilan bulan bisa di-scroll', 'Bulan yang butuh enam baris nggak kepotong lagi: kalendernya bisa di-scroll dan nama hari tetap di atas.', ARRAY['fixed']::text[], 'calendar', 'everyone', 'app', NULL, '## Apa yang berubah

- Di tampilan **Bulan**, kalau minggunya nggak muat di layar, kalendernya sekarang bisa di-scroll. Dulu minggu terakhir kepotong.
- Baris nama hari (Sen, Sel, …) nempel di atas selama kamu scroll.

> [!TIP]
> Klik kanan slot kosong buat **Lihat minggu ini**, **Ke hari ini**, atau **Pergi ke tanggal…** tanpa nyari tombolnya.', true, 18),
('sharing-santuy', '2026-11-02', 'Sharing Santuy punya halaman sendiri', 'Siapa yang sharing tiap Jumat 16:00, antriannya, dan link Meet tetapnya ada di satu halaman. Sesinya juga muncul di kalender.', ARRAY['new']::text[], 'santuy', 'everyone', 'app', '/whats-new/santuy-page.webp', '## Buka halamannya

1. Di sidebar ruang kerja **Pribadi**, klik **Sharing Santuy** (ikon cangkir, di bawah **Kalender**).
2. Paling atas ada kartu **Yang sharing**: siapa, kapan, dan labelnya (**Hari ini**, **Minggu ini**, atau **Berikutnya**).
3. Di bawahnya **Link Meet**. Klik ikon salin buat nyalin, atau ikon buka buat langsung gabung.
4. **Jadwal** nunjukin minggu-minggu ke depan. **Antrian** nunjukin urutan semua orang dan tanggal giliran berikutnya. Antriannya muter terus: abis orang terakhir, balik lagi ke yang pertama.

Jadwal default: **tiap Jumat, 16:00–17:00 WIB**.

![Halaman Sharing Santuy](/whats-new/santuy-page.webp#size=wide)

## Muncul di kalender

Sesinya otomatis muncul di kalender pribadi dan kalender project sebagai "Sharing Santuy · Nama". Klik sesinya buat lihat **Pembicara**, **Waktu**, **Link Meet**, dan tombol **Gabung Meet**.

Klik kanan sesinya → **Gabung Meet**, **Salin link Meet**, atau **Atur jadwal**.

> [!NOTE]
> Sharing Santuy nggak bisa lagi dibikin manual dari **Jadwal baru** di kalender. Semuanya diatur dari halaman ini biar nggak dobel.

## Atur urutan & antrian (PM & stakeholder)

PM dan stakeholder bisa ngatur antrian. Karyawan cuma bisa lihat.

1. **Ubah urutan:** tarik pegangan di baris orangnya ("Geser buat ubah urutan"). Atau klik kanan → **Pindah ke atas**, **Pindah ke bawah**, **Jadikan giliran berikutnya**. Notifikasinya punya **Batalin**.
2. **Tambah orang:** klik **Tambah** → **Pilih orang**. Orang baru masuk di urutan paling akhir.
3. **Sembunyiin orang:** klik **Sembunyiin** di barisnya (atau lewat klik kanan). Dia nggak ikut giliran dan pindah ke daftar **Disembunyikan**. Balikin pakai **Munculin lagi**.

Ubah urutan nggak ngubah siapa yang sharing di sesi berikutnya.

## Tunjuk orang buat satu minggu (PM & stakeholder)

Ada yang mau tukeran minggu, atau ada tamu? Atur satu minggu aja tanpa ngacak rotasi:

1. Klik **Atur minggu** di panel **Jadwal**. Bisa juga lewat ⋯ di baris minggunya, klik kanan kartu **Yang sharing** → **Tunjuk orang buat sesi ini**, atau klik kanan sesinya di kalender → **Tunjuk orang buat minggu ini**.
2. Di **Atur satu minggu**, pilih **Minggu**-nya.
3. Di **Minggu itu**, pilih **Tunjuk orang**, lalu **Siapa yang sharing**.
4. Simpan. Minggu itu dapat label **Ditunjuk**, dan "harusnya …" nunjukin siapa yang sebenarnya giliran.

Cuma minggu itu yang berubah, jadwal orang lain nggak geser. Mau balik? Pilih **Ikut rotasi**, atau **Balikin ke rotasi** di menu baris minggunya.

## Ganti jadwal & link Meet (PM & stakeholder)

**Jadwal:** klik **Atur jadwal**, pilih **Hari**, **Mulai (WIB)**, dan **Durasi** (30–120 menit). Yang sharing di sesi berikutnya tetap sama, urutan lanjut dari situ.

**Link Meet tetap:**

1. Belum ada link? Klik **Buat link GMeet**. App bikin satu acara mingguan di Google Calendar **tanpa tamu**, jadi nggak ada yang dapat email.
2. Mau ganti? Klik **⋯** di baris link → **Ganti link**. Link lama berhenti jalan.
3. Udah punya link sendiri? **⋯** → **Tempel link sendiri**, tempel link (diawali https://), lalu **Simpan**.

> [!TIP]
> Link-nya sama terus tiap minggu, jadi boleh di-bookmark.', true, 19),
('profil-saya', '2026-11-02', 'Profil saya: ganti foto sendiri', 'Sekarang kamu bisa upload dan atur foto profil sendiri, plus lihat email, tim, dan sisa cuti tahunan di satu panel.', ARRAY['new']::text[], 'profile', 'everyone', 'app', '/whats-new/profile-photo.webp', '## Buka Profil saya

1. Klik foto/nama kamu di pojok sidebar (atau klik kanan).
2. Pilih **Profil saya**. Panel **Profil saya** kebuka di samping.

Isinya: nama dan jabatan, lalu di **Detail** ada **Email**, **Tim**, dan **Sisa cuti tahunan**.

## Ganti foto

1. Di panel **Profil saya**, klik **Upload foto** (atau **Ganti foto** kalau udah ada).
2. Pilih file PNG, JPG, atau WebP, maksimal 5 MB.
3. Di **Atur foto**, geser fotonya biar pas di lingkaran. Zoom pakai slider **Zoom** atau scroll mouse.
4. Klik **Pakai foto**. Muncul "Foto profil diganti."

Fotonya disimpan kotak 512 px (WebP), jadi ringan dan tajam di mana-mana.

**Hapus foto:** klik **Hapus foto** → konfirmasi **Hapus foto**. Avatar balik ke inisial nama.

![Atur foto profil](/whats-new/profile-photo.webp)

## Data lain

Selain foto, data profil diatur admin. Ada yang salah (nama, jabatan, tim, sisa cuti)? Pilih **Hubungi admin** di menu akun.

## Ganti foto orang lain (khusus stakeholder)

Stakeholder bisa ganti foto siapa aja: buka **Tim** → anggota & akses → buka anggotanya → baris **Foto**, atau klik kanan anggotanya → **Ganti foto**.', true, 20),
('inbox-approval', '2026-11-02', 'Inbox approval lebih rapi', 'Baris di Inbox approval lebih lega dan gampang dibaca, dan sekarang bisa disetujui atau ditolak lewat klik kanan.', ARRAY['improved']::text[], 'leave', 'stakeholder', 'app', NULL, '## Buka inbox

1. Klik **Inbox approval** di Beranda, atau di halaman **Cuti & Kehadiran**. Angkanya nunjukin yang lagi nunggu.
2. Ada dua tab: **Cuti** dan **Hapus absen**.
3. Tiap baris nunjukin foto, nama · jenis cuti, tanggal dan jumlah hari, lalu alasannya.

## Setujui atau tolak

1. Klik tombol centang buat **Setujui**.
2. Klik × buat **Tolak**, tulis catatan (misalnya "Mis. bentrok dengan deadline project"), lalu **Tolak**.
3. Banyak yang nunggu? **Setujui semua** di atas daftar.

Lewat klik kanan juga bisa: **Setujui**, **Tolak…**, **Buka profil**, **Salin rentang tanggal**. Buat permintaan hapus absen: **Hapus data** (klik dua kali) atau **Tolak permintaan**.

> [!NOTE]
> Kalau pengajuannya udah diproses orang lain duluan, muncul "Pengajuan ini sudah diproses".

## Detail pengajuan

Di tabel cuti, klik kanan pengajuan → **Lihat detail** buat lihat semuanya: karyawan, jenis, tanggal, durasi, status, alasan, catatan peninjau, bukti, dan tanggal pengajuan. Dari daftar yang nunggu di Beranda, klik kanan → **Tinjau di kotak masuk** buat langsung ke pengajuan itu di inbox.', true, 21),
('lihat-sebagai', '2026-11-02', 'Kembali dari Lihat sebagai lebih andal', 'Tombol Kembali ke akun saya sekarang selalu balik ke akun kamu, termasuk di app Mac.', ARRAY['fixed']::text[], 'general', 'stakeholder', 'app', NULL, '## Apa yang diperbaiki

Waktu pakai **Lihat sebagai** (lihat app sebagai anggota tim), klik **Kembali ke akun saya** di banner atas sekarang muat ulang halaman penuh dan langsung balik ke **Tim**. Dulu di app Mac kadang masih nyangkut di akun orang lain.

Masuk dan keluar **Lihat sebagai** juga selalu muat ulang halaman, jadi data akun yang lain nggak kebawa.', true, 22),
('kretya-flow-update', '2026-11-02', 'Kretya Flow: kabar update & Setelan app', 'App Mac sekarang ngabarin kalau ada versi baru, dan punya halaman Setelan app buat ngatur notifikasi dan buka otomatis saat login.', ARRAY['new']::text[], 'desktop', 'everyone', 'mac', NULL, '## Kalau ada versi baru

1. Di bawah sidebar Kretya Flow muncul kartu **Update tersedia** ("Versi … · lihat yang baru"). macOS juga ngirim notifikasi "Kretya Flow versi … siap".
2. Klik kartunya (atau notifikasinya). Versi baru di-download lewat browser, dan muncul **Cara update**.
3. Buka file DMG-nya dari folder Downloads.
4. Drag **Kretya Flow** ke folder **Applications**, lalu pilih **Replace**.
5. Buka lagi Kretya Flow. Beres!

Belum mau update? Arahkan kursor ke kartunya, klik × (**Sembunyikan**). Kartunya muncul lagi kalau ada versi yang lebih baru lagi.

## Setelan app

Buka dari menu akun di sidebar → **Setelan app**. (Di browser, halaman ini cuma nyuruh download app Mac dulu.)

**Notifikasi** — biar pengumuman, tugas, approval, dan pengingat jadwal muncul di pojok layar:

1. Lihat statusnya: **Aktif**, **Belum diizinkan**, atau **Ditolak**.
2. **Belum diizinkan**? Klik **Nyalakan**, lalu izinkan di pop-up macOS.
3. **Ditolak**? Klik **Buka Pengaturan Notifikasi**, nyalakan **Allow notifications** buat Kretya Flow.
4. Kalau udah **Aktif**, halaman ini nunjukin **Gaya** (**Banners** hilang sendiri, **Alerts** nunggu diklik), **Badges**, dan **Suara** yang lagi dipakai. Mau ganti? Ubah di Pengaturan Sistem lewat **Buka Pengaturan Notifikasi** (ikuti **Cara nyalain di macOS**).
5. Klik **Kirim notifikasi tes** buat ngecek.

**Jalan di background** (**Tetap jalan di menubar**) — nutup jendela nggak bikin Kretya Flow berhenti. App-nya tetap di menubar, jadi notifikasi dan pengingat tetap masuk. Keluar beneran: klik kanan ikon menubar → **Keluar dari Kretya Flow**, atau **⌘Q**.

**Buka saat login** — nyalakan biar Kretya Flow kebuka sendiri tiap Mac nyala. Cek juga di **Buka Login Items** (Pengaturan Sistem → Umum → Login Items & Extensions).

**Tentang** — versi yang lagi jalan dan tombol **Cek update**.

## Belum punya app Mac-nya?

Buka app ini di browser di Mac. Di bawah sidebar ada kartu **Kretya Flow untuk Mac** ("Notifikasi, menubar, shortcut"). Klik, lalu ikuti **Cara pasang**: buka DMG-nya, drag ke **Applications**, buka, dan masuk pakai akunmu. Bisa juga dari menu akun → **Download app Mac**.', true, 23),
('kretya-flow-navigasi', '2026-11-02', 'Kretya Flow: ⌘[ / ⌘] dan embed di dalam app', 'Mundur dan maju pakai ⌘[ dan ⌘] kayak di Safari, dan embed Figma, YouTube, Drive di report sekarang tampil langsung di app.', ARRAY['new', 'fixed']::text[], 'desktop', 'everyone', 'mac', NULL, '## Shortcut

| Shortcut | Fungsinya |
|---|---|
| **⌘[** | Kembali ke halaman sebelumnya |
| **⌘]** | Maju lagi |
| **⌥⌘K** | Buka/tutup popover menubar (dari mana aja) |
| **⌘K** | Cari di app |

⌘[ dan ⌘] nggak jalan waktu kamu lagi ngetik di editor, biar nggak bentrok sama shortcut teks.

## Embed nggak lempar ke browser lagi

Preview Figma, Google Drive/Docs, YouTube, Vimeo, dan Loom di report sekarang tampil langsung di Kretya Flow. Dulu kebuka di browser.

Klik link biasa ke situs-situs itu tetap buka browser, dan klik kanan link → **Buka di browser** juga ada.

## Perubahan kecil lainnya

- Blur jendela lebih tembus pandang, warna chrome lebih terang.
- Layar loading lebih simpel.
- Geser blok di editor sekarang jalan di app Mac.
- Klik kanan ikon menubar: **Buka Kretya Flow** dan **Keluar dari Kretya Flow**.', true, 24),
('yang-baru', '2026-11-02', 'Halaman Yang baru', 'Semua update app dan halaman klien sekarang ada di satu tempat, lengkap sama panduan langkah demi langkah.', ARRAY['new']::text[], 'general', 'everyone', 'app', NULL, '## Isinya apa

Tiap ada fitur baru, perubahan, atau perbaikan, catatannya masuk ke sini. Satu catatan = satu fitur, dan tiap catatan punya panduan: langkahnya bernomor, ada tips, dan screenshot kalau perlu.

Yang kamu lihat ikut akses kamu. Fitur khusus PM atau stakeholder cuma muncul buat yang bisa pakai, jadi daftarnya nggak penuh sama hal yang nggak relevan.

## Cara pakai

1. Buka **Yang baru** dari sidebar (ruang kerja **Pribadi**), atau klik kartu **Ada yang baru** di bawah sidebar.
2. Daftarnya dikelompokkan per tanggal, yang paling baru di atas.
3. Mau lihat satu bagian aja? Klik chip area di atas daftar, misalnya **Project** atau **Kalender**. Klik **Semua** buat balik.
4. Cari fitur lewat kotak cari, misalnya "embed" atau "libur". Pencarian ikut baca isi panduannya, bukan cuma judul.
5. Klik satu catatan buat buka panduannya. Panduan yang panjang punya daftar isi: di layar lebar ada di samping kanan, di HP ada di atas (**Isi panduan**).

> [!TIP]
> Catatan yang udah kamu buka ditandai **Sudah dibaca**. Mau beresin semuanya sekaligus? Klik **Tandai semua sudah dibaca**.

## Nulis update (khusus stakeholder)

Stakeholder bisa nulis, ngubah, dan ngapus catatan di sini langsung dari app.

1. Klik **Tulis update** di kanan atas.
2. Isi **Judul**, **Ringkasan** (satu-dua kalimat buat daftar), dan **Tanggal**.
3. Pilih **Label** (Baru / Diperbarui / Perbaikan), **Area**, **Buat siapa** (semua, PM & stakeholder, atau khusus stakeholder), dan **Muncul di** (app, Kretya Flow, atau halaman klien).
4. Upload **Thumbnail** (gambar 4:3, otomatis jadi WebP).
5. Tulis panduannya di editor kayak nulis report: **Judul 1/2** jadi bagian di **Isi panduan**, plus langkah bernomor, callout, toggle, dan gambar.
6. Mau satu bagian cuma buat stakeholder? Tambahin "(khusus stakeholder)" di akhir judul bagiannya. "(PM & stakeholder)" buat PM juga.
7. Nyalakan **Terbitkan** biar semua orang lihat, lalu **Simpan**. Kalau belum, catatannya jadi **Draf** dan cuma kelihatan buat stakeholder.

Ubah atau hapus lewat tombol **Ubah** / **Hapus** di catatannya, atau klik kanan kartunya.

## Tanda ada yang baru

Kalau ada catatan baru yang belum kamu lihat:

- Ada titik kecil di samping **Yang baru** di sidebar.
- Di bawah sidebar muncul kartu **Ada yang baru**, misalnya "3 update minggu ini · lihat panduannya" (kalau banyak: "Update di 9 bagian · lihat panduan"). Klik kartunya buat langsung ke sini, atau arahkan kursor lalu klik × buat nyembunyiin.

Dua-duanya hilang begitu kamu buka halaman ini. Tandanya disimpan di browser yang kamu pakai, jadi di perangkat lain bisa muncul lagi sekali.', true, 25)
ON CONFLICT (id) DO NOTHING;
