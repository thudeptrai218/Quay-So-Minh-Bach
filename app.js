const storageKey = "xoSoNangCapState";

let state = {
  round: 1,
  daQuay: false,
  soTrung: null,
  winner: null,
  players: [],
  history: []
};

let nameNguoiChoi = "";
let soVeConLai = 0;
let soDaMua = [];

function $(id) {
  return document.getElementById(id);
}

function padNumber(number) {
  return String(number).padStart(2, "0");
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state = {
      ...state,
      ...parsed,
      players: Array.isArray(parsed.players) ? parsed.players : [],
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch (err) {
    console.error("Khong the doc du lieu da luu:", err);
  }
}

function setStatus(message) {
  $("veStatus").innerText = message;
}

function updateSummary() {
  $("roundText").innerText = state.round;
  $("ticketText").innerText = state.players.reduce((total, player) => total + player.cacSo.length, 0);
  $("playerText").innerText = state.players.length;
  $("statusText").innerText = state.daQuay ? "Da quay" : "Dang mo ban";
}

function createPlayerCode(name) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 7);
  return `${name}_${timestamp}_${random}`;
}

function startBuying() {
  if (state.daQuay) {
    alert("Vong nay da quay. Hay reset de bat dau vong moi.");
    return;
  }

  nameNguoiChoi = $("nameInput").value.trim();
  const quantity = Number.parseInt($("veInput").value.trim(), 10);

  if (!nameNguoiChoi || Number.isNaN(quantity) || quantity <= 0) {
    alert("Nhap dung ten va so luong ve.");
    return;
  }

  soVeConLai = quantity;
  soDaMua = [];
  $("daMuaList").innerHTML = "";
  setStatus(`Con ${soVeConLai} ve can ghi so cho ${nameNguoiChoi}.`);
}

function buyTicket() {
  if (state.daQuay) {
    alert("Vong nay da quay. Hay reset de mua ve vong moi.");
    return;
  }

  if (!nameNguoiChoi || soVeConLai <= 0) {
    alert("Bam Bat dau mua ve truoc.");
    return;
  }

  const number = Number.parseInt($("numberInput").value.trim(), 10);

  if (Number.isNaN(number) || number < 0 || number > 99) {
    alert("Nhap so tu 00 den 99.");
    return;
  }

  if (soDaMua.includes(number)) {
    alert("Nguoi choi nay da chon so nay trong luot mua hien tai.");
    return;
  }

  let player = state.players.find((item) => item.ten === nameNguoiChoi);
  if (!player) {
    player = {
      ma: createPlayerCode(nameNguoiChoi),
      ten: nameNguoiChoi,
      cacSo: []
    };
    state.players.push(player);
  }

  player.cacSo.push(number);
  soDaMua.push(number);
  soVeConLai -= 1;

  const li = document.createElement("li");
  li.innerText = `So: ${padNumber(number)}`;
  $("daMuaList").appendChild(li);

  $("numberInput").value = "";
  $("numberInput").focus();

  setStatus(soVeConLai > 0
    ? `Con ${soVeConLai} ve can ghi so cho ${nameNguoiChoi}.`
    : `Da ghi du ${soDaMua.length} ve cho ${nameNguoiChoi}.`);

  saveState();
  updateSummary();
  listPlayers();
}

function listPlayers() {
  const ul = $("playerList");
  ul.innerHTML = "";

  if (state.players.length === 0) {
    ul.innerHTML = "<li>Chua co nguoi choi nao.</li>";
    return;
  }

  state.players.forEach((player) => {
    const numbers = player.cacSo.map(padNumber).join(", ");
    const li = document.createElement("li");
    li.innerText = `${player.ten} - Ma: ${player.ma} - So da mua: [${numbers}]`;
    ul.appendChild(li);
  });
}

function findWinners(winningNumber) {
  const winners = [];

  state.players.forEach((player) => {
    const matchedNumbers = player.cacSo.filter((number) => number === winningNumber);
    matchedNumbers.forEach(() => {
      winners.push({
        ma: player.ma,
        ten: player.ten,
        so: winningNumber
      });
    });
  });

  return winners;
}

function drawAndSpin() {
  if (state.players.length === 0) {
    alert("Can co it nhat 1 ve de quay.");
    return;
  }

  if (state.daQuay) {
    alert("Vong nay da quay roi. Hay reset de quay vong moi.");
    return;
  }

  const spinner = $("spinner");
  let current = 0;
  let spins = 0;
  const winningNumber = Math.floor(Math.random() * 100);

  $("resultText").innerText = "Dang quay...";

  const interval = setInterval(() => {
    spinner.innerText = padNumber(current);
    current = (current + 1) % 100;
    spins += 1;

    if (spins >= 45) {
      clearInterval(interval);
      finishDraw(winningNumber);
    }
  }, 45);
}

function finishDraw(winningNumber) {
  const winners = findWinners(winningNumber);
  const winnerText = winners.length > 0
    ? winners.map((winner) => `${winner.ten} (${winner.ma})`).join(", ")
    : "";

  state.daQuay = true;
  state.soTrung = winningNumber;
  state.winner = winnerText || null;
  state.history.unshift({
    round: state.round,
    soTrung: winningNumber,
    winner: winnerText,
    thoiGian: new Date().toLocaleString()
  });

  state.history = state.history.slice(0, 30);

  $("spinner").innerText = padNumber(winningNumber);
  $("resultText").innerText = winnerText
    ? `Nguoi thang: ${winnerText}`
    : "Khong co nguoi thang.";

  saveState();
  updateSummary();
  xemLichSu();
}

function xemLichSu() {
  const ul = $("historyList");
  ul.innerHTML = "";

  if (state.history.length === 0) {
    ul.innerHTML = "<li>Chua co lich su quay so.</li>";
    return;
  }

  state.history.forEach((item) => {
    const li = document.createElement("li");
    li.innerText = `${item.thoiGian} - Vong ${item.round} - So ${padNumber(item.soTrung)} - ${item.winner || "Khong ai trung"}`;
    ul.appendChild(li);
  });
}

function reset() {
  if (!confirm("Reset vong hien tai va bat dau vong moi?")) return;

  state.round += 1;
  state.daQuay = false;
  state.soTrung = null;
  state.winner = null;
  state.players = [];

  nameNguoiChoi = "";
  soVeConLai = 0;
  soDaMua = [];

  $("nameInput").value = "";
  $("veInput").value = "";
  $("numberInput").value = "";
  $("daMuaList").innerHTML = "";
  $("spinner").innerText = "--";
  $("resultText").innerText = "Chua quay so.";

  setStatus("Da reset sang vong moi.");
  saveState();
  updateSummary();
  listPlayers();
}

function clearHistory() {
  if (!confirm("Xoa toan bo lich su quay so?")) return;

  state.history = [];
  saveState();
  xemLichSu();
}

window.addEventListener("load", () => {
  loadState();
  updateSummary();
  listPlayers();
  xemLichSu();

  if (state.daQuay && state.soTrung !== null) {
    $("spinner").innerText = padNumber(state.soTrung);
    $("resultText").innerText = state.winner
      ? `Nguoi thang: ${state.winner}`
      : "Khong co nguoi thang.";
  }
});
