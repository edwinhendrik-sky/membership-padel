const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// 1. Pastikan file Excel tersedia
const excelFilePath = path.join(__dirname, 'list member.xlsx');
if (!fs.existsSync(excelFilePath)) {
    console.error("❌ Error: File 'list member.xlsx' tidak ditemukan di folder utama!");
    process.exit(1);
}

// 2. Baca file Excel
const workbook = xlsx.readFile(excelFilePath, { cellDates: true });
const sheetName = workbook.SheetNames[0];
const dataExcel = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Fungsi bantu format tanggal YYYY-MM-DD
function formatTanggal(dateVal) {
    if (!dateVal) return "";
    if (dateVal instanceof Date) {
        const y = dateVal.getFullYear();
        const m = String(dateVal.getMonth() + 1).padStart(2, '0');
        const d = String(dateVal.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return String(dateVal);
}

// 3. Hubungkan ke database SQLite (membership.db)
const dbFile = path.join(__dirname, 'membership.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error("❌ Gagal terhubung ke database:", err.message);
        process.exit(1);
    }
    console.log(`🔗 Terhubung ke database: ${dbFile}`);
});

console.log(`Membaca ${dataExcel.length} baris dari Excel. Memulai proses sinkronisasi...`);

let diupdate = 0;
let ditambah = 0;
let processed = 0;

db.serialize(() => {
    // Pastikan tabel members ada
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

    db.run("BEGIN TRANSACTION");

    dataExcel.forEach((item, index) => {
        const idMember = item["ID Member"] ? item["ID Member"].toString().trim() : "";
        const nama = item["Nama Member"] ? item["Nama Member"].toString().trim() : "";
        let noWa = item["No WA"] ? item["No WA"].toString().trim() : "";
        const aktivasi = formatTanggal(item["Tgl Aktivasi"]);
        const expired = formatTanggal(item["Tgl Expired"]);
        const status = item["Status"] ? item["Status"].toString().trim() : "Aktif";

        if (noWa.endsWith('.0')) {
            noWa = noWa.replace('.0', '');
        }

        if (!idMember) {
            processed++;
            return;
        }

        // Cek apakah ID Member sudah ada di database
        db.get(`SELECT id_member FROM members WHERE UPPER(id_member) = UPPER(?)`, [idMember], (err, row) => {
            if (row) {
                // Update jika sudah ada
                db.run(`UPDATE members SET nama_member = ?, no_wa = ?, tgl_aktivasi = ?, tgl_expired = ?, status = ? WHERE UPPER(id_member) = UPPER(?)`,
                    [nama, noWa, aktivasi, expired, status, idMember], (err) => {
                        if (!err) diupdate++;
                        checkFinished();
                    });
            } else {
                // Insert jika belum ada
                db.run(`INSERT INTO members (nama_member, no_wa, id_member, tgl_aktivasi, tgl_expired, status) VALUES (?, ?, ?, ?, ?, ?)`,
                    [nama, noWa, idMember, aktivasi, expired, status], (err) => {
                        if (!err) ditambah++;
                        checkFinished();
                    });
            }
        });
    });
});

function checkFinished() {
    processed++;
    if (processed >= dataExcel.length) {
        db.run("COMMIT", () => {
            console.log(`\n=== SINKRONISASI EXCEL SELESAI ===`);
            console.log(`- Data member diperbarui (timpa) : ${diupdate}`);
            console.log(`- Data member baru ditambahkan   : ${ditambah}`);
            db.close();
        });
    }
}