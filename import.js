const sqlite3 = require('sqlite3').verbose();

// Koneksi ke database
const db = new sqlite3.Database('./membership.db');

// Data dari file Excel 'list member.xlsx'
const dataExcel = [
  {"Nama Member": "CLAUDIA VANESSA", "No WA": "6287823212221", "ID Member": "PB0013", "Tgl Aktivasi": "2026-03-06", "Tgl Expired": "2026-09-05", "Status": "Non Aktif"},
  {"Nama Member": "ZALE", "No WA": "6281221892069", "ID Member": "PB0017", "Tgl Aktivasi": "2026-03-06", "Tgl Expired": "2026-09-05", "Status": "Non Aktif"},
  {"Nama Member": "ANTARES PARASEVA BANDORO", "No WA": "628112343003", "ID Member": "PB0020", "Tgl Aktivasi": "2026-03-07", "Tgl Expired": "2026-09-06", "Status": "Non Aktif"},
  {"Nama Member": "YAYU SRI DINASTI", "No WA": "6281288444334", "ID Member": "PB0010", "Tgl Aktivasi": "2026-03-07", "Tgl Expired": "2026-09-06", "Status": "Non Aktif"},
  {"Nama Member": "IVO HIKARU WIJAYAKUSUMA", "No WA": "62818978189", "ID Member": "PB0016", "Tgl Aktivasi": "2026-03-08", "Tgl Expired": "2026-09-07", "Status": "Non Aktif"},
  {"Nama Member": "AGNES ISLY", "No WA": "6281321155313", "ID Member": "PB0022", "Tgl Aktivasi": "2026-03-08", "Tgl Expired": "2026-09-07", "Status": "Non Aktif"},
  {"Nama Member": "GRACE SYNTIA DEWI", "No WA": "6281809977336", "ID Member": "PB0028", "Tgl Aktivasi": "2026-03-11", "Tgl Expired": "2026-09-10", "Status": "Non Aktif"},
  {"Nama Member": "ANGGA DWI KOSWARA", "No WA": "6287779994563", "ID Member": "PB0029", "Tgl Aktivasi": "2026-03-13", "Tgl Expired": "2026-09-12", "Status": "Non Aktif"},
  {"Nama Member": "AL FRITA MEGA PURI", "No WA": "6282128286777", "ID Member": "PB0021", "Tgl Aktivasi": "2026-03-14", "Tgl Expired": "2026-09-13", "Status": "Non Aktif"},
  {"Nama Member": "DAVID", "No WA": "6285721221241", "ID Member": "PB0025", "Tgl Aktivasi": "2026-03-14", "Tgl Expired": "2026-09-13", "Status": "Non Aktif"},
  {"Nama Member": "VICAQUITA LIDRAPRANOTO", "No WA": "6281809787800", "ID Member": "PB0026", "Tgl Aktivasi": "2026-03-14", "Tgl Expired": "2026-09-13", "Status": "Non Aktif"},
  {"Nama Member": "FRANCISKA CLAUDIA SUNGADI", "No WA": "6281802038451", "ID Member": "PB0031", "Tgl Aktivasi": "2026-03-17", "Tgl Expired": "2026-09-16", "Status": "Non Aktif"},
  {"Nama Member": "FAISHAL ARDHAN", "No WA": "6287838285096", "ID Member": "PB0030", "Tgl Aktivasi": "2026-03-25", "Tgl Expired": "2026-09-24", "Status": "Aktif"},
  {"Nama Member": "DEASY LIUNARDO", "No WA": "6282126255968", "ID Member": "PB0014", "Tgl Aktivasi": "2026-04-01", "Tgl Expired": "2026-10-01", "Status": "Aktif"},
  {"Nama Member": "MELLISA GUNAWAN", "No WA": "6281222888805", "ID Member": "PB0011", "Tgl Aktivasi": "2026-04-01", "Tgl Expired": "2026-10-01", "Status": "Aktif"},
  {"Nama Member": "DINNY ASHRI AKBARIANI", "No WA": "6282121070757", "ID Member": "PB0019", "Tgl Aktivasi": "2026-04-01", "Tgl Expired": "2026-10-01", "Status": "Aktif"},
  {"Nama Member": "CAROLINE HDI", "No WA": "6285863336699", "ID Member": "PB0024", "Tgl Aktivasi": "2026-04-01", "Tgl Expired": "2026-10-01", "Status": "Aktif"},
  {"Nama Member": "RAMA TYAS", "No WA": "6288299019106", "ID Member": "PB0015", "Tgl Aktivasi": "2026-04-01", "Tgl Expired": "2026-10-01", "Status": "Aktif"},
  {"Nama Member": "LIZA MARIANA", "No WA": "6281321620426", "ID Member": "PB0023", "Tgl Aktivasi": "2026-04-01", "Tgl Expired": "2026-10-01", "Status": "Aktif"},
  {"Nama Member": "ANGGA ARDIANSYAH", "No WA": "628112309096", "ID Member": "PB0027", "Tgl Aktivasi": "2026-04-01", "Tgl Expired": "2026-10-01", "Status": "Aktif"},
  {"Nama Member": "FELIA FEBY SUTANTO", "No WA": "628112388662", "ID Member": "PB0032", "Tgl Aktivasi": "2026-04-03", "Tgl Expired": "2026-10-02", "Status": "Aktif"},
  {"Nama Member": "ABDUL HAKIM", "No WA": "628112244619", "ID Member": "PB0034", "Tgl Aktivasi": "2026-04-08", "Tgl Expired": "2026-10-07", "Status": "Aktif"},
  {"Nama Member": "ALFI RAHMAN WIDI KRISNADI", "No WA": "6282116163883", "ID Member": "PB0033", "Tgl Aktivasi": "2026-04-11", "Tgl Expired": "2026-10-10", "Status": "Aktif"},
  {"Nama Member": "ANGGI SUCI AGUSTINA", "No WA": "628562312971", "ID Member": "PB0038", "Tgl Aktivasi": "2026-04-19", "Tgl Expired": "2026-10-18", "Status": "Aktif"},
  {"Nama Member": "BRAM F PURWA", "No WA": "6281918189888", "ID Member": "PB0035", "Tgl Aktivasi": "2026-04-20", "Tgl Expired": "2026-10-19", "Status": "Aktif"},
  {"Nama Member": "IIN RIZKI", "No WA": "62818203337", "ID Member": "PB0036", "Tgl Aktivasi": "2026-04-20", "Tgl Expired": "2026-10-19", "Status": "Aktif"},
  {"Nama Member": "NAJMIYA BRILIANI ARFIDHIYA", "No WA": "6282240440173", "ID Member": "PB0037", "Tgl Aktivasi": "2026-04-20", "Tgl Expired": "2026-10-19", "Status": "Aktif"},
  {"Nama Member": "KANG J. RIDWAN", "No WA": "6285871582080", "ID Member": "PB0039", "Tgl Aktivasi": "2026-04-20", "Tgl Expired": "2026-10-19", "Status": "Aktif"},
  {"Nama Member": "FABIAN", "No WA": "6281809090303", "ID Member": "PB0040", "Tgl Aktivasi": "2026-04-20", "Tgl Expired": "2026-10-19", "Status": "Aktif"},
  {"Nama Member": "CHRISTINE GAUTAMA", "No WA": "6281319000930", "ID Member": "PB0041", "Tgl Aktivasi": "2026-04-29", "Tgl Expired": "2026-10-28", "Status": "Aktif"},
  {"Nama Member": "JUANITA", "No WA": "628122182900", "ID Member": "PB0042", "Tgl Aktivasi": "2026-05-06", "Tgl Expired": "2026-11-05", "Status": "Aktif"},
  {"Nama Member": "FADHIL ADRIAN", "No WA": "6282117811569", "ID Member": "PB0045", "Tgl Aktivasi": "2026-05-29", "Tgl Expired": "2026-11-28", "Status": "Aktif"},
  {"Nama Member": "HENRY", "No WA": "6285956225050", "ID Member": "PB0043", "Tgl Aktivasi": "2026-06-01", "Tgl Expired": "2026-12-01", "Status": "Aktif"},
  {"Nama Member": "SEMBIRING", "No WA": "6281322406496", "ID Member": "PB0044", "Tgl Aktivasi": "2026-05-28", "Tgl Expired": "2026-12-01", "Status": "Aktif"},
  {"Nama Member": "ALYA DIAZ", "No WA": "6287745876585", "ID Member": "PB0047", "Tgl Aktivasi": "2026-06-18", "Tgl Expired": "2026-12-17", "Status": "Aktif"},
  {"Nama Member": "MUHAMMAD DZULQARNAIN", "No WA": "6282129291077", "ID Member": "PB0048", "Tgl Aktivasi": "2026-06-27", "Tgl Expired": "2026-12-26", "Status": "Aktif"},
  {"Nama Member": "ANDIKO MANIK", "No WA": "62817224615", "ID Member": "PB0049", "Tgl Aktivasi": "2026-07-09", "Tgl Expired": "2027-01-08", "Status": "Aktif"},
  {"Nama Member": "SENTOSO", "No WA": "62818613311", "ID Member": "PB0050", "Tgl Aktivasi": "2026-07-24", "Tgl Expired": "2027-01-23", "Status": "Aktif"},
  {"Nama Member": "ANDREA", "No WA": "6289658746486", "ID Member": "PB0051", "Tgl Aktivasi": "2026-08-25", "Tgl Expired": "2027-02-24", "Status": "Aktif"},
  {"Nama Member": "FREDDY", "No WA": "62811237738", "ID Member": "PB0012", "Tgl Aktivasi": "2026-09-05", "Tgl Expired": "2027-03-04", "Status": "Perpanjang"},
  {"Nama Member": "TOMY SARWANTO", "No WA": "6281320464423", "ID Member": "PB0018", "Tgl Aktivasi": "2026-09-07", "Tgl Expired": "2027-03-06", "Status": "Perpanjang"}
];

db.serialize(() => {
    // 1. Drop tabel lama jika sudah ada (karena strukturnya beda)
    db.run(`DROP TABLE IF EXISTS members`);
    
    // 2. Buat tabel baru dengan struktur sesuai Excel
    db.run(`CREATE TABLE members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_member TEXT NOT NULL,
        no_wa TEXT,
        id_member TEXT,
        tgl_aktivasi TEXT,
        tgl_expired TEXT,
        status TEXT
    )`);

    // 3. Masukkan ke-41 data secara berurutan
    const stmt = db.prepare(`INSERT INTO members (nama_member, no_wa, id_member, tgl_aktivasi, tgl_expired, status) VALUES (?, ?, ?, ?, ?, ?)`);
    
    dataExcel.forEach(item => {
        stmt.run(
            item["Nama Member"], 
            item["No WA"], 
            item["ID Member"], 
            item["Tgl Aktivasi"], 
            item["Tgl Expired"], 
            item["Status"]
        );
    });
    stmt.finalize();

    console.log("Berhasil! 41 Data Member dari Excel telah dimasukkan ke Database SQLite.");
});

db.close();