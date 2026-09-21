const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

// Inisialisasi Database SQLite
const db = new Database('./membership');
console.log('Terhubung ke database SQLite.');

// Setup Tabel Members & Bookings
db.exec(`
    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_member TEXT UNIQUE,
        nama_member TEXT,
        no_wa TEXT,
        tgl_aktivasi TEXT,
        tgl_expired TEXT,
        status TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_booking TEXT,
        id_member TEXT,
        nama TEXT,
        no_hp TEXT,
        lokasi TEXT,
        tanggal TEXT,
        detail_jam TEXT,
        total_bayar INTEGER,
        status_booked TEXT DEFAULT 'Booked',
        status_payment TEXT DEFAULT 'Menunggu Cek',
        status_ayo TEXT DEFAULT 'Pending AYO',
        bukti_transfer TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Pastikan kolom tambahan aman
try { db.exec(`ALTER TABLE bookings ADD COLUMN status_booked TEXT DEFAULT 'Booked'`); } catch(e) {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN status_payment TEXT DEFAULT 'Menunggu Cek'`); } catch(e) {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN status_ayo TEXT DEFAULT 'Pending AYO'`); } catch(e) {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN bukti_transfer TEXT`); } catch(e) {}

// AUTO-SYNC / INSERT DATA MEMBER AWAL AGAR DATABASE TIDAK KOSONG
const dataExcel = [
  {"Nama Member": "CLAUDIA VANESSA", "No WA": "6287823212221", "ID Member": "PB0013", "Tgl Aktivasi": "2026-03-06", "Tgl Expired": "2026-09-05", "Status": "Non Aktif"},
  {"Nama Member": "ZALE", "No WA": "6281221892069", "ID Member": "PB0017", "Tgl Aktivasi": "2026-03-06", "Tgl Expired": "2026-09-04", "Status": "Non Aktif"},
  {"Nama Member": "ANTARES PARASEVA BANDORO", "No WA": "628112343003", "ID Member": "PB0020", "Tgl Aktivasi": "2026-03-06", "Tgl Expired": "2026-09-05", "Status": "Non Aktif"},
  {"Nama Member": "YAYU SRI DINASTI", "No WA": "6281288444334", "ID Member": "PB0010", "Tgl Aktivasi": "2026-03-06", "Tgl Expired": "2026-09-05", "Status": "Non Aktif"},
  {"Nama Member": "IVO HIKARU WIJAYAKUSUMA", "No WA": "62818978189", "ID Member": "PB0016", "Tgl Aktivasi": "2026-03-07", "Tgl Expired": "2026-09-06", "Status": "Non Aktif"},
  {"Nama Member": "AGNES ISLY", "No WA": "6281321155313", "ID Member": "PB0022", "Tgl Aktivasi": "2026-03-07", "Tgl Expired": "2026-09-06", "Status": "Non Aktif"},
  {"Nama Member": "GRACE SYNTIA DEWI", "No WA": "6281809977336", "ID Member": "PB0028", "Tgl Aktivasi": "2026-03-10", "Tgl Expired": "2026-09-09", "Status": "Non Aktif"},
  {"Nama Member": "ANGGA DWI KOSWARA", "No WA": "6287779994563", "ID Member": "PB0029", "Tgl Aktivasi": "2026-03-12", "Tgl Expired": "2026-09-11", "Status": "Non Aktif"},
  {"Nama Member": "AL FRITA MEGA PURI", "No WA": "6282128286777", "ID Member": "PB0021", "Tgl Aktivasi": "2026-03-13", "Tgl Expired": "2026-09-12", "Status": "Non Aktif"},
  {"Nama Member": "DAVID", "No WA": "6285721221241", "ID Member": "PB0025", "Tgl Aktivasi": "2026-03-13", "Tgl Expired": "2026-09-12", "Status": "Non Aktif"},
  {"Nama Member": "VICAQUITA LIDRAPRANOTO", "No WA": "6281809787800", "ID Member": "PB0026", "Tgl Aktivasi": "2026-03-13", "Tgl Expired": "2026-09-12", "Status": "Non Aktif"},
  {"Nama Member": "FRANCISKA CLAUDIA SUNGADI", "No WA": "6281802038451", "ID Member": "PB0031", "Tgl Aktivasi": "2026-03-16", "Tgl Expired": "2026-09-15", "Status": "Non Aktif"},
  {"Nama Member": "FAISHAL ARDHAN", "No WA": "6287838285096", "ID Member": "PB0030", "Tgl Aktivasi": "2026-03-24", "Tgl Expired": "2026-09-23", "Status": "Aktif"},
  {"Nama Member": "DEASY LIUNARDO", "No WA": "6282126255968", "ID Member": "PB0014", "Tgl Aktivasi": "2026-03-31", "Tgl Expired": "2026-09-30", "Status": "Aktif"},
  {"Nama Member": "MELLISA GUNAWAN", "No WA": "6281222888805", "ID Member": "PB0011", "Tgl Aktivasi": "2026-03-31", "Tgl Expired": "2026-09-30", "Status": "Aktif"},
  {"Nama Member": "DINNY ASHRI AKBARIANI", "No WA": "6282121070757", "ID Member": "PB0019", "Tgl Aktivasi": "2026-03-31", "Tgl Expired": "2026-09-30", "Status": "Aktif"},
  {"Nama Member": "CAROLINE HDI", "No WA": "6285863336699", "ID Member": "PB0024", "Tgl Aktivasi": "2026-03-31", "Tgl Expired": "2026-09-30", "Status": "Aktif"},
  {"Nama Member": "RAMA TYAS", "No WA": "6288299019106", "ID Member": "PB0015", "Tgl Aktivasi": "2026-03-31", "Tgl Expired": "2026-09-30", "Status": "Aktif"},
  {"Nama Member": "LIZA MARIANA", "No WA": "6281321620426", "ID Member": "PB0023", "Tgl Aktivasi": "2026-03-31", "Tgl Expired": "2026-09-30", "Status": "Aktif"},
  {"Nama Member": "ANGGA ARDIANSYAH", "No WA": "628112309096", "ID Member": "PB0027", "Tgl Aktivasi": "2026-03-31", "Tgl Expired": "2026-09-30", "Status": "Aktif"},
  {"Nama Member": "FELIA FEBY SUTANTO", "No WA": "628112388662", "ID Member": "PB0032", "Tgl Aktivasi": "2026-04-02", "Tgl Expired": "2026-10-01", "Status": "Aktif"},
  {"Nama Member": "ABDUL HAKIM", "No WA": "628112244619", "ID Member": "PB0034", "Tgl Aktivasi": "2026-04-07", "Tgl Expired": "2026-10-06", "Status": "Aktif"},
  {"Nama Member": "ALFI RAHMAN WIDI KRISNADI", "No WA": "6282116163883", "ID Member": "PB0033", "Tgl Aktivasi": "2026-04-10", "Tgl Expired": "2026-10-09", "Status": "Aktif"},
  {"Nama Member": "ANGGI SUCI AGUSTINA", "No WA": "628562312971", "ID Member": "PB0038", "Tgl Aktivasi": "2026-04-18", "Tgl Expired": "2026-10-17", "Status": "Aktif"},
  {"Nama Member": "BRAM F PURWA", "No WA": "6281918189888", "ID Member": "PB0035", "Tgl Aktivasi": "2026-04-19", "Tgl Expired": "2026-10-19", "Status": "Aktif"},
  {"Nama Member": "IIN RIZKI", "No WA": "62818203337", "ID Member": "PB0036", "Tgl Aktivasi": "2026-04-19", "Tgl Expired": "2026-10-19", "Status": "Aktif"},
  {"Nama Member": "NAJMIYA BRILIANI ARFIDHIYA", "No WA": "6282240440173", "ID Member": "PB0037", "Tgl Aktivasi": "2026-04-19", "Tgl Expired": "2026-10-18", "Status": "Aktif"},
  {"Nama Member": "KANG J. RIDWAN", "No WA": "6285871582080", "ID Member": "PB0039", "Tgl Aktivasi": "2026-04-19", "Tgl Expired": "2026-10-18", "Status": "Aktif"},
  {"Nama Member": "FABIAN", "No WA": "6281809090303", "ID Member": "PB0040", "Tgl Aktivasi": "2026-04-19", "Tgl Expired": "2026-10-18", "Status": "Aktif"},
  {"Nama Member": "CHRISTINE GAUTAMA", "No WA": "6281319000930", "ID Member": "PB0041", "Tgl Aktivasi": "2026-04-28", "Tgl Expired": "2026-10-27", "Status": "Aktif"},
  {"Nama Member": "JUANITA", "No WA": "628122182900", "ID Member": "PB0042", "Tgl Aktivasi": "2026-05-05", "Tgl Expired": "2026-11-04", "Status": "Aktif"},
  {"Nama Member": "FADHIL ADRIAN", "No WA": "6282117811569", "ID Member": "PB0045", "Tgl Aktivasi": "2026-05-28", "Tgl Expired": "2026-11-27", "Status": "Aktif"},
  {"Nama Member": "HENRY", "No WA": "6285956225050", "ID Member": "PB0043", "Tgl Aktivasi": "2026-05-31", "Tgl Expired": "2026-11-30", "Status": "Aktif"},
  {"Nama Member": "SEMBIRING", "No WA": "6281322406496", "ID Member": "PB0044", "Tgl Aktivasi": "2026-05-27", "Tgl Expired": "2026-11-30", "Status": "Aktif"},
  {"Nama Member": "ALYA DIAZ", "No WA": "6287745876585", "ID Member": "PB0047", "Tgl Aktivasi": "2026-06-17", "Tgl Expired": "2026-12-16", "Status": "Aktif"},
  {"Nama Member": "MUHAMMAD DZULQARNAIN", "No WA": "6282129291077", "ID Member": "PB0048", "Tgl Aktivasi": "2026-06-26", "Tgl Expired": "2026-12-25", "Status": "Aktif"},
  {"Nama Member": "ANDIKO MANIK", "No WA": "62817224615", "ID Member": "PB0049", "Tgl Aktivasi": "2026-07-08", "Tgl Expired": "2027-01-07", "Status": "Aktif"},
  {"Nama Member": "SENTOSO", "No WA": "62818613311", "ID Member": "PB0050", "Tgl Aktivasi": "2026-07-23", "Tgl Expired": "2027-01-22", "Status": "Aktif"},
  {"Nama Member": "ANDREA", "No WA": "6289658746486", "ID Member": "PB0051", "Tgl Aktivasi": "2026-08-24", "Tgl Expired": "2027-02-23", "Status": "Aktif"},
  {"Nama Member": "FREDDY", "No WA": "62811237738", "ID Member": "PB0012", "Tgl Aktivasi": "2026-09-04", "Tgl Expired": "2027-03-03", "Status": "Aktif"},
  {"Nama Member": "TOMY SARWANTO", "No WA": "6281320464423", "ID Member": "PB0018", "Tgl Aktivasi": "2026-09-06", "Tgl Expired": "2027-03-05", "Status": "Aktif"}
];

