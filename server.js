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

// Setup Tabel & Kolom Foto
db.exec(`
    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_member TEXT UNIQUE,
        nama_member TEXT,
        no_wa TEXT,
        tgl_aktivasi TEXT,
        tgl_expired TEXT,
        status TEXT,
        foto TEXT
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

try { db.exec(`ALTER TABLE members ADD COLUMN foto TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN status_booked TEXT DEFAULT 'Booked'`); } catch(e) {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN status_payment TEXT DEFAULT 'Menunggu Cek'`); } catch(e) {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN status_ayo TEXT DEFAULT 'Pending AYO'`); } catch(e) {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN bukti_transfer TEXT`); } catch(e) {}

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

// Endpoint Upload / Ganti Foto Profil Member
app.post('/api/member/foto', (req, res) => {
    const { id_member, foto } = req.body;
    if (!id_member || !foto) {
        return res.status(400).json({ error: "ID Member dan foto wajib diisi!" });
    }

    try {
        const sql = `UPDATE members SET foto = ? WHERE UPPER(id_member) = UPPER(?)`;
        db.prepare(sql).run(foto, id_member);
        
        const updatedMember = db.prepare(`SELECT * FROM members WHERE UPPER(id_member) = UPPER(?)`).get(id_member);
        res.json({ success: true, message: "Foto profil berhasil diperbarui", data: updatedMember });
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