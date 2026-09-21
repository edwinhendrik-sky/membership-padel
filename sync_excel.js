const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');

// 1. Hubungkan ke database
const db = new sqlite3.Database('./membership.db');

// 2. Baca file Excel 'list member.xlsx' (Pastikan file ada di folder yang sama)
// cellDates: true digunakan agar format tanggal dari Excel terbaca dengan benar
const workbook = xlsx.readFile('list member.xlsx', { cellDates: true });
const sheetName = workbook.SheetNames[0];
const dataExcel = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Fungsi bantuan untuk mengubah tanggal Excel ke format YYYY-MM-DD
function formatTanggal(dateVal) {
    if (!dateVal) return "";
    if (dateVal instanceof Date) {
        const y = dateVal.getFullYear();
        const m = String(dateVal.getMonth() + 1).padStart(2, '0');
        const d = String(dateVal.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return String(dateVal); // Kembalikan string jika sudah berwujud teks
}

console.log(`Membaca ${dataExcel.length} baris dari Excel. Memulai proses sinkronisasi...`);

let diupdate = 0;
let ditambah = 0;

db.serialize(() => {
    dataExcel.forEach(item => {
        const idMember = item["ID Member"];
        const nama = item["Nama Member"];
        let noWa = item["No WA"];
        const aktivasi = formatTanggal(item["Tgl Aktivasi"]);
        const expired = formatTanggal(item["Tgl Expired"]);
        const status = item["Status"];

        // Bersihkan format nomor WA (Misal dari Excel terbaca 81234.0)
        if (noWa && noWa.toString().endsWith('.0')) {
            noWa = noWa.toString().replace('.0', '');
        }

        // CEK DATABASE: Apakah ID Member ini sudah ada?
        const sqlCheck = `SELECT id_member FROM members WHERE id_member = ?`;
        
        db.get(sqlCheck, [idMember], (err, row) => {
            if (err) console.error(err.message);
            
            if (row) {
                // JIKA SUDAH ADA -> UPDATE (Timpa yang berubah)
                const sqlUpdate = `UPDATE members SET nama_member=?, no_wa=?, tgl_aktivasi=?, tgl_expired=?, status=? WHERE id_member=?`;
                db.run(sqlUpdate, [nama, noWa, aktivasi, expired, status, idMember]);
                diupdate++;
            } else {
                // JIKA BELUM ADA -> INSERT (Tambahkan ke database)
                const sqlInsert = `INSERT INTO members (nama_member, no_wa, id_member, tgl_aktivasi, tgl_expired, status) VALUES (?, ?, ?, ?, ?, ?)`;
                db.run(sqlInsert, [nama, noWa, idMember, aktivasi, expired, status]);
                ditambah++;
            }
        });
    });
});

// Tunggu sejenak agar SQLite selesai memproses seluruh baris
setTimeout(() => {
    console.log(`\n=== PROSES SELESAI ===`);
    console.log(`- Data yang diperbarui (ditimpa): ${diupdate}`);
    console.log(`- Data baru yang ditambahkan  : ${ditambah}`);
    console.log(`\nSilakan jalankan ulang server Anda (node server.js).`);
}, 2000);