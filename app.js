// ====== CONFIG ======
// 1) Paste your Make webhook URL here (Make -> Webhooks -> Custom webhook).
// Example: https://hook.us1.make.com/xxxxxxxxxxxxxxxxxxxxxxxx
const API_URL = "https://order-proxy.empanadissima-prueba.workers.dev";

// 2) Currency formatting (CLP looks like $3.900). Change if you want.
const CURRENCY = "CLP";
const LOCALE = "es-CL";

// 3) Products: edit this list (id must be unique).
// Tip: You can keep placeholder images while testing.
const PRODUCTS = [
  { id: "pino", name: "Empanada de Pino", price: 3900, image: "./images/imagen_testing.png" },
  { id: "huevoqueso", name: "Empanada Huevo-Queso", price: 2900, image: "./images/imagen_testing.png" },
  { id: "polloqueso", name: "Empanada Pollo-Queso", price: 1900, image: "./images/imagen_testing.png" },
  { id: "pino1", name: "Empanada de Pino1", price: 3900, image: "./images/imagen_testing.png" },
  { id: "huevoqueso1", name: "Empanada Huevo-Queso1", price: 2900, image: "./images/imagen_testing.png" },
  { id: "polloqueso1", name: "Empanada Pollo-Queso1", price: 1900, image: "./images/imagen_testing.png" },
  // Add more here...
];

// Quantity limits
const MIN_QTY = 0;
const MAX_QTY = 2000;
// Order rules
const MIN_TOTAL_ITEMS = 10;


// Note limits
const MAX_NOTE_LENGTH = 200;
const NOTE_WARN_AT = 180; // when counter turns orange

const MAX_TEXT_LENGTH = 78;
const TEXT_WARN_AT = 65;


// ====== STATE ======
/** cart: Map productId -> quantity */
const cart = new Map();


// ====== HELPERS ======
function formatMoney(value){
  // CLP has no cents; Intl will format nicely.
  try{
    return new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 }).format(value);
  } catch {
    // Fallback
    return "$" + String(value);
  }
}

function normalizeChilePhone(input) {
  if (!input) return null;

  // Remove everything except digits
  let digits = input.replace(/\D/g, "");

  // If starts with 56, keep it
  if (digits.startsWith("56")) {
    digits = digits.slice(2);
  }

  // If starts with 9 and has 9 digits → OK
  if (digits.startsWith("9") && digits.length === 9) {
    return "+56" + digits;
  }

  // If user typed only the last 8 digits → assume mobile
  if (digits.length === 8) {
    return "+569" + digits;
  }

  // Invalid
  return null;
}

function clamp(n, lo, hi){
  return Math.max(lo, Math.min(hi, n));
}

function cartCount(){
  let count = 0;
  for (const qty of cart.values()) count += qty;
  return count;
}

function cartSubtotal(){
  let sum = 0;
  for (const p of PRODUCTS){
    const qty = cart.get(p.id) || 0;
    sum += qty * p.price;
  }
  return sum;
}

function cartItemsArray(){
  return PRODUCTS
    .map(p => ({...p, qty: cart.get(p.id) || 0}))
    .filter(x => x.qty > 0)
    .map(x => ({
      id: x.id,
      name: x.name,
      qty: x.qty,
      price: x.price,
      subtotal: x.qty * x.price
    }));
}


// ====== RENDER ======
const productGrid = document.getElementById("productGrid");
const cartItemsEl = document.getElementById("cartItems");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");
const cartCountBadge = document.getElementById("cartCountBadge");
const statusEl = document.getElementById("status");

const checkoutForm = document.getElementById("checkoutForm");
const submitBtn = checkoutForm?.querySelector('button[type="submit"]');

function updateMinOrderUI() {
  const totalItems = cartCount();

  // Enable/disable button based on rule
  if (submitBtn) {
    submitBtn.disabled = totalItems < MIN_TOTAL_ITEMS;
  }

  // Show a message when there are some items but not enough
  if (totalItems > 0 && totalItems < MIN_TOTAL_ITEMS) {
    statusEl.className = "status err";
    statusEl.textContent =
      `Tu pedido debe contener ${MIN_TOTAL_ITEMS} o más productos (actualmente: ${totalItems}).`;
  } else {
    // Clear only this specific message
    if (statusEl.textContent.includes("Tu pedido debe contener")) {
      statusEl.className = "status";
      statusEl.textContent = "";
    }
  }
}


