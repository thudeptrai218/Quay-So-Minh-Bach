const ticketKey = "quaySoMinhBachTickets";
const historyKey = "quaySoMinhBachHistory";

let tickets = [];

function $(id) {
  return document.getElementById(id);
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Không thể đọc dữ liệu đã lưu:", error);
    return fallback;
  }
}

function saveTickets() {
  localStorage.setItem(ticketKey, JSON.stringify(tickets));
}

function saveHistory(history) {
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 30)));
}

function setMessage(message, isError = false) {
  const element = $("message");
  element.innerText = message;
  element.style.color = isError ? "#b42318" : "#0f766e";
}

function showWinnerModal(winningNumber, winnerText) {
  $("winnerModalNumber").innerText = padNumber(winningNumber);
  $("winnerModalName").innerText = winnerText;
  $("winnerModal").classList.add("is-open");
  $("winnerModal").setAttribute("aria-hidden", "false");
  $("winnerCloseButton").focus();
}

function closeWinnerModal() {
  $("winnerModal").classList.remove("is-open");
  $("winnerModal").setAttribute("aria-hidden", "true");
}

function updateMetrics(lastNumber = null) {
  $("ticketCount").innerText = tickets.length;
  $("demoStatus").innerText = tickets.length > 0 ? "Sẵn sàng quay" : "Đang nhận vé";

  if (lastNumber !== null) {
    $("lastNumber").innerText = padNumber(lastNumber);
  }
}

function createEmptyItem(text) {
  const item = document.createElement("li");
  item.innerText = text;
  return item;
}

function renderTickets() {
  const list = $("ticketList");
  list.replaceChildren();

  if (tickets.length === 0) {
    list.appendChild(createEmptyItem("Chưa có vé nào."));
    updateMetrics();
    return;
  }

  tickets.forEach((ticket, index) => {
    const item = document.createElement("li");
    const content = document.createElement("span");
    const removeButton = document.createElement("button");

    content.innerText = `${index + 1}. ${ticket.name} - Số ${padNumber(ticket.number)}`;
    removeButton.type = "button";
    removeButton.className = "small danger";
    removeButton.innerText = "Xóa";
    removeButton.addEventListener("click", () => removeTicket(index));

    item.append(content, removeButton);
    list.appendChild(item);
  });

  updateMetrics();
}

function renderHistory() {
  const history = readJson(historyKey, []);
  const list = $("historyList");
  list.replaceChildren();

  if (history.length === 0) {
    list.appendChild(createEmptyItem("Chưa có lịch sử quay."));
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");
    li.innerText = `${item.time} - Số trúng: ${padNumber(item.winningNumber)} - ${item.winner || "Không có người trúng"}`;
    list.appendChild(li);
  });
}

function parseNumberInput() {
  const rawNumber = $("numberInput").value.trim();

  if (!/^\d{1,2}$/.test(rawNumber)) {
    return null;
  }

  const number = Number.parseInt(rawNumber, 10);
  return number >= 0 && number <= 99 ? number : null;
}

function addTicket() {
  const name = $("nameInput").value.trim();
  const number = parseNumberInput();

  if (!name) {
    setMessage("Vui lòng nhập tên người chơi.", true);
    $("nameInput").focus();
    return;
  }

  if (number === null) {
    setMessage("Vui lòng nhập số từ 00 đến 99.", true);
    $("numberInput").focus();
    return;
  }

  tickets.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name,
    number,
    createdAt: new Date().toISOString()
  });

  $("numberInput").value = "";
  $("numberInput").focus();
  setMessage(`Đã thêm vé số ${padNumber(number)} cho ${name}.`);
  saveTickets();
  renderTickets();
}

function removeTicket(index) {
  const [ticket] = tickets.splice(index, 1);
  saveTickets();
  renderTickets();
  setMessage(`Đã xóa vé số ${padNumber(ticket.number)} của ${ticket.name}.`);
}

function secureRandomNumber() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % 100;
}

function drawLottery() {
  if (tickets.length === 0) {
    setMessage("Cần có ít nhất 1 vé để quay.", true);
    return;
  }

  const winningNumber = secureRandomNumber();
  const winners = tickets.filter((ticket) => ticket.number === winningNumber);
  const winnerText = winners.length > 0
    ? winners.map((winner) => winner.name).join(", ")
    : "";

  $("winningNumber").innerText = padNumber(winningNumber);
  $("resultText").innerText = winnerText
    ? `Người trúng thưởng: ${winnerText}`
    : "Không có người trúng thưởng.";

  const history = readJson(historyKey, []);
  history.unshift({
    time: new Date().toLocaleString("vi-VN"),
    winningNumber,
    winner: winnerText
  });

  saveHistory(history);
  updateMetrics(winningNumber);
  renderHistory();
  setMessage("Đã quay xong và lưu vào lịch sử.");

  if (winnerText) {
    showWinnerModal(winningNumber, winnerText);
  }
}

function resetTickets() {
  if (!confirm("Xóa tất cả vé hiện tại?")) return;

  tickets = [];
  saveTickets();
  $("winningNumber").innerText = "--";
  $("lastNumber").innerText = "--";
  $("resultText").innerText = "Chưa quay.";
  setMessage("Đã xóa toàn bộ vé hiện tại.");
  renderTickets();
}

function clearHistory() {
  if (!confirm("Xóa toàn bộ lịch sử quay?")) return;

  localStorage.removeItem(historyKey);
  renderHistory();
  setMessage("Đã xóa lịch sử quay.");
}

function bindEvents() {
  $("addTicketButton").addEventListener("click", addTicket);
  $("drawButton").addEventListener("click", drawLottery);
  $("resetTicketsButton").addEventListener("click", resetTickets);
  $("clearHistoryButton").addEventListener("click", clearHistory);
  $("winnerCloseButton").addEventListener("click", closeWinnerModal);
  $("winnerModal").addEventListener("click", (event) => {
    if (event.target === $("winnerModal")) {
      closeWinnerModal();
    }
  });

  $("numberInput").addEventListener("input", (event) => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 2);
  });

  $("numberInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addTicket();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $("winnerModal").classList.contains("is-open")) {
      closeWinnerModal();
    }
  });
}

window.addEventListener("load", () => {
  tickets = readJson(ticketKey, []);
  bindEvents();
  renderTickets();
  renderHistory();
  updateMetrics();
});
