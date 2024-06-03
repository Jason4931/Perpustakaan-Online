let mongoose = require('mongoose');
let report = new mongoose.Schema({
    user_id: String,
    buku_id: String,
    reason: String,
    date: Date
});
module.exports=mongoose.model('report', report);
// Akun: id, username, password, role
// Buku: id, judul, penulis, penerbit, tahun_terbit, edisi, sinopsis, genre, ISBN, stok
// Pinjam: id, user_id, buku_id, date_pinjam, lama, date_kembali, status
// Komentar: id, user_id, buku_id, text, date
// Report: id, user_id, buku_id, reason, date