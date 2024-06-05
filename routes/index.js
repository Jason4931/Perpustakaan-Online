var express = require('express');
var router = express.Router();

let akun = require('../models/akun.js');
let buku = require('../models/buku.js');
let komentar = require('../models/komentar.js');
let pinjam = require('../models/pinjam.js');
let report = require('../models/report.js');

let crypto = require('crypto');

/* GET home page. */
router.get('/', async function (req, res, next) {
  if (req.session.Nama != null) {
    let akunfind = await akun.find({ "username": req.session.Nama });
    if (akunfind[0].del != null) {
      res.redirect('/logout');
    }
    let genre = await buku.aggregate([
      { $unwind: "$genre" },
      { $group: { _id: "$genre", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);
    let borrow = await pinjam.aggregate([
      { $group: { _id: "$buku_id", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);
    borrow = await buku.find({ "_id": borrow[0]._id });
    let ulasan = await komentar.aggregate([
      { $group: { _id: "$buku_id", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);
    ulasan = await buku.find({ "_id": ulasan[0]._id });
    let pinjamdata = await pinjam.aggregate([
      {
        $match:
        {
          user_id: akunfind[0]._id.toString()
        }
      },
      {
        $addFields: {
          buku_id: { $toObjectId: "$buku_id" }
        }
      },
      {
        $lookup:
        {
          from: 'bukus',
          localField: 'buku_id',
          foreignField: '_id',
          as: 'buku'
        }
      }
    ]);
    let notifulasan = await komentar.aggregate([
      { $sort: { date: -1 } },
      { $limit: 5 }
    ]);
    let notifbuku = await buku.aggregate([
      { $sort: { date: -1 } },
      { $limit: 5 }
    ]);
    res.render('index', { nama: req.session.Nama, role: req.session.Role, buku: await buku.find({ "del": null }), pinjam: pinjamdata, genre: genre, borrow: borrow, ulasan: ulasan, notifulasan: notifulasan, notifbuku: notifbuku });
  } else {
    res.render('index', {nama: null, role: null, buku: await buku.find({ "del": null }), pinjam: null});
  }
});
router.get('/isi/:id', async function (req, res, next) {
  let bukufind = await buku.find({ "_id": req.params.id });
  if (bukufind[0].del == null) {
    if (req.session.Nama != null) {
      let akunfind = await akun.find({ "username": req.session.Nama });
      if (akunfind[0].del != null) {
        res.redirect('/logout');
      }
      if (req.query.err != null) {
        res.render('isi', { buku: await buku.find({ "_id": req.params.id }), role: req.session.Role, pinjam: await pinjam.find({ "user_id": akunfind[0]._id, "buku_id": req.params.id }), komentar: await komentar.find({ "buku_id": req.params.id }), err: req.query.err });
      } else {
        res.render('isi', { buku: await buku.find({ "_id": req.params.id }), role: req.session.Role, pinjam: await pinjam.find({ "user_id": akunfind[0]._id, "buku_id": req.params.id }), komentar: await komentar.find({ "buku_id": req.params.id }), err: null });
      }
    } else {
      res.render('isi', { buku: await buku.find({ "_id": req.params.id }), role: null, pinjam: null, komentar: null, err: null });
    }
  } else {
    res.redirect('/');
  }
});
router.get('/register', async function (req, res, next) {
  if (req.session.Role == null) {
    if (req.query.err != null) {
      res.render('register', { err: req.query.err });
    } else {
      res.render('register', { err: null });
    }
  } else {
    res.redirect('/');
  }
});
router.get('/login', async function (req, res, next) {
  if (req.session.Role == null) {
    if (req.query.err != null) {
      res.render('login', { err: req.query.err });
    } else {
      res.render('login', { err: null });
    }
  } else {
    res.redirect('/');
  }
});
router.post('/register', async function (req, res, next) {
  let akunfind = await akun.find({ "username": req.body.name });
  if (akunfind.length == 1) {
    res.redirect('/register?err=akun');
  } else {
    let passenc = crypto.createHash('sha256').update(req.body.pass).digest('hex');
    new akun({
      username: req.body.name,
      password: passenc,
      role: "user"
    }).save();
    res.redirect('/login');
  }
});
router.post('/login', async function (req, res, next) {
  let passenc = crypto.createHash('sha256').update(req.body.pass).digest('hex');
  let akunfind = await akun.find({ "username": req.body.name, "password": passenc });
  if (akunfind.length == 1 && akunfind[0].del == null) {
    if (akunfind[0].accept != null) {
      req.session.Nama = req.body.name;
      req.session.Role = akunfind[0].role;
      res.redirect('/');
    } else {
      res.redirect('/login?err=accept');
    }
  } else {
    res.redirect('/login?err=akun');
  }
});
router.get('/logout', async function(req, res, next) {
  req.session.Nama = null;
  req.session.Role = null;
  res.redirect('/');
});
router.get('/ganti', async function (req, res, next) {
  if (req.session.Role == null) {
    if (req.query.err != null) {
      res.render('ganti', { err: req.query.err });
    } else {
      res.render('ganti', { err: null });
    }
  } else {
    res.redirect('/');
  }
});
router.post('/ganti', async function (req, res, next) {
  let passenc = crypto.createHash('sha256').update(req.body.pass1).digest('hex');
  let akunfind = await akun.find({ "username": req.body.name, "password": passenc });
  if (akunfind.length == 1) {
    let passenc = crypto.createHash('sha256').update(req.body.pass2).digest('hex');
    await akun.findByIdAndUpdate(akunfind[0]._id, {
      password: passenc
    });
    res.redirect('/login');
  } else {
    res.redirect('/ganti?err=akun');
  }
});
router.post('/edit/:id', async function (req, res, next) {
  let genreArr = req.body.genre.split(',');
  let today = new Date(); 
  await buku.findByIdAndUpdate(req.params.id, {
    judul: req.body.judul,
    penulis: req.body.penulis,
    penerbit: req.body.penerbit,
    tahun_terbit: req.body.tahun_terbit,
    edisi: req.body.edisi,
    sinopsis: req.body.sinopsis,
    genre: genreArr,
    isbn: req.body.isbn,
    stok: req.body.stok,
    isi: req.body.isi,
    date: today
  });
  res.redirect('/isi/'+req.params.id);
});
router.post('/pinjam/:id', async function (req, res, next) {
  let today = new Date();
  let akunfind = await akun.find({ "username": req.session.Nama });
  let pinjaman = await pinjam.find({ "user_id": akunfind[0]._id, "status": "Sedang Dipinjam" });
  if (pinjaman.length <= 4) {
    let stok = await buku.find({ "_id": req.params.id });
    if(stok[0].stok - 1 >= 0) {
      await buku.findByIdAndUpdate(req.params.id, {
        stok: stok[0].stok - 1
      });
      new pinjam({
        user_id: akunfind[0]._id,
        buku_id: req.params.id,
        date_pinjam: today,
        lama: req.body.lama,
        date_kembali: null,
        status: "Sedang Dipinjam"
      }).save();
      res.redirect('/isi/' + req.params.id);
    } else {
      let doublewait = await pinjam.find({ "user_id": akunfind[0]._id, "buku_id": req.params.id, "status": "Waiting List" });
      if (doublewait.length == 0) {
        new pinjam({
          user_id: akunfind[0]._id,
          buku_id: req.params.id,
          date_pinjam: today,
          lama: req.body.lama,
          date_kembali: null,
          status: "Waiting List"
        }).save();
      }
      res.redirect('/isi/' + req.params.id + '?err=stok');
    }
  } else {
    res.redirect('/isi/' + req.params.id + '?err=pinjam');
  }
});
router.get('/kembali/:id', async function (req, res, next) {
  if (req.session.Role != null) {
    let today = new Date();
    let akunfind = await akun.find({ "username": req.session.Nama });
    let pinjamfind = await pinjam.find({ "user_id": akunfind[0]._id, "buku_id": req.params.id });
    let datepinjam = new Date(pinjamfind[pinjamfind.length - 1].date_pinjam);
    let hari = Math.abs((today.getTime() - datepinjam.getTime()) / (1000 * 3600 * 24));
    let stok = await buku.find({ "_id": req.params.id });
    await buku.findByIdAndUpdate(req.params.id, {
      stok: stok[0].stok + 1
    });
    if (hari <= pinjamfind[pinjamfind.length - 1].lama) {
      await pinjam.findByIdAndUpdate(pinjamfind[pinjamfind.length - 1]._id, {
        date_kembali: today,
        status: "Tepat Waktu"
      });
    } else {
      await pinjam.findByIdAndUpdate(pinjamfind[pinjamfind.length - 1]._id, {
        date_kembali: today,
        status: "Terlambat"
      });
    }
    let waitinglist = await pinjam.find({ "status": "Waiting List", "buku_id": req.params.id });
    if (waitinglist.length > 0) {
      await buku.findByIdAndUpdate(req.params.id, {
        stok: stok[0].stok
      });
      await pinjam.findByIdAndUpdate(waitinglist[0]._id, {
        date_pinjam: today,
        status: "Sedang Dipinjam"
      });
    }
    res.redirect('/isi/' + req.params.id);
  } else {
    res.redirect('/');
  }
});
router.get('/src/:field/:search', async function(req, res, next) {
  const { field, search } = req.params;
  try {
    let result;
    switch (field) {
      case "judul":
        result = await buku.find({ 'judul': { $regex: search }, "del": null });
        break;
      case "penulis":
        result = await buku.find({ 'penulis': { $regex: search }, "del": null });
        break;
      case "penerbit":
        result = await buku.find({ 'penerbit': { $regex: search }, "del": null });
        break;
      case "tahunterbit":
        const tahunTerbit = parseInt(search);
        result = await buku.find({ 'tahun_terbit': tahunTerbit, "del": null });
        break;
      case "genre":
        result = await buku.find({ 'genre': { $regex: search }, "del": null });
        break;
      default:
        return res.status(400).json({ error: "Invalid field" });
    }
    res.json(result);
  } catch(error) {
    return next(error);
  }
});
router.get('/create', async function (req, res, next) {
  if (req.session.Role == "admin") {
    res.render('createbuku');
  } else {
    res.redirect('/');
  }
});
router.post('/create', async function (req, res, next) {
  let today = new Date();
  let genreArr = req.body.genre.split(',');
  new buku({
    judul: req.body.judul,
    penulis: req.body.penulis,
    penerbit: req.body.penerbit,
    tahun_terbit: req.body.tahun_terbit,
    edisi: req.body.edisi,
    sinopsis: req.body.sinopsis,
    genre: genreArr,
    isbn: req.body.isbn,
    stok: req.body.stok,
    isi: req.body.isi,
    date: today
  }).save();
  res.redirect('/');
});
router.get('/delbuku/:id', async function (req, res, next) {
  if (req.session.Role == "admin") {
    await buku.findByIdAndUpdate(req.params.id, {
      del: 1
    });
    let pinjams = await pinjam.find({ "buku_id": req.params.id, "status": "Sedang Dipinjam" });
    if (pinjams.length > 0) {
      let today = new Date();
      pinjams.forEach(async function (pinjams) {
        await pinjam.findByIdAndUpdate(pinjams._id, {
          date_kembali: today,
          status: "Tepat Waktu"
        });
      });
    }
  }
  res.redirect('/');
});
router.get('/akun', async function (req, res, next) {
  if (req.session.Role == "admin") {
    res.render('akun', { akun: await akun.find(), akunacc: await akun.find({ "accept": null }) });
  } else {
    res.redirect('/');
  }
});
router.get('/accakun/:id', async function (req, res, next) {
  if (req.session.Role == "admin") {
    await akun.findByIdAndUpdate(req.params.id, {
      accept: 1
    });
    res.redirect('/akun');
  } else {
    res.redirect('/');
  }
});
router.post('/updakun', async function (req, res, next) {
  await akun.findByIdAndUpdate(req.body.id, {
    username: req.body.username,
    password: req.body.password,
    role: req.body.role
  });
  res.redirect('/akun');
});
router.get('/delakunhard/:id', async function (req, res, next) {
  if (req.session.Role == "admin") {
    await akun.findByIdAndDelete(req.params.id);
    res.redirect('/akun');
  } else {
    res.redirect('/');
  }
});
router.get('/delakun/:id', async function (req, res, next) {
  if (req.session.Role == "admin") {
    await akun.findByIdAndUpdate(req.params.id, {
      del: 1
    });
    let pinjams = await pinjam.find({ "user_id": req.params.id, "status": "Sedang Dipinjam" });
    if (pinjams.length > 0) {
      let today = new Date();
      pinjams.forEach(async function (pinjams) {
        await pinjam.findByIdAndUpdate(pinjams._id, {
          date_kembali: today,
          status: "Tepat Waktu"
        });
      });
    }
    res.redirect('/akun');
  } else {
    res.redirect('/');
  }
});
router.get('/delcomment/:id', async function (req, res, next) {
  if (req.session.Role == "admin") {
    await komentar.findByIdAndDelete(req.params.id);
    res.redirect('/isi/' + req.query.id);
  } else {
    res.redirect('/');
  }
});
router.post('/addcomment/:id', async function (req, res, next) {
  let today = new Date();
  let komentarfind = await komentar.find({ "user_id": req.session.Nama, "buku_id": req.params.id });
  if (komentarfind.length == 0) {
    new komentar({
      user_id: req.session.Nama,
      buku_id: req.params.id,
      text: req.body.komentar,
      date: today
    }).save();
  } else {
    await komentar.findOneAndUpdate({ "user_id": req.session.Nama, "buku_id": req.params.id }, {
      text: req.body.komentar,
      date: today
    });
  }
  res.redirect('/isi/'+req.params.id);
});
router.get('/pinjaman', async function (req, res, next) {
  if (req.session.Role == "admin") {
    let pinjamdata = await pinjam.aggregate([
      {
        $addFields: {
          buku_id: { $toObjectId: "$buku_id" },
          user_id: { $toObjectId: "$user_id" }
        }
      },
      {
        $lookup:
        {
          from: 'bukus',
          localField: 'buku_id',
          foreignField: '_id',
          as: 'buku'
        }
      },
      {
        $lookup:
        {
          from: 'akuns',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);
    res.render('pinjaman', { pinjam: pinjamdata });
  } else {
    res.redirect('/');
  }
});

module.exports = router;