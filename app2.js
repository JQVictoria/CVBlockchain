// --- Date & Time updater ---
function updateDateTime() {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  );
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  
  const dtElement = document.getElementById("datetime");
  if (dtElement) {
    dtElement.textContent = `${dayName}, ${date} ${month} ${year} (${hh}:${mm}:${ss} WIB)`;
  }
}
setInterval(updateDateTime, 1000);
updateDateTime();

// --- SHA-256 helper ---
async function sha256(msg) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(msg));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Navigation ---
function showPage(pageId) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".navbar button")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  document
    .getElementById("tab-" + pageId.split("-")[1])
    .classList.add("active");
    
  // Panggil update dashboard saat tab-nya diklik
  if (pageId === "page-dashboard") {
    updateDashboard();
  }
}
document.getElementById("tab-home").onclick = () => showPage("page-home");
document.getElementById("tab-about").onclick = () => showPage("page-about");
document.getElementById("tab-hash").onclick = () => showPage("page-hash");
document.getElementById("tab-block").onclick = () => showPage("page-block");
document.getElementById("tab-chain").onclick = () => showPage("page-chain");
document.getElementById("tab-dashboard").onclick = () => showPage("page-dashboard");

// ▼▼▼ TAMBAHAN BARU UNTUK CARD MODUL ▼▼▼
document.getElementById("goto-hash").onclick = () => showPage("page-hash");
document.getElementById("goto-block").onclick = () => showPage("page-block");
document.getElementById("goto-chain").onclick = () => showPage("page-chain");
document.getElementById("goto-dashboard").onclick = () => showPage("page-dashboard");
// ▲▲▲ BATAS TAMBAHAN ▲▲▲

// --- Hash Page ---
document.getElementById("hash-input").addEventListener("input", async (e) => {
  document.getElementById("hash-output").textContent = await sha256(
    e.target.value
  );
});

// --- Single Block Page ---
const blockNumber = document.getElementById("block-number");
const blockData = document.getElementById("block-data");
const blockNonce = document.getElementById("block-nonce");
const blockTimestamp = document.getElementById("block-timestamp");
const blockHash = document.getElementById("block-hash");
const speedControl = document.getElementById("speed-control");
const miningStatus = document.getElementById("mining-status");
let mining = false;

blockNonce.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, "");
  updateBlockHash();
});
async function updateBlockHash() {
  const number = blockNumber.value || "0";
  const data = blockData.value;
  const nonce = blockNonce.value || "0";
  const timestamp = blockTimestamp.value || "";
  const input = number + data + timestamp + nonce;
  blockHash.textContent = await sha256(input);
}
blockData.addEventListener("input", updateBlockHash);
blockNumber.addEventListener("input", updateBlockHash);

document.getElementById("btn-mine").addEventListener("click", async () => {
  if (mining) return;
  const number = blockNumber.value.trim() || "0";
  const data = blockData.value.trim();
  if (!data) {
    alert("Isi data terlebih dahulu sebelum mining!");
    return;
  }
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
  });
  blockTimestamp.value = timestamp;
  blockHash.textContent = "";
  blockNonce.value = "0";
  let nonce = 0;
  mining = true;
  const difficulty = "0000"; // Ini difficulty untuk single block
  const baseBatch = 1000;
  const speedMultiplier = parseInt(speedControl.value);
  const batchSize = baseBatch * speedMultiplier;
  miningStatus.textContent = "Mining dimulai...";
  const startTime = performance.now();
  async function mineBatch() {
    for (let i = 0; i < batchSize; i++) {
      const input = number + data + timestamp + nonce;
      const h = await sha256(input);
      if (h.startsWith(difficulty)) {
        blockNonce.value = nonce;
        blockHash.textContent = h;
        mining = false;
        const durasi = ((performance.now() - startTime) / 1000).toFixed(2);
        miningStatus.textContent = `Selesai! Nonce: ${nonce}, waktu: ${durasi} detik.`;
        return true;
      }
      nonce++;
    }
    blockNonce.value = nonce;
    miningStatus.textContent = `Mining... Nonce: ${nonce.toLocaleString()}`;
    return false;
  }
  async function mine() {
    const done = await mineBatch();
    if (!done && mining) requestAnimationFrame(mine);
  }
  mine();
});

// --- Blockchain Page ---
const gDifficulty = "0000"; // Definisikan difficulty secara global untuk chain
const ZERO_HASH = "0".repeat(64);
let blocks = []; // Ini adalah "Database" simulasi kita
const chainDiv = document.getElementById("blockchain");

