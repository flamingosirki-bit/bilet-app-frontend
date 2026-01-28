// ------------------ CONFIG ------------------
const API_BASE_URL = "https://bilet-app-backend-1.onrender.com";
const userId = "user_" + Math.floor(Math.random() * 100000); // her kullanıcı farklı

// ------------------ DOM ------------------
const seatWrapper = document.getElementById("seatWrapper");
const checkoutBtn = document.getElementById("checkoutBtn");
const bonusText = document.getElementById("bonusText");

// ------------------ SEAT CONFIG ------------------
const rows = [];
for (let i = 0; i < 30; i++) {
  rows.push(i < 26 ? String.fromCharCode(65 + i) : "A" + String.fromCharCode(65 + i - 26));
}
const seatsPerRow = 30;

let cart = [];
let bonusRemaining = 0;

// ------------------ CREATE SEATS ------------------
rows.forEach(row => {
  const rowDiv = document.createElement("div");
  rowDiv.className = "row";

  for (let i = 1; i <= seatsPerRow; i++) {
    const seat = document.createElement("button");
    seat.className = "seat free";
    seat.dataset.id = `${row}${i}`;
    seat.dataset.bonus = "0";

    seat.addEventListener("click", async () => {
      if (seat.classList.contains("sold") || seat.classList.contains("locked")) return;

      const isSelected = seat.classList.contains("selected");

      try {
        // -------- UNLOCK --------
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
          }
        }

        // -------- LOCK --------
        else {
          const isBonus = bonusRemaining > 0;
          const res = await fetch(`${API_BASE_URL}/lock-seats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              selectedSeats: [seat.dataset.id],
              userId,
              isBonus
            })
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
          }
        }
      } catch (err) {
        console.error(err);
        alert("Sunucu hatası");
      }
    });

    rowDiv.appendChild(seat);
  }

  seatWrapper.appendChild(rowDiv);
});

// ------------------ LOAD SEAT STATUS ------------------
async function loadSeatStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/seats-status`);
    const data = await res.json();

    // Sold
    data.soldSeats.forEach(id => {
      const seat = document.querySelector(`.seat[data-id='${id}']`);
      if (seat) {
        seat.className = "seat sold";
      }
    });

    // Locked
    Object.entries(data.lockedSeats).forEach(([id, info]) => {
      const seat = document.querySelector(`.seat[data-id='${id}']`);
      if (!seat) return;

      if (info.userId !== userId) {
        seat.className = "seat locked";
      } else {
        seat.className = "seat selected";
        if (!cart.includes(id)) cart.push(id);
      }
    });

  } catch (err) {
    console.error("Seat status error", err);
  }
}

loadSeatStatus();
setInterval(loadSeatStatus, 5000);

// ------------------ CHECKOUT ------------------
checkoutBtn.addEventListener("click", async () => {
  if (cart.length === 0) return alert("Sepet boş");

  try {
    const res = await fetch(`${API_BASE_URL}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cart })
    });
    const data = await res.json();

    if (data.purchased?.length) {
      bonusRemaining += data.purchased.length;
      bonusText.innerText = bonusRemaining;
      cart = [];
      loadSeatStatus();
      alert("Satın alma başarılı ✅");
    }
  } catch (err) {
    console.error(err);
    alert("Ödeme hatası");
  }
});
