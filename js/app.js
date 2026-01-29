

const API_BASE_URL = "https://bilet-app-backend-1.onrender.com";

const loginWrapper = document.getElementById("loginWrapper");
const appWrapper = document.getElementById("appWrapper");
const seatWrapper = document.getElementById("seatWrapper");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const bonusText = document.getElementById("bonusText");

let userId = null;
let cart = [];
let bonusRemaining = 0;

const rows = [];
for (let i = 0; i < 30; i++) rows.push(i < 26 ? String.fromCharCode(65 + i) : "A" + String.fromCharCode(65 + i - 26));
const seatsPerRow = 30;

// CREATE SEATS
function createSeats() {
  seatWrapper.innerHTML = "";
  rows.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";
    for (let i = 1; i <= seatsPerRow; i++) {
      const seat = document.createElement("button");
      seat.className = "seat free";
      seat.dataset.id = `${row}${i}`;
      seat.dataset.bonus = "0";
      seat.addEventListener("click", handleSeatClick);
      rowDiv.appendChild(seat);
    }
    seatWrapper.appendChild(rowDiv);
  });
}

// HANDLE SEAT CLICK
async function handleSeatClick(e) {
  const seat = e.target;
  if (!userId) return;

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
        if (seat.dataset.bonus === "1") { bonusRemaining++; bonusText.innerText = bonusRemaining; }
        seat.dataset.bonus = "0";
      }
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
        if (isBonus) { bonusRemaining--; bonusText.innerText = bonusRemaining; }
      }
    }
  } catch (err) { console.error(err); alert("Sunucu hatası"); }
}

// LOAD SEAT STATUS
async function loadSeatStatus() {
  if (!userId) return;

  try {
    const res = await fetch(`${API_BASE_URL}/seats-status`);
    const data = await res.json();

    data.soldSeats.forEach(id => {
      const seat = document.querySelector(`.seat[data-id='${id}']`);
      if (seat) seat.className = "seat sold";
    });

    Object.entries(data.lockedSeats).forEach(([id, info]) => {
      const seat = document.querySelector(`.seat[data-id='${id}']`);
      if (!seat) return;
      if (info.userId !== userId) seat.className = "seat locked";
      else { seat.className = "seat selected"; if (!cart.includes(id)) cart.push(id); }
    });
  } catch (err) { console.error("Seat status error", err); }
}

// CHECKOUT
checkoutBtn.addEventListener("click", async () => {
  if (!userId) return alert("Giriş yapmalısınız");
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
  } catch (err) { console.error(err); alert("Ödeme hatası"); }
});

// LOGIN
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert("Email ve şifre gerekli");

  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.userId) {
      userId = data.userId;
      loginWrapper.style.display = "none";
      bonusRemaining = data.bonus || 0;
      bonusText.innerText = bonusRemaining;
      loadSeatStatus();
      setInterval(loadSeatStatus, 5000);
    } else alert(data.message || "Giriş başarısız");
  } catch (err) { console.error(err); alert("Sunucu hatası"); }
});

// SAYFA AÇILIRKEN
createSeats();
