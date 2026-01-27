// ------------------ CONFIG ------------------ //
const API_BASE_URL = "https://bilet-app-backend-1.onrender.com"; 
console.log("SCRIPT LOADED FROM RENDER");

// ------------------ DOM ELEMENTS ------------------ //
const seatWrapper = document.getElementById("seatWrapper");
const checkoutBtn = document.getElementById("checkoutBtn");
const bonusText = document.getElementById("bonusText");
const userId = "user1"; // Örnek kullanıcı

// ------------------ SEAT SETUP ------------------ //
const rows = [];
for (let i = 0; i < 30; i++) {
  rows.push(i < 26 ? String.fromCharCode(65 + i) : "A" + String.fromCharCode(65 + i - 26));
}
const seatsPerRow = 30;

let cart = [];
let bonusRemaining = 0;

// ------------------ CREATE SEATS ------------------ //
rows.forEach(row => {
  const rowDiv = document.createElement("div");
  rowDiv.className = "row";

  for (let i = 1; i <= seatsPerRow; i++) {
    const seat = document.createElement("button");
    seat.className = "seat free";
    seat.dataset.id = `${row}${i}`;
    seat.innerText = ""; 

    seat.addEventListener("click", async () => {
      if (seat.classList.contains("sold")) return;

    // Deselect
if (seat.classList.contains("selected")) {
  try {
    const response = await fetch(`${API_BASE_URL}/unlock-seats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedSeats: [seat.dataset.id], userId })
    });

    const data = await response.json();
    console.log("Unlocked seats:", data.unlockedSeats);

    seat.classList.remove("selected");
    seat.classList.add("free");
    cart = cart.filter(s => s !== seat.dataset.id);

    if (seat.dataset.bonus === "1") {
      bonusRemaining++;
      bonusText.innerText = bonusRemaining;
    }
    seat.dataset.bonus = "0";

  } catch (err) {
    console.error("Koltuk iptal hatası:", err);
    alert("Koltuk iptali başarısız!");
  }
  return;
}


      const isBonus = bonusRemaining > 0;

      try {
        const response = await fetch(`${API_BASE_URL}/lock-seats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedSeats: [seat.dataset.id], userId, isBonus })
        });

        const data = await response.json();

        if (data.lockedSeats.includes(seat.dataset.id)) {
          seat.classList.add("selected");
          seat.classList.remove("free");
          seat.dataset.bonus = isBonus ? "1" : "0";
          cart.push(seat.dataset.id);

          if (isBonus) {
            bonusRemaining--;
            bonusText.innerText = bonusRemaining;
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

// ------------------ LOAD SEAT STATUS ------------------ //
async function loadSeatStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/seats-status`);
    const data = await response.json();

    // Satılmış koltuklar
    data.soldSeats.forEach(id => {
      const seatBtn = document.querySelector(`.seat[data-id='${id}']`);
      if (seatBtn) seatBtn.classList.add("sold");
    });

    // Kilitli/selected koltuklar
    data.lockedSeats.forEach(id => {
      const seatBtn = document.querySelector(`.seat[data-id='${id}']`);
      if (seatBtn) seatBtn.classList.add("selected");
      if (!cart.includes(id)) cart.push(id);
    });
  } catch (err) {
    console.error("Koltuğu yükleme hatası:", err);
  }
}

// İlk yükleme ve her 5 saniyede bir güncelle
loadSeatStatus();
setInterval(loadSeatStatus, 5000);

// ------------------ CHECKOUT ------------------ //
checkoutBtn.addEventListener("click", async () => {
  if (cart.length === 0) { alert("Sepetiniz boş!"); return; }

  try {
    const response = await fetch(`${API_BASE_URL}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cart })
    });

    const data = await response.json();

    if (data.purchased?.length > 0) {
      data.purchased.forEach(id => {
        const seatBtn = document.querySelector(`.seat[data-id='${id}']`);
        if (seatBtn) { seatBtn.classList.remove("selected"); seatBtn.classList.add("sold"); }
      });
      bonusRemaining += data.purchased.length;
      cart = [];
      bonusText.innerText = bonusRemaining;
      alert(`Satın alma başarılı ✅ Bonus: ${bonusRemaining}`);
    } else {
      alert("Ödeme sırasında hata oluştu!");
    }
  } catch (err) {
    console.error(err);
    alert("Ödeme başarısız!");
  }
});
