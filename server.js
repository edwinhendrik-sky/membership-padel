const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');

const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

// Inisialisasi Database SQLite
const dbFile = path.join(__dirname, 'membership.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) console.error('Gagal terhubung ke database:', err.message);
    else console.log('Terhubung ke database SQLite (membership.db).');
});

// Setup Tabel & Kolom secara Aman
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_member TEXT UNIQUE,
            nama_member TEXT,
            no_wa TEXT,
            tgl_aktivasi TEXT,
            tgl_expired TEXT,
            status TEXT,
            foto TEXT
        )
    `);

    db.run(`
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
        )
    `);

    db.run(`ALTER TABLE members ADD COLUMN foto TEXT`, () => {});
    db.run(`ALTER TABLE bookings ADD COLUMN status_booked TEXT DEFAULT 'Booked'`, () => {});
    db.run(`ALTER TABLE bookings ADD COLUMN status_payment TEXT DEFAULT 'Menunggu Cek'`, () => {});
    db.run(`ALTER TABLE bookings ADD COLUMN status_ayo TEXT DEFAULT 'Pending AYO'`, () => {});
    db.run(`ALTER TABLE bookings ADD COLUMN bukti_transfer TEXT`, () => {});
});

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

    const sql = `SELECT * FROM members WHERE UPPER(id_member) = UPPER(?) AND no_wa = ?`;
    db.get(sql, [cleanId, cleanWa], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) {
            return res.status(401).json({ success: false, message: "ID Member atau Nomor WhatsApp salah!" });
        }
        res.json({ success: true, data: row });
    });
});

// Endpoint Upload / Ganti Foto Profil Member
app.post('/api/member/foto', (req, res) => {
    const { id_member, foto } = req.body;
    if (!id_member || !foto) {
        return res.status(400).json({ error: "ID Member dan foto wajib diisi!" });
    }

    db.run(`UPDATE members SET foto = ? WHERE UPPER(id_member) = UPPER(?)`, [foto, id_member], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        db.get(`SELECT * FROM members WHERE UPPER(id_member) = UPPER(?)`, [id_member], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Foto profil berhasil diperbarui", data: row });
        });
    });
});

// Endpoint Booking Terpakai
app.get('/api/booking/terpakai', (req, res) => {
    const { tanggal } = req.query;
    db.all("SELECT lokasi, detail_jam FROM bookings WHERE tanggal = ?", [tanggal], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Endpoint Submit Booking
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

// Endpoint Update Bukti Transfer Member (Edit Bukti)
app.put('/api/booking/bukti/:id', (req, res) => {
    const { bukti_transfer } = req.body;
    if (!bukti_transfer) {
        return res.status(400).json({ error: "Bukti transfer wajib diunggah!" });
    }

    const sql = `UPDATE bookings SET bukti_transfer = ?, status_payment = 'Menunggu Cek' WHERE id = ?`;
    db.run(sql, [bukti_transfer, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Bukti transfer berhasil diperbarui" });
    });
});

// Endpoint Riwayat Booking Member
app.get('/api/booking/member/:id_member', (req, res) => {
    const sql = `SELECT * FROM bookings WHERE UPPER(id_member) = UPPER(?) ORDER BY id DESC`;
    db.all(sql, [req.params.id_member], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Endpoint Admin Bookings
app.get('/api/admin/bookings', (req, res) => {
    db.all(`SELECT * FROM bookings ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Update Status Booking Admin
app.put('/api/admin/booking/status/:id', (req, res) => {
    const { status_payment, status_ayo } = req.body;
    const sql = `UPDATE bookings SET status_payment = COALESCE(?, status_payment), status_ayo = COALESCE(?, status_ayo) WHERE id = ?`;
    db.run(sql, [status_payment, status_ayo, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Status booking berhasil diperbarui" });
    });
});

// CRUD Members
app.get('/members', (req, res) => {
    db.all("SELECT * FROM members ORDER BY id_member ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/members', (req, res) => {
    const { nama_member, no_wa, tgl_aktivasi, tgl_expired, status } = req.body;
    const cleanWa = no_wa ? no_wa.toString().trim() : '';

    if (cleanWa) {
        db.get(`SELECT id_member, nama_member FROM members WHERE no_wa = ?`, [cleanWa], (err, existingWa) => {
            if (existingWa) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Gagal: Nomor WhatsApp ${cleanWa} sudah terdaftar atas nama ${existingWa.nama_member} (ID: ${existingWa.id_member})!` 
                });
            }
            eksekusiInsert();
        });
    } else {
        eksekusiInsert();
    }

    function eksekusiInsert() {
        db.get(`SELECT id_member FROM members WHERE id_member LIKE 'PB%' ORDER BY CAST(SUBSTR(id_member, 3) AS INTEGER) DESC LIMIT 1`, [], (err, row) => {
            let nextIdNum = 1;
            if (row && row.id_member) {
                const lastNum = parseInt(row.id_member.replace("PB", ""), 10);
                if (!isNaN(lastNum)) nextIdNum = lastNum + 1;
            }
            const newIdMember = "PB" + String(nextIdNum).padStart(4, '0');

            const sql = `INSERT INTO members (nama_member, no_wa, id_member, tgl_aktivasi, tgl_expired, status) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(sql, [nama_member, cleanWa, newIdMember, tgl_aktivasi, tgl_expired, status || 'Aktif'], function(err) {
                if (err) return res.status(500).json({ success: false, error: err.message });
                res.json({ success: true, message: "Data member berhasil disimpan", id: this.lastID, id_member: newIdMember });
            });
        });
    }
});

app.put('/members/:id', (req, res) => {
    const { nama_member, no_wa, tgl_aktivasi, tgl_expired, status } = req.body;
    const cleanWa = no_wa ? no_wa.toString().trim() : '';

    db.get(`SELECT id_member, nama_member FROM members WHERE no_wa = ? AND id != ?`, [cleanWa, req.params.id], (err, existingWa) => {
        if (existingWa) {
            return res.status(400).json({ 
                success: false, 
                error: `Gagal: Nomor WhatsApp ${cleanWa} sudah digunakan oleh ${existingWa.nama_member} (ID: ${existingWa.id_member})!` 
            });
        }

        const sql = `UPDATE members SET nama_member = ?, no_wa = ?, tgl_aktivasi = ?, tgl_expired, status = ? WHERE id = ?`;
        db.run(sql, [nama_member, cleanWa, tgl_aktivasi, tgl_expired, status, req.params.id], function(err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, message: "Data berhasil diupdate" });
        });
    });
});

app.delete('/members/:id', (req, res) => {
    db.run(`DELETE FROM members WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: "Data berhasil dihapus" });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});