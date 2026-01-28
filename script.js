const API_BASE_URL = "https://bilet-app-backend-1.onrender.com";
const seatWrapper = document.getElementById("seatWrapper");
const checkoutBtn = document.getElementById("checkoutBtn");
const bonusText = document.getElementById("bonusText");
const userId = "user1";

const rows = [];
for (let i = 0; i < 30; i++) {
  rows.push(i < 26 ? String.fromCharCode(65 + i) : "A" + String.fromCharCode(65 + i - 26));
}
const seatsPerRow = 30;

let cart = [];
let bonusRemaining = 0;

// Koltukları oluştur
rows.forEach(row => {
  for (let i = 1; i <= seatsPerRow; i++) {
    const seat = document.createElement("button");
    seat.className = "seat free";
    seat.dataset.id = `${row}${i}`;
    seat.dataset.bonus = "0";
    seat.innerText = "";

    seat.addEventListener("click", async () => {
      if (seat.classList.contains("sold") || seat.classList.contains("locked")) return;

      const isSelected = seat.classList.contains("selected");

      try {
        if (isSelected) {
          const res = await fetch(`${API_BASE_URL}/unlock-seats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedSeats: [seat.dataset.id], userId })
          });
          const data = await res.json();
          if (data.unlockedSeats?.includes(seat.dataset.id)) {
            seat.classList.remove("selected");
            seat.classList.add("free");
            cart = cart.filter(s => s !== seat.dataset.id);
            if (seat.dataset.bonus === "1") {
              bonusRemaining++;
              bonusText.innerText = bonusRemaining;
            }
            seat.dataset.bonus = "0";
          } else alert("Koltuk iptal edilemedi!");
        } else {
          const isBonus = bonusRemaining > 0;
          const res = await fetch(`${API_BASE_URL}/lock-seats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedSeats: [seat.dataset.id], userId, isBonus })
          });
          const data = await res.json();
          if (data.lockedSeats?.includes(seat.dataset.id)) {
            seat.classList.add("selected");
            seat.classList.remove("free");
            cart.push(seat.dataset.id);
            seat.dataset.bonus = isBonus ? "1" : "0";
            if (isBonus) {
              bonusRemaining--;
              bonusText.innerText = bonusRemaining;
            }
          } else alert("Koltuk seçilemedi!");
        }
      } catch (err) {
        console.error("Koltuk işlemi hatası:", err);
        alert("Backend bağlantı hatası!");
      }
    });

    seatWrapper.appendChild(seat);
  }
});

// Koltuk durumunu yükle
async function loadSeatStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/seats-status`);
    const data = await res.json();

    data.soldSeats.forEach(id => {
      const seatBtn = document.querySelector(`.seat[data-id='${id}']`);
      if (seatBtn) {
        seatBtn.classList.remove("free", "selected");
        seatBtn.classList.add("sold");
      }
    });

    Object.entries(data.lockedSeats).forEach(([id, info]) => {
      const seatBtn = document.querySelector(`.seat[data-id='${id}']`);
      if (!seatBtn) return;

      if (info.userId !== userId) seatBtn.classList.add("locked");
      else {
        seatBtn.classList.add("selected");
        if (!cart.includes(id)) cart.push(id);
      }
    });
  } catch (err) {
    console.error("Koltuğu yükleme hatası:", err);
  }
}

loadSeatStatus();
setInterval(loadSeatStatus, 5000);

// Checkout
checkoutBtn.addEventListener("click", async () => {
  if (cart.length === 0) { alert("Sepetiniz boş!"); return; }

  try {
    const res = await fetch(`${API_BASE_URL}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cart })
    });
    const data = await res.json();

    if (data.purchased?.length > 0) {
      data.purchased.forEach(id => {
        const seatBtn = document.querySelector(`.seat[data-id='${id}']`);
        if (seatBtn) {
          seatBtn.classList.remove("selected");
          seatBtn.classList.add("sold");
        }
      });
      bonusRemaining += data.purchased.length;
      cart = [];
      bonusText.innerText = bonusRemaining;
      alert(`Satın alma başarılı ✅ Bonus: ${bonusRemaining}`);
    } else alert("Ödeme sırasında hata oluştu!");
  } catch (err) {
    console.error(err);
    alert("Ödeme başarısız!");
  }
});
