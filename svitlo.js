/* ===== Налаштування клієнта (змінюється за хвилину) ===== */
const CONFIG = {
  shop: "Світло",
  telegram: "your_shop",          // нік у Telegram без @
  viber: "+380000000000",         // номер Viber у міжнародному форматі
  freeShipFrom: 1200,             // безкоштовна доставка від, грн
  currency: "₴",
};

/* ===== Товари ===== */
const SOY = "соєвий віск, косметичні аромаолії";
const PRODUCTS = [
  { id: "perlyna", name: "Перлина", cat: "Ароматичні", price: 520, tag: "Хіт", img: "bowls", pos: "50% 40%", notes: ["Білий чай", "Бергамот", "Мускус"], weight: "180 г", burn: "до 30 год сумарно", wax: SOY, wick: "бавовняний", desc: "Свічка у керамічній чаші ручної роботи. Легкий чайний аромат із цитрусовою свіжістю для вітальні та спальні. Чашу можна використати вдруге." },
  { id: "med-lypa", name: "Мед і липа", cat: "Ароматичні", price: 540, tag: "Новинка", img: "yellow", pos: "50% 50%", notes: ["Липовий цвіт", "Мед", "Ваніль"], weight: "200 г", burn: "до 35 год сумарно", wax: SOY, wick: "дерев’яний", desc: "Теплий медовий аромат у золотистій кераміці. Дерев’яний ґніт тихо потріскує, створюючи затишок." },
  { id: "troianda", name: "Троянда", cat: "Ароматичні", price: 590, img: "rose", pos: "50% 45%", notes: ["Дамаська троянда", "Лаванда", "Сухоцвіти"], weight: "220 г", burn: "до 40 год сумарно", wax: SOY, wick: "бавовняний", desc: "Свічка з прикрасою у вигляді воскової троянди та сухоцвітів. Ніжний квітковий аромат, гарний подарунок." },
  { id: "kedr", name: "Кедр і сандал", cat: "Ароматичні", price: 480, img: "duo", pos: "50% 50%", notes: ["Кедр", "Сандал", "Бурштин"], weight: "200 г", burn: "до 35 год сумарно", wax: SOY, wick: "дерев’яний", desc: "Свічка в керамічній чашці ручної роботи з темним глеком. Теплий деревний аромат, який подобається і жінкам, і чоловікам." },
  { id: "pilar", name: "Пілар", cat: "Декоративні", price: 380, img: "pillars", pos: "50% 100%", notes: ["Бджолиний віск", "Медовий запах", "Ø 7 см"], weight: "350 г", burn: "до 45 год сумарно", wax: "бджолиний віск", wick: "бавовняний", desc: "Товста стовпчаста свічка з бджолиного воску. Горить рівно, ледь відчутно пахне медом, без додаткових ароматів." },
  { id: "konusni", name: "Конусні кольорові", cat: "Декоративні", price: 320, img: "colors", pos: "50% 50%", notes: ["Набір 6 шт", "Висота 25 см", "Кольорові"], weight: "6 шт", burn: "до 8 год кожна", wax: "соєвий віск, безпечні барвники", wick: "бавовняний", desc: "Набір конусних свічок для святкового столу в кількох кольорах. Для рівного горіння ставте їх подалі від протягів." },
  { id: "bdzholy", name: "Бджолині тонкі", cat: "Декоративні", price: 280, img: "tapers", pos: "50% 40%", notes: ["Набір 10 шт", "Висота 18 см", "Мед"], weight: "10 шт", burn: "до 5 год кожна", wax: "бджолиний віск", wick: "бавовняний", desc: "Тонкі свічки з натурального бджолиного воску. Пахнуть медом, горять яскраво та чисто." },
];
const CATS = ["Усі", "Ароматичні", "Декоративні"];

const artFor = (p) => `<img src="svitlo-${p.img}.jpg" alt="Свічка «${p.name}»" style="object-position:${p.pos}" loading="lazy">`;

