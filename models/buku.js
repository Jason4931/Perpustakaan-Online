let mongoose = require('mongoose');
let buku = new mongoose.Schema({
    judul: String,
    penulis: String,
    penerbit: String,
    tahun_terbit: Number,
    edisi: Number,
    sinopsis: String,
    genre: [String],
    isbn: Number,
    stok: Number,
    isi: String,
    del: Number,
    date: Date
});
module.exports=mongoose.model('buku', buku);
// Akun: id, username, password, role
// Buku: id, judul, penulis, penerbit, tahun_terbit, edisi, sinopsis, genre, ISBN, stok
// Pinjam: id, user_id, buku_id, date_pinjam, lama, date_kembali, status
// Komentar: id, user_id, buku_id, text, date
// Report: id, user_id, buku_id, reason, date