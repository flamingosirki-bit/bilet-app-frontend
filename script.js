const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());

// ⚡ CORS ayarı: frontend URL ve lokal test portu
app.use(cors({
  origin: [
    'https://bilet-app-frontend-1.onrender.com',
    'http://localhost:5173'
  ]
}));

// ------------------------
// Global veri (hafızada tutuyor)
// ------------------------
let soldSeats = [];    // Satılmış koltuklar
let lockedSeats = [];  // Kullanıcıların geçici kilitlediği koltuklar

// ------------------------
// GET / → test için
// ------------------------
app.get('/', (req, res) => {
  res.send('Bilet App Backend çalışıyor!');
});

// ------------------------
// GET /seats-status → satılmış ve kilitli koltukları döndür
// ------------------------
app.get('/seats-status', (req, res) => {
  res.json({ soldSeats, lockedSeats });
});

// ------------------------
// POST /lock-seats → koltuk kilitleme
// ------------------------
app.post('/lock-seats', (req, res) => {
  const { selectedSeats, userId, isBonus } = req.body;

  // Geçerli koltukları filtrele (satılmış olanlar kilitlenemez)
  const lockableSeats = selectedSeats.filter(id => 
    !soldSeats.includes(id) && !lockedSeats.includes(id)
  );

  // Kilitlenen koltukları lockedSeats listesine ekle
  lockedSeats = lockedSeats.concat(lockableSeats);

  // Dönüş: hangi koltuklar gerçekten kilitlendi
  res.json({ lockedSeats: lockableSeats });
});

// ------------------------
// POST /checkout → satın alma
// ------------------------
app.post('/checkout', (req, res) => {
  const { userId, cart } = req.body;

  // Sepetteki koltukları satılmış olarak işaretle
  const purchased = cart.filter(id => !soldSeats.includes(id));
  soldSeats = soldSeats.concat(purchased);

  // Kilitli listeden kaldır
  lockedSeats = lockedSeats.filter(id => !purchased.includes(id));

  // Bonus simülasyonu: her satın alma +1 bonus
  const bonusGained = purchased.length;

  res.json({ purchased, bonusGained });
});

// ------------------------
// Render uyumlu port
// ------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server çalışıyor → http://localhost:${PORT}`));