/* ===== Допоміжне ===== */
const $ = (s, r = document) => r.querySelector(s);
const fmt = (n) => n.toLocaleString("uk-UA") + " " + CONFIG.currency;
let cart = {};
try { cart = JSON.parse(localStorage.getItem("svitlo-cart") || "{}"); } catch { cart = {}; }
const save = () => { try { localStorage.setItem("svitlo-cart", JSON.stringify(cart)); } catch {} };
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), msg.length > 40 ? 5000 : 2200); }

for (const id of Object.keys(cart)) if (!PRODUCTS.some((p) => p.id === id)) delete cart[id];

/* ===== Каталог ===== */
let activeCat = "Усі";
function renderChips() {
  $("#chips").innerHTML = CATS.map((c) => `<button class="chip" role="tab" aria-selected="${c === activeCat}" data-cat="${c}">${c}</button>`).join("");
}
function renderGrid() {
  const list = PRODUCTS.filter((p) => activeCat === "Усі" || p.cat === activeCat);
  $("#grid").innerHTML = list.map((p) => `
    <article class="card">
      <div class="card-art" data-open="${p.id}" role="button" tabindex="0" aria-label="${p.tag ? p.tag + ". " : ""}Детальніше: ${p.name}">
        ${p.tag ? `<span class="tag">${p.tag}</span>` : ""}${artFor(p)}
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p>${p.notes.join(" · ")}</p>
        <div class="card-foot"><span class="price">${fmt(p.price)}</span><button class="add" data-add="${p.id}">У кошик</button></div>
      </div>
    </article>`).join("");
}

/* ===== Модальне вікно ===== */
let modalId = null;
function openModal(id) {
  const p = PRODUCTS.find((x) => x.id === id); modalId = id;
  $("#mArt").innerHTML = artFor(p);
  $("#mCat").textContent = p.cat; $("#mTitle").textContent = p.name; $("#mDesc").textContent = p.desc;
  $("#mNotes").innerHTML = p.notes.map((n) => `<li>${n}</li>`).join("");
  $("#mSpec").innerHTML = `<dt>Вага</dt><dd>${p.weight}</dd><dt>Горіння</dt><dd>${p.burn}</dd><dt>Склад</dt><dd>${p.wax}</dd><dt>Ґніт</dt><dd>${p.wick}</dd>`;
  $("#mPrice").textContent = fmt(p.price);
  $("#modal").hidden = false; document.body.style.overflow = "hidden"; $("#closeModal").focus();
}
function closeModal() { $("#modal").hidden = true; document.body.style.overflow = ""; }

/* ===== Кошик ===== */
const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
const sum = () => Object.entries(cart).reduce((a, [id, q]) => a + PRODUCTS.find((p) => p.id === id).price * q, 0);
function add(id, q = 1) { cart[id] = (cart[id] || 0) + q; if (cart[id] <= 0) delete cart[id]; save(); renderCart(); }
function renderCart() {
  $("#cartCount").textContent = count();
  const ids = Object.keys(cart);
  $("#items").innerHTML = ids.length ? ids.map((id) => {
    const p = PRODUCTS.find((x) => x.id === id), q = cart[id];
    return `<div class="line"><div class="th">${artFor(p)}</div>
      <div><b>${p.name}</b><small>${fmt(p.price)}</small>
      <div class="qty"><button data-dec="${id}" aria-label="Менше">−</button><span>${q}</span><button data-inc="${id}" aria-label="Більше">+</button></div></div>
      <div class="lp">${fmt(p.price * q)}</div></div>`;
  }).join("") : `<p class="empty">Кошик порожній. Оберіть свічку в каталозі.</p>`;
  const s = sum(); $("#total").textContent = fmt(s);
  const left = CONFIG.freeShipFrom - s;
  $("#shipText").textContent = s === 0 ? `Безкоштовна доставка від ${fmt(CONFIG.freeShipFrom)}` : left > 0 ? `До безкоштовної доставки залишилось ${fmt(left)}. Інакше доставка за тарифами «Нової пошти».` : "Безкоштовна доставка «Новою поштою» ✓";
  $("#shipBar").style.width = Math.min(100, (s / CONFIG.freeShipFrom) * 100) + "%";
}
function openCart() { $("#drawer").classList.add("open"); $("#drawer").inert = false; $("#overlay").hidden = false; document.body.style.overflow = "hidden"; }
function closeCart() { $("#drawer").classList.remove("open"); $("#drawer").inert = true; $("#overlay").hidden = true; document.body.style.overflow = ""; }