const insertStmt = db.prepare(`INSERT OR IGNORE INTO members (nama_member, no_wa, id_member, tgl_aktivasi, tgl_expired, status) VALUES (?, ?, ?, ?, ?, ?)`);
const updateStmt = db.prepare(`UPDATE members SET nama_member=?, no_wa=?, tgl_aktivasi=?, tgl_expired=?, status=? WHERE id_member=?`);

dataExcel.forEach(item => {
    try {
        const info = insertStmt.run(item["Nama Member"], item["No WA"], item["ID Member"], item["Tgl Aktivasi"], item["Tgl Expired"], item["Status"]);
        if (info.changes === 0) {
            updateStmt.run(item["Nama Member"], item["No WA"], item["Tgl Aktivasi"], item["Tgl Expired"], item["Status"], item["ID Member"]);
        }
    } catch (e) {
        console.error("Gagal sync member:", item["ID Member"], e.message);
    }
});
console.log("Auto-sync database member selesai.");

// Route Halaman
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Endpoint Login Member
app.post('/login', (req, res) => {
    const { id_member, no_wa } = req.body;
    const cleanId = id_member ? id_member.toString().trim() : '';
    const cleanWa = no_wa ? no_wa.toString().trim() : '';

    try {
        const sql = `SELECT * FROM members WHERE UPPER(id_member) = UPPER(?) AND no_wa = ?`;
        const row = db.prepare(sql).get(cleanId, cleanWa);
        
        if (!row) {
            return res.status(401).json({ success: false, message: "ID Member atau Nomor WhatsApp salah!" });
        }
        res.json({ success: true, data: row });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint Booking Terpakai
app.get('/api/booking/terpakai', (req, res) => {
    const { tanggal } = req.query;
    try {
        const rows = db.prepare("SELECT lokasi, detail_jam FROM bookings WHERE tanggal = ?").all(tanggal);
        res.json(rows || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint Submit Booking
app.post('/api/booking', (req, res) => {
    const { id_booking, id_member, nama, no_hp, lokasi, tanggal, detail_jam, total_bayar, bukti_transfer } = req.body;
    
    if (!bukti_transfer) {
        return res.status(400).json({ error: "Bukti transfer wajib diunggah!" });
    }

    try {
        const sql = `INSERT INTO bookings (id_booking, id_member, nama, no_hp, lokasi, tanggal, detail_jam, total_bayar, status_booked, status_payment, status_ayo, bukti_transfer) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Booked', 'Menunggu Cek', 'Pending AYO', ?)`;
        db.prepare(sql).run(id_booking, id_member, nama, no_hp, lokasi, tanggal, detail_jam, total_bayar, bukti_transfer);
        res.json({ success: true, message: "Booking berhasil dicatat", id_booking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint Riwayat Booking Member
app.get('/api/booking/member/:id_member', (req, res) => {
    try {
        const sql = `SELECT * FROM bookings WHERE UPPER(id_member) = UPPER(?) ORDER BY id DESC`;
        const rows = db.prepare(sql).all(req.params.id_member);
        res.json(rows || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint Admin Bookings
app.get('/api/admin/bookings', (req, res) => {
    try {
        const rows = db.prepare(`SELECT * FROM bookings ORDER BY id DESC`).all();
        res.json(rows || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Status Booking Admin
app.put('/api/admin/booking/status/:id', (req, res) => {
    const { status_payment, status_ayo } = req.body;
    try {
        const sql = `UPDATE bookings SET status_payment = COALESCE(?, status_payment), status_ayo = COALESCE(?, status_ayo) WHERE id = ?`;
        db.prepare(sql).run(status_payment, status_ayo, req.params.id);
        res.json({ success: true, message: "Status booking berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRUD Members
app.get('/members', (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM members ORDER BY id_member ASC").all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/members', (req, res) => {
    const { nama_member, no_wa, tgl_aktivasi, tgl_expired, status } = req.body;
    try {
        const row = db.prepare(`SELECT id_member FROM members ORDER BY id_member DESC LIMIT 1`).get();
        let newIdMember = "PB0001";
        if (row && row.id_member) {
            const lastIdNum = parseInt(row.id_member.replace("PB", ""), 10);
            newIdMember = "PB" + String(lastIdNum + 1).padStart(4, '0');
        }
        const sql = `INSERT INTO members (nama_member, no_wa, id_member, tgl_aktivasi, tgl_expired, status) VALUES (?, ?, ?, ?, ?, ?)`;
        const info = db.prepare(sql).run(nama_member, no_wa, newIdMember, tgl_aktivasi, tgl_expired, status);
        res.json({ id: info.lastInsertRowid, id_member: newIdMember, nama_member, no_wa, tgl_aktivasi, tgl_expired, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/members/:id', (req, res) => {
    const { nama_member, no_wa, tgl_aktivasi, tgl_expired, status } = req.body;
    try {
        const sql = `UPDATE members SET nama_member = ?, no_wa = ?, tgl_aktivasi = ?, tgl_expired = ?, status = ? WHERE id = ?`;
        db.prepare(sql).run(nama_member, no_wa, tgl_aktivasi, tgl_expired, status, req.params.id);
        res.json({ message: "Data member berhasil diupdate" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/members/:id', (req, res) => {
    try {
        db.prepare(`DELETE FROM members WHERE id = ?`).run(req.params.id);
        res.json({ message: "Data member berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});