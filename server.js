const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();

// Naikkan limit body parser untuk menampung gambar foto bukti transfer base64
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());

const db = new sqlite3.Database('./membership.db', (err) => {
    if (err) console.error(err.message);
    console.log('Terhubung ke database SQLite.');
});

// Setup tabel SQLite
db.serialize(() => {
    // Tabel Member
    db.run(`CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_member TEXT UNIQUE,
        nama_member TEXT,
        no_wa TEXT,
        tgl_aktivasi TEXT,
        tgl_expired TEXT,
        status TEXT
    )`);

    // Tabel Bookings (Dengan 3 Status & Bukti Transfer)
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
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
    )`);

    // Tambahkan kolom jika tabel lama belum memiliki kolom-kolom ini
    db.run(`ALTER TABLE bookings ADD COLUMN status_booked TEXT DEFAULT 'Booked'`, () => {});
    db.run(`ALTER TABLE bookings ADD COLUMN status_payment TEXT DEFAULT 'Menunggu Cek'`, () => {});
    db.run(`ALTER TABLE bookings ADD COLUMN status_ayo TEXT DEFAULT 'Pending AYO'`, () => {});
    db.run(`ALTER TABLE bookings ADD COLUMN bukti_transfer TEXT`, () => {});
});

// ==========================================
// 1. ENDPOINT AUTH & LOGIN MEMBER
// ==========================================
app.post('/login', (req, res) => {
    const { id_member, no_wa } = req.body;
    const cleanId = id_member ? id_member.toString().trim() : '';
    const cleanWa = no_wa ? no_wa.toString().trim() : '';

    // Cek database tanpa terpengaruh huruf besar/kecil (case-insensitive)
    const sql = `SELECT * FROM members WHERE UPPER(id_member) = UPPER(?) AND no_wa = ?`;
    db.get(sql, [cleanId, cleanWa], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) {
            return res.status(401).json({ success: false, message: "ID Member atau Nomor WhatsApp salah!" });
        }
        res.json({ success: true, data: row });
    });
});

// ==========================================
// 2. ENDPOINT BOOKING LAPANGAN (MEMBER)
// ==========================================

// Ambil slot terpakai berdasarkan tanggal
app.get('/api/booking/terpakai', (req, res) => {
    const { tanggal } = req.query;
    db.all("SELECT lokasi, detail_jam FROM bookings WHERE tanggal = ?", [tanggal], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Submit booking baru beserta bukti transfer wajib
app.post('/api/booking', (req, res) => {
    const { id_booking, id_member, nama, no_hp, lokasi, tanggal, detail_jam, total_bayar, bukti_transfer } = req.body;
    
    if (!bukti_transfer) {
        return res.status(400).json({ error: "Bukti transfer wajib diunggah!" });
    }

    const sql = `INSERT INTO bookings (id_booking, id_member, nama, no_hp, lokasi, tanggal, detail_jam, total_bayar, status_booked, status_payment, status_ayo, bukti_transfer) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Booked', 'Menunggu Cek', 'Pending AYO', ?)`;
    db.run(sql, [id_booking, id_member, nama, no_hp, lokasi, tanggal, detail_jam, total_bayar, bukti_transfer], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Booking berhasil dicatat", id_booking });
    });
});

// Ambil riwayat booking member yang sedang login
app.get('/api/booking/member/:id_member', (req, res) => {
    const sql = `SELECT * FROM bookings WHERE UPPER(id_member) = UPPER(?) ORDER BY id DESC`;
    db.all(sql, [req.params.id_member], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// ==========================================
// 3. ENDPOINT ADMIN (VERIFIKASI BOOKING)
// ==========================================

// Ambil seluruh data booking masuk untuk admin
app.get('/api/admin/bookings', (req, res) => {
    db.all(`SELECT * FROM bookings ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Update status Payment (PAID) atau Status AYO (Updated AYO)
app.put('/api/admin/booking/status/:id', (req, res) => {
    const { status_payment, status_ayo } = req.body;
    const sql = `UPDATE bookings SET status_payment = COALESCE(?, status_payment), status_ayo = COALESCE(?, status_ayo) WHERE id = ?`;
    db.run(sql, [status_payment, status_ayo, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Status booking berhasil diperbarui" });
    });
});

// ==========================================
// 4. ENDPOINT CRUD DATA MEMBERSHIP
// ==========================================

// READ: Menampilkan semua member (Urut ID ASC)
app.get('/members', (req, res) => {
    db.all("SELECT * FROM members ORDER BY id_member ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE: Tambah member baru dengan ID otomatis
app.post('/members', (req, res) => {
    const { nama_member, no_wa, tgl_aktivasi, tgl_expired, status } = req.body;

    db.get(`SELECT id_member FROM members ORDER BY id_member DESC LIMIT 1`, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let newIdMember = "PB0001";
        if (row && row.id_member) {
            const lastIdNum = parseInt(row.id_member.replace("PB", ""), 10);
            const nextIdNum = lastIdNum + 1;
            newIdMember = "PB" + String(nextIdNum).padStart(4, '0');
        }

        const sql = `INSERT INTO members (nama_member, no_wa, id_member, tgl_aktivasi, tgl_expired, status) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [nama_member, no_wa, newIdMember, tgl_aktivasi, tgl_expired, status], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, id_member: newIdMember, nama_member, no_wa, tgl_aktivasi, tgl_expired, status });
        });
    });
});

// UPDATE: Edit data member
app.put('/members/:id', (req, res) => {
    const { nama_member, no_wa, tgl_aktivasi, tgl_expired, status } = req.body;
    const sql = `UPDATE members SET nama_member = ?, no_wa = ?, tgl_aktivasi = ?, tgl_expired = ?, status = ? WHERE id = ?`;
    db.run(sql, [nama_member, no_wa, tgl_aktivasi, tgl_expired, status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Data berhasil diupdate" });
    });
});

// DELETE: Hapus data member
app.delete('/members/:id', (req, res) => {
    db.run(`DELETE FROM members WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Data berhasil dihapus" });
    });
});

// Jalankan Server
app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});