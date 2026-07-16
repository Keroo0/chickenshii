export interface DiseaseInfo {
  description: string;
  cause: string;
  immediate_action: string[];
}

export const diseaseInfo: Record<string, DiseaseInfo> = {
  Coccidiosis: {
    description:
      "Coccidiosis adalah penyakit parasiter usus yang disebabkan oleh protozoa Eimeria sp. Parasit menginfeksi dan merusak sel epitel mukosa usus, menyebabkan diare berdarah, dehidrasi, dan penurunan penyerapan nutrisi yang drastis. Feses berwarna merah atau oranye kemerahan, encer, dan sering mengandung bercak darah segar. Pada kasus berat, feses hampir seluruhnya berupa darah. Ayam terlihat lesu, bulu kusut, dan nafsu makan menurun.",
    cause:
      "Infeksi ookista Eimeria sp. yang bersporulasi, tertelan melalui pakan, air minum, atau litter (alas kandang) yang terkontaminasi feses ayam terinfeksi. Kondisi kandang yang lembap mempercepat proses sporulasi ookista menjadi infektif.",
    immediate_action: [
      "Segera pisahkan ayam yang sakit dari kawanan sehat",
      "Bersihkan dan sterilkan lingkungan kandang dengan disinfeksi menyeluruh",
      "Berikan elektrolit dan vitamin untuk memulihkan kondisi ayam",
      "Berikan obat antikoksidia golongan sulfonamid (seperti Amprolium atau Toltrazuril) lewat air minum",
      "Jaga litter tetap kering karena kelembapan memperparah infeksi",
    ],
  },
  Healthy: {
    description:
      "Kondisi pencernaan ayam yang normal dan sehat. Tidak ada tanda-tanda infeksi, peradangan, atau gangguan pada saluran pencernaan. Feses padat, mengikuti kontur usus, dengan tekstur kering dan tidak menyebar. Warna kehijauan atau kecoklatan, dilapisi bagian putih (asam urat) di salah satu sisi. Tidak ada bau busuk, lendir berlebih, atau perubahan warna yang mencurigakan.",
    cause: "",
    immediate_action: [
      "Pertahankan rutinitas manajemen kandang yang sudah berjalan",
      "Tetap jaga kebersihan pakan, air minum, dan buang feses secara rutin",
      "Pantau kondisi feses secara berkala sebagai indikator kesehatan",
      "Lanjutkan program vaksinasi sesuai jadwal",
    ],
  },
  "New Castle Disease": {
    description:
      "Newcastle Disease (Tetelo) adalah penyakit viral sangat menular dan mematikan yang disebabkan oleh virus Avian Paramyxovirus tipe 1 (APMV-1). Menyerang tiga sistem organ sekaligus: pernapasan, pencernaan, dan saraf pusat. Mortalitas bisa mencapai 80-100% pada unggas yang belum divaksin. Feses berwarna hijau lumut atau hijau kekuningan, encer, dan tidak berlendir. Diikuti oleh gejala pernapasan (batuk, ngorok, bersin) dan pada stadium lanjut muncul gejala saraf seperti leher terpelintir (tortikolis), tremor, dan kelumpuhan. Produksi telur menurun drastis.",
    cause:
      "Virus Newcastle Disease (NDV) dari kelompok Avian Paramyxovirus tipe 1. Penyebaran sangat cepat melalui udara (droplet pernapasan), kontak langsung dengan ayam sakit, peralatan atau pekerja yang terkontaminasi, serta burung liar. Belum ditemukan obat yang dapat membunuh virus ini secara spesifik.",
    immediate_action: [
      "Segera pisahkan dan karantina ayam yang menunjukkan gejala",
      "Bersihkan dan sterilkan lingkungan kandang dengan disinfeksi menyeluruh",
      "Berikan elektrolit dan vitamin untuk memperkuat daya tahan tubuh",
      "Lakukan revaksinasi darurat pada ayam yang masih sehat untuk membentuk antibodi lebih cepat",
      "Hubungi dokter hewan atau dinas peternakan untuk penanganan lebih lanjut",
    ],
  },
  Salmonellosis: {
    description:
      "Salmonellosis (Pullorum atau Berak Kapur) adalah penyakit bakteri akut maupun kronis yang disebabkan oleh Salmonella pullorum atau Salmonella gallinarum. Menyerang saluran pencernaan, menyebabkan diare putih seperti kapur, penurunan drastis produksi telur, dan dapat menular secara vertikal dari induk ke anak melalui telur. Feses berwarna putih seperti kapur (berak kapur), encer, dan sering menempel di sekitar anus hingga mengering dan menjadi lengket. Pada ayam dewasa, feses bisa berwarna kuning kecoklatan. Ayam terlihat lesu, nafsu makan menurun, sayap terkulai, dan bulu kusut.",
    cause:
      "Bakteri Salmonella pullorum atau Salmonella gallinarum. Bakteri ini sangat tahan dan mampu bertahan hidup lebih dari 1 tahun di dalam tanah. Penularan terjadi melalui jalur feses-oral, pakan atau air minum yang terkontaminasi, vektor seperti tikus dan serangga, serta penularan vertikal dari induk ke telur.",
    immediate_action: [
      "Segera pisahkan ayam yang menunjukkan gejala dari kawanan sehat",
      "Bersihkan dan sterilkan lingkungan kandang dengan disinfeksi menyeluruh",
      "Berikan elektrolit dan vitamin untuk memulihkan kondisi ayam",
      "Berikan antibiotik (seperti Enrofloxacin atau golongan sulfonamid) di bawah pengawasan dokter hewan",
      "Lakukan sanitasi ketat pada air minum dan basmi tikus serta serangga di sekitar kandang",
    ],
  },
};
