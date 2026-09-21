const Database = require('better-sqlite3');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// 1. Hubungkan ke database (pastikan nama file sesuai dengan yang digunakan server.js)
const dbPath = path.join(__dirname, 'membership');
const db = new Database(dbPath);

// 2. Pastikan tabel members sudah ada
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
`);

// 3. Baca file Excel 'list member.xlsx'
const excelFilePath = path.join(__dirname, 'list member.xlsx');
if (!fs.existsSync(excelFilePath)) {
    console.error("❌ Error: File 'list member.xlsx' tidak ditemukan di folder utama!");
    process.exit(1);
}

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

console.log(`Membaca ${dataExcel.length} baris dari Excel. Memulai sinkronisasi ke database...`);

let diupdate = 0;
let ditambah = 0;

const checkStmt = db.prepare(`SELECT id_member FROM members WHERE UPPER(id_member) = UPPER(?)`);
const updateStmt = db.prepare(`UPDATE members SET nama_member = ?, no_wa = ?, tgl_aktivasi = ?, tgl_expired = ?, status = ? WHERE UPPER(id_member) = UPPER(?)`);
const insertStmt = db.prepare(`INSERT INTO members (nama_member, no_wa, id_member, tgl_aktivasi, tgl_expired, status) VALUES (?, ?, ?, ?, ?, ?)`);

// Gunakan transaction agar proses tulis ke database jauh lebih cepat dan aman
const runSync = db.transaction((rows) => {
    rows.forEach(item => {
        const idMember = item["ID Member"] ? item["ID Member"].toString().trim() : "";
        const nama = item["Nama Member"] ? item["Nama Member"].toString().trim() : "";
        let noWa = item["No WA"] ? item["No WA"].toString().trim() : "";
        const aktivasi = formatTanggal(item["Tgl Aktivasi"]);
        const expired = formatTanggal(item["Tgl Expired"]);
        const status = item["Status"] ? item["Status"].toString().trim() : "Aktif";

        if (noWa.endsWith('.0')) {
            noWa = noWa.replace('.0', '');
        }

        if (!idMember) return;

        const existing = checkStmt.get(idMember);
        if (existing) {
            updateStmt.run(nama, noWa, aktivasi, expired, status, idMember);
            diupdate++;
        } else {
            insertStmt.run(nama, noWa, idMember, aktivasi, expired, status);
            ditambah++;
        }
    });
});

try {
    runSync(dataExcel);
    console.log(`\n=== SINKRONISASI BERHASIL ===`);
    console.log(`- Data member diperbarui (timpa) : ${diupdate}`);
    console.log(`- Data member baru ditambahkan   : ${ditambah}`);
} catch (err) {
    console.error("❌ Gagal melakukan sinkronisasi:", err.message);
}

db.close();