function renderProducts(){
  productGrid.innerHTML = "";

  for (const p of PRODUCTS){
    const qty = cart.get(p.id) || 0;

    const card = document.createElement("div");
    card.className = "card";

    const imgWrap = document.createElement("div");
    imgWrap.className = "img";
    const img = document.createElement("img");
    img.alt = p.name;
    img.loading = "lazy";
    img.src = p.image;
    imgWrap.appendChild(img);

    const body = document.createElement("div");
    body.className = "body";

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = p.name;

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = formatMoney(p.price);

    const qtyRow = document.createElement("div");
    qtyRow.className = "qty";

    const controls = document.createElement("div");
    controls.className = "qtyControls";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", `Quantity for ${p.name}`);

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.addEventListener("click", () => setQty(p.id, (cart.get(p.id) || 0) - 1));

    const value = document.createElement("div");
    value.className = "qtyValue";
    value.textContent = String(qty);

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.addEventListener("click", () => setQty(p.id, (cart.get(p.id) || 0) + 1));

    controls.appendChild(minus);
    controls.appendChild(value);
    controls.appendChild(plus);

    qtyRow.appendChild(controls);

    body.appendChild(name);
    body.appendChild(price);
    body.appendChild(qtyRow);

    card.appendChild(imgWrap);
    card.appendChild(body);

    productGrid.appendChild(card);
  }
}

function renderCart(){
  const items = cartItemsArray();
  cartItemsEl.innerHTML = "";

  if (items.length === 0){
    const empty = document.createElement("div");
    empty.className = "muted small";
    empty.textContent = "El carro está vacío, agrega productos desde la lista.";
    cartItemsEl.appendChild(empty);
  } else {
    for (const it of items){
      const wrap = document.createElement("div");
      wrap.className = "cartItem";

      const top = document.createElement("div");
      top.className = "cartItemTop";

      const left = document.createElement("div");
      const nm = document.createElement("div");
      nm.className = "cartItemName";
      nm.textContent = it.name;
      const meta = document.createElement("div");
      meta.className = "cartItemMeta";
      meta.textContent = `${formatMoney(it.price)} c/u`;
      left.appendChild(nm);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.style.textAlign = "right";
      right.innerHTML = `<div class="cartItemName">${formatMoney(it.subtotal)}</div>
                         <div class="cartItemMeta">${it.qty} unid.</div>`;

      top.appendChild(left);
      top.appendChild(right);

      const qtyRow = document.createElement("div");
      qtyRow.className = "cartItemQtyRow";

      const controls = document.createElement("div");
      controls.className = "qtyControls";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      minus.addEventListener("click", () => setQty(it.id, (cart.get(it.id) || 0) - 1));

      const value = document.createElement("div");
      value.className = "qtyValue";
      value.textContent = String(it.qty);

      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.addEventListener("click", () => setQty(it.id, (cart.get(it.id) || 0) + 1));

      controls.appendChild(minus);
      controls.appendChild(value);
      controls.appendChild(plus);

      qtyRow.appendChild(controls);

      wrap.appendChild(top);
      wrap.appendChild(qtyRow);
      cartItemsEl.appendChild(wrap);
    }

  }

  const subtotal = cartSubtotal();
  subtotalEl.textContent = formatMoney(subtotal);
  totalEl.textContent = formatMoney(subtotal); // same (no tax/shipping here)
  cartCountBadge.textContent = String(cartCount());
  
  updateMinOrderUI();


}

function renderAll(){
  renderProducts();
  renderCart();
}


// ====== ACTIONS ======
function setQty(productId, qty){
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  const q = clamp(qty, MIN_QTY, MAX_QTY);
  if (q <= 0) cart.delete(productId);
  else cart.set(productId, q);

  renderAll();
}

function clearCart(){
  cart.clear();
  renderAll();
}


