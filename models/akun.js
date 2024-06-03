let mongoose = require('mongoose');
let akun = new mongoose.Schema({
    username: String,
    password: String,
    role: String,
    accept: Number,
    del: Number
});
module.exports=mongoose.model('akun', akun);
// Akun: id, username, password, role
// Buku: id, judul, penulis, penerbit, tahun_terbit, edisi, sinopsis, genre, ISBN, stok
// Pinjam: id, user_id, buku_id, date_pinjam, lama, date_kembali, status
// Komentar: id, user_id, buku_id, text, date
// Report: id, user_id, buku_id, reason, date