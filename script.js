const seatWrapper = document.getElementById("seatWrapper");
const checkoutBtn = document.getElementById("checkoutBtn");
const bonusText = document.getElementById("bonusText"); // opsiyonel olarak bonus gösterimi
const userId = "user1";

// 30 satır: A-Z + AA-AD
const rows = [];
for (let i = 0; i < 30; i++) {
  if (i < 26) rows.push(String.fromCharCode(65 + i));
  else rows.push("A" + String.fromCharCode(65 + i - 26));
}
const seatsPerRow = 30;

// Sepet ve bonus durumu
let cart = [];
let bonusRemaining = 0;

// 1️⃣ Koltukları oluştur
rows.forEach(row => {
  const rowDiv = document.createElement("div");
  rowDiv.className = "row";

  for (let i = 1; i <= seatsPerRow; i++) {
    const seat = document.createElement("button");
    seat.className = "seat free";
    seat.dataset.id = `${row}${i}`;
    seat.innerText = "";

    // Tıklama eventi
    seat.addEventListener("click", async () => {
      if (seat.classList.contains("sold")) return;

      // Seçimi iptal etme
      if (seat.classList.contains("selected")) {
        seat.classList.remove("selected");
        seat.classList.add("free");

        // Sepetten çıkar
        cart = cart.filter(s => s !== seat.dataset.id);

        // Bonus geri geliyorsa
        if (seat.dataset.bonus === "1") {
          bonusRemaining++;
          if (bonusText) bonusText.innerText = bonusRemaining;
        }
        seat.dataset.bonus = "0";
        return;
      }

      // Bonus seçimi mi?
      const isBonus = bonusRemaining > 0;

      try {
        const response = await fetch("http://localhost:3000/lock-seats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedSeats: [seat.dataset.id],
            userId,
            isBonus
          })
        });

        const data = await response.json();

        if (data.lockedSeats.includes(seat.dataset.id)) {
          seat.classList.add("selected");
          seat.classList.remove("free");

          seat.dataset.bonus = isBonus ? "1" : "0";

          cart.push(seat.dataset.id);

          if (isBonus) {
            bonusRemaining--;
            if (bonusText) bonusText.innerText = bonusRemaining;
            alert(`Bonus koltuk seçildi! Kalan bonus: ${bonusRemaining}`);
          }
        } else {
          alert(`${seat.dataset.id} koltuğu seçilemedi!`);
        }

      } catch (err) {
        console.error(err);
        alert("Backend bağlantı hatası!");
      }
    });

    rowDiv.appendChild(seat);
  }

  seatWrapper.appendChild(rowDiv);
});

// 2️⃣ Sayfa açılır açılmaz backend’den durumları yükle
async function loadSeatStatus() {
  try {
    const response = await fetch("http://localhost:3000/seats-status");
    const data = await response.json();

    data.soldSeats.forEach(id => {
      const seatBtn = document.querySelector(`.seat[data-id='${id}']`);
      if (seatBtn) {
        seatBtn.classList.remove("free", "selected");
        seatBtn.classList.add("sold");
      }
    });

    data.lockedSeats.forEach(id => {
      const seatBtn = document.querySelector(`.seat[data-id='${id}']`);
      if (seatBtn) {
        seatBtn.classList.remove("free", "sold");
        seatBtn.classList.add("selected");
        cart.push(id); // Sepete ekle
      }
    });

  } catch (err) {
    console.error("Koltuğu yükleme hatası:", err);
  }
}
loadSeatStatus();

// 3️⃣ Checkout / Ödeme simülasyonu
checkoutBtn.addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Sepetiniz boş!");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cart })
    });

    const data = await response.json();

    if (data.purchased && data.purchased.length > 0) {
      data.purchased.forEach(id => {
        const seatBtn = document.querySelector(`.seat[data-id='${id}']`);
        if (seatBtn) {
          seatBtn.classList.remove("selected");
          seatBtn.classList.add("sold");
        }
      });

      bonusRemaining += data.purchased.length; // her satın alınan koltuk için 1 bonus
      cart = [];
      if (bonusText) bonusText.innerText = bonusRemaining;

      alert(`Satın alma başarılı ✅ Bonus hakkınız: ${bonusRemaining}`);
    } else {
      alert("Ödeme sırasında hata oluştu!");
    }

  } catch (err) {
    console.error(err);
    alert("Ödeme başarısız!");
  }
});
