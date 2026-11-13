/** "wiki" strings: Kretya Wiki (page-slices/wiki). */
const id = {
  title: "Kretya Wiki",
  newPage: "Halaman baru",
  newSubpage: "Subhalaman",
  untitled: "Tanpa judul",
  titlePlaceholder: "Judul halaman",
  bodyLabel: "Isi halaman",
  subpages: "Subhalaman",
  edited: "Diedit {time}",
  editedBy: "Diedit {time} oleh {name}",
  saving: "Menyimpan…",
  saveFailed: "Gagal menyimpan",
  createFailed: "Gagal membuat halaman",
  deleteFailed: "Gagal menghapus halaman",
  delete: "Hapus halaman",
  deleteTitle: "Hapus \"{name}\"?",
  deleteDesc: "Halaman ini dihapus untuk semua orang.",
  deleteDescChildren:
    "Halaman ini dan {count} subhalamannya dihapus untuk semua orang.",
  more: "Lainnya",
  empty: "Wiki masih kosong",
  emptyDesc:
    "Tulis cara kerja studio, panduan dan catatan yang perlu diketahui semua orang. Semua bisa membaca dan mengedit.",
  noSubpages: "Belum ada subhalaman",
  notFound: "Halaman ini tidak ada (lagi)",
  loadFailed: "Wiki gagal dimuat",
  pages: "{count} halaman",
}

const en: Record<keyof typeof id, string> = {
  title: "Kretya Wiki",
  newPage: "New page",
  newSubpage: "Subpage",
  untitled: "Untitled",
  titlePlaceholder: "Page title",
  bodyLabel: "Page content",
  subpages: "Subpages",
  edited: "Edited {time}",
  editedBy: "Edited {time} by {name}",
  saving: "Saving…",
  saveFailed: "Couldn't save",
  createFailed: "Couldn't create the page",
  deleteFailed: "Couldn't delete the page",
  delete: "Delete page",
  deleteTitle: "Delete \"{name}\"?",
  deleteDesc: "This page is deleted for everyone.",
  deleteDescChildren:
    "This page and its {count} subpages are deleted for everyone.",
  more: "More",
  empty: "The wiki is empty",
  emptyDesc:
    "Write down how the studio works, guides and notes everyone should know. Everyone can read and edit.",
  noSubpages: "No subpages yet",
  notFound: "This page doesn't exist (any more)",
  loadFailed: "Couldn't load the wiki",
  pages: "{count} pages",
}

export const wiki = { id, en }
