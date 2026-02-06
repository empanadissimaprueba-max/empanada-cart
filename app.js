// ====== CONFIG ======
// 1) Paste your Make webhook URL here (Make -> Webhooks -> Custom webhook).
// Example: https://hook.us1.make.com/xxxxxxxxxxxxxxxxxxxxxxxx
const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/12rkb2bpud6d7bvqd47uw2htq14mo65d";

// 2) Currency formatting (CLP looks like $3.900). Change if you want.
const CURRENCY = "CLP";
const LOCALE = "es-CL";

// 3) Products: edit this list (id must be unique).
// Tip: You can keep placeholder images while testing.
const PRODUCTS = [
  { id: "pino", name: "Empanada de Pino", price: 3900, image: "./images/imagen_testing.png" },
  { id: "huevoqueso", name: "Empanada Huevo-Queso", price: 2900, image: "./images/imagen_testing.png" },
  { id: "polloqueso", name: "Empanada Pollo-Queso", price: 1900, image: "./images/imagen_testing.png" },
  // Add more here...
];

// Quantity limits
const MIN_QTY = 0;
const MAX_QTY = 20;


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
    empty.textContent = "Cart is empty. Add quantities from the products list.";
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
      meta.textContent = `${formatMoney(it.price)} each`;
      left.appendChild(nm);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.style.textAlign = "right";
      right.innerHTML = `<div class="cartItemName">${formatMoney(it.subtotal)}</div>
                         <div class="cartItemMeta">${it.qty} pcs</div>`;

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
    statusEl.textContent = "Add at least one product before submitting.";
    return;
  }

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const note = document.getElementById("customerNote").value.trim();

  if (!name || !phone){
    statusEl.className = "status err";
    statusEl.textContent = "Please enter name and phone.";
    return;
  }

  if (!MAKE_WEBHOOK_URL || MAKE_WEBHOOK_URL.includes("PASTE_YOUR_MAKE_WEBHOOK_URL_HERE")){
    statusEl.className = "status err";
    statusEl.textContent = "Webhook URL not set. Paste your Make webhook URL in app.js.";
    return;
  }

  const orderId = "ORD-" + Date.now();

  const payload = {
    orderId,
    name,
    phone,
    note: note || "",
    currency: CURRENCY,
    locale: LOCALE,
    items,
    subtotal: cartSubtotal(),
    total: cartSubtotal(),
    timestamp: new Date().toISOString()
  };

  try{
    statusEl.textContent = "Sending…";

    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok){
      const txt = await res.text().catch(() => "");
      throw new Error(`Webhook responded ${res.status}. ${txt}`.trim());
    }

    statusEl.className = "status ok";
    statusEl.textContent = "Order sent! ✅";
    clearCart();
    evt.target.reset();

  } catch (err){
    statusEl.className = "status err";
    statusEl.textContent = "Error sending order. Check webhook URL + Make scenario is ON.";
    console.error(err);
  }
}


// ====== UI ======
document.getElementById("clearCartBtn").addEventListener("click", clearCart);
document.getElementById("checkoutForm").addEventListener("submit", submitOrder);

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
