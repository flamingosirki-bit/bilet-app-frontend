const seatWrapper = document.getElementById("seatWrapper");
const checkoutBtn = document.getElementById("checkoutBtn");
const bonusText = document.getElementById("bonusText");
const userId = "user1"; // Örnek kullanıcı

const rows = [];
for (let i = 0; i < 30; i++) {
  rows.push(i < 26 ? String.fromCharCode(65 + i) : "A" + String.fromCharCode(65 + i - 26));
}
const seatsPerRow = 30;

let cart = [];
let bonusRemaining = 0;

// Koltukları oluştur
rows.forEach(row => {
  const rowDiv = document.createElement("div");
  rowDiv.className = "row";

  for (let i = 1; i <= seatsPerRow; i++) {
    const seat = document.createElement("button");
    seat.className = "seat free";
    seat.dataset.id = `${row}${i}`;
    seat.dataset.bonus = "0";

    seat.addEventListener("click", () => {
      if (seat.classList.contains("sold") || seat.classList.contains("locked")) return;

      const isSelected = seat.classList.contains("selected");

      if (isSelected) {
        seat.classList.remove("selected");
        seat.classList.add("free");
        cart = cart.filter(s => s !== seat.dataset.id);
        if (seat.dataset.bonus === "1") { bonusRemaining++; bonusText.innerText = bonusRemaining; }
        seat.dataset.bonus = "0";
      } else {
        const isBonus = bonusRemaining > 0;
        seat.classList.add("selected");
        seat.classList.remove("free");
        cart.push(seat.dataset.id);
        seat.dataset.bonus = isBonus ? "1" : "0";
        if (isBonus) { bonusRemaining--; bonusText.innerText = bonusRemaining; }
      }
    });

    rowDiv.appendChild(seat);
  }

  seatWrapper.appendChild(rowDiv);
});

// Checkout
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) { alert("Sepetiniz boş!"); return; }
  alert(`Satın alındı: ${cart.join(", ")}`);
  cart.forEach(id => {
    const seatBtn = document.querySelector(`.seat[data-id='${id}']`);
    if (seatBtn) { seatBtn.classList.remove("selected"); seatBtn.classList.add("sold"); }
  });
  cart = [];
});