// ====== SUBMIT ORDER ======
async function submitOrder(evt){
  evt.preventDefault();
  statusEl.className = "status";
  statusEl.textContent = "";

  const items = cartItemsArray();
  if (items.length === 0){
    statusEl.className = "status err";
    statusEl.textContent = "Agrega al menos un producto antes de enviar el pedido.";
    return;
  }
  
  const totalItems = cartCount();
  
  if (totalItems < MIN_TOTAL_ITEMS) {
    statusEl.className = "status err";
    statusEl.textContent =
      `El pedido mínimo es de ${MIN_TOTAL_ITEMS} productos, actualmente tienes ${totalItems}.`;
    return;
  }


  const name = document.getElementById("customerName").value.trim();
  const rawPhone = document.getElementById("customerPhone").value.trim();
  const phone = normalizeChilePhone(rawPhone);
  const address = document.getElementById("customerAddress").value.trim();

  let note = document.getElementById("customerNote").value.trim();
  if (note.length > MAX_NOTE_LENGTH) {
    note = note.slice(0, MAX_NOTE_LENGTH);
  }
  
  if (!name || !address){
    statusEl.className = "status err";
    statusEl.textContent = "Por favor ingresa tu nombre y dirección.";
    return;
  }
  
  if (!phone){
    statusEl.className = "status err";
    statusEl.textContent =
      "Por favor ingresa un número móvil chileno válido (ejemplo: +56912345678).";
    return;
  }

  const orderId = "ORD-" + Date.now();
  
  const timestampCL = new Date().toLocaleString("sv-SE", {
    timeZone: "America/Santiago"
  });

  const payload = {
    orderId,
    name,
    phone,
    address,
    note: note || "",
    currency: CURRENCY,
    locale: LOCALE,
    items,
    subtotal: cartSubtotal(),
    total: cartSubtotal(),
    timestampUTC: new Date().toISOString(),
    timestampCL: timestampCL
  };

  try{
    statusEl.textContent = "Enviando…";
    if (submitBtn) submitBtn.disabled = true;

    
    if (!API_URL) {
      statusEl.className = "status err";
      statusEl.textContent = "La URL del servidor no está configurada.";
      return;
    }
    
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      // Mensaje especial para límite de solicitudes
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        statusEl.className = "status err";
        statusEl.textContent = retryAfter
          ? `Has realizado demasiadas solicitudes. Por favor espera ${retryAfter} segundos e inténtalo nuevamente.`
          : "Has realizado demasiadas solicitudes. Por favor espera un momento e inténtalo nuevamente.";
        return; // no lanzar error, solo mostrar el mensaje
      }
      // Error genérico para otros códigos
      const txt = await res.text().catch(() => "");
      throw new Error(`La API respondió con el código ${res.status}. ${txt}`.trim());
    }
    
    statusEl.className = "status ok";
    statusEl.textContent = "¡Pedido enviado! ✅";
    clearCart();
    evt.target.reset();
    if (counterEl) {
      counterEl.textContent = `0 / ${MAX_NOTE_LENGTH}`;
      counterEl.classList.remove("warn", "danger");
    }
    if (noteEl) noteEl.style.height = "auto";

  } catch (err){
    statusEl.className = "status err";
    statusEl.textContent = "Error al enviar el pedido. Revisa el Worker de Cloudflare y el escenario de Make.";
    console.error(err);
  } finally {
    updateMinOrderUI();
  }


}


// ====== UI ======
document.getElementById("clearCartBtn").addEventListener("click", clearCart);
document.getElementById("checkoutForm").addEventListener("submit", submitOrder);

// Note counter + warning colors + auto-resize
const noteEl = document.getElementById("customerNote");
const counterEl = document.getElementById("noteCounter");


if (noteEl && counterEl) {
  const updateNoteUI = () => {
    const len = noteEl.value.length;

    counterEl.textContent = `${len} / ${MAX_NOTE_LENGTH}`;
    counterEl.classList.remove("warn", "danger");

    if (len >= NOTE_WARN_AT && len < MAX_NOTE_LENGTH) counterEl.classList.add("warn");
    if (len >= MAX_NOTE_LENGTH) counterEl.classList.add("danger");

    noteEl.style.height = "auto";
    noteEl.style.height = noteEl.scrollHeight + "px";
  };

  noteEl.addEventListener("input", updateNoteUI);
  updateNoteUI(); // initialize on load
}

// Name + Address counters
const nameEl = document.getElementById("customerName");
const nameCounterEl = document.getElementById("nameCounter");

const addressEl = document.getElementById("customerAddress");
const addressCounterEl = document.getElementById("addressCounter");

function attachTextCounter(inputEl, counterEl) {
  if (!inputEl || !counterEl) return;

  const updateUI = () => {
    const len = inputEl.value.length;

    counterEl.textContent = `${len} / ${MAX_TEXT_LENGTH}`;
    counterEl.classList.remove("warn", "danger");

    if (len >= TEXT_WARN_AT && len < MAX_TEXT_LENGTH) counterEl.classList.add("warn");
    if (len >= MAX_TEXT_LENGTH) counterEl.classList.add("danger");
  };

  inputEl.addEventListener("input", updateUI);
  updateUI(); // initialize on load
}

// Attach counters
attachTextCounter(nameEl, nameCounterEl);
attachTextCounter(addressEl, addressCounterEl);


// Mobile cart toggle (optional)
const cartPanel = document.getElementById("cartPanel");
const toggleCartBtn = document.getElementById("toggleCartBtn");
toggleCartBtn.addEventListener("click", () => {
  const expanded = toggleCartBtn.getAttribute("aria-expanded") === "true";
  toggleCartBtn.setAttribute("aria-expanded", String(!expanded));
  cartPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Initial render
renderAll();