function renderChain() {
  chainDiv.innerHTML = "";
  blocks.forEach((blk, i) => {
    const div = document.createElement("div");
    div.className = "blockchain-block";
    div.innerHTML = `
<h3>Block #${blk.index}</h3>
<label>Previous Hash:</label>
<div class="output" id="prev-${i}">${blk.previousHash}</div>
<label>Data:</label>
<textarea rows="3" id="data-${i}">${blk.data}</textarea>
<label>Timestamp:</label>
<div class="output" id="timestamp-${i}">${blk.timestamp}</div>
<label>Nonce:</label>
<div class="output" id="nonce-${i}">${blk.nonce}</div>
<label>Hash:</label>
<div class="output" id="hash-${i}">${blk.hash}</div>
<button id="mine-${i}" class="mine">Mine Block</button>
<div id="status-${i}" class="status"></div>
`;
    chainDiv.appendChild(div);
    
    // Listener untuk data diubah -> invalidate block
    document.getElementById(`data-${i}`).addEventListener("input", (e) => {
      blocks[i].data = e.target.value;
      blocks[i].hash = ""; // Invalidate block
      blocks[i].timestamp = "";
      blocks[i].nonce = 0;
      document.getElementById(`hash-${i}`).textContent = "";
      updateDashboard(); // Perbarui dashboard jika data diubah
    });
    
    // Listener tombol mine
    document.getElementById(`mine-${i}`).addEventListener("click", () => {
      mineChainBlock(i);
    });
  });
  
  // Kunci field data jika block sudah valid
  blocks.forEach((blk, i) => {
    if (blk.hash && blk.hash.startsWith(gDifficulty)) {
      const dataField = document.getElementById(`data-${i}`);
      if (dataField) dataField.readOnly = true;
    }
  });
}

function addChainBlock() {
  const idx = blocks.length;
  const prev = idx ? blocks[idx - 1].hash || ZERO_HASH : ZERO_HASH;
  const blk = {
    index: idx,
    data: "",
    previousHash: prev,
    timestamp: "",
    nonce: 0,
    hash: "",
  };
  blocks.push(blk);
  renderChain();
  updateDashboard(); // Update dashboard saat blok baru ditambah
  chainDiv.scrollLeft = chainDiv.scrollWidth;
}

async function mineChainBlock(i) {
  const blk = blocks[i];
  const prev = blk.previousHash;
  const data = blk.data;
  const timeDiv = document.getElementById(`timestamp-${i}`);
  const nonceDiv = document.getElementById(`nonce-${i}`);
  const hashDiv = document.getElementById(`hash-${i}`);
  const statusDiv = document.getElementById(`status-${i}`);
  blk.nonce = 0;
  blk.timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
  });
  timeDiv.textContent = blk.timestamp;
  hashDiv.textContent = "";
  statusDiv.textContent = "Mining dimulai...";
  const difficulty = gDifficulty; // Pakai global difficulty
  const baseBatch = 1000;
  const batchSize = baseBatch * 10;
  const startTime = performance.now();
  async function mineBatch() {
    for (let j = 0; j < batchSize; j++) {
      const input = blk.index + prev + data + blk.timestamp + blk.nonce;
      const h = await sha256(input);
      if (h.startsWith(difficulty)) {
        blk.hash = h;
        hashDiv.textContent = h;
        document.getElementById(`data-${i}`).readOnly = true;
        const durasi = ((performance.now() - startTime) / 1000).toFixed(2);
        statusDiv.textContent = `Selesai! Nonce: ${blk.nonce}, waktu: ${durasi} detik.`;
        // Update previous hash di blok selanjutnya JIKA ada
        if (blocks[i + 1]) {
          blocks[i + 1].previousHash = blk.hash;
          renderChain(); // Render ulang untuk update prev hash
        }
        updateDashboard(); // Update dashboard saat mining selesai
        return true;
      }
      blk.nonce++;
    }
    nonceDiv.textContent = blk.nonce;
    statusDiv.textContent = `Mining... Nonce: ${blk.nonce.toLocaleString()}`;
    return false;
  }
  async function mine() {
    const done = await mineBatch();
    if (!done) requestAnimationFrame(mine);
  }
  mine();
}

// --- Simulation Dashboard Page ---
function checkChainValidity() {
  if (blocks.length === 0) return true; // Rantai kosong dianggap valid
  
  for (let i = 1; i < blocks.length; i++) {
    const currentBlock = blocks[i];
    const previousBlock = blocks[i-1];
    
    // Cek 1: Hash block sebelumnya tidak cocok
    if (currentBlock.previousHash !== previousBlock.hash) {
      return false;
    }
    // Cek 2: Hash block ini tidak valid (belum di-mine)
    if (!currentBlock.hash.startsWith(gDifficulty)) {
      return false;
    }
  }
  
  // Cek block genesis (block #0)
  if (!blocks[0].hash || !blocks[0].hash.startsWith(gDifficulty)) {
    return false;
  }
  
  return true;
}

function updateDashboard() {
  const totalBlocks = blocks.length;
  const lastBlock = totalBlocks > 0 ? blocks[blocks.length - 1] : null;
  const isValid = checkChainValidity();
  
  document.getElementById("db-total-blocks").textContent = totalBlocks;
  
  const hashText = lastBlock && lastBlock.hash ? lastBlock.hash : (totalBlocks > 0 ? "N/A (Blok terakhir belum di-mine)" : "N/A");
  document.getElementById("db-last-hash").textContent = hashText;
  
  const validDiv = document.getElementById("db-chain-valid");
  if (isValid) {
    validDiv.textContent = "✅ Rantai Valid";
    validDiv.className = "valid"; // Tambah class untuk styling
  } else {
    validDiv.textContent = "❌ Rantai Tidak Valid!";
    validDiv.className = "invalid"; // Tambah class untuk styling
  }
  
  document.getElementById("db-difficulty").textContent = gDifficulty;
}

// --- Init ---
document.getElementById("btn-add-block").onclick = addChainBlock;
addChainBlock(); // Mulai dengan 1 blok