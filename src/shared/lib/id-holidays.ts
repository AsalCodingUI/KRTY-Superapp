/**
 * Indonesian national holidays (libur nasional) and collective leave (cuti
 * bersama), straight from the SKB 3 Menteri. Indonesian days only, nothing
 * international. Add the next year here once its SKB is signed (usually
 * September of the year before).
 *
 * Sources:
 * - 2026: SKB Menteri Agama No. 1497/2025, Menteri Ketenagakerjaan No. 2/2025,
 *   Menteri PANRB No. 5/2025 (signed 19 Sep 2025). List as published at
 *   https://www.setneg.go.id/baca/index/inilah_skb_3_menteri_libur_nasional_dan_cuti_bersama_2026
 * - 2027: SKB Menteri Agama No. 1205/2026, Menteri Ketenagakerjaan No. 3/2026,
 *   Menteri PANRB No. 2/2026 (set 15 Sep 2026). List as published at
 *   https://kemenkopmk.go.id/pemerintah-tetapkan-18-hari-libur-nasional-dan-8-cuti-bersama-tahun-2027
 *   and https://setneg.go.id/baca/index/inilah_skb_3_menteri_libur_nasional_dan_cuti_bersama_2027
 */

export type IdHolidayKind = "nasional" | "cuti_bersama"

export type IdHoliday = {
  /** Local (WIB) day, yyyy-MM-dd. */
  date: string
  name: string
  kind: IdHolidayKind
  /** Why it's a day off, in a sentence or two. */
  description: string
}

const WHY = {
  tahunBaru: "Hari pertama tahun baru dalam kalender Masehi.",
  israMikraj:
    "Memperingati perjalanan malam Nabi Muhammad saw. dari Masjidil Haram ke Masjidil Aqsa lalu naik ke Sidratul Muntaha, saat perintah salat lima waktu diterima.",
  imlek:
    "Tahun baru dalam kalender Tionghoa, dirayakan umat Khonghucu dan masyarakat Tionghoa dengan berkumpul bersama keluarga.",
  nyepi:
    "Tahun Baru Saka bagi umat Hindu, dijalani dengan sehari penuh menyepi: tanpa api, tanpa bepergian, tanpa bekerja, dan tanpa hiburan.",
  idulfitri:
    "Hari raya umat Islam setelah sebulan berpuasa Ramadan, saatnya salat Id, silaturahmi, dan saling bermaafan.",
  wafatYesus:
    "Jumat Agung, mengenang penyaliban dan wafatnya Yesus Kristus bagi umat Kristiani.",
  paskah:
    "Hari Paskah, merayakan kebangkitan Yesus Kristus dari kematian, hari raya terpenting umat Kristiani.",
  hariBuruh:
    "Hari Buruh (May Day), menghargai perjuangan dan hak-hak para pekerja.",
  kenaikanYesus:
    "Memperingati naiknya Yesus Kristus ke surga, 40 hari setelah Paskah.",
  iduladha:
    "Hari raya kurban umat Islam yang meneladani pengorbanan Nabi Ibrahim, bertepatan dengan puncak ibadah haji.",
  waisak:
    "Hari suci umat Buddha yang memperingati kelahiran, pencerahan, dan wafatnya Sang Buddha Gautama.",
  pancasila:
    "Memperingati pidato Bung Karno pada 1 Juni 1945 yang pertama kali mencetuskan Pancasila sebagai dasar negara.",
  tahunBaruIslam:
    "Tahun baru dalam kalender Hijriah, mengenang hijrahnya Nabi Muhammad saw. dari Makkah ke Madinah.",
  kemerdekaan:
    "Hari Ulang Tahun Kemerdekaan Republik Indonesia, mengenang dibacakannya Proklamasi pada 17 Agustus 1945.",
  maulid: "Memperingati hari kelahiran Nabi Muhammad saw. pada 12 Rabiulawal.",
  natal: "Hari Natal, merayakan kelahiran Yesus Kristus bagi umat Kristiani.",
} as const

const cuti = (reason: string) =>
  `Cuti bersama yang ditetapkan pemerintah untuk memperpanjang libur ${reason}.`

