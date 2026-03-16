// ====== CONFIG ======
// 1) Paste the Make webhook URL here (Make -> Webhooks -> Custom webhook).
// Example: https://hook.us1.make.com/xxxxxxxxxxxxxxxxxxxxxxxx
const API_URL = "https://order-proxy.empanadissima-prueba.workers.dev";

// 2) Currency formatting (CLP looks like $3.900).
const CURRENCY = "CLP";
const LOCALE = "es-CL";

// 3) Products: edit this list (id must be unique).
const PRODUCTS = [
  { id: "10", name: "Empanada de Mechada Tradicional", price: 1900, image: "./images/MECHADA FONDO NARANJO.jpg", category: "Tradicional" },
  { id: "11", name: "Empanada de Pastelera Tradicional", price: 1900, image: "./images/PASTELERA FONDO NARANJO.jpg", category: "Tradicional" },
  { id: "12", name: "Empanada de Pino Tradicional", price: 1900, image: "./images/PINO FONDO NARANJO.jpg", category: "Tradicional" },
  { id: "13", name: "Empanada de Pollo-Huevo Tradicional", price: 1900, image: "./images/POLLO HUEVO FONDO NARANJO.jpg", category: "Tradicional" },
  { id: "14", name: "Empanada de Pollo-Queso Tradicional", price: 1900, image: "./images/POLLO QUESO FONDO NARANJO.jpg", category: "Tradicional" },
  { id: "15", name: "Empanada de Malaya de Vacuno Tradicional", price: 1900, image: "./images/MALAYA FONDO NARANJO.jpg", category: "Tradicional" },
  { id: "17", name: "Empanada Napolitana Tradicional", price: 1900, image: "./images/NAPOLITANA FONDO NARANJO.jpg", category: "Tradicional" },
  { id: "16", name: "Empanada Vegetariana Tradicional", price: 1900, image: "./images/VEGETARIANA FONDO NARANJO.jpg", category: "Tradicional" },
  { id: "18", name: "Empanada de Manzana", price: 1000, image: "./images/MANZANA FONDO NARANJO.jpeg", category: "Tradicional" },
  { id: "38", name: "Chaparrita Queso", price: 1500, image: "./images/PRODUCTO SIN IMAGEN.jpg", category: "Otros" },
  { id: "40", name: "Pan Campesino", price: 1700, image: "./images/PRODUCTO SIN IMAGEN.jpg", category: "Otros" },
  { id: "39", name: "Pan Hallulla", price: 1600, image: "./images/PRODUCTO SIN IMAGEN.jpg", category: "Otros" },
  { id: "20", name: "Empanada de Mechada Midi", price: 750, image: "./images/MECHADA FONDO NARANJO.jpg", category: "Midi" },
  { id: "28", name: "Empanada de Pastelera Midi", price: 750, image: "./images/PASTELERA FONDO NARANJO.jpg", category: "Midi" },
  { id: "29", name: "Empanada de Pino Tradicional Midi", price: 750, image: "./images/PINO FONDO NARANJO.jpg", category: "Midi" },
  { id: "30", name: "Empanada de Pollo-Huevo Midi", price: 750, image: "./images/POLLO HUEVO FONDO NARANJO.jpg", category: "Midi" },
  { id: "31", name: "Empanada de Pollo-Queso Midi", price: 750, image: "./images/POLLO QUESO FONDO NARANJO.jpg", category: "Midi" },
  { id: "32", name: "Empanada de Malaya de Vacuno Midi", price: 750, image: "./images/MALAYA FONDO NARANJO.jpg", category: "Midi" },
  { id: "34", name: "Empanada Napolitana Midi", price: 750, image: "./images/NAPOLITANA FONDO NARANJO.jpg", category: "Midi" },
  { id: "33", name: "Empanada Vegetariana Midi", price: 750, image: "./images/VEGETARIANA FONDO NARANJO.jpg", category: "Midi" },
  { id: "19", name: "Empanada de Mechada Cóctel", price: 500, image: "./images/MECHADA FONDO NARANJO.jpg", category: "Cóctel" },
  { id: "21", name: "Empanada de Pastelera Cóctel", price: 500, image: "./images/PASTELERA FONDO NARANJO.jpg", category: "Cóctel" },
  { id: "22", name: "Empanada de Pino Tradicional Cóctel", price: 500, image: "./images/PINO FONDO NARANJO.jpg", category: "Cóctel" },
  { id: "23", name: "Empanada de Pollo-Huevo Cóctel", price: 500, image: "./images/POLLO HUEVO FONDO NARANJO.jpg", category: "Cóctel" },
  { id: "24", name: "Empanada de Pollo-Queso Cóctel", price: 500, image: "./images/POLLO QUESO FONDO NARANJO.jpg", category: "Cóctel" },
  { id: "25", name: "Empanada de Malaya de Vacuno Cóctel", price: 500, image: "./images/MALAYA FONDO NARANJO.jpg", category: "Cóctel" },
  { id: "27", name: "Empanada Napolitana Cóctel", price: 500, image: "./images/NAPOLITANA FONDO NARANJO.jpg", category: "Cóctel" },
  { id: "26", name: "Empanada Vegetariana Cóctel", price: 500, image: "./images/VEGETARIANA FONDO NARANJO.jpg", category: "Cóctel" },
  // Add more here...
];