/* ===== Замовлення ===== */
function orderText(f) {
  const lines = Object.entries(cart).map(([id, q], i) => { const p = PRODUCTS.find((x) => x.id === id); return `${i + 1}. ${p.name} × ${q} = ${fmt(p.price * q)}`; });
  const free = sum() >= CONFIG.freeShipFrom;
  return [`Нове замовлення зі сайту «${CONFIG.shop}»`, "", ...lines, "", `Разом за товари: ${fmt(sum())}`, `Доставка: «Нова пошта», ${f.np} (${free ? "безкоштовно" : "за тарифами перевізника"})`, `Ім’я: ${f.name}`, `Телефон: ${f.phone}`, f.note ? `Коментар: ${f.note}` : ""].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n").trim();
}
function readForm() {
  const fd = new FormData($("#checkout")), f = Object.fromEntries(fd.entries());
  const err = $("#err"); err.textContent = "";
  if (!count()) { err.textContent = "Додайте хоча б один товар."; return null; }
  if (!f.name.trim() || !f.np.trim()) { err.textContent = "Вкажіть ім’я та відділення «Нової пошти»."; return null; }
  if (f.phone.replace(/\D/g, "").length < 10) { err.textContent = "Вкажіть коректний номер телефону."; return null; }
  return f;
}

/* Відправка: текст завжди копіюється в буфер, бо Viber не вміє підставляти текст у чат, а Telegram у деяких версіях теж */
function sendOrder(text, via) {
  const url = via === "viber"
    ? `viber://chat?number=${encodeURIComponent(CONFIG.viber)}`
    : `https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(text)}`;
  const hint = via === "viber" ? "Вставте текст у чат Viber і надішліть." : "Якщо чат відкрився порожнім, вставте текст і надішліть.";
  const done = (ok) => toast(ok ? `Текст замовлення скопійовано. ${hint}` : "Відкриваємо месенджер: надішліть замовлення в чат.");
  try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch { done(false); }
  window.open(url, "_blank");
}

/* ===== Події ===== */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-cat],[data-add],[data-open],[data-inc],[data-dec]"); if (!t) return;
  if (t.dataset.cat) { activeCat = t.dataset.cat; renderChips(); renderGrid(); }
  else if (t.dataset.add) { add(t.dataset.add); toast("Додано в кошик"); }
  else if (t.dataset.open) openModal(t.dataset.open);
  else if (t.dataset.inc) add(t.dataset.inc, 1);
  else if (t.dataset.dec) add(t.dataset.dec, -1);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeModal(); closeCart(); }
  if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[data-open]")) { e.preventDefault(); openModal(e.target.dataset.open); }
});
$("#openCart").onclick = openCart; $("#closeCart").onclick = closeCart; $("#overlay").onclick = closeCart;
$("#closeModal").onclick = closeModal; $("#modal").onclick = (e) => { if (e.target.id === "modal") closeModal(); };
$("#mAdd").onclick = () => { add(modalId); closeModal(); toast("Додано в кошик"); };
$("#burger").onclick = () => { const o = $("#nav").classList.toggle("open"); $("#burger").setAttribute("aria-expanded", o); };
$("#nav").onclick = () => { $("#nav").classList.remove("open"); $("#burger").setAttribute("aria-expanded", false); };
$("#checkout").addEventListener("submit", (e) => {
  e.preventDefault(); const f = readForm(); if (!f) return;
  sendOrder(orderText(f), e.submitter?.dataset.via || "tg");
});
$("#copyOrder").onclick = async () => {
  const f = readForm(); if (!f) return;
  try { await navigator.clipboard.writeText(orderText(f)); toast("Текст замовлення скопійовано"); } catch { prompt("Скопіюйте текст замовлення:", orderText(f)); }
};

/* ===== Старт ===== */
renderChips(); renderGrid(); renderCart();
