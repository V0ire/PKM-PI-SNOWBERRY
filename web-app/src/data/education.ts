// Konten edukasi statis (FR-07).
// Aturan tulis: satu poin = satu tindakan, maksimal 12 kata.
// Petani membaca ini sambil berdiri di greenhouse, bukan sambil duduk membaca manual.
// Dijaga oleh scripts/qa-density.ts.

export type EduSection = {
  id: string;
  title: string;
  summary: string;
  points: string[];
};

export const EDU_SECTIONS: EduSection[] = [
  {
    id: "tentang",
    title: "Mengenal Stroberi Putih",
    summary: "Kenapa buahnya tetap putih.",
    points: [
      "Tetap pucat karena tidak membentuk protein pemerah.",
      "Aromanya mirip nanas, bukan stroberi merah.",
      "Biji berubah kemerahan saat buah matang.",
      "Lebih aman untuk sebagian orang yang alergi stroberi.",
    ],
  },
  {
    id: "kondisi",
    title: "Kondisi Tumbuh Ideal",
    summary: "Batas aman yang dipakai aplikasi.",
    points: [
      "Suhu 18-26 °C. Di atas 30 °C bunga rontok.",
      "Udara 60-70%. Terlalu lembap memicu jamur.",
      "Media 40-70%. Basah terus membuat akar busuk.",
      "Cahaya 15-20 DLI. Lampu menambah bila kurang.",
      "Ubah angka ini di menu Pengaturan.",
    ],
  },
  {
    id: "hama",
    title: "Hama dan Penyakit",
    summary: "Tanda awal dan tindakannya.",
    points: [
      "Buah berbulu abu-abu: busuk kelabu. Buang buahnya.",
      "Daun berbintik kuning berjaring: tungau. Semprot bawah daun.",
      "Pucuk keriting dan lengket: kutu daun. Periksa semut.",
      "Lapisan putih di daun: embun tepung. Kurangi lembap.",
      "Selalu: buang bagian sakit, perbaiki sirkulasi udara.",
    ],
  },
  {
    id: "penyiraman",
    title: "Cara Menyiram",
    summary: "Sedikit tapi sering.",
    points: [
      "Siram sedikit beberapa kali, jangan sekali banyak.",
      "Air perlu meresap agar akar tetap dapat udara.",
      "Daun bawah menguning dan becek: kelebihan air.",
      "Daun layu sore hari: kekurangan air.",
      "Siram pagi agar daun kering sebelum malam.",
    ],
  },
  {
    id: "panen",
    title: "Tanda Siap Panen",
    summary: "Tiga hal sebelum memetik.",
    points: [
      "Warna putih krem dengan biji kemerahan.",
      "Buah padat berisi, tidak keras atau lembek.",
      "Tercium wangi manis seperti nanas.",
      "Sisakan sedikit tangkai agar tidak cepat busuk.",
      "Panen pagi hari saat udara masih sejuk.",
    ],
  },
];

// Fakta bergantian di layar pembuka. Maksimal 12 kata, tanpa mengulang isi EDU_SECTIONS.
export const FUN_FACTS: string[] = [
  "Stroberi putih pertama dibudidayakan di Jepang.",
  "Satu buah pernah dijual lebih dari Rp150.000.",
  "Sensor Snowberry mengukur suhu dengan ketelitian 0,2 °C.",
  "Snowberry memeriksa kondisi kebun setiap 60 detik.",
  "Prosesor Snowberry lebih cepat dari komputer pemandu Apollo 11.",
  "Cahaya matahari dan lampu tanam dicatat terpisah.",
  "Lebah lebih suka bunga stroberi daripada bunga liar sekitarnya.",
];