// Quantity limits
const MIN_QTY = 0;
const MAX_QTY = 999;
// Order rules
const MIN_TOTAL_ITEMS = 1;


// Note limits
const MAX_NOTE_LENGTH = 200;
const NOTE_WARN_AT = 180; // when counter turns orange

const MAX_TEXT_LENGTH = 78;
const TEXT_WARN_AT = 65;


// ====== STATE ======
/** cart: Map productId -> quantity */
const cart = new Map();

/** productIds that currently have an empty qty input */
const invalidQty = new Set();

let currentCategory = "Tradicional"; // default best-seller
let submitting = false;



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
    .filter(x => x.qty > 0 || invalidQty.has(x.id))
    .map(x => ({
      id: x.id,
      name: x.name,
      qty: x.qty,
      price: x.price,
      subtotal: (x.qty > 0 ? x.qty : 0) * x.price
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

const catTabs = document.querySelectorAll(".catTab");

function setActiveCategory(cat){
  currentCategory = cat;
  
  catTabs.forEach(btn => {
    const isActive = btn.dataset.cat === cat;
    btn.classList.toggle("isActive", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  
}

catTabs.forEach(btn => {
  btn.addEventListener("click", () => {
    setActiveCategory(btn.dataset.cat);
    renderProducts(); // or renderAll() if you prefer
  });
});

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
  
  const visibleProducts = PRODUCTS.filter(p => (p.category || "Tradicional") === currentCategory);
  
  for (const p of visibleProducts){

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
    
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn primary small";
    
    const isAdded = cart.has(p.id) || invalidQty.has(p.id);
    addBtn.innerHTML = isAdded ? "✅ Añadido" : "Añadir";
    
    addBtn.addEventListener("click", () => {
      if (!cart.has(p.id)) {
        invalidQty.delete(p.id);   // clear invalid state if it was empty
        cart.set(p.id, 1);
      }
      renderAll();
    });


    
body.appendChild(name);
body.appendChild(price);
body.appendChild(addBtn);


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

      
      const qtyLine = invalidQty.has(it.id)
        ? `<span class="qtyWarn">Ingrese cantidad</span>`
        : `${it.qty} unid.`;
      
      right.innerHTML = `
        <div class="cartItemName">
          <span class="lineSubtotal" data-pid="${it.id}">${formatMoney(it.subtotal)}</span>
        </div>
        <div class="cartItemMeta">
          <span class="qtyMeta" data-pid="${it.id}">${qtyLine}</span>
        </div>
        `;


      
      const trash = document.createElement("button");
      trash.type = "button";
      trash.className = "trashBtn";
      trash.title = "Quitar producto";
      trash.textContent = "🗑️";
      trash.addEventListener("click", () => {
        invalidQty.delete(it.id);
        cart.delete(it.id);
        renderAll();
      });
      right.appendChild(trash);



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
      
      const input = document.createElement("input");
      input.type = "number";
      input.inputMode = "numeric";
      input.setAttribute("autocomplete", "off");
      input.min = MIN_QTY;
      input.max = MAX_QTY;
      input.value = invalidQty.has(it.id) ? "" : it.qty;
      input.className = "qtyInput";

      input.dataset.pid = it.id;
      
      input.addEventListener("input", () => {
        // 1) If user deletes everything: mark invalid but DO NOT re-render
        if (input.value.trim() === "") {
          invalidQty.add(it.id);
          // Keep item visible and qty=0 in state without calling setQty/renderAll
          cart.set(it.id, 0);
          // Update totals + badge + min-order UI without recreating the input
          
          const qtyMetaEl = right.querySelector(`.qtyMeta[data-pid="${it.id}"]`);
          if (qtyMetaEl) qtyMetaEl.innerHTML = `<span class="qtyWarn">Ingrese cantidad</span>`;
          
          const lineSubtotalEl = right.querySelector(`.lineSubtotal[data-pid="${it.id}"]`);
          if (lineSubtotalEl) lineSubtotalEl.textContent = formatMoney(0);


          const subtotal = cartSubtotal();
          subtotalEl.textContent = formatMoney(subtotal);
          totalEl.textContent = formatMoney(subtotal);
          cartCountBadge.textContent = String(cartCount());
          updateMinOrderUI();
          
          return;
        }
        
        // 2) Valid number typed again → normal behavior
        invalidQty.delete(it.id);
        
        const newQty = parseInt(input.value, 10);
        setQty(it.id, isNaN(newQty) ? 0 : newQty);
      });



      
      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.addEventListener("click", () => setQty(it.id, (cart.get(it.id) || 0) + 1));
      
      controls.appendChild(minus);
      controls.appendChild(input);
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

  // ✅ Save focus info if user is editing a qty input
  const active = document.activeElement;
  const wasEditingQty =
    active &&
    active.classList &&
    active.classList.contains("qtyInput") &&
    active.dataset &&
    active.dataset.pid;

  const keepPid = wasEditingQty ? active.dataset.pid : null;
  const keepCursor = wasEditingQty ? active.selectionStart : null;
  
  const q = clamp(qty, MIN_QTY, MAX_QTY);
  
  if (q > 0) {
    invalidQty.delete(productId);   // ✅ qty is valid again
    cart.set(productId, q);
  } else {
    cart.delete(productId);
  }


  renderAll();

  // ✅ Restore focus + cursor position
  if (keepPid) {
    const newInput = document.querySelector(`.qtyInput[data-pid="${keepPid}"]`);
    if (newInput) {
      newInput.focus();
      // Put cursor back (best-effort)
      const pos = Math.min(keepCursor ?? newInput.value.length, newInput.value.length);
      if (typeof newInput.setSelectionRange === "function") {
        try {
          newInput.setSelectionRange(pos, pos);
        } catch {}
      }

    }
  }
}


function clearCart({ clearStatus = true } = {}) {
  cart.clear();
  invalidQty.clear();

  if (clearStatus && statusEl) {
    statusEl.className = "status";
    statusEl.textContent = "";
  }

  renderAll();
}


// ====== SUBMIT ORDER ======
async function submitOrder(evt){
  evt.preventDefault();
  
  if (submitting) return;
  submitting = true;
  
  try {
    statusEl.className = "status";
    statusEl.textContent = "";
    
    const items = cartItemsArray().filter(x => x.qty > 0);
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
  
  if (invalidQty.size > 0) {
    statusEl.className = "status err";
    statusEl.textContent = "Hay productos sin cantidad. Ingresa cantidad o elimina el producto.";
    return;
  }

  const name = document.getElementById("customerName").value.trim();
  const rawPhone = document.getElementById("customerPhone").value.trim();
  const phone = normalizeChilePhone(rawPhone);
  const address = document.getElementById("customerAddress").value.trim();
  const email = document.getElementById("customerEmail").value.trim();

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
      "Por favor ingresa un número móvil chileno válido (ejemplo: 56912345678).";
    return;
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    statusEl.className = "status err";
    statusEl.textContent = "Por favor ingresa un correo electrónico válido.";
    return;
  }

  const orderId =
  "ORD-" +
  (crypto?.randomUUID
    ? crypto.randomUUID()
    : Date.now() + "-" + Math.random().toString(36).slice(2));
  
  const timestampCL = new Date().toLocaleString("sv-SE", {
    timeZone: "America/Santiago"
  });

  const payload = {
    orderId,
    name,
    phone,
    email,
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
    clearCart({ clearStatus: false }); // keep success message visible
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
    submitting = false;
    if (submitBtn) submitBtn.disabled = false;
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
setActiveCategory(currentCategory);
renderAll();
