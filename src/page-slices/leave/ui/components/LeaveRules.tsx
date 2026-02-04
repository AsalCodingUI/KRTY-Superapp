export function LeaveRules() {
    return (
        // HAPUS class scroll dari sini
        <div className="space-y-6 text-sm text-content-subtle dark:text-content-placeholder">

            {/* SECTION 1: ATURAN CUTI */}
            <section>
                <h4 className="font-semibold text-content dark:text-content mb-3 text-base">Aturan Cuti</h4>
                <ol className="list-decimal list-outside ml-4 space-y-2">
                    <li>
                        Setiap karyawan mendapatkan jatah cuti sebanyak <span className="font-semibold text-content dark:text-content">12 kali</span> dalam setahun.
                    </li>
                    <li>
                        Pengajuan cuti harus dilakukan <span className="font-semibold bg-orange-100 text-orange-800 px-1 rounded dark:bg-orange-500/20 dark:text-orange-200">paling lambat 7 hari</span> sebelum tanggal rencana cuti. Jika pengajuan dilakukan mendadak, kami berhak menolak kecuali dalam keadaan darurat. Cuti tidak dapat diuangkan.
                    </li>
                    <li>
                        Jika pengambilan cuti dilakukan tidak sesuai aturan no.2 maka cuti tersebut ditukar/digantikan dengan WFH.
                    </li>
                    <li>
                        Batas pengambilan cuti per bulan tidak lagi diberlakukan sesuai aturan sebelumnya, sehingga teman-teman bisa menggunakan cuti secara bijaksana.
                    </li>
                    <li>
                        Namun, sesuai peraturan perusahaan, dalam satu minggu tidak diperbolehkan mengambil cuti lebih dari <span className="font-semibold bg-orange-100 text-orange-800 px-1 rounded dark:bg-orange-500/20 dark:text-orange-200">5 hari kerja secara langsung</span>.
                    </li>
                </ol>
            </section>

            {/* SECTION 2: SYARAT & KETENTUAN */}
            <section>
                <h4 className="font-semibold text-content dark:text-content mb-3 text-base">Syarat & Ketentuan Pengambilan Cuti:</h4>
                <ol className="list-decimal list-outside ml-4 space-y-2">
                    <li>
                        Karyawan yang sudah bekerja selama satu tahun berhak mendapatkan cuti.
                    </li>
                    <li>
                        Cuti dapat diberikan setelah 6 bulan bekerja, terhitung setelah masa intern (3 bulan).
                    </li>
                    <li>
                        Cuti tidak dapat diakumulasi, sehingga jika dalam satu tahun cuti tidak digunakan, maka cuti tersebut akan hangus dan diperbarui di tahun berikutnya.
                    </li>
                </ol>
            </section>

            {/* SECTION 3: CONTOH KASUS (CALLOUT) */}
            <section>
                <h4 className="font-semibold text-content dark:text-content mb-3 text-base">Contoh Aturan Cuti yang Diperbolehkan</h4>
                <div className="space-y-3 rounded-lg bg-muted p-4 border border dark:bg-surface dark:border">
                    {/* Pertanyaan */}
                    <div className="flex gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-border text-xs font-semibold text-content-subtle dark:bg-hover dark:text-content-placeholder">?</div>
                        <p><span className="font-semibold text-content dark:text-content">Pertanyaan:</span> Karena jatah cuti saya dalam satu tahun ada 12 kali, lalu di bulan ini, pada minggu pertama, saya ingin mengambil cuti 5 hari kerja secara langsung. Apakah boleh?</p>
                    </div>

                    <div className="h-px w-full bg-border dark:bg-hover my-2"></div>

                    {/* Jawaban */}
                    <div className="flex gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">!</div>
                        <p className="text-red-600 dark:text-red-400"><span className="font-semibold">Jawaban:</span> Tidak boleh. Pengambilan cuti secara langsung diperbolehkan jika di bawah 5 hari.</p>
                    </div>

                    {/* Alasan */}
                    <div className="flex gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-border text-xs font-semibold text-content-subtle dark:bg-hover dark:text-content-placeholder">i</div>
                        <p className="text-content-subtle italic"><span className="font-semibold not-italic">Alasan:</span> Karena kami ingin meminimalisir risiko proyek yang tidak ada pengganti sementara.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 4: ATURAN WFH */}
            <section>
                <h4 className="font-semibold text-content dark:text-content mb-3 text-base">Aturan WFH</h4>
                <ol className="list-decimal list-outside ml-4 space-y-2">
                    <li>
                        WFH diperbolehkan jika alasannya jelas atau ada urusan mendadak yang mendesak.
                    </li>
                    <li>
                        Selama WFH, karyawan harus tetap dapat dihubungi dan mudah dicari ketika dibutuhkan. Jika tidak, kesempatan WFH akan dicabut.
                    </li>
                    <li>
                        Jika ada urusan mendadak yang harus diselesaikan terlebih dahulu dan belum ingin mengambil cuti, harap informasikan jam berapa Anda bisa kembali dihubungi, agar kami dapat mengetahui detail informasinya.
                    </li>
                </ol>
            </section>

        </div>
    )
}