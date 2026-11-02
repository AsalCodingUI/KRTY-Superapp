-- Yang baru: "Panduan dasar" (3 Nov 2026), guides to the core features,
-- tagged 'guide' (needs whats_new_guides.sql). Pictures are files in
-- public/whats-new (guide-*.webp). Re-running leaves existing rows alone
-- (ON CONFLICT DO NOTHING), so edits made in the app stay.

INSERT INTO public.whats_new_entries
  (id, date, title, summary, tags, area, audience, surface, thumbnail_url, body, published, sort)
VALUES
('panduan-beranda', '2026-11-03', 'Beranda: absen, cuti, dan kerjaan hari ini', 'Halaman pertama setelah login. Clock in/out, lihat sisa cuti, KPI, review & 1:1, dan project yang lagi jalan tanpa pindah-pindah halaman.', ARRAY['guide']::text[], 'general', 'everyone', 'app', '/whats-new/guide-beranda-thumb.webp', '## Buka Beranda

1. Klik **Beranda** di ruang kerja **Pribadi** di sidebar, atau klik logo Kretya Studio di kiri atas.
2. Di HP, pakai tab **Beranda** di bar bawah.

Paling atas ada sapaan "Halo, nama kamu", lalu tombol pintas:

| Tombol | Buat apa |
|---|---|
| **Ajukan cuti** | Langsung buka form pengajuan cuti |
| **Kehadiran** | Ke halaman **Cuti & Kehadiran** |
| **KPI saya** | Ke halaman **Kinerja** (cuma di layar besar) |
| **Kalender** | Ke kalender tim di ruang kerja **Project** |

Di kanan tombol-tombol itu ada pilihan tahun dan kuartal (**Q1**–**Q4**, atau **Setahun**). Pilihannya ngatur kartu **Performa** dan **Review & 1:1**.

## Clock in & clock out di kartu Hari ini

1. Pilih status dulu: **Hadir**, **Lembur**, atau **Cuti Masuk**.
2. Klik **Clock In**. Badge di pojok kartu berubah jadi **Sedang bekerja**.
3. Mau rehat? Klik **Istirahat**, lalu **Selesai istirahat** kalau udah balik.
4. Pulang: klik **Clock Out**. Muncul "Clock out sekarang?", klik **Clock Out** lagi buat nutup sesi.

Badge-nya nunjukin status kamu: **Belum clock in**, **Sedang bekerja**, **Selesai**, atau **Sesi belum ditutup**. Di bawah jam ada **Minggu ini**: jam kerja kamu per hari minggu ini.

> [!NOTE]
> Lupa clock out kemarin? Kartunya nunjukin "Sesi … belum ditutup" dan tombol **Tutup sesi sebelumnya**. Beresin itu dulu, baru bisa clock in lagi.

> [!TIP]
> Klik kanan kartu **Hari ini** buat clock in dari menu. **Clock in sebagai** langsung milih statusnya sekalian.

## Kartu Cuti

- Angka besar = **Sisa cuti tahunan** kamu.
- Di bawahnya 5 pengajuan terakhir, masing-masing dengan badge **Disetujui**, **Ditolak**, atau **Menunggu**.
- Tombol **+** di pojok kartu (atau klik kanan kartu → **Ajukan cuti**) buka form cuti yang sama kayak tombol pintas.
- Klik kanan satu pengajuan buat lihat detail, ubah tanggal, atau batalin. Daftar lengkapnya di [Menu klik kanan di tiap halaman](/whats-new/klik-kanan-per-halaman).

## Performa, Review & 1:1, Project aktif

- **Performa:** skor KPI kamu di kuartal yang dipilih. Ikon panah di pojok = **Buka KPI**.
- **Review & 1:1:** 360 review yang harus kamu isi (tenggatnya, plus **Terkirim** atau **Belum diisi**) dan sesi 1:1 kamu ("Dengan …", online atau tatap muka). Sesi online punya tombol **Gabung**.
- **Project aktif:** project yang kamu ikut, dengan sisa harinya ("… hari lagi", **Hari ini**, atau **Lewat tenggat**). Klik project buat buka.

> [!NOTE]
> Di HP, kartu **Performa** dan **Review & 1:1** disembunyiin biar Beranda tetap ringkas. Buka **Kinerja** dari laptop buat lihat lengkapnya.

Beranda ikut update sendiri: begitu kamu clock in di tab lain atau cuti kamu disetujui, kartunya langsung berubah.

## Beranda buat stakeholder (khusus stakeholder)

Stakeholder dapat Beranda yang beda, isinya kondisi tim hari ini:

- Tombol pintas: **Inbox approval** (dengan jumlah yang nunggu), **Kehadiran**, **360 review**, **Tim**, **Kalender**.
- **Kehadiran hari ini:** berapa yang **Hadir**, **Cuti**, dan **Tidak hadir**.
- **Review tertunda:** review 360 yang belum lengkap, dengan "… belum menilai".
- **Cuti:** pengajuan yang **Menunggu**, **Cuti hari ini**, dan yang **Tidak hadir**.
- **Performa tim:** **Rata-rata skor**, siapa yang **Perlu perhatian**, dan berapa yang **Sudah dinilai**.
- **Aktivitas terbaru:** review yang dikirim dan pengajuan cuti terbaru.

![Beranda stakeholder](/whats-new/guide-beranda-stakeholder.webp)

Cara nyetujui cuti dari **Inbox approval** ada di [Inbox approval lebih rapi](/whats-new/inbox-approval).', true, 10),
('panduan-pencarian', '2026-11-03', 'Pencarian ⌘K: buka apa aja dari keyboard', 'Tekan ⌘K (Ctrl+K di Windows) di halaman mana aja buat nyari halaman, project, tugas, file, aturan, dan orang, lalu langsung buka.', ARRAY['guide']::text[], 'general', 'everyone', 'app', '/whats-new/guide-pencarian-thumb.webp', '## Buka pencarian

1. Tekan **⌘K** di Mac atau **Ctrl+K** di Windows, dari halaman mana aja.
2. Atau klik kolom **Cari** di bar atas (yang ada tulisan ⌘ K di kanannya).
3. Tekan lagi **⌘K** atau **Esc** buat nutup.

Sebelum ngetik, dialognya udah nunjukin **Terakhir dibuka** (5 yang terakhir kamu buka dari sini) dan **Buka halaman**: semua halaman yang bisa kamu buka, kayak sidebar versi daftar.

> [!NOTE]
> Di HP kolom **Cari** nggak ada. Pencarian ini buat laptop dan app Mac.

## Cari sesuatu

1. Ketik namanya, misalnya nama project, judul tugas, atau nama file.
2. Halaman langsung kesaring dari huruf pertama. Project, tugas, file, dan aturan muncul setelah **minimal 2 huruf**.
3. Pilih pakai **↑ / ↓**, lalu **Enter** buat buka. Bisa juga langsung diklik.

![Hasil pencarian ⌘K](/whats-new/guide-pencarian-hasil.webp)

Yang dicari:

| Grup | Isinya | Kebuka di |
|---|---|---|
| **Halaman** | Halaman & tab app (bisa pakai kata lain, misalnya "absen" → Cuti & Kehadiran) | Halamannya |
| **Project** | Nama project atau nama klien | Project-nya |
| **Tugas** | Judul tugas (yang udah selesai dicoret) | Tugasnya di halaman **Tugas** project |
| **File & dokumen** | Dokumen dan file di **Library & Aset** | **Dokumen** / **Library & Aset** project |
| **Aturan** | Judul aturan di **Aturan & Update** | Aturannya |
| **Orang** | Nama atau email anggota tim (khusus stakeholder) | Profilnya |

Hasilnya ikut hak akses kamu: project yang nggak kamu ikut nggak bakal muncul.

## Saring per jenis

Di bawah kolom cari ada **Semua**, **Halaman**, **Project**, **Tugas**, **File**, **Aturan** (dan **Orang** buat stakeholder).

1. Klik salah satu, atau tekan **Tab** buat pindah ke kanan (**Shift+Tab** ke kiri).
2. Nggak ketemu? Muncul "Tidak ada hasil untuk …". Kalau lagi di satu jenis, coba balik ke **Semua**.
3. Klik **×** di ujung kolom buat ngosongin.

> [!TIP]
> Blok teks di halaman mana aja, klik kanan → **Cari "…" di app**. Pencarian kebuka dengan teks itu udah keisi. Lihat [Klik kanan di mana aja](/whats-new/klik-kanan).', true, 20),
('panduan-notifikasi', '2026-11-03', 'Notifikasi: semua kabar buat kamu di lonceng', 'Tugas baru, komentar, mention, tenggat, cuti, jadwal, review, sampai pengumuman masuk ke lonceng di kanan atas. Klik buat langsung ke tempatnya.', ARRAY['guide']::text[], 'general', 'everyone', 'app', '/whats-new/guide-notifikasi-thumb.webp', '## Buka notifikasi

1. Klik ikon lonceng di kanan atas, di samping foto profil kamu. Titik merah berkedip artinya ada yang belum dibaca.
2. Panel **Notifikasi** kebuka di kanan (di HP dari bawah).
3. Tab **Belum dibaca (n)** kebuka duluan. Pindah ke **Semua** buat lihat yang lama juga.

Notifikasi baru langsung masuk tanpa perlu muat ulang halaman.

## Isi tiap baris

- Ikon di kiri nunjukin jenisnya (tugas, komentar, cuti, kalender, review, KPI, project, aturan, kontrak, pengumuman). Titik biru = belum dibaca.
- Judul tebal = belum dibaca. Di kanannya kapan masuknya (arahkan kursor buat tanggal & jam persisnya).
- Di bawah judul ada pesan singkatnya.

**Klik barisnya** buat buka tempatnya (tugas, pengajuan cuti, report, dan lain-lain). Notifikasinya sekalian ditandai dibaca dan panelnya ketutup.

## Yang bikin kamu dapat notifikasi

| Kejadian | Contoh |
|---|---|
| Tugas | Kamu di-assign tugas, ada komentar baru di tugas kamu, kamu di-@ di komentar atau report |
| Tenggat | Tiap pagi jam 08.00 WIB: tugas yang tenggatnya besok, atau udah lewat |
| Project | Kamu ditambah ke project, atau jadi **Lead** |
| Cuti & kehadiran | Pengajuan kamu disetujui atau ditolak |
| Kinerja | Skor KPI berubah, kuartal dikunci, review 360 dibuka |
| Lainnya | Jadwal kalender, aturan baru, kontrak, pengumuman dari stakeholder |

## Rapikan

1. **Baca semua** di atas panel buat nandain semuanya dibaca sekaligus.
2. Arahkan kursor ke baris, klik ikon tempat sampah buat **Hapus notifikasi**.
3. Klik kanan baris buat **Buka di tab baru**, **Salin link**, **Tandai dibaca** / **Tandai belum dibaca**, atau hapus.
4. Klik kanan ruang kosong di panel buat **Baca semua** dan **Tampilkan** → **Belum dibaca** / **Semua**.

![Menu klik kanan di notifikasi](/whats-new/guide-notifikasi-menu.webp)

> [!TIP]
> **Tandai belum dibaca** enak buat yang mau dikerjain nanti, biar tetap nongol di tab **Belum dibaca**.

## Banner pengumuman

Aturan baru dan pengumuman **Penting** juga muncul sebagai banner di atas halaman sampai kamu baca. Klik **Baca** buat buka, atau tutup banner-nya. Dua-duanya sekalian nandain notifikasinya dibaca.

Di browser, waktu pertama kali buka lonceng kamu bakal ditanya izin notifikasi. Kalau diizinkan, pengumuman **Penting** juga muncul sebagai notifikasi di pojok layar waktu tab app lagi nggak kamu lihat. Pakai app Mac? Atur notifikasinya di **Setelan app**, lihat [Kretya Flow: kabar update & Setelan app](/whats-new/kretya-flow-update).

## Kirim pengumuman (khusus stakeholder)

1. Buka panel **Notifikasi**, klik **Pengumuman** di atas (atau klik kanan ruang kosong → **Pengumuman**).
2. Di **Kirim pengumuman**, isi **Judul** dan **Pesan**. **Link (opsional)** bisa halaman di app (misalnya /leave) atau link web.
3. Pilih **Penerima**: **Semua**, **Karyawan**, atau **Pilih orang**.
4. Nyalakan **Penting** kalau perlu tampil sebagai banner sampai dibaca.
5. Klik **Kirim**. Muncul "Terkirim ke … orang".', true, 30),
('panduan-tugas-saya', '2026-11-03', 'Tugas saya: semua tugas kamu di satu tempat', 'Tugas yang di-assign ke kamu dari semua project berjalan, dalam board atau list. Ganti status, atur tenggat, tambah subtugas, dan komentar tanpa buka project-nya.', ARRAY['guide']::text[], 'tasks', 'everyone', 'app', '/whats-new/guide-tugas-saya-thumb.webp', '## Buka Tugas saya

1. Pindah ke ruang kerja **Project** di bar atas, lalu klik **Tugas saya** di sidebar.
2. Di HP, pakai tab **Tugas** di bar bawah.

Yang muncul: tugas yang PIC-nya kamu, dari project yang statusnya **Belum mulai**, **Berjalan**, atau **Review**. Project yang udah **Selesai** atau **Diarsipkan** nggak ikut.

> [!NOTE]
> Tugas baru tetap dibikin di dalam project (**Tugas** → **Tambah kartu**). Begitu kamu jadi PIC-nya, tugasnya muncul di sini.

## Board atau list

Pilih tampilannya pakai pengalih di kanan atas. Pilihannya diingat di perangkat kamu.

**Board** (kanban):

1. Empat kolom: **Akan dikerjakan**, **Dikerjakan**, **Review**, **Selesai**.
2. Tiap kartu nunjukin tenggat, progres subtugas (misalnya 2/5), jumlah komentar, dan project-nya.
3. Geser kartu ke kolom lain buat ganti status. Klik kartu buat buka tugasnya.

**List:**

1. Tab **Semua**, **Belum**, dan **Selesai**, lengkap sama jumlahnya. Awalnya di **Belum**.
2. Kolomnya **Tugas**, **Project**, **Status**, dan **Tenggat**. Yang tenggatnya paling dekat di atas.
3. Centang kotak di kiri buat tandai selesai. Klik judul buat buka tugas, klik nama project buat ke halaman **Tugas** project itu.

![Tugas saya dalam tampilan list](/whats-new/guide-tugas-saya-list.webp)

Di HP selalu tampil sebagai list, dan satu baris penuh bisa diklik buat buka tugas.

**Fokus ke satu project:** pilih project-nya di **Semua project** di kanan atas.

## Warna tenggat

| Tampilan | Artinya |
|---|---|
| Merah (plus ikon ⚠ di kartu) | **Lewat tenggat** |
| Oranye, tulisan **Hari ini** | Tenggatnya hari ini |
| **Besok** / tanggal | Masih aman |
| — | Belum ada tenggat |

## Di dalam tugas

Klik kartu atau judul tugas, dialognya kebuka:

1. **Judul:** klik buat ubah, **Enter** buat simpan.
2. **Deskripsi:** editor yang sama kayak report, ketik **/** buat blok, tempel gambar atau file. Gambar dan file di sini cuma buat tim (nggak ikut ke klien).
3. **Subtugas:** ketik di **Tambah subtugas**, **Enter**. Subtugas baru masuk paling atas. Centang buat selesai, ikon tempat sampah buat **Hapus subtugas**.
4. **Komentar:** ketik di bawah, **@** buat nyebut anggota tim (mereka dapat notifikasi). **⌘ Enter** atau **Kirim** buat ngirim.
5. Panel kanan: **Status**, **PIC** (pilih orang atau **Tanpa PIC**), dan **Tenggat** (klik buat pilih tanggal di kalender).
6. **Hapus tugas** di bawah panel kanan. Subtugas dan komentarnya ikut kehapus.

![Dialog tugas](/whats-new/guide-tugas-saya-dialog.webp)

Semua perubahan langsung kesimpan, nggak ada tombol simpan.

> [!TIP]
> Ganti **PIC** ke orang lain bikin tugasnya pindah dari **Tugas saya** kamu ke punya dia.

## Lebih cepat lewat klik kanan

Klik kanan kartu atau baris buat **Tandai selesai**, **Status**, **Assign ke**, **Tenggat** (**Hari ini**, **Besok**, **Minggu depan**…), **Pindah ke fase**, **Duplikat**, **Buka project**, sampai **Hapus tugas**. Langkahnya di [Atur tugas tanpa buka tugasnya](/whats-new/tugas-klik-kanan).

Buat nulis deskripsi lebih rapi, lihat [Sebut orang atau tugas pakai @](/whats-new/editor-mention) dan [AI buat nulis di editor](/whats-new/ai-editor).', true, 40),
('panduan-catatan-saya', '2026-11-03', 'Catatan saya: catatan & to-do pribadi', 'Tempat catatan dan to-do list kamu sendiri. Cuma kamu yang bisa lihat, kesimpan otomatis, bisa disematkan, dan bisa dicari.', ARRAY['guide']::text[], 'tasks', 'everyone', 'app', '/whats-new/guide-catatan-saya-thumb.webp', '## Buka Catatan saya

Pindah ke ruang kerja **Project**, lalu klik **Catatan saya** di sidebar.

Catatan ini pribadi: rekan setim, PM, dan stakeholder nggak bisa lihat. Cocok buat to-do harian, ide, atau catatan rapat yang belum mau dibagi.

## Bikin catatan

1. Klik **Catatan baru** di kanan atas.
2. Kursor langsung di **Judul**. Ketik judulnya.
3. Di bawahnya tulis isi catatan di **Tulis catatan…**.
4. Tambah to-do di **Tambah to-do**, lalu **Enter**. To-do baru masuk paling atas.

Nggak ada tombol simpan. Pojok panel nunjukin **Menyimpan…** waktu kamu ngetik dan **Tersimpan** setelah kesimpan.

![Panel catatan](/whats-new/guide-catatan-saya-editor.webp)

## Nulis lebih rapi

- Awali baris dengan **-** buat poin, atau **1.** buat daftar bernomor.
- Ketik **/** di awal baris buat milih **Poin** atau **Daftar bernomor**.
- Link yang kamu tempel tampil sebagai tag biru yang bisa langsung dibuka.

## Atur to-do

1. Centang kotaknya kalau udah beres. Progres (misalnya 2/5) dan garis hijau di atas daftar ikut naik.
2. Klik teks to-do buat ubah. **Enter** di ujung to-do bikin to-do baru di bawahnya.
3. **Backspace** di to-do yang kosong buat hapus, atau pakai ikon **Hapus to-do**.

## Cari, sematkan, hapus

- **Cari catatan…** di atas daftar nyari di judul, isi, dan to-do.
- Ikon pin di panel = **Sematkan**. Catatan yang disematkan selalu paling atas di daftar (ada ikon pin di depan judulnya). Klik lagi buat **Lepas sematan**.
- Daftar sisanya urut dari yang terakhir diubah. Kolom **Diubah** nunjukin jam (hari ini) atau tanggalnya.
- Ikon tempat sampah = **Hapus catatan**. Ada konfirmasi dulu, dan catatan yang dihapus nggak bisa dibalikin.

> [!TIP]
> Klik kanan catatan di daftar buat **Buka**, **Sematkan**, **Duplikat**, **Salin isi** (judul, to-do, dan teks sekaligus, enak buat ditempel ke chat), atau **Hapus catatan**.

> [!NOTE]
> Di layar kecil, panel catatan pindah ke bawah daftar, bukan di kanan.', true, 50),
('panduan-kalender', '2026-11-03', 'Kalender: jadwal kamu, tenggat, dan cuti', 'Ada dua kalender: Pribadi buat agenda kamu sendiri, dan kalender Project buat jadwal tim plus timeline project. Bikin jadwal, saring yang tampil, dan pakai pintasan keyboard.', ARRAY['guide']::text[], 'calendar', 'everyone', 'app', '/whats-new/guide-kalender-thumb.webp', '## Dua kalender, beda isinya

| | Kalender pribadi | Kalender project |
|---|---|---|
| Buka dari | **Kalender** di ruang kerja **Pribadi** (di HP: tab **Kalender**) | **Kalender** di ruang kerja **Project** |
| Tampilan | **Minggu**, **Bulan** (di HP: **Agenda**, **Bulan**) | **Timeline**, **Minggu**, **Bulan** |
| Isinya | Jadwal **Pribadi** kamu, rapat & acara yang buat kamu atau buat semua, Sharing Santuy, libur perusahaan, cuti kamu, sesi 1:1 kamu, tenggat tugas kamu | Rapat internal, acara, libur perusahaan, Sharing Santuy, tenggat tugas di project kamu |

Jadwal tipe **Pribadi** cuma kelihatan buat kamu.

## Pindah-pindah tanggal

1. Pilih tampilan di kiri toolbar.
2. Panah **‹ ›** buat mundur/maju, **Hari ini** buat balik ke sekarang. Rentang tanggalnya tertulis di sampingnya.
3. Di tampilan **Minggu** ada **Perkecil** / **Perbesar** buat ngatur tinggi jam.

Pintasan keyboard (selama kursor nggak di kolom isian):

| Tombol | Buat |
|---|---|
| **C** atau **N** | Jadwal baru |
| **T** | Ke hari ini |
| **←** / **→** | Sebelumnya / berikutnya |
| **W** / **M** | Tampilan **Minggu** / **Bulan** |

## Bikin jadwal

1. Klik **Jadwal baru** di kanan toolbar. Bisa juga klik slot jam kosong di **Minggu**, atau klik tanggal di **Bulan**, nanti tanggalnya langsung keisi.
2. Isi **Judul** (wajib).
3. Pilih **Tipe jadwal**.
4. Atur **Mulai** dan **Selesai**, atau nyalakan **Sepanjang hari**.
5. Kalau perlu, isi **Lokasi** dan **Deskripsi**.
6. Klik **Simpan**. Muncul "Jadwal ditambahkan".

![Dialog Tambah jadwal baru](/whats-new/guide-kalender-jadwal-baru.webp)

Tipe yang bisa kamu bikin ikut akses kamu:

| | Kalender pribadi | Kalender project |
|---|---|---|
| Karyawan | **Pribadi** | (cuma lihat) |
| PM | **Pribadi**, **Rapat internal** | **Rapat internal**, **Acara** |
| Stakeholder | **Pribadi**, **Rapat internal**, **Acara**, **Libur perusahaan** | **Rapat internal**, **Acara**, **Libur perusahaan** |

Sesi Sharing Santuy nggak dibikin di sini, tapi dari rotasinya. Lihat [Sharing Santuy punya halaman sendiri](/whats-new/sharing-santuy).

## Ubah atau hapus jadwal

1. Klik jadwal kamu. Dialog **Edit jadwal** kebuka.
2. Ubah yang perlu, lalu **Simpan**. Atau klik **Hapus** → **Ya, hapus**.
3. Mau mindahin jam aja? Geser jadwalnya ke slot lain.

Cuti, sesi 1:1, tenggat tugas, Sharing Santuy, libur nasional, dan jadwal dari Google Calendar cuma bisa dilihat, nggak bisa diubah di kalender. Klik tenggat tugas buat langsung buka tugasnya.

## Pilih yang tampil

1. Klik tombol **Kalender** di toolbar.
2. Centang atau hilangkan centang: **Pribadi**, **Sharing Santuy**, **Rapat internal**, **Acara**, **Cuti**, **Kerja dari Rumah**, **Tenggat tugas**, dan lainnya.
3. Kalau ada yang disembunyiin, tombolnya nunjukin angka kayak 8/10.

![Pilihan kalender yang tampil](/whats-new/guide-kalender-filter.webp)

> [!TIP]
> Di kalender pribadi, **Tenggat tugas** awalnya disembunyiin biar nggak rame. Centang kalau mau lihat tenggat dari [Tugas saya](/whats-new/panduan-tugas-saya) di kalender.

## Google Calendar

Kalender pribadi ikut nampilin jadwal dari Google Calendar. Titik di samping tombol **Kalender** nunjukin statusnya: hijau **Google Calendar terhubung**, merah **Google Calendar terputus**. Jadwal rapat yang punya link Meet bisa dibuka lewat **Gabung via Google Meet** di detailnya.

## Timeline project

Di kalender project, **Timeline** nunjukin tiap project yang berjalan sebagai bar dari tanggal mulai sampai selesai, dengan tugas-tugasnya sebagai kartu di tanggal tenggatnya. Garis merah = hari ini. Klik **Tutup tugas** / **Lihat tugas** buat lipat atau buka tugas satu project, dan klik kartu tugas buat buka tugasnya.

![Timeline project](/whats-new/guide-kalender-timeline.webp)

Karyawan dan PM lihat project yang mereka ikut, stakeholder lihat semua.

## Cuti tim & libur (PM & stakeholder)

PM dan stakeholder juga lihat cuti dan WFH seluruh tim yang udah disetujui. Lihat [Cuti tim di kalender pribadi](/whats-new/kalender-cuti-tim). Stakeholder juga dapat daftar libur nasional dan bisa jadikan libur kantor: [Libur nasional & jadikan libur kantor](/whats-new/kalender-libur-nasional).

Semua aksi klik kanan di kalender (jadwal, slot kosong, toolbar) ada di [Menu klik kanan di tiap halaman](/whats-new/klik-kanan-per-halaman).', true, 60),
('panduan-project-dashboard', '2026-11-03', 'Dashboard project: fase, langkah, progres', 'Cara buka project, baca header dan menu project di sidebar, sampai fase, langkah, progres, dan tenggat di Dashboard.', ARRAY['guide']::text[], 'projects', 'everyone', 'app', '/whats-new/guide-project-dashboard.webp', '## Buka project

1. Klik **Project** di sidebar.
2. Klik kartu atau baris project yang kamu mau. Karyawan cuma lihat project yang dia ikut, stakeholder lihat semua.
3. Sidebar berubah jadi menu project: **Semua project** (balik ke daftar), nama project, lalu halaman-halamannya.

| Halaman | Isinya | Siapa |
|---|---|---|
| **Dashboard** | Ringkasan, fase, langkah, tim | Semua anggota |
| **Tugas** | Board dan list tugas | Semua anggota |
| **Report** | Report harian/mingguan buat klien | Semua anggota |
| **Invoice** | Tagihan project | PM (cuma lihat) & stakeholder |
| **Dokumen** | Proposal, kontrak, file lain | Semua anggota |
| **Library & Aset** | Gambar, video, catatan | Semua anggota |
| **Penilaian** | Nilai SLA & kualitas tim | Lead project & stakeholder |
| **Pengaturan** | Klien, proses, portal, tim | Stakeholder |

Kalau kamu lead project, di samping **Penilaian** ada tanda **Lead**. Panduan tiap halaman: [Tugas](/whats-new/panduan-project-tugas), [Report](/whats-new/panduan-project-report), [Invoice](/whats-new/panduan-invoice), [Dokumen](/whats-new/panduan-project-dokumen), [Library & Aset](/whats-new/panduan-project-library), [Penilaian](/whats-new/panduan-project-penilaian), [Pengaturan](/whats-new/panduan-project-pengaturan).

## Header dan baris properti

Di paling atas ada logo kecil dan nama project. Di kanannya:

- **Report baru** buat langsung nulis report (semua anggota).
- Tombol status project (PM & stakeholder) buat **Pindahkan ke** status lain. Lihat [Project: bikin, pindahin status](/whats-new/project-pm).

Di bawah judul ada satu baris properti:

- **Status** project (titik warna).
- **Progres** dalam persen. Tiap fase dihitung sama: fase selesai = penuh, fase aktif = sesuai langkah yang udah dicentang. Project tanpa fase nunjukin **Berjalan terus** (lihat [Project tanpa fase](/whats-new/project-tanpa-fase)).
- **Fase aktif** dan urutannya, misalnya "Desain 2 dari 4".
- **Tanggal mulai → selesai**, dan jumlah **tugas terbuka**.

## Fase dan langkah

Rel **Fase** nunjukin semua fase dari kiri ke kanan. Tiap kartu fase berisi:

- Nama fase dan statusnya: **Belum mulai**, **Sedang berjalan**, atau **Selesai** + tanggalnya.
- Tenggat fase (ikon kalender). Merah kalau udah lewat.
- Bar progres dan jumlah langkah, misalnya "3/5 langkah".

![Rel fase dan panel langkah](/whats-new/guide-project-phase-rail.webp)

Klik satu fase buat lihat langkahnya di panel **Proses · nama fase**:

1. Centang kotak di depan langkah buat **Tandai selesai** (label kanan berubah dari **Draf** jadi **Selesai**).
2. Mau nambah? Klik **Langkah** di kanan atas panel, ketik judulnya, lalu **Enter**. **Esc** buat batal.
3. Tombol **⋯** di tiap langkah: **Naikkan**, **Turunkan**, **Hapus langkah**. Klik kanan langkah juga bisa **Ubah nama**.

> [!TIP]
> Fase berikutnya nggak jalan sendiri. Kalau semua langkah udah selesai, kabari PM atau stakeholder buat selesaikan fasenya.

## Panel samping dan ringkasan

- **Tugas mendatang**: tugas terbuka terdekat. **Lihat semua** buka tab Tugas.
- **Report terbaru**: report paling baru, klik buat buka. Ikon link artinya report itu udah **Dibagikan** ke klien.
- Kolom kanan: deskripsi **Project**, **Mulai**, **Kuartal**, **Klien** (arahkan kursor buat lihat kontak, email, telepon), [Link desain](/whats-new/panduan-project-link-desain), dan **Tim** (lead ditandai **Lead**).

## Atur fase (khusus stakeholder)

Tombol **⋯** di kanan judul **Fase** berisi **Atur fase**, **Tambah fase**, dan **Jangan pakai fase**. Di tiap kartu fase ada **⋯** juga:

- **Selesaikan nama fase** (fase aktif): fase itu selesai, fase berikutnya jadi aktif.
- **Jadikan aktif**: fase sebelumnya otomatis selesai, yang setelahnya balik ke belum mulai.
- **Ubah nama fase**, **Geser ke kiri**, **Geser ke kanan**, **Hapus fase** (langkahnya ikut hilang, tugasnya tetap ada tanpa fase).

Di **Atur fase** kamu isi **Tenggat**, **Bobot SLA**, dan **Selesai pada** tiap fase, lalu **Simpan**.

![Dialog Atur fase](/whats-new/guide-project-phase-settings.webp)

> [!NOTE]
> Tenggat fase jadi patokan KPI SLA: selesai ≥2 hari lebih awal = Faster, sampai tenggat = On Time, lewat = Delay. Kalau ada fase tanpa tenggat, di samping judul **Fase** muncul peringatan "n fase belum punya tenggat, SLA belum bisa dihitung" dengan tombol **Atur tenggat**.

Stakeholder juga bisa klik deskripsi project ("Tambahkan deskripsi project"), **Mulai**, dan **Kuartal** di kolom kanan buat langsung ngubah.', true, 100),
('panduan-project-tugas', '2026-11-03', 'Tugas di project: board, list, dan detail tugas', 'Kelola tugas project di board atau list: tambah tugas, isi detail, subtugas, PIC, tenggat, komentar, dan saring tugas punyamu.', ARRAY['guide']::text[], 'tasks', 'everyone', 'app', '/whats-new/guide-project-tasks-board.webp', '## Dua tampilan

Buka project → **Tugas**. Di kanan atas ada tombol tampilan:

- **Tampilan kanban** (default): kolom **Akan dikerjakan**, **Dikerjakan**, **Review**, **Selesai**, lengkap sama jumlah kartunya.
- **Tampilan list**: baris dengan kolom **Tugas**, **Fase**, **PIC**, **Tenggat**, **Dibuat**.

Pilihan tampilan diingat di browser kamu. Semua anggota project bisa nambah dan ngubah tugas.

## Tambah tugas

1. Klik **Tugas baru** di kanan atas.
2. Di kanban, kolom pertama kebuka kotak "Judul kartu, Enter untuk simpan". Di list, kotaknya "Nama tugas, Enter untuk simpan".
3. Ketik judul, tekan **Enter**. Kotaknya tetap kebuka, jadi bisa langsung ketik tugas berikutnya. **Esc** buat selesai.

Mau langsung di kolom tertentu? Klik **Tambah kartu** di atas kolom itu (atau klik kanan judul kolom). Tugas baru otomatis masuk ke fase yang lagi aktif.

## Geser dan ubah cepat

- **Kanban:** tarik kartu ke kolom lain buat ganti status, atau naik-turun buat atur urutan.
- **List:** centang kotak di depan baris buat **Tandai selesai**, klik judul buat ganti nama, dan ubah **Fase**, **PIC**, **Tenggat** langsung dari kolomnya.
- Kartu nunjukin tenggat, jumlah subtugas (misalnya 2/5), jumlah komentar, dan ikon peringatan kalau **Lewat tenggat**.

Semua perubahan cepat lain (status, assign, tenggat, pindah fase, duplikat) ada di klik kanan: lihat [Atur tugas tanpa buka tugasnya](/whats-new/tugas-klik-kanan).

## Buka tugas

Klik kartu (di list: ikon komentar di baris) buat buka dialog tugas. Link halaman ikut berubah, jadi bisa disalin dan dikirim ke teman.

![Dialog tugas](/whats-new/guide-project-task-dialog.webp)

**Kolom kiri:**

1. **Judul**: klik dan ketik langsung.
2. **Deskripsi**: editor yang sama kayak report. Ketik **/** buat blok, tempel link buat embed, tempel atau seret gambar dan file. Lihat [Blok baru di editor](/whats-new/editor-blok-baru) dan [Embed](/whats-new/editor-embed).
3. **Subtugas**: ketik di "Tambah subtugas", lalu **Enter**. Centang buat selesai, bar hijau nunjukin progresnya.
4. **Komentar**: tulis di kotak bawah, ketik **@** buat nyebut anggota, kirim pakai **⌘ Enter** (Ctrl+Enter) atau tombol **Kirim**.

**Panel kanan:** **Status**, **PIC** (atau **Tanpa PIC**), dan **Tenggat** (pilih tanggal di kalender). Paling bawah ada **Hapus tugas**.

> [!NOTE]
> Gambar dan file di deskripsi tugas disimpan internal. Klien nggak pernah lihat tugas, termasuk lewat portal.

> [!WARNING]
> **Hapus tugas** ikut ngehapus subtugas dan komentarnya.

## Saring tugas

- **Punya saya**: cuma tugas yang PIC-nya kamu. Bisa di kanban maupun list.
- Di list ada tab **Semua**, **Belum** (default), dan **Selesai**, lengkap sama jumlahnya.

![Tampilan list dan filter](/whats-new/guide-project-tasks-list.webp)

> [!TIP]
> Tugas dari semua project yang di-assign ke kamu juga kumpul di **Tugas saya** di sidebar.', true, 110),
('panduan-project-library', '2026-11-03', 'Library & Aset: folder, file, catatan', 'Simpan gambar, video, dan catatan project di Library: bikin folder, upload, pratinjau, dan atur folder mana yang nggak boleh dilihat klien.', ARRAY['guide']::text[], 'projects', 'everyone', 'app', '/whats-new/guide-project-library.webp', '## Isinya apa aja

Library khusus **aset**: gambar (termasuk SVG dan GIF), video, dan catatan **.md**. Proposal, kontrak, PDF, dan file lain masuk ke tab [Dokumen](/whats-new/panduan-project-dokumen). Kalau kamu upload file lain di sini, muncul pesan "Library untuk aset (gambar & video) dan catatan .md. Dokumen lain di tab Dokumen."

Semua anggota project bisa upload, bikin folder, dan nulis catatan.

## Upload

1. Buka project → **Library & Aset**. Masuk dulu ke folder kalau mau upload ke situ.
2. Klik **Upload**, pilih satu atau beberapa file. Bisa juga seret file ke halaman sampai muncul "Lepas untuk upload".
3. Tunggu tulisan "Mengupload n…" selesai. Muncul notifikasi "n file diupload".

Gambar otomatis dikecilkan dan jadi WebP (lihat [Gambar otomatis jadi WebP](/whats-new/gambar-webp)). Butuh kualitas penuh? Klik panah di samping **Upload** → **Upload resolusi asli (tanpa kompres)**.

## Folder

1. Klik **Folder** di kanan atas (cuma ada di halaman utama Library, folder nggak bisa bertingkat).
2. Isi nama, misalnya "Logo".
3. Nyalakan **Hanya internal** kalau isinya cuma buat tim.
4. Klik **Simpan**.

![Dialog folder baru](/whats-new/guide-project-library-folder.webp)

- Klik folder buat masuk, tombol kembali di header buat keluar.
- Pindahin file: tarik kartunya ke folder, atau **⋯** → **Pindahkan…** → pilih folder (atau **Library (tanpa folder)**).
- **⋯** di folder: **Ubah** (nama dan internal) dan **Hapus**. Hapus folder ikut ngehapus semua isinya permanen.

## Catatan

1. Klik **Catatan** di kanan atas.
2. Isi judul (misalnya "Notulen meeting 28 Okt") dan isinya. Editornya sama kayak report: **/** buat blok, checklist, gambar.
3. Klik **Simpan**. Catatan masuk ke folder yang lagi kebuka sebagai file .md.

Kalau ditutup sebelum disimpan, muncul **Simpan perubahan?** dengan pilihan **Jangan simpan** atau **Simpan**.

![Dialog catatan](/whats-new/guide-project-library-note.webp)

## Lihat dan atur file

- Klik file buat **Pratinjau**. Pakai **←** / **→** buat pindah ke file sebelah, ada tombol buka di tab baru dan unduh di atas.
- **⋯** di file: **Ubah nama**, **Pindahkan…**, **Unduh**, **Hapus**.
- Tombol tampilan di kanan atas: **Tampilan grid** (kartu dengan gambar) atau **Tampilan list** (kolom **Nama**, **Ukuran**, **Dibuat**).

Menu klik kanan file dan folder ada di [Menu klik kanan di tiap halaman](/whats-new/klik-kanan-per-halaman).

## Apa yang dilihat klien

Kalau portal klien project nyala, klien bisa lihat dan unduh isi Library **kecuali folder Hanya internal**. Folder itu ada tanda **Internal**.

> [!WARNING]
> File dan catatan yang ditaruh langsung di Library (tanpa folder) ikut kelihatan di portal. Simpan bahan internal, misalnya notulen atau referensi, di folder **Hanya internal**.

Lihat juga [Portal klien](/whats-new/panduan-portal-klien).', true, 120),
('panduan-project-dokumen', '2026-11-03', 'Dokumen project: proposal, kontrak, status', 'Proposal, kontrak, dan file lain project ada di Dokumen, masing-masing dengan status. Dokumen yang udah dikirim ke klien otomatis muncul di portal.', ARRAY['guide']::text[], 'projects', 'everyone', 'app', '/whats-new/guide-project-documents.webp', '## Lihat dokumen

1. Buka project → **Dokumen**.
2. Dokumen dikelompokkan per jenis: **Proposal**, **Kontrak**, **Lainnya**.
3. Tiap kartu nunjukin pratinjau file, judul, ukuran, tanggal diubah, dan chip status.
4. Klik kartu buat **Pratinjau** (PDF, gambar, dan file teks kebuka langsung). **⋯** di kartu: **Buka** dan **Unduh**.

| Status | Artinya |
|---|---|
| **Draf** | Masih disiapkan, belum ke klien |
| **Dikirim ke klien** | Udah dikirim, nunggu jawaban |
| **Disetujui** | Klien setuju |
| **Ditandatangani** | Udah ditandatangani |

Semua anggota project bisa lihat dan unduh. Yang nambah, ngubah, dan ganti status cuma stakeholder.

> [!NOTE]
> Gambar, video, dan catatan meeting tempatnya di [Library & Aset](/whats-new/panduan-project-library), bukan di sini.

## Tambah dokumen (khusus stakeholder)

1. Klik **Dokumen baru** di kanan atas. Atau langsung seret file ke halaman, judulnya otomatis diisi dari nama file.
2. Di kiri, **Klik atau seret file ke sini** (opsional, maks 50 MB). Bisa **Ganti file** atau **Hapus file** sebelum simpan.
3. Pilih **Jenis** (Proposal, Kontrak, Lainnya) dan **Status**.
4. Isi **Judul**, misalnya "Proposal Rebrand". Wajib.
5. Kalau file-nya gambar, ada pilihan **Resolusi asli** biar nggak dikompres.
6. Klik **Simpan**. Muncul "Dokumen ditambahkan".

![Dialog Dokumen baru](/whats-new/guide-project-document-new.webp)

## Ubah, ganti status, hapus (khusus stakeholder)

- **⋯** di kartu → **Ubah** buat ganti judul, jenis, status, atau file.
- Di menu yang sama ada daftar status. Klik salah satu buat langsung pindah (yang sekarang dicentang).
- Klik kanan kartu → **Status** → pilih status. Ada juga **Salin link**.
- **Hapus**: dokumen dan file-nya hilang permanen.

## Apa yang dilihat klien (PM & stakeholder)

Di [portal klien](/whats-new/panduan-portal-klien), klien cuma lihat dokumen yang:

- statusnya **Dikirim ke klien**, **Disetujui**, atau **Ditandatangani**, dan
- punya file.

Dokumen **Draf** dan dokumen tanpa file nggak pernah muncul ke klien. Jadi ganti status ke **Dikirim ke klien** begitu dokumennya siap dilihat.', true, 130),
('panduan-project-report', '2026-11-03', 'Report project: tulis, simpan, bagikan', 'Tulis report progres project, mulai dari template, simpan, lalu bagikan ke klien. Semua anggota bisa nulis report.', ARRAY['guide']::text[], 'reports', 'everyone', 'app', '/whats-new/guide-project-reports.webp', '## Daftar report

Buka project → **Report**. Tiap baris nunjukin:

- Judul report, badge **Dibagikan** kalau link klien udah dibuat, dan ikon mata dengan jumlah baca klien.
- Penulis dan tanggal report.
- **⋯**: **Buka**, **Salin link** (kalau dibagikan), dan **Hapus** (penulis atau stakeholder).

Report terbaru juga muncul di [Dashboard project](/whats-new/panduan-project-dashboard) di panel **Report terbaru**.

## Tulis report

1. Klik **Report baru** (di tab Report atau di header Dashboard).
2. Judulnya otomatis "Report - @tanggal hari ini". Klik buat ganti.
3. Selama masih kosong, ada baris **Mulai dari template**: **Harian**, **Mingguan**, atau **Kosong**. Lihat [Template report](/whats-new/report-template).
4. Tulis isinya. Ketik **/** buat blok (judul, checklist, callout, gambar, galeri…), **@** buat nyebut tugas atau orang, tempel link Figma/YouTube buat embed.
5. Klik **Simpan**. Muncul "Report disimpan".

![Editor report baru](/whats-new/guide-project-report-editor.webp)

Kalau ditutup sebelum disimpan, muncul **Simpan perubahan?**: pilih **Jangan simpan** atau **Simpan**.

> [!TIP]
> Tombol **AI** di header bisa ngerapiin seluruh isi atau bikin **Ringkas report** di paling atas. Lihat [AI buat nulis di editor](/whats-new/ai-editor).

Panduan editor lainnya: [Blok baru di editor](/whats-new/editor-blok-baru), [Embed](/whats-new/editor-embed), [Mention](/whats-new/editor-mention).

## Siapa bisa ngapain

| | Penulis | Stakeholder | Anggota lain |
|---|---|---|---|
| Baca | Ya | Ya | Ya |
| Ubah & simpan | Ya | Ya | Cuma baca |
| Bagikan / matikan link | Ya | Ya | Nggak |
| Hapus | Ya | Ya | Nggak |

Anggota lain bisa buka report siapa aja, tapi judul dan isinya nggak bisa diedit.

## Bagikan ke klien

1. Buka report → klik **Bagikan** di header → **Buat link**.
2. Link langsung tersalin. Tempel ke WhatsApp atau email klien.
3. Report yang dibagikan juga otomatis muncul di halaman **Report** di [portal klien](/whats-new/panduan-portal-klien).

Detailnya, termasuk **Dibaca n×** dan **Matikan link**, ada di [Bagikan report ke klien](/whats-new/report-link-klien). Tampilan yang klien lihat ada di [Halaman report buat klien](/whats-new/report-halaman-klien), dan preview link-nya di [Preview link yang rapi](/whats-new/report-preview-link).

> [!WARNING]
> Report yang belum dibagikan nggak kelihatan di portal. **Matikan link** atau hapus report bikin report itu hilang dari klien.', true, 140),
('panduan-project-link-desain', '2026-11-03', 'Link desain di Dashboard project', 'Simpan link Figma, prototype, atau FigJam di Dashboard project, tampil dengan nama yang gampang dibaca. Klien juga bisa lihat di portal.', ARRAY['guide']::text[], 'projects', 'everyone', 'app', '/whats-new/guide-project-design-links.webp', '## Ada di mana

1. Buka project → **Dashboard**.
2. Di kolom kanan, di bawah **Klien**, ada bagian **Link desain**.
3. Klik salah satu link buat buka di tab baru. Arahkan kursor buat lihat alamat lengkapnya.

Tiap link nunjukin nama yang rapi dan jenisnya:

| Link | Tertulis |
|---|---|
| figma.com/design/… | **Figma**, nama file diambil dari link (misalnya "Milxa Brand Kit") |
| figma.com/proto/… | **Figma · Prototype** |
| figma.com/board/… | **FigJam** |
| figma.com/slides/… | **Figma · Slides** |
| Link lain | Nama situs dan bagian akhir link-nya |

Karyawan cuma lihat bagian ini kalau udah ada link-nya.

## Tambah link (PM & stakeholder)

1. Klik **+** di samping **Link desain**. Kalau masih kosong, klik **Tambah link Figma**.
2. Tempel alamatnya di **Link** (harus diawali https://).
3. **Nama (opsional)**: kosongin aja kalau nama otomatisnya udah pas. Nama otomatis kelihatan sebagai contoh di kolomnya.
4. Klik **Simpan** atau tekan **Enter**.

![Dialog Tambah link](/whats-new/guide-project-design-link-dialog.webp)

## Ubah atau hapus (PM & stakeholder)

- **⋯** di baris link: **Salin link**, **Ubah**, **Hapus**.
- Klik kanan link juga bisa: **Buka**, **Salin link**, **Ubah**, **Hapus**.
- **Hapus** minta konfirmasi dulu.

## Di portal klien

Link desain ikut tampil di Dashboard [portal klien](/whats-new/panduan-portal-klien), cuma bisa dibuka (nggak bisa diubah).

> [!WARNING]
> Pastikan akses file Figma-nya memang boleh dibuka klien sebelum ditaruh di sini. Link internal (misalnya file kerja yang berantakan) lebih baik disimpan di deskripsi tugas atau catatan di folder **Hanya internal**.', true, 150),
('panduan-project-penilaian', '2026-11-03', 'Penilaian project: nilai SLA & kualitas tim', 'Lead project dan stakeholder menilai SLA dan kualitas kerja tiap anggota project per kuartal dari halaman Penilaian.', ARRAY['guide']::text[], 'projects', 'everyone', 'app', '/whats-new/guide-project-assessment.webp', '## Siapa yang lihat

Halaman **Penilaian** cuma muncul buat:

- **Lead project**: di sidebar project ada tanda **Lead** di samping **Penilaian**.
- **Stakeholder**: di semua project.

Anggota lain nggak lihat menunya. Nilai kamu sendiri tetap bisa kamu lihat di **Kinerja**.

## Isi halamannya

1. Buka project → **Penilaian**. Di samping judul ada kuartal project, misalnya **Q4 2026**.
2. Baris angka di atas: **Anggota**, **SLA belum dinilai**, **Kualitas belum dinilai**.
3. Tabel anggota: **Anggota**, **Peran**, **SLA**, **Kualitas**. Yang belum dinilai ditandai **Belum**.

## Nilai satu anggota

1. Klik baris anggotanya. Panel nilai kebuka di kanan.
2. Bagian atas: **SLA project** dan **Kualitas kerja** orang itu.
3. **Milestone dari fase project**: hasil SLA tiap fase otomatis dari tenggat fase (≥2 hari lebih awal = Lebih cepat). Kalau perlu koreksi, pakai **Sesuaikan hasil** dan tulis alasannya.
4. **Kompetensi (peran)**: tandai tiap kompetensi **Tercapai** atau **Belum**. Daftarnya ikut peran orang itu di project.
5. Klik **Simpan nilai**.

![Daftar anggota di Penilaian](/whats-new/guide-project-assessment-table.webp)

> [!NOTE]
> Lead bisa menilai anggota lain, tapi nggak bisa menilai dirinya sendiri. Nilai lead dikasih stakeholder.

## Biar SLA bisa dihitung (PM & stakeholder)

SLA ngambil patokan dari **tenggat tiap fase**. Kalau fase belum punya tenggat, hasilnya belum bisa dihitung.

- Atur tenggat dan **Bobot SLA** di Dashboard → **⋯** di samping **Fase** → **Atur fase** (khusus stakeholder). Lihat [Dashboard project](/whats-new/panduan-project-dashboard).
- Peran tiap anggota (yang nentuin kompetensinya) diatur waktu bikin atau ubah project, di bagian **Tim**.

> [!TIP]
> Project tanpa fase nggak punya milestone fase. SLA-nya dinilai langsung buat kuartal project.', true, 160),
('panduan-project-pengaturan', '2026-11-03', 'Pengaturan project: klien, proses, portal, tim', 'Atur klien, proses, portal klien, tim, dan hapus project dari halaman Pengaturan. Khusus stakeholder.', ARRAY['guide']::text[], 'projects', 'stakeholder', 'app', '/whats-new/guide-project-settings.webp', '## Buka Pengaturan

1. Buka project → **Pengaturan** (paling bawah di sidebar project).
2. Di atas ada nama project, tanggal mulai–selesai, dan kuartalnya.
3. Kiri: kartu **Klien**, **Proses**, **Portal klien**, **Hapus project**. Kanan: kartu **Tim**.

Karyawan dan PM yang buka link Pengaturan langsung diarahkan balik ke Dashboard.

## Klien

1. Di kartu **Klien**, pilih klien dari dropdown, **Tanpa klien**, atau **Klien baru…** buat bikin sekalian.
2. Data klien (**Nama klien**, **Kontak**, **Email**, **Telepon / WhatsApp**, **Alamat**, **Mata uang**) ikut dari data klien, bukan diisi per project.
3. **Ubah klien** buat ngedit datanya, **Kelola klien** buat buka halaman Klien.

Muncul "Klien project diperbarui" setelah diganti.

## Proses

Dropdown di kartu **Proses** nentuin fase, langkah, dan task project.

![Kartu Proses](/whats-new/guide-project-settings-process.webp)

- **Ganti ke proses lain**: konfirmasi **Ganti proses**. Fase, langkah, dan task yang belum selesai diganti isi proses baru. Task yang udah selesai tetap ada.
- **Tanpa fase**: semua fase dihapus, task tetap ada. Detailnya di [Project tanpa fase](/whats-new/project-tanpa-fase).
- Dari project tanpa fase, pilih proses → **Pakai fase** buat nambahin fasenya.
- Tombol panah di samping dropdown (**Kelola proses**) buka halaman proses itu.

> [!WARNING]
> Ganti proses nggak bisa dibalikin otomatis. Langkah dan task yang belum selesai dari proses lama hilang.

## Tim

1. Klik **Ubah project & tim** di kartu **Tim**.
2. Di dialog **Ubah project** kamu bisa ganti nama, tanggal, kategori, deskripsi, dan anggota.
3. **Tambah anggota…**, atur peran tiap orang, dan nyalakan **Lead** buat satu orang aja.
4. Klik **Simpan**.

> [!NOTE]
> Peran nentuin kompetensi yang dinilai di [Penilaian](/whats-new/panduan-project-penilaian). Ngeluarin anggota yang udah punya nilai bakal ngehapus nilainya, dan ada konfirmasinya dulu.

## Portal klien

Nyalakan portal buat ngasih klien akses ke progres, report, dokumen, dan library pakai link dan PIN:

1. Di kartu **Portal klien**, klik **Aktifkan**.
2. PIN 6 angka udah diacak. Mau ganti? Ketik sendiri atau klik **Acak**.
3. Klik **Simpan**. Link dan PIN langsung tersalin ("Link & PIN disalin").
4. PIN cuma kelihatan sekali di kartu. Klik **Salin link & PIN** kalau perlu salin lagi sebelum pindah halaman.

Setelah nyala, kartu nunjukin link portal dan kapan terakhir dibuka klien ("Terakhir dibuka …" atau "Belum pernah dibuka klien").

- **Ganti PIN**: klien yang lagi masuk diminta PIN baru.
- **Matikan**: link lama nggak bisa dibuka lagi.

Isi portal dari sisi klien ada di [Portal klien](/whats-new/panduan-portal-klien).

## Hapus project

1. Klik **Hapus project** di kartunya.
2. Baca konfirmasinya: tugas, dokumen, library, dan nilai KPI-nya ikut terhapus permanen.
3. Klik **Hapus permanen**.

> [!TIP]
> Cuma mau nyembunyiin project yang udah beres? Pindahin ke **Diarsipkan** aja, datanya tetap aman.', true, 170),
('panduan-portal-klien', '2026-11-03', 'Portal klien: yang dilihat klien', 'Portal klien nunjukin progres project, report yang dibagikan, dokumen, dan library ke klien lewat link dan PIN. Begini yang klien lihat dan cara ngasih link-nya.', ARRAY['guide']::text[], 'projects', 'pm', 'client', '/whats-new/guide-portal-dashboard.webp', '## Kasih link ke klien

Portal dinyalakan stakeholder dari **Pengaturan** project → kartu **Portal klien** → **Aktifkan**. Langkah lengkapnya di [Pengaturan project](/whats-new/panduan-project-pengaturan).

1. Setelah disimpan, link dan PIN langsung tersalin dalam satu pesan: "Portal project nama: link" lalu "PIN: 123456".
2. Tempel ke WhatsApp atau email klien.
3. PIN cuma kelihatan sekali. Kalau lupa dicatat, stakeholder tinggal **Ganti PIN**.

![Kartu Portal klien di Pengaturan](/whats-new/guide-portal-settings-card.webp)

![Dialog Aktifkan portal klien](/whats-new/guide-portal-activate.webp)

> [!NOTE]
> PM nggak punya halaman Pengaturan. Minta link dan PIN ke stakeholder, lalu teruskan ke klien.

Formatnya **/p/nama-project-kode**. Kalau nama project diganti, link lama tetap jalan dan pindah ke nama baru. Link dibuka di situs klien, jadi klien nggak perlu VPN atau akun.

## Masuk pakai PIN

1. Klien buka link-nya. Muncul nama project dan "Enter the PIN from Kretya Studio."
2. Klien ketik 6 angka PIN, klik **Open**.
3. Sekali masuk, browser itu diingat 30 hari. Keluar lewat **Sign out** di sidebar.

![Layar PIN portal](/whats-new/guide-portal-pin.webp)

| Kejadian | Yang klien lihat |
|---|---|
| PIN salah | "Wrong PIN." |
| Salah 5 kali | "Too many tries. Try again in 15 minutes." Di kartu portal muncul "Terkunci sebentar karena PIN salah 5 kali". |
| Stakeholder **Ganti PIN** | Semua yang lagi masuk diminta PIN baru |
| Portal **Matikan** | "This portal is no longer active." / halaman tidak ditemukan |

## Yang klien lihat

Portal tampil dalam bahasa Inggris dulu. Di sidebar ada pengalih tema dan bahasa (lihat [Halaman report buat klien](/whats-new/report-halaman-klien)).

- **Dashboard**: status, progres, fase aktif, tanggal, rel fase, langkah tiap fase (**Done** / **To do**), **Latest reports** (3 terbaru), deskripsi project, **Start**, **Deadline**, **Client**, dan [Link desain](/whats-new/panduan-project-link-desain).
- **Reports**: semua report yang udah **Dibagikan**. Bukanya dari portal ikut dihitung di **Dibaca n×** dengan sumber **Portal**.
- **Documents**: dokumen berstatus **Dikirim ke klien**, **Disetujui**, atau **Ditandatangani** yang punya file. Bisa dipratinjau dan diunduh.
- **Library & assets**: file dan folder Library, kecuali folder **Hanya internal**.

![Library di portal: folder Hanya internal nggak ikut tampil](/whats-new/guide-portal-library.webp)

## Yang nggak pernah kelihatan

- **Tugas**, subtugas, komentar, dan lampiran di deskripsi tugas.
- **Invoice**, **Penilaian**, **Pengaturan**, bobot SLA, dan nama anggota tim.
- Report yang belum dibagikan, dokumen **Draf**, dan isi folder **Hanya internal**.

> [!WARNING]
> File dan catatan yang ditaruh langsung di Library (tanpa folder) ikut kelihatan di portal. Simpan bahan internal di folder **Hanya internal**.

> [!TIP]
> Sebelum kirim link, coba buka portalnya sendiri di jendela privat biar tahu persis apa yang klien lihat.', true, 180),
('panduan-kehadiran', '2026-11-03', 'Kehadiran: clock in, istirahat, clock out', 'Cara clock in dengan status yang pas, istirahat, clock out (manual atau otomatis), nutup sesi yang kelupaan, dan baca riwayat kehadiran kamu.', ARRAY['guide']::text[], 'leave', 'everyone', 'app', '/whats-new/guide-kehadiran-thumb.webp', '## Buka halamannya

1. Di sidebar ruang kerja **Pribadi**, klik **Cuti & Kehadiran**.
2. Di bawah saldo cuti ada baris hari ini: jam sekarang, tanggal, switch **Clock out otomatis**, dan tombol clock in.
3. Paling bawah ada **Riwayat kehadiran**.

Kartu **Hari ini** di **Beranda** punya tombol yang sama, jadi bisa clock in langsung dari situ tanpa buka halaman ini.

## Clock in

1. Pilih status di dropdown sebelah tombol: **Hadir**, **Lembur**, atau **Cuti Masuk**.
2. Klik **Clock In**. Muncul "Clock in berhasil".

| Status | Dipakai buat |
|---|---|
| **Hadir** | Hari kerja biasa, termasuk hari WFH |
| **Lembur** | Sesi lembur |
| **Cuti Masuk** | Lagi cuti (udah disetujui) tapi tetap masuk. Otomatis kepilih kalau hari ini kamu cuti |

> [!NOTE]
> WFH tetap clock in kayak biasa, statusnya **Hadir**. Hari WFH-nya sendiri diajukan lewat **Ajukan cuti** → **WFH (Remote)**. Lihat [Cuti: ajukan, pantau, batalkan](/whats-new/panduan-cuti).

## Istirahat & clock out

1. Setelah clock in, tombolnya berubah jadi **Istirahat** dan **Clock Out**.
2. Klik **Istirahat** buat mulai, lalu **Selesai istirahat** buat lanjut kerja. Lama istirahat masuk ke kolom **Istirahat**.
3. Udah selesai? Klik **Clock Out** → "Clock out sekarang?" → **Clock Out**.

Tiap clock in sampai clock out dihitung satu sesi. Sehari boleh beberapa sesi, misalnya pagi dan sore.

Lewat klik kanan juga bisa: klik kanan baris hari ini → **Clock In**, **Clock in sebagai** (langsung pilih statusnya), **Istirahat**, atau **Clock Out**.

## Clock out otomatis

1. Nyalain switch **Clock out otomatis** di baris hari ini.
2. Pilih jamnya (per 30 menit, awalnya 17:00). Muncul "Clock out otomatis pukul 17:00."

Tiap orang atur sendiri. Sesi yang ditutup otomatis ditandai **Clock out otomatis** di riwayat.

## Lupa clock out

Kalau sesi kemarin masih kebuka, baris hari ini nunjukin "Sesi … belum ditutup" dan tombol **Tutup sesi sebelumnya**. Klik itu dulu sebelum clock in lagi.

Sesinya ditutup di jam clock out otomatis kamu di hari itu (17:00 kalau belum diatur), bukan jam sekarang, jadi malamnya nggak ikut kehitung kerja. Sesi **Lembur** ditutup 23:59.

> [!TIP]
> Durasi yang warnanya kuning artinya sesinya lebih dari 12 jam, biasanya karena lupa clock out. Arahkan kursor ke angkanya buat lihat keterangannya.

## Baca riwayat kehadiran

- Riwayatnya dikelompokkan per hari, tiga hari terakhir langsung kebuka. Klik judul harinya buat buka/tutup.
- Judul hari nunjukin label **Hari ini** / **Kemarin**, **Aktif** kalau masih kerja, jumlah sesi, total istirahat, dan total durasi.
- Tiap sesi punya kolom **Jam**, **Status**, **Istirahat**, dan **Durasi**.
- Catatan kecil di bawah jam: **Diedit admin**, **Clock out otomatis**, atau **Menunggu dihapus**.
- Yang tampil 90 hari terakhir. Klik **Muat lebih banyak** buat hari-hari sebelumnya.

## Minta hapus sesi yang salah

1. Arahkan kursor ke sesi yang udah selesai, lalu klik **Minta hapus** (di HP: link **Minta hapus** di bawah jamnya).
2. Di "Minta hapus data kehadiran?", klik **Kirim permintaan**.
3. Sesinya ditandai **Menunggu dihapus** sampai admin meninjaunya.

Klik kanan sesi juga ada **Minta hapus** dan **Salin jam**.

## Pantau kehadiran tim (khusus stakeholder)

1. Buka **Cuti & Kehadiran** → tab **Kehadiran** (atau langsung dari sidebar: **Cuti & Kehadiran** → **Kehadiran**).
2. Di atas ada angka **Cuti hari ini**, **Menunggu persetujuan**, **Disetujui**, **Hadir hari ini**, dan **Sedang bekerja**.
3. Daftarnya per hari, satu baris per sesi: **Karyawan**, **Status**, **Jam**, **Istirahat**, **Durasi**.

![Kehadiran tim](/whats-new/guide-kehadiran-tim.webp#size=wide)

Tombol di tiap baris:

| Tombol | Kapan muncul | Hasilnya |
|---|---|---|
| **Tinjau hapus** | Karyawan minta hapus | **Hapus data** atau **Tolak permintaan** |
| **Tutup sesi** | Sesi masih aktif | Clock out dicatat pada jam sekarang |
| **Edit** | Sesi udah selesai | Ubah **Tanggal**, **Clock In**, **Clock Out**, **Status** → **Simpan perubahan**. Sesinya ditandai **Diedit admin** |

Permintaan hapus juga masuk ke [Inbox approval](/whats-new/inbox-approval) di tab **Hapus absen**. Di **Beranda**, kartu **Kehadiran hari ini** punya tombol **Buka kehadiran** buat langsung ke sini.', true, 300),
('panduan-cuti', '2026-11-03', 'Cuti: ajukan, pantau, batalkan', 'Ajukan cuti tahunan, sakit, atau WFH, cek sisa cuti dan aturannya, pantau statusnya, lalu ubah atau batalkan kalau rencana berubah. Plus cara stakeholder menyetujui.', ARRAY['guide']::text[], 'leave', 'everyone', 'app', '/whats-new/guide-cuti-thumb.webp', '## Cek sisa cuti

1. Buka **Cuti & Kehadiran** di sidebar ruang kerja **Pribadi**.
2. Paling atas ada **Sisa cuti tahunan** (misalnya "8 / 12 hari"), **Sakit tahun ini**, dan **WFH tahun ini**.
3. Klik **Aturan** di sebelah **Sisa cuti tahunan** buat baca **Aturan cuti** yang berlaku. Di bawahnya ada versinya dan **Buka di Aturan**.

Sisa cuti tahunan juga ada di panel [Profil saya](/whats-new/profil-saya).

| Masa kerja | Jatah cuti tahunan |
|---|---|
| Kurang dari 6 bulan | Belum dapat, tertulis "Mulai …" tanggal kamu berhak |
| 6–11 bulan | 1 hari per bulan kerja |
| 12 bulan ke atas | 12 hari per tahun, nggak diakumulasi |
| Magang | Nggak dapat cuti tahunan |

Yang ngurangin saldo cuma **Cuti Tahunan** yang udah disetujui, dihitung per hari kerja.

## Ajukan cuti

1. Klik **Ajukan cuti**.
2. Di **Pengajuan untuk**, pilih **Cuti Tahunan**, **Sakit**, atau **WFH (Remote)**.
3. Pilih rentang **Tanggal**. Di bawahnya muncul "Durasi: … hari kerja." (Sabtu–Minggu nggak dihitung).
4. Isi **Alasan** (wajib).
5. Buat **Sakit**, kamu bisa lampirkan **Surat dokter (opsional)**: foto atau PDF, maks 5MB. Foto dikecilin otomatis.
6. Klik **Lanjut**. Di **Periksa pengajuan**, cek lagi jenis, tanggal, durasi, dan alasannya.
7. Centang "Saya sudah membaca dan menyetujui aturan cuti." (buka **Lihat aturan lengkap** kalau mau baca dulu), lalu **Kirim pengajuan**.

> [!NOTE]
> Khusus **Cuti Tahunan**: diajukan paling lambat H-7, maksimal 5 hari kerja per pengajuan, dan nggak boleh lebih dari sisa saldo. Form-nya langsung ngasih tahu, misalnya "Memenuhi ketentuan: diajukan H-10.", atau merah kalau masih kurang. **Sakit** dan **WFH** nggak kena aturan ini.

Tanggalnya nggak boleh bentrok sama pengajuan kamu yang lain.

## Pantau statusnya

1. Klik **Detail cuti** di pojok kanan atas.
2. **Pengajuan aktif** nunjukin pengajuan yang lagi jalan dan progresnya: **Diajukan** → **Menunggu persetujuan** (atau **Disetujui** / **Ditolak**) → **Mulai cuti** / **Sedang cuti**.
3. Catatan dari yang menyetujui muncul sebagai "Catatan: …".
4. **Riwayat pengajuan** di bawahnya berisi semua pengajuan kamu dengan status **Menunggu**, **Disetujui**, atau **Ditolak**.

Kamu dapat notifikasi waktu pengajuannya disetujui atau ditolak. Cuti yang disetujui juga muncul di **Kalender** kamu.

## Ubah atau batalkan

| Status | Yang bisa kamu lakukan |
|---|---|
| **Menunggu** | **Ubah tanggal** (form yang sama, kirim lewat **Simpan & kirim ulang**) atau **Batalkan** → **Batalkan pengajuan** |
| **Ditolak** | **Ajukan ulang** dengan tanggal atau alasan baru |
| **Disetujui** | Nggak bisa diubah dari sini. Hubungi admin |

Tombolnya ada di kartu **Pengajuan aktif** dan di menu ⋯ tiap baris **Riwayat pengajuan**. Lewat klik kanan juga ada **Salin rentang tanggal**, **Lihat di kalender**, dan **Lihat bukti**.

## Setujui pengajuan (khusus stakeholder)

1. Buka **Cuti & Kehadiran**. Tab **Persetujuan** kebuka duluan.
2. Tabelnya berisi **Karyawan**, **Tanggal**, **Jenis**, **Alasan**, dan **Status**. Yang masih menunggu ada paling atas.
3. Klik centang di barisnya buat **Setujui** → "Setujui pengajuan?" → **Setujui**. Karyawannya dikabari.
4. Klik × buat **Tolak**, isi **Alasan (opsional)** (misalnya "Mis. bentrok dengan deadline project"), lalu **Tolak**.
5. Banyak sekaligus? Centang beberapa baris, lalu setujui atau tolak bareng.

Klik kanan baris → **Lihat detail** buat lihat semuanya, termasuk bukti. Yang lebih cepat: tombol **Inbox approval** di kanan atas, lihat [Inbox approval lebih rapi](/whats-new/inbox-approval). Cuti tim yang disetujui ada di [kalender](/whats-new/kalender-cuti-tim).

## Catat cuti manual (khusus stakeholder)

Buat cuti yang diajukan di luar app:

1. Di tab **Persetujuan**, klik **Tambah manual**.
2. Isi **Karyawan**, **Tanggal mulai**, **Tanggal selesai**, **Jenis**, **Status**, **Tanggal pengajuan**, **Alasan**, dan **Link bukti** kalau ada.
3. Klik **Simpan**. Muncul "Cuti manual ditambahkan".

![Dialog Tambah cuti manual](/whats-new/guide-cuti-form.webp)

## Saldo cuti tim (khusus stakeholder)

Tab **Saldo Cuti** nunjukin tiap orang: **Karyawan**, **Jabatan**, **Terpakai**, dan **Sisa**, lengkap sama catatannya (misalnya masih magang atau belum 6 bulan). Klik kanan → **Buka profil**.', true, 310),
('panduan-kinerja', '2026-11-03', 'Kinerja: KPI & kompetensi', 'Dari mana nilai akhir KPI kamu: SLA project, 360 review, dan kualitas kerja, lengkap sama bobot, target, dan rating. Plus KPI tim, kunci periode, dan kompetensi buat stakeholder.', ARRAY['guide']::text[], 'performance', 'everyone', 'app', '/whats-new/guide-kinerja-thumb.webp', '## Buka KPI kamu

1. Klik **Kinerja** di sidebar. Kamu langsung lihat **KPI saya**.
2. Pilih periode di kanan atas: tahunnya, lalu **Q1**–**Q4** atau **Setahun**. Periodenya ikut tersimpan di link, jadi bisa dibagikan.

## Nilai akhir & rating

Paling atas ada **Nilai akhir** (0–100), ratingnya, dan perubahan dari kuartal sebelumnya (misalnya "Naik 4 dari Q3"). Di bawahnya ada saran fokus, misalnya "Fokus kuartal ini: Kualitas kerja, kurang 6% lagi ke target." Batang kecil di kanan nunjukin nilai akhir tiap kuartal.

| Nilai akhir | Rating |
|---|---|
| 95 ke atas | **Istimewa** |
| 85–94 | **Di atas harapan** |
| 75–84 | **Sesuai harapan** |
| 60–74 | **Di bawah harapan** |
| Di bawah 60 | **Perlu perbaikan** |

## Tiga bagian nilainya

| Bagian | Isinya | Bobot | Target |
|---|---|---|---|
| **SLA project** | Milestone project selesai tepat waktu | 40% | 90% |
| **360 review** | Penilaian dari rekan kerja | 15% | 85% |
| **Kualitas kerja** | Kompetensi yang tercapai di project | 45% | 90% |

- **SLA project:** tiap milestone dapat **Lebih cepat** (120% dari bobotnya), **Tepat waktu** (100%), atau **Terlambat** (80%). Milestone-nya diambil dari fase project, hasilnya otomatis dari tenggat fase. Selesai 2 hari lebih awal atau lebih = **Lebih cepat**.
- **360 review:** hasil penilaian rekan di periode itu. Cara ngisinya ada di [Kinerja: 360 review & jadwal 1:1](/whats-new/panduan-kinerja-review).
- **Kualitas kerja:** checklist kompetensi buat peran kamu di project, dinilai lead project. Biasanya dihitung saat handover.

Ikon (i) di tiap kartu nunjukin bobot dan targetnya. Bagian yang belum ada nilainya nggak ikut dihitung, bobotnya dibagi ke yang lain ("Dari 2 komponen yang sudah ada nilainya").

## Project kamu

Kartu **Project** berisi semua project kamu di periode itu, dengan nilai **SLA** dan **Kualitas** masing-masing.

1. Di bawah nama project ada peran kamu, atau "Lewat tenggat … hari" kalau project-nya telat.
2. Project yang diarsipkan tertulis "Diarsipkan, tidak masuk nilai".
3. Klik project buat buka rinciannya di panel samping: milestone, hasilnya, dan kompetensi yang dinilai.
4. **Tenggat berikutnya** nunjukin milestone yang sebentar lagi jatuh tempo.

> [!NOTE]
> Yang menilai milestone dan kualitas kerja adalah lead project (dan stakeholder), lewat halaman **Penilaian** di project. Ada yang kerasa salah? Ngobrol sama lead project kamu.

## KPI tim (khusus stakeholder)

1. Buka **Kinerja**. Tab pertama jadi **KPI tim**.
2. Di atas ada **Anggota**, **Rata-rata nilai akhir**, **Di bawah harapan**, dan **Belum ada data**.
3. Tabelnya: **Anggota**, **Jabatan**, **SLA**, **360**, **Kualitas**, **Nilai**, **Rating**, urut dari nilai tertinggi.
4. Klik orangnya buat buka KPI dia. Tampilannya sama kayak punya dia, plus kartu **Perlu tindakan** (misalnya "Kualitas kerja belum dinilai" atau "Belum ada milestone") dengan tombol **Nilai** atau **Buka project**.

Klik kanan baris → **Lihat KPI** atau **Salin skor**.

![Tab KPI tim](/whats-new/guide-kinerja-kpi.webp#size=wide)

## Kunci periode (khusus stakeholder)

Biar nilai satu kuartal nggak berubah-ubah lagi setelah dibahas:

1. Di **KPI tim**, pilih satu kuartal (bukan **Setahun**).
2. Klik **Kunci periode** → konfirmasi (misalnya "Kunci Q4 2026?") → **Kunci periode**. Nilai semua anggota disimpan seperti sekarang.
3. Kalau ada yang berubah setelahnya, KPI orangnya nunjukin "Nilai berubah setelah dikunci (sekarang …)."
4. Mau dihitung langsung lagi? **Buka kunci** → konfirmasi.

## Kompetensi (khusus stakeholder)

Tab **Kompetensi** berisi checklist kualitas kerja per peran project: **UIX Designer**, **Brand Designer**, **Webflow Developer**, **Project Manager**, dan **Admin**.

1. Saring pakai **Semua peran** atau salah satu peran (angkanya jumlah kompetensi).
2. Klik **Kompetensi** buat nambah. Di **Kompetensi baru**, isi **Peran**, **Nama**, dan **Penjelasan** (kapan dianggap tercapai), lalu **Simpan**.
3. Klik **Ubah** di barisnya buat ganti nama atau penjelasan.
4. Klik kanan → **Salin ke role** buat bikin kompetensi yang sama di peran lain.

![Tab Kompetensi](/whats-new/guide-kinerja-kompetensi.webp#size=wide)

> [!NOTE]
> Kompetensi yang udah dipakai di penilaian ("Dipakai di … penilaian") nggak bisa dihapus, biar nilai lama nggak berubah. Ubah namanya aja kalau perlu.', true, 320),
('panduan-kinerja-review', '2026-11-03', 'Kinerja: 360 review & jadwal 1:1', 'Cara menilai rekan di 360 review, baca hasilnya, dan pilih jadwal 1:1. Stakeholder juga bisa buka periode 360, proses hasilnya, dan atur slot 1:1.', ARRAY['guide']::text[], 'performance', 'everyone', 'app', '/whats-new/guide-kinerja-review-thumb.webp', '## Di mana

Dua-duanya ada di **Kinerja** → **KPI saya**:

- **360 review** di kartu tengah, di bawah nilai akhir. Bagian bawah kartunya nunjukin status periode dan tombolnya.
- **Jadwal 1:1** di kartu sebelah **Project**.

Status 360 yang mungkin muncul: "360 dibuka …" (belum mulai), "Tutup … · sisa … hari" (lagi jalan), "Menunggu hasil" (udah tutup, hasil belum diproses), atau "Belum ada periode 360".

## Nilai rekan di 360 review

1. Selama periodenya buka, klik **Nilai … rekan** (atau **Nilai rekan** kalau semua udah kamu nilai).
2. Di **Nilai rekan kerja**, klik **Nilai** di baris rekannya.
3. Kasih bintang 1–5 buat lima kriteria: **Kualitas kerja**, **Keandalan & deadline**, **Komunikasi**, **Inisiatif & berkembang**, dan **Kepemimpinan & kerja tim**.
4. Nilai 1–2 atau 5 perlu alasan singkat, minimal 10 karakter.
5. Isi **Masukan**: **Pertahankan** (hal baik yang perlu terus dilakukan), **Mulai lakukan**, dan **Kurangi**.
6. Klik **Kirim penilaian**. Statusnya jadi **Terkirim**.

> [!NOTE]
> Nama kamu nggak ditampilkan ke rekan yang kamu nilai, cuma admin yang lihat. Semua karyawan saling menilai; admin nggak ikut.

- Salah isi? Klik **Ubah** di barisnya. Review cuma bisa diubah sekali, dan nggak bisa lagi kalau hasilnya **Sudah diproses**.
- Nutup form di tengah jalan? Muncul "Tinggalkan penilaian?". Pilih **Lanjut mengisi** atau **Tinggalkan**.

## Baca hasil 360 kamu

Setelah admin memproses hasilnya, klik **Lihat hasil lengkap** di kartu **360 review**.

1. Di atas ada **Nilai 360** kamu, dari berapa rekan, dan rata-rata tim.
2. **Kriteria** nunjukin nilai tiap kriteria.
3. Tab **Rangkuman AI** berisi **Ringkasan**, **Pertahankan**, **Mulai lakukan**, dan **Kurangi**.
4. Tab **Teks asli** berisi tulisan rekan apa adanya, tanpa nama dan nggak sesuai urutan masuk.

## Pilih jadwal 1:1

1. Di kartu **Jadwal 1:1**, slot yang tersedia dikelompokkan per hari ("Hari ini · …", "Besok · …").
2. Klik jam yang kamu mau. Muncul "Jadwal 1:1 terkonfirmasi" dan kartunya jadi **Terjadwal**, lengkap sama "dengan …" dan tempatnya (**Online** atau **Offline**).
3. Slot online otomatis dapat link Meet. Klik **Gabung** pas waktunya.
4. Berhalangan? Klik **Lepas** → "Lepas jadwal ini?" → **Lepas**. Slotnya kebuka lagi buat orang lain.

Satu periode cuma satu 1:1. Setelah lewat, kartunya nunjukin **Sudah berlangsung**. Jadwal 1:1 kamu juga muncul di **Kalender**.

## Kelola periode 360 (khusus stakeholder)

1. Buka **Kinerja** → tab **360 review**, lalu pilih kuartalnya (360 dikelola per kuartal, bukan **Setahun**).
2. Di atas ada "Periode Q…" dan statusnya: **Dijadwalkan**, **Berjalan**, **Selesai**, atau **Ditutup**.
3. Belum ada periode? Klik **Buka periode**, isi **Tanggal mulai** dan **Tanggal tutup** ("Dibuka … 00:00, ditutup … 23:59 WIB."), lalu **Buka periode**. Tanggal mulai di depan = dijadwalkan.
4. Lagi jalan: **Ubah periode** buat geser tanggal, **Tutup sekarang** buat nutup lebih awal. Udah ditutup: **Buka lagi**.

## Proses hasil 360 (khusus stakeholder)

1. Angka di atas: **Penilaian masuk**, **Siap diproses**, dan **Sudah diproses**.
2. Daftar karyawan dikelompokkan: **Siap diproses**, **Masih berjalan**, **Belum ada penilaian**, **Sudah diproses**. Kolom **Penilai** nunjukin berapa rekan yang udah menilai.
3. Klik **Proses** di barisnya (atau **Proses semua (…)** di atas) → konfirmasi.
4. Klik **Lihat** buat baca hasilnya.

![Tab 360 review](/whats-new/guide-kinerja-review-360.webp#size=wide)

> [!WARNING]
> Hasil dirangkum AI, langsung kelihatan sama karyawannya, dan cuma bisa diproses sekali. Tunggu sampai penilainya cukup.

## Atur slot 1:1 (khusus stakeholder)

1. Buka **Kinerja** → tab **Jadwal 1:1**. Di atas ada **Slot berikutnya**, **Terisi**, **Tersedia**, dan **Sudah lewat**.
2. Klik **Tambah slot**. Di **Tambah slot 1:1**, isi **Tanggal**, **Mulai**, **Selesai**, dan **Tempat**: **Online (Meet)** atau **Offline** (tulis lokasinya).
3. Klik **Tambah slot**. Karyawan dikabari ada slot baru.
4. Di tiap slot: **Ubah jadwal** (yang udah pesan dikabari jadwal barunya), **Batalkan** buat slot yang udah terisi, atau **Hapus** buat slot kosong.

Klik kanan slot juga ada **Salin jadwal** dan **Salin link meeting**.

![Dialog Tambah slot 1:1](/whats-new/guide-kinerja-review-slot.webp)', true, 321),
('panduan-aturan', '2026-11-03', 'Aturan & Update: baca dan kelola aturan kantor', 'Cari dan baca aturan kantor, lihat versi lamanya lewat riwayat, dan unduh update Kretya Flow. Stakeholder juga bisa nulis, menerbitkan, dan mengarsipkan aturan.', ARRAY['guide']::text[], 'policies', 'everyone', 'app', '/whats-new/guide-aturan-thumb.webp', '## Cari aturan

1. Klik **Aturan & Update** di sidebar.
2. Aturan dikelompokkan per kategori: **Umum**, **Cuti**, **Kehadiran**, **Jam kerja**, **Benefit**, **Keuangan**, **Etika & perilaku**, dan **Update aplikasi**.
3. Ketik di **Cari aturan…** buat nyaring.
4. Ganti tampilan kartu atau daftar pakai tombol di kanan atas.

Tiap kartu nunjukin judul, ringkasan, dan "Berlaku sejak …". Yang kamu lihat cuma aturan yang udah terbit.

## Baca aturannya

1. Klik kartunya. Aturannya kebuka di atas daftar.
2. Di atas ada judul, ringkasan, "Berlaku sejak …", dan "Diperbarui … oleh …".
3. Isinya di bawah garis. Gambar bisa diklik buat dibuka besar.
4. Tutup pakai × atau **Esc**.

Link-nya bisa disalin dan dibagikan: aturannya langsung kebuka waktu link-nya dibuka. Klik kanan kartu juga ada **Salin judul**.

![Membaca aturan](/whats-new/guide-aturan-baca.webp#size=wide)

## Lihat versi sebelumnya

Di bagian bawah aturan ada **Riwayat**: siapa yang menerbitkan atau memperbarui, kapan, dan catatan apa yang berubah.

1. Versi yang lagi dipakai ditandai **Berlaku**.
2. Klik versi lain buat membacanya. Muncul "Ini versi lama dari …, bukan yang berlaku sekarang."
3. Klik **Lihat versi berlaku** buat balik.

> [!TIP]
> Aturan cuti juga bisa dibaca langsung dari halaman **Cuti & Kehadiran** lewat link **Aturan** di sebelah **Sisa cuti tahunan**.

## Update aplikasi

Catatan di kategori **Update aplikasi** punya kotak unduhan "Kretya Flow … untuk Mac" (Apple Silicon & Intel). Klik **Unduh** buat ambil versi itu.

## Tulis aturan baru (khusus stakeholder)

1. Klik **Aturan baru**. Editornya kebuka penuh, statusnya **Draf**.
2. Pilih **Kategori** di atas, isi **Judul aturan**, dan **Ringkasan singkat (opsional)**.
3. Tulis isinya. Ketik **/** buat nyisipin blok (judul, daftar, tabel, gambar, callout, toggle, dan lainnya).
4. Tersimpan otomatis: lihat status **Menyimpan…** / **Tersimpan** di atas.
5. Klik **Terbitkan**. Di **Terbitkan aturan**, isi **Apa yang berubah (opsional)**, pilih **Berlaku sejak**, dan centang **Kirim notifikasi ke semua karyawan** kalau perlu.
6. Klik **Terbitkan**. Muncul "… diterbitkan".

Nutup editor waktu masih ada yang belum tersimpan? Muncul "Simpan perubahan?" dengan **Jangan simpan** dan **Simpan**.

![Editor aturan](/whats-new/guide-aturan-editor.webp#size=wide)

## Ubah aturan yang udah terbit (khusus stakeholder)

1. Buka aturannya, klik **Edit** (atau **Lanjutkan draf** kalau udah ada).
2. Perubahannya jadi **Draf perubahan**. Karyawan tetap lihat versi yang berlaku sampai kamu terbitkan.
3. Klik **Terbitkan** → **Terbitkan perubahan**. **Apa yang berubah** wajib diisi, dan tampil di **Riwayat**.

Versi sebelumnya tetap tersimpan di riwayat. Nggak jadi? Buka menu ⋯ (**Aksi aturan**) → **Buang draf**. Isi yang berlaku nggak berubah.

## Arsip & hapus (khusus stakeholder)

1. Tab di atas daftar: **Semua**, **Terbit**, **Draf**, dan **Diarsipkan**, lengkap sama jumlahnya.
2. Kartu bisa punya label **Ada draf**, **Draf**, atau **Diarsipkan**.
3. Menu ⋯ di aturan (atau klik kanan kartunya) → **Arsipkan** buat nyembunyiin dari karyawan, **Pulihkan** buat balikin.
4. **Hapus aturan** → **Hapus permanen** menghapus aturan beserta riwayatnya.

> [!WARNING]
> Hapus nggak bisa dibatalkan. Kalau cuma mau nyembunyiin, pakai **Arsipkan**.', true, 330),
('panduan-kontrak', '2026-11-03', 'Kontrak: baca dan setujui kontrak kerja', 'Lihat kontrak kerja kamu, baca PDF-nya langsung di app, dan setujui dengan ngetik nama lengkap. Stakeholder bisa unggah, ubah, dan pantau kontrak semua karyawan.', ARRAY['guide']::text[], 'policies', 'everyone', 'app', '/whats-new/guide-kontrak-thumb.webp', '## Lihat kontrak kamu

1. Klik **Kontrak** di sidebar.
2. Tiap baris nunjukin judul, periode ("Sejak …" atau "… – …"), jenisnya, dan statusnya.
3. Kontrak yang berakhir dalam 30 hari ditandai "Berakhir … hari lagi" dengan garis kuning di kirinya.

| Label | Artinya |
|---|---|
| **PKWT**, **PKWTT**, **Freelance**, **NDA**, **Adendum**, **Lainnya** | Jenis kontrak |
| **e-Meterai** | PDF-nya udah dibubuhi e-Meterai |
| **Perlu disetujui** | Kamu belum menyetujuinya |
| **Disetujui** | Kamu udah menyetujuinya |

Kamu dapat notifikasi tiap ada kontrak baru yang dikirim ke kamu.

## Buka kontraknya

1. Klik judulnya. PDF-nya tampil di kiri, **Detail** di kanan: **Jenis**, **Periode**, **e-Meterai**, dan **Catatan**.
2. Klik ikon unduh di kanan atas buat nyimpan PDF-nya.
3. Tutup pakai × atau **Esc**.

Klik kanan baris juga ada **Lihat**, **Unduh PDF**, dan **Salin judul**.

![Membaca kontrak](/whats-new/guide-kontrak-detail.webp#size=wide)

## Setujui kontrak

1. Buka kontrak yang statusnya **Perlu disetujui**.
2. Di panel kanan, di "Saya sudah membaca dan menyetujui", ketik nama lengkap kamu.
3. Namanya harus sama dengan nama di profil kamu. Kalau beda, muncul "Nama harus sama dengan nama di profilmu."
4. Klik **Setujui kontrak**. Muncul "Kontrak disetujui", dan panelnya nunjukin "Disetujui oleh … · …" lengkap sama tanggal dan jamnya.

> [!NOTE]
> Ngetik nama ini tanda kamu udah baca dan setuju. Tanda tangan dan e-Meterai ada di PDF final yang diunggah admin. Kalau PDF-nya diganti, kamu diminta menyetujui ulang.

## Unggah kontrak (khusus stakeholder)

1. Klik **Unggah kontrak**.
2. Klik atau seret PDF final yang udah ditandatangani (maks 25 MB).
3. Isi **Karyawan**, **Judul** (misalnya "PKWT Desainer 2027"), **Jenis kontrak**, **Mulai**, dan **Berakhir**. Kosongkan **Berakhir** buat kontrak tanpa batas waktu.
4. Centang **Sudah dibubuhi e-Meterai** kalau iya, tambah **Catatan** kalau perlu.
5. Klik **Unggah kontrak**. Karyawannya langsung dikabari.

Belum mau dikirim? Centang **Simpan sebagai draf (belum dikirim ke karyawan)**. Statusnya **Draf** dan karyawannya belum bisa lihat.

![Unggah kontrak](/whats-new/guide-kontrak-upload.webp)

## Kelola semua kontrak (khusus stakeholder)

1. Daftarnya dikelompokkan per karyawan. Cari pakai **Cari kontrak…**, atau saring pakai **Semua karyawan**.
2. Panel kanan kontrak nunjukin progresnya: "Masih draf; karyawan belum bisa melihatnya.", "Menunggu persetujuan karyawan.", atau "Disetujui oleh …".
3. Menu ⋯ di barisnya: **Lihat**, **Ubah**, **Hapus**. Di dalam kontrak juga ada tombol **Ubah**.
4. Klik kanan → **Kontrak … saja** buat nyaring ke satu orang.

Di **Ubah kontrak**, **Ganti PDF** bikin karyawan harus menyetujui ulang. **Hapus** menghapus kontrak dan PDF-nya permanen.', true, 340),
('panduan-klien', '2026-11-03', 'Klien: tambah, ubah, arsipkan', 'Catat klien sekali, lalu hubungkan ke project-nya. Kontak, alamat, dan mata uangnya otomatis ikut ke project dan invoice.', ARRAY['guide']::text[], 'clients', 'stakeholder', 'app', '/whats-new/guide-clients-thumb.webp', '## Buka halamannya

Halaman **Klien** khusus stakeholder. Ada di ruang kerja **Project** di sidebar → **Klien**.

Di atas ada tab **Aktif** dan **Diarsipkan**, kotak cari ("Cari klien…", nyari nama, PIC, email, dan negara), dan tombol tampilan grid / list. Tiap kartu nunjukin mata uang, negara, PIC, jumlah project, dan total yang udah **Diterima** (dalam Rupiah).

## Tambah klien

1. Klik **Klien baru** di kanan atas.
2. Isi **Nama** (wajib), misalnya "PT Contoh Jaya". Maksimal 120 karakter dan nggak boleh dobel.
3. Isi **Kontak (PIC)**, **Email**, **Telepon**, **Website**, dan **Negara**.
4. Pilih **Mata uang**: IDR, USD, EUR, SGD, AUD, atau GBP. Ini jadi mata uang awal invoice project klien ini.
5. Isi **Alamat**. Alamat ini yang dicetak di invoice.
6. **Catatan** opsional, buat info internal.
7. Klik **Simpan**. Muncul "Klien ditambahkan" dan detail kliennya langsung kebuka.

![Dialog Klien baru](/whats-new/guide-clients-form.webp)

> [!NOTE]
> Detail kontak cuma disimpan di data klien. Project yang terhubung selalu ngambil dari sini, jadi cukup ubah sekali di **Klien**.

## Lihat dan ubah klien

1. Klik kartu atau baris klien. Detailnya kebuka: **Project** (berapa yang berjalan), **Diterima**, **Belum dibayar**, lalu **Detail** kontak dan daftar **Project** klien itu.
2. Klik project di daftar buat langsung ke project-nya.
3. Klik **Ubah** buat ganti data klien, lalu **Simpan**.

![Detail klien](/whats-new/guide-clients-detail.webp)

Angka **Diterima** dan **Belum dibayar** dihitung dari invoice project klien itu (invoice draf nggak dihitung), dikonversi ke Rupiah pakai kurs di **Keuangan**.

## Arsipkan, pulihkan, hapus

- **Arsipkan:** di detail klien klik **⋯** → **Arsipkan**. Kliennya pindah ke tab **Diarsipkan** dan nggak muncul lagi di pilihan klien project baru.
- **Pulihkan:** buka klien di tab **Diarsipkan** → **⋯** → **Pulihkan**.
- **Hapus:** **⋯** → **Hapus**, lalu konfirmasi. Project-nya tetap ada, cuma nggak terhubung ke klien lagi.

> [!TIP]
> Klien yang udah selesai kerja sama mending diarsipkan aja, jangan dihapus. Riwayat project dan uang masuknya tetap kebaca.

## Hubungkan klien ke project

Klien dipasang dari project-nya, bukan dari halaman Klien.

1. Buka project → **Pengaturan**.
2. Di kartu **Klien**, buka pilihan di kanan atas kartu.
3. Pilih kliennya. Muncul "Klien project diperbarui". Mau lepas? Pilih **Tanpa klien**.
4. Kliennya belum ada? Pilih **Klien baru…** di paling bawah, isi, **Simpan**. Klien baru langsung terhubung.

![Pilih klien di Pengaturan project](/whats-new/guide-clients-project-link.webp)

Setelah terhubung, kartu **Klien** nunjukin nama, kontak, email, telepon, alamat, dan mata uang. Ada juga tombol **Kelola klien** (ke halaman Klien) dan **Ubah klien** (ubah tanpa pindah halaman).

## Klik kanan

Klik kanan kartu atau baris klien:

| Pilihan | Gunanya |
|---|---|
| **Project klien** | Submenu semua project-nya, lengkap sama statusnya |
| **Salin kontak** | Nama PIC, email, dan telepon sekaligus |
| **Kirim email**, **Chat WhatsApp**, **Telepon** | Muncul kalau email / telepon diisi |
| **Buka website** | Muncul kalau website diisi |
| **Ubah**, **Arsipkan** / **Pulihkan**, **Hapus** | Sama kayak di detail klien |', true, 400),
('panduan-proses', '2026-11-03', 'Proses: template fase, langkah, dan task', 'Proses itu template project: fase, langkah, dan task yang disalin ke tiap project baru. Atur sekali, pakai berkali-kali.', ARRAY['guide']::text[], 'processes', 'stakeholder', 'app', '/whats-new/guide-processes-thumb.webp', '## Proses itu apa

Proses adalah template buat project. Isinya bertingkat:

- **Fase**, misalnya Discovery, Design, Development.
- **Langkah** di tiap fase. Langkah ini **yang dilihat klien**.
- **Task** di tiap langkah. Task ini **yang dikerjakan tim**.

Waktu project baru dibuat, semua fase, langkah, dan task dari prosesnya disalin ke project itu. Halaman **Proses** khusus stakeholder, ada di ruang kerja **Project** → **Proses**.

> [!NOTE]
> Yang disalin itu salinan. Ubah proses nanti nggak ngubah project yang udah jalan, dan project lama tetap punya fase & langkahnya walaupun prosesnya dihapus.

## Bikin proses

1. Klik **Proses baru** di kanan atas.
2. Isi **Nama** (wajib, nggak boleh dobel), misalnya "Branding".
3. Isi **Deskripsi** kalau perlu: "Untuk project apa proses ini dipakai".
4. Di **Mulai dari**, pilih **Kosong**, atau pilih proses lain buat nyalin isinya sebagai awal.
5. Klik **Simpan**. Muncul "Proses dibuat" dan editornya langsung kebuka.

![Dialog Proses baru](/whats-new/guide-processes-new.webp)

## Isi fase, langkah, dan task

Semua perubahan di editor langsung tersimpan, nggak ada tombol simpan.

1. **Fase:** klik **Tambah fase** di bawah daftar fase kiri. Klik fasenya, lalu ubah nama dan deskripsinya langsung di panel kanan ("Tambahkan deskripsi fase…").
2. **Langkah:** di panel fase klik **Tambah langkah**. Ubah judulnya, dan isi "Catatan untuk klien (opsional)" di bawahnya.
3. **Task:** di sisi kanan langkah, klik **Tambah task**, ketik, tekan **Enter**. Kotaknya tetap kebuka buat task berikutnya. **Esc** buat selesai.
4. Ubah teks apa aja: klik teksnya, ketik, lalu **Enter** atau klik di luar. **Esc** batalin perubahan.

![Editor proses](/whats-new/guide-processes-editor.webp#size=wide)

**Urutan dan hapus:**

- Fase dan langkah: arahkan kursor, klik **⋯** (atau klik kanan) → **Naikkan**, **Turunkan**, **Hapus fase** / **Hapus langkah**.
- Hapus fase minta konfirmasi dulu: semua langkah dan task di dalamnya ikut terhapus.
- Task: klik **×** di ujung task, atau klik kanan → **Hapus task**.

## Proses default

Proses default otomatis terpilih di kolom **Proses** waktu bikin **Project baru**. Kartunya ditandai **Default**.

1. Buka prosesnya, klik **Jadikan default** di kanan atas.
2. Atau di daftar proses: klik kanan kartunya → **Jadikan default**.

Proses default nggak bisa dihapus. Jadikan proses lain default dulu.

## Dipakai di project

- **Project baru:** di kolom **Proses** pilih prosesnya (default udah terpilih). Fase, langkah, dan task disalin. Pilih **Tanpa fase** kalau project-nya jalan terus tanpa fase. Lihat [Project tanpa fase](/whats-new/project-tanpa-fase).
- **Project yang udah jalan:** buka **Pengaturan** project → kartu **Proses** → pilih proses lain → **Ganti proses**. Fase, langkah, dan task yang belum selesai diganti isi proses baru. Task yang udah selesai tetap ada.
- Tombol panah di samping pilihan **Proses** (**Kelola proses**) langsung buka prosesnya di editor.

> [!WARNING]
> **Ganti proses** di project yang lagi jalan ngganti semua yang belum selesai. Cek dulu task yang masih dikerjakan tim.

## Ubah nama, duplikat, hapus

Di editor klik **⋯** di kanan atas, atau klik kanan kartu proses di daftar:

- **Ubah nama & deskripsi**
- **Duplikat**: bikin salinan ("Salinan Branding") lalu buka editornya.
- **Hapus proses**: project yang udah pakai proses ini tetap punya fase & langkahnya.

Kartu di daftar nunjukin jumlah fase, langkah, task, dan **Dipakai n project**.', true, 410),
('panduan-invoice', '2026-11-03', 'Invoice project: bikin, cetak, tandai lunas', 'Invoice dibuat per project: item, termin pembayaran, metode bayar, lalu unduh PDF atau cetak. PM bisa lihat dan unduh, stakeholder yang bikin dan ubah.', ARRAY['guide']::text[], 'finance', 'pm', 'app', '/whats-new/guide-invoice-thumb.webp', '## Siapa yang bisa

| | PM | Stakeholder |
|---|---|---|
| Buka halaman **Invoice** di project | Project yang dia ikut | Semua project |
| **Unduh PDF**, **Buka halaman cetak**, **Salin nomor invoice** | Bisa | Bisa |
| Bikin, ubah, duplikat, tandai lunas, hapus | Nggak | Bisa |

Karyawan biasa nggak lihat halaman **Invoice** di project.

## Lihat invoice project

1. Buka project → **Invoice** di sidebar project.
2. Di atas ada **Diterima**, **Belum dibayar** (dalam Rupiah), jumlah invoice **Belum lunas**, dan **Lunas**.
3. Saring pakai tab **Semua**, **Draf**, **Belum lunas**, **Lunas**.
4. Ganti tampilan grid (pratinjau halaman pertama invoice) atau list (kolom **Item**, **Jatuh tempo**, **Status**, **Jumlah**).

Status yang mungkin: **Draf**, **Terkirim**, **Sebagian**, **Lunas**, **Telat**, **Refund**. Invoice yang belum lunas nunjukin "telat n hari" atau "n hari lagi".

## Unduh atau cetak

- **Unduh PDF:** klik **⋯** di kartu/baris → **Unduh PDF**. Di editor ada juga tombol **Unduh PDF** di bawah pratinjau.
- **Halaman cetak:** klik kanan invoice → **Buka halaman cetak**. Halamannya kebuka di tab baru (alamatnya /invoice-print/…) dan dialog cetak browser langsung muncul. Pilih "Save as PDF" buat simpan. Ketutup? Klik **Cetak / Simpan PDF**.

![Halaman cetak invoice](/whats-new/guide-invoice-print.webp)

## Bikin invoice (khusus stakeholder)

1. Di halaman **Invoice** project, klik **Invoice baru**. Editor layar penuh kebuka: pratinjau kertas di kiri, isian di kanan.
2. Status di atas mulai dari **Draf**. Mata uang otomatis ikut mata uang klien. Kalau bukan IDR, isi **Kurs diterima (IDR)**.
3. **Detail invoice:** **Nomor invoice** terisi otomatis (INV-KR-tahunbulan-urutan). Klik ikon di sampingnya (**Buat nomor otomatis**) kalau mau balik ke nomor otomatis. **Tanggal invoice** hari ini, **Jatuh tempo** 14 hari lagi. Ubah kalau perlu.
4. **Klien:** diambil dari klien project. Belum ada klien? Klik **Ubah di Pengaturan**. Lihat [Panduan dasar: Klien](/whats-new/panduan-klien).
5. **Item:** isi **Deskripsi** (mis. "UI Design"), **Timeline**, dan **Harga**. **Tambah item** buat baris baru, geser pegangannya buat ngurutin.
6. **Pembayaran:** pilih **Lunas sekali**, **DP 50/50**, atau **Milestone**. Nama termin dan persennya bisa diubah, totalnya harus 100%. Di **Milestone** bisa **Tambah termin**. **Kalimat syarat** terisi otomatis dan bisa diganti.
7. **Metode pembayaran:** metode aktif pertama udah terpilih. Ganti, atau **Tanpa metode**. Lihat [Panduan dasar: Metode pembayaran](/whats-new/panduan-metode-pembayaran).
8. **Catatan internal:** buat tim aja, nggak ikut tercetak.
9. Klik **Simpan draf** buat nyimpen dulu, atau pilih **Terbit** di atas lalu **Simpan**.

![Editor invoice](/whats-new/guide-invoice-editor.webp#size=wide)

> [!NOTE]
> Draf boleh belum lengkap. Invoice **Terbit** butuh minimal satu item berharga dan termin yang totalnya 100%. Nomor invoice juga nggak boleh dobel.

> [!TIP]
> Nutup editor waktu ada perubahan? Muncul "Simpan sebagai draf?" (atau "Simpan perubahan?" buat invoice yang udah terbit) dengan pilihan **Buang**, **Lanjut edit**, atau simpan.

## Catat pembayaran (khusus stakeholder)

Status invoice **Terbit** ikut status termin-nya:

1. Buka invoice, di **Pembayaran** ubah **Status** tiap termin: **Belum dibayar**, **Menunggu**, atau **Lunas**.
2. Sebagian termin lunas → **Sebagian**. Semua lunas → **Lunas**. Belum ada yang lunas dan lewat jatuh tempo → **Telat**.
3. Klik **Simpan**.

Mau cepat? Klik kanan invoice yang belum lunas → **Tandai lunas** (klik dua kali). Semua termin langsung ditandai lunas.

**Refund** dipakai kalau uangnya dikembalikan. Jumlah yang diterima jadi nol.

## Duplikat dan hapus (khusus stakeholder)

![Menu klik kanan invoice](/whats-new/guide-invoice-menu.webp)

- **Duplikat**: bikin draf baru dengan item, termin, dan metode yang sama, nomor baru, tanggal hari ini. Editornya langsung kebuka.
- **Hapus**: invoice dihapus permanen, setelah konfirmasi.

Klik kartu atau baris invoice buat buka editornya. Dari **Keuangan** juga ada pintasan **⋯** → **Invoice project**.', true, 420),
('panduan-metode-pembayaran', '2026-11-03', 'Metode pembayaran buat invoice', 'Rekening bank, PayPal, Wise, crypto, dan lainnya yang dicetak di invoice, plus profil studio di kop invoice. Alamat crypto diingatkan buat dicek ulang.', ARRAY['guide']::text[], 'finance', 'stakeholder', 'app', '/whats-new/guide-payments-thumb.webp', '## Buka halamannya

Halaman **Pembayaran** khusus stakeholder, ada di ruang kerja **Project** → **Pembayaran**. Judul halamannya **Metode pembayaran**.

Isinya dua hal yang dicetak di invoice:

- **Metode pembayaran**: ke mana klien bayar.
- **Profil studio**: nama, tagline, email, dan alamat di kop invoice.

Tiap kartu nunjukin nama, tipe, detail singkat, dan status **Aktif** / **Nonaktif**. Kartu crypto nunjukin kapan terakhir dicek.

## Tambah metode

1. Klik **Tambah metode** di kanan atas.
2. Isi **Nama**, misalnya "USDT TRC-20 (Pintu)" atau "BCA Kretya".
3. Pilih **Tipe**. Kolom detailnya ikut tipe:

| Tipe | Kolom |
|---|---|
| Bank Transfer | Account Name, Bank Name, Account Number, SWIFT Code, Bank Address |
| Crypto | Payment Method, Asset, Network, Network Code, Address, plus **QR code** |
| PayPal | PayPal Email, PayPal Username, Account Name |
| Payoneer | Payoneer Email, Account Name, Account Type |
| Wise | Wise Email, Account Name, Account Number |
| Stripe | Payment Link |
| Other | Details |

4. Isi **Please Note (satu baris per poin)**. Tiap baris jadi satu poin catatan di invoice.
5. Biarkan **Aktif** nyala kalau metodenya mau bisa dipilih di invoice baru.
6. Klik **Simpan**. Muncul "Metode disimpan".

![Form metode baru](/whats-new/guide-payments-form.webp)

Label kolomnya sengaja bahasa Inggris, karena itu yang tercetak di invoice.

## Crypto: cek alamat

Alamat crypto gampang berubah di aplikasi exchange, jadi app ngingetin:

- Kartu dapat tanda **Perlu dicek** kalau alamatnya belum pernah dicek atau terakhir dicek lebih dari 7 hari lalu.
- Setelah kamu cocokkan di aplikasi exchange, klik **Tandai sudah dicek** di form metodenya, atau klik kanan kartunya → **Tandai sudah dicek**.
- Di editor invoice juga muncul pengingat yang sama, dengan tombol **Sudah saya cek hari ini**.

> [!WARNING]
> Selalu cek ulang alamat crypto sebelum ngirim invoice. Salah alamat berarti uangnya nyasar dan nggak bisa ditarik balik.

## Ubah, nonaktifkan, hapus

- Klik kartu buat ubah. Detail baru dipakai invoice berikutnya.
- Matikan **Aktif** buat nyembunyiin metode dari pilihan invoice baru tanpa ngehapus.
- **Hapus metode** ada di kiri bawah form. Invoice yang udah ada tetap pakai detail yang tersimpan waktu dibuat.

> [!NOTE]
> Invoice nyimpen salinan detail metode waktu disimpan. Kalau metodenya diubah belakangan, editor invoice bilang "Detail … sudah berubah" dan nawarin **Pakai detail terbaru**.

## Profil studio

1. Klik **Profil studio** di kanan atas.
2. Ubah **Nama studio**, **Tagline**, **Email**, dan **Alamat**.
3. Klik **Simpan**. Semua invoice (termasuk yang lama, waktu diunduh atau dicetak ulang) pakai profil ini.

## Dari editor invoice

Lagi bikin invoice dan metodenya belum ada? Di bagian **Metode pembayaran** klik **Kelola metode & profil**. Dialog yang sama kebuka tanpa ninggalin invoice. Lihat [Panduan dasar: Invoice project](/whats-new/panduan-invoice).

## Klik kanan

![Menu klik kanan metode](/whats-new/guide-payments-menu.webp)

- **Ubah metode**
- **Salin detail** → tiap kolom satu-satu, atau **Semua detail** sekaligus (enak buat ditempel di chat klien)
- **Aktif** (centang buat nyalain / matiin)
- **Tandai sudah dicek** (khusus crypto)
- **Hapus metode**', true, 430),
('panduan-keuangan', '2026-11-03', 'Keuangan: ringkasan, target, langganan', 'Ringkasan uang masuk dari invoice, tagihan yang belum dibayar, target tahunan, dan langganan atau biaya rutin kantor.', ARRAY['guide']::text[], 'finance', 'stakeholder', 'app', '/whats-new/guide-finance-thumb.webp', '## Buka halamannya

**Keuangan** khusus stakeholder, ada di ruang kerja **Pribadi** → **Keuangan**. Ada dua tab: **Ringkasan** dan **Langganan**.

Di header:

- **Ikon mata** (**Sembunyikan nominal**): semua angka jadi •••••. Pas buat share layar atau kerja di ruang terbuka. Pilihannya diingat di browser kamu.
- **Tahun**: ganti tahun yang dirangkum.
- **⋯**: **Target** tahun itu, **Kurs mata uang**, dan **Invoice project** (ke daftar project).
- **Tambah langganan**.

## Ringkasan

![Menu ⋯ di Keuangan](/whats-new/guide-finance-menu.webp)

- **Diterima**: uang yang masuk dari invoice tahun itu.
- **Belum dibayar**: sisa tagihan invoice yang masih terbuka, plus jumlah invoice-nya.
- **Pengeluaran**: langganan & biaya rutin.
- **Target**: progres terhadap target pemasukan. Belum ada? Klik **Atur target** tahunnya.
- **Uang masuk**: grafik uang masuk sepanjang tahun yang dipilih.
- **Invoice belum dibayar**: dikelompokkan **Lewat 30 hari**, **Telat**, dan **Belum jatuh tempo**. Klik buat ke halaman Invoice project-nya, klik kanan buat **Salin nomor invoice** atau **Buka halaman cetak**.
- **Uang masuk per sumber**: **Per klien** atau **Per project**, dengan persen yang udah masuk.

Invoice-nya sendiri dibuat di tiap project. Lihat [Panduan dasar: Invoice project](/whats-new/panduan-invoice).

## Kurs mata uang

Semua total dihitung dalam Rupiah. Buat invoice dan langganan dalam mata uang asing:

1. Klik **⋯** → **Kurs mata uang**.
2. Isi Rupiah per 1 unit yang benar-benar dibayar atau diterima, termasuk markup.
3. Klik **Simpan**.

> [!NOTE]
> Kalau kurs sebuah mata uang belum diatur, muncul pengingat "Kurs … belum diatur" dan nominal itu belum masuk total.

## Target pemasukan

1. **⋯** → **Target** tahunnya.
2. Isi **Target (Rp)**, lalu **Simpan**. **Hapus target** buat ngosongin.

## Langganan & biaya rutin

![Dialog Tambah langganan](/whats-new/guide-finance-subscriptions.webp)

1. Klik **Tambah langganan**.
2. Isi **Nama** (mis. "Figma"), **Kategori** (Software, Gaji, Sewa, Layanan, Asuransi, Marketing, Lainnya), dan **Siklus** (**Bulanan** / **Tahunan**).
3. Pilih **Mata uang** dan isi **Nominal per tagihan**. Mata uang asing bisa diisi **Kurs dibayar** sendiri. Kosongin buat pakai kurs default.
4. Isi tanggal **Tagihan pertama**. **Berhenti** diisi kalau langganannya ada tanggal akhirnya.
5. Klik **Simpan**.

Tab **Langganan** nunjukin total **Per bulan**, **Dibayar tahun ini**, dan **Akan datang tahun ini** (dengan tagihan berikutnya), lalu daftar langganan (**List** atau kalender **Bulan**) dan rincian **Per kategori**.

Klik kanan langganan: **Ubah langganan**, **Hentikan mulai hari ini** (klik dua kali) atau **Jalankan lagi**, **Salin nama**, **Hapus**.

> [!TIP]
> Langganan yang cuma berhenti jangan dihapus. Pakai **Hentikan mulai hari ini** biar tagihan lamanya tetap kehitung di ringkasan.', true, 440),
('panduan-tim', '2026-11-03', 'Tim & akses: anggota, role, jabatan', 'Direktori anggota tim, dan buat super admin: tambah anggota, atur role, jabatan, tim, status, dan tanggal mulai kerja.', ARRAY['guide']::text[], 'team', 'stakeholder', 'app', '/whats-new/guide-team-thumb.webp', '## Buka halamannya

**Tim** khusus stakeholder, ada di ruang kerja **Pribadi** → **Tim**. Di atas ada jumlah **Total anggota**, **Designer**, **Developer**, **Project Manager**, dan **Admin/Stakeholder**.

Isinya beda tergantung akun kamu:

- **Stakeholder biasa:** direktori yang cuma bisa dibaca. Cari pakai "Cari anggota…", klik kanan baris buat **Lihat KPI**, **Salin nama**, **Salin email**, **Kirim email**.
- **Super admin:** tabel yang sama, tapi tiap anggota bisa diatur, plus tombol **Tambah anggota**.

## Level akses

Yang bisa dibuka tiap orang ditentukan dari **Role** dan **Jabatan**:

| Kolom **Akses** | Didapat dari | Bisa buka |
|---|---|---|
| **Karyawan** | Role Karyawan | Halaman umum, project yang dia ikut |
| **PM** | Role Karyawan + jabatan Project Manager | Plus bikin project, pindahin status, lihat invoice project-nya |
| **Stakeholder** | Role Stakeholder | Semua, termasuk Klien, Proses, Pembayaran, Keuangan, Tim |

Tim dan status kerja cuma data profil, nggak ngasih akses tambahan.

## Atur anggota (super admin)

1. Klik baris anggota. Panel **Detail anggota** kebuka di samping.
2. Ubah yang perlu. Tiap perubahan langsung tersimpan ("Tersimpan."):
   - **Foto**
   - **Role**: **Karyawan** atau **Stakeholder** ("Stakeholder bisa mengelola tim & project.")
   - **Jabatan**: Admin, Project Manager, Designer, Web Developer
   - **Tim**, atau **Tanpa tim**
   - **Status**: **Karyawan** atau **Magang**
   - **Mulai kerja**: dipakai buat ngitung jatah cuti
   - **Super admin**: bisa buka pengaturan anggota & akses. Status kamu sendiri nggak bisa diubah.
3. **Lihat sebagai** buat lihat app persis dari akun anggota itu. Lihat [Kembali dari Lihat sebagai](/whats-new/lihat-sebagai).

![Panel Detail anggota](/whats-new/guide-team-sheet.webp)

> [!TIP]
> Mau cepat? Klik kanan baris anggota: **Lihat profil**, **Lihat sebagai**, **Lihat KPI**, **Ubah role**, **Ubah jabatan**, **Ubah tim**, **Ubah status**, **Ganti foto**, **Hapus anggota**.

## Tambah anggota (super admin)

1. Klik **Tambah anggota**.
2. Isi **Nama lengkap** dan **Email** (wajib). Email yang udah terdaftar ditolak.
3. Pilih **Jabatan**, **Role**, dan **Tim**.
4. Klik **Tambah**. Muncul "Anggota ditambahkan." dan detailnya langsung kebuka.

![Dialog Tambah anggota](/whats-new/guide-team-add.webp)

## Hapus anggota (super admin)

Di bawah panel **Detail anggota** klik **Hapus**, lalu konfirmasi.

> [!WARNING]
> Kehadiran, cuti, review, dan kontrak orang itu ikut terhapus permanen dan nggak bisa dibalikin. Kamu nggak bisa ngehapus akun sendiri.

> [!NOTE]
> Alamat lama **/teams/access** dan halaman **Pengaturan** lama (**/settings/permission**, **/settings/team-access**) sekarang langsung dialihkan ke **Tim**.', true, 450)
ON CONFLICT (id) DO NOTHING;