export const ID_HOLIDAYS: readonly IdHoliday[] = [
  // 2026: 17 libur nasional + 8 cuti bersama
  {
    date: "2026-01-01",
    name: "Tahun Baru 2026 Masehi",
    kind: "nasional",
    description: WHY.tahunBaru,
  },
  {
    date: "2026-01-16",
    name: "Isra Mikraj Nabi Muhammad saw.",
    kind: "nasional",
    description: WHY.israMikraj,
  },
  {
    date: "2026-02-16",
    name: "Cuti Bersama Tahun Baru Imlek",
    kind: "cuti_bersama",
    description: cuti("Tahun Baru Imlek 2577 Kongzili"),
  },
  {
    date: "2026-02-17",
    name: "Tahun Baru Imlek 2577 Kongzili",
    kind: "nasional",
    description: WHY.imlek,
  },
  {
    date: "2026-03-18",
    name: "Cuti Bersama Hari Suci Nyepi",
    kind: "cuti_bersama",
    description: cuti("Hari Suci Nyepi (Tahun Baru Saka 1948)"),
  },
  {
    date: "2026-03-19",
    name: "Hari Suci Nyepi (Tahun Baru Saka 1948)",
    kind: "nasional",
    description: WHY.nyepi,
  },
  {
    date: "2026-03-20",
    name: "Cuti Bersama Idulfitri 1447 H",
    kind: "cuti_bersama",
    description: cuti("Idulfitri 1447 H"),
  },
  {
    date: "2026-03-21",
    name: "Idulfitri 1447 H",
    kind: "nasional",
    description: WHY.idulfitri,
  },
  {
    date: "2026-03-22",
    name: "Idulfitri 1447 H (hari kedua)",
    kind: "nasional",
    description: WHY.idulfitri,
  },
  {
    date: "2026-03-23",
    name: "Cuti Bersama Idulfitri 1447 H",
    kind: "cuti_bersama",
    description: cuti("Idulfitri 1447 H"),
  },
  {
    date: "2026-03-24",
    name: "Cuti Bersama Idulfitri 1447 H",
    kind: "cuti_bersama",
    description: cuti("Idulfitri 1447 H"),
  },
  {
    date: "2026-04-03",
    name: "Wafat Yesus Kristus",
    kind: "nasional",
    description: WHY.wafatYesus,
  },
  {
    date: "2026-04-05",
    name: "Kebangkitan Yesus Kristus (Paskah)",
    kind: "nasional",
    description: WHY.paskah,
  },
  {
    date: "2026-05-01",
    name: "Hari Buruh Internasional",
    kind: "nasional",
    description: WHY.hariBuruh,
  },
  {
    date: "2026-05-14",
    name: "Kenaikan Yesus Kristus",
    kind: "nasional",
    description: WHY.kenaikanYesus,
  },
  {
    date: "2026-05-15",
    name: "Cuti Bersama Kenaikan Yesus Kristus",
    kind: "cuti_bersama",
    description: cuti("Kenaikan Yesus Kristus"),
  },
  {
    date: "2026-05-27",
    name: "Iduladha 1447 H",
    kind: "nasional",
    description: WHY.iduladha,
  },
  {
    date: "2026-05-28",
    name: "Cuti Bersama Iduladha 1447 H",
    kind: "cuti_bersama",
    description: cuti("Iduladha 1447 H"),
  },
  {
    date: "2026-05-31",
    name: "Hari Raya Waisak 2570 BE",
    kind: "nasional",
    description: WHY.waisak,
  },
  {
    date: "2026-06-01",
    name: "Hari Lahir Pancasila",
    kind: "nasional",
    description: WHY.pancasila,
  },
  {
    date: "2026-06-16",
    name: "1 Muharam Tahun Baru Islam 1448 H",
    kind: "nasional",
    description: WHY.tahunBaruIslam,
  },
  {
    date: "2026-08-17",
    name: "Proklamasi Kemerdekaan",
    kind: "nasional",
    description: WHY.kemerdekaan,
  },
  {
    date: "2026-08-25",
    name: "Maulid Nabi Muhammad saw.",
    kind: "nasional",
    description: WHY.maulid,
  },
  {
    date: "2026-12-24",
    name: "Cuti Bersama Natal",
    kind: "cuti_bersama",
    description: cuti("Hari Raya Natal"),
  },
  {
    date: "2026-12-25",
    name: "Kelahiran Yesus Kristus (Natal)",
    kind: "nasional",
    description: WHY.natal,
  },

  // 2027: 18 libur nasional + 8 cuti bersama
  {
    date: "2027-01-01",
    name: "Tahun Baru 2027 Masehi",
    kind: "nasional",
    description: WHY.tahunBaru,
  },
  {
    date: "2027-01-05",
    name: "Isra Mikraj Nabi Muhammad saw.",
    kind: "nasional",
    description: WHY.israMikraj,
  },
  {
    date: "2027-02-05",
    name: "Cuti Bersama Tahun Baru Imlek",
    kind: "cuti_bersama",
    description: cuti("Tahun Baru Imlek 2578 Kongzili"),
  },
  {
    date: "2027-02-06",
    name: "Tahun Baru Imlek 2578 Kongzili",
    kind: "nasional",
    description: WHY.imlek,
  },
  {
    date: "2027-03-08",
    name: "Hari Suci Nyepi (Tahun Baru Saka 1949)",
    kind: "nasional",
    description: WHY.nyepi,
  },
  {
    date: "2027-03-09",
    name: "Cuti Bersama Idulfitri 1448 H",
    kind: "cuti_bersama",
    description: cuti("Idulfitri 1448 H"),
  },
  {
    date: "2027-03-10",
    name: "Idulfitri 1448 H",
    kind: "nasional",
    description: WHY.idulfitri,
  },
  {
    date: "2027-03-11",
    name: "Idulfitri 1448 H (hari kedua)",
    kind: "nasional",
    description: WHY.idulfitri,
  },
  {
    date: "2027-03-12",
    name: "Cuti Bersama Idulfitri 1448 H",
    kind: "cuti_bersama",
    description: cuti("Idulfitri 1448 H"),
  },
  {
    date: "2027-03-15",
    name: "Cuti Bersama Idulfitri 1448 H",
    kind: "cuti_bersama",
    description: cuti("Idulfitri 1448 H"),
  },
  {
    date: "2027-03-25",
    name: "Cuti Bersama Wafat Yesus Kristus",
    kind: "cuti_bersama",
    description: cuti("Wafat Yesus Kristus (Jumat Agung)"),
  },
  {
    date: "2027-03-26",
    name: "Wafat Yesus Kristus",
    kind: "nasional",
    description: WHY.wafatYesus,
  },
  {
    date: "2027-03-28",
    name: "Kebangkitan Yesus Kristus (Paskah)",
    kind: "nasional",
    description: WHY.paskah,
  },
  {
    date: "2027-05-01",
    name: "Hari Buruh Internasional",
    kind: "nasional",
    description: WHY.hariBuruh,
  },
  {
    date: "2027-05-06",
    name: "Kenaikan Yesus Kristus",
    kind: "nasional",
    description: WHY.kenaikanYesus,
  },
  {
    date: "2027-05-17",
    name: "Iduladha 1448 H",
    kind: "nasional",
    description: WHY.iduladha,
  },
  {
    date: "2027-05-18",
    name: "Cuti Bersama Iduladha 1448 H",
    kind: "cuti_bersama",
    description: cuti("Iduladha 1448 H"),
  },
  {
    date: "2027-05-19",
    name: "Cuti Bersama Waisak",
    kind: "cuti_bersama",
    description: cuti("Hari Raya Waisak 2571 BE"),
  },
  {
    date: "2027-05-20",
    name: "Hari Raya Waisak 2571 BE",
    kind: "nasional",
    description: WHY.waisak,
  },
  {
    date: "2027-06-01",
    name: "Hari Lahir Pancasila",
    kind: "nasional",
    description: WHY.pancasila,
  },
  {
    date: "2027-06-06",
    name: "1 Muharam Tahun Baru Islam 1449 H",
    kind: "nasional",
    description: WHY.tahunBaruIslam,
  },
  {
    date: "2027-08-15",
    name: "Maulid Nabi Muhammad saw.",
    kind: "nasional",
    description: WHY.maulid,
  },
  {
    date: "2027-08-17",
    name: "Proklamasi Kemerdekaan",
    kind: "nasional",
    description: WHY.kemerdekaan,
  },
  {
    date: "2027-12-24",
    name: "Cuti Bersama Natal",
    kind: "cuti_bersama",
    description: cuti("Hari Raya Natal"),
  },
  {
    date: "2027-12-25",
    name: "Kelahiran Yesus Kristus (Natal)",
    kind: "nasional",
    description: WHY.natal,
  },
  {
    date: "2027-12-26",
    name: "Isra Mikraj Nabi Muhammad saw.",
    kind: "nasional",
    description: WHY.israMikraj,
  },
]

/**
 * Stable link between a holiday and the "Company Holiday" row made from it
 * (calendar_events.holiday_key). One holiday per day, so the day is enough.
 */
export const idHolidayKey = (holiday: Pick<IdHoliday, "date">) =>
  `id:${holiday.date}`

const BY_KEY = new Map(ID_HOLIDAYS.map((h) => [idHolidayKey(h), h]))
const DATES = new Set(ID_HOLIDAYS.map((h) => h.date))

export const getIdHoliday = (key: string | null | undefined) =>
  key ? BY_KEY.get(key) : undefined

/** Is this local day (yyyy-MM-dd) in the dataset? */
export const isIdHolidayDate = (date: string) => DATES.has(date)

/** Holidays from..to (yyyy-MM-dd, inclusive). */
export const idHolidaysBetween = (from: string, to: string) =>
  ID_HOLIDAYS.filter((h) => h.date >= from && h.date <= to)

/** The day as WIB instants, start and end (all-day rows are stored so). */
export const idHolidayRange = (date: string) => ({
  start: new Date(`${date}T00:00:00+07:00`),
  end: new Date(`${date}T23:59:59+07:00`),
})
