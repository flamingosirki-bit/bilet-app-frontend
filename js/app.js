const API_BASE = "https://bilet-app-backend-1.onrender.com";

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

const rows = Array.from({length:10}, (_,i)=>String.fromCharCode(65+i));
const seatsPerRow = 10;

// -------- LOGIN --------
loginBtn.onclick = async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const res = await fetch(`${API_BASE}/login`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if(!data.userId) return alert(data.message);

  userId = data.userId;
  bonusText.innerText = data.bonus;

  loginWrapper.style.display="none";
  appWrapper.style.display="block";

  createSeats();
  loadSeatStatus();
  setInterval(loadSeatStatus,3000);
};

// -------- SEATS --------
function createSeats(){
  seatWrapper.innerHTML="";
  rows.forEach(r=>{
    const row = document.createElement("div");
    row.className="row";
    for(let i=1;i<=seatsPerRow;i++){
      const seat = document.createElement("div");
      seat.className="seat free";
      seat.dataset.id = `${r}${i}`;
      seat.onclick = ()=>toggleSeat(seat);
      row.appendChild(seat);
    }
    seatWrapper.appendChild(row);
  });
}

async function toggleSeat(seat){
  if(seat.classList.contains("sold") || seat.classList.contains("locked")) return;

  const id = seat.dataset.id;
  const selected = seat.classList.contains("selected");

  const url = selected ? "/unlock-seats" : "/lock-seats";

  const res = await fetch(API_BASE+url,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ selectedSeats:[id], userId })
  });

  const data = await res.json();

  if(selected){
    seat.className="seat free";
    cart = cart.filter(s=>s!==id);
  }else if(data.lockedSeats?.includes(id)){
    seat.className="seat selected";
    cart.push(id);
  }
}

// -------- STATUS --------
async function loadSeatStatus(){
  const res = await fetch(`${API_BASE}/seats-status`);
  const data = await res.json();

  document.querySelectorAll(".seat").forEach(seat=>{
    const id = seat.dataset.id;
    if(data.soldSeats.includes(id)) seat.className="seat sold";
    else if(data.lockedSeats[id] && data.lockedSeats[id].userId!==userId)
      seat.className="seat locked";
  });
}

// -------- CHECKOUT --------
checkoutBtn.onclick = async ()=>{
  if(cart.length===0) return alert("Sepet boş");

  const res = await fetch(`${API_BASE}/checkout`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ userId, cart })
  });

  const data = await res.json();
  alert("Satın alındı: "+data.purchased.join(", "));
  cart=[];
  loadSeatStatus();
};
