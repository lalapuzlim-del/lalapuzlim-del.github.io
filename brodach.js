/* ===== Налаштування клієнта ===== */
const CONFIG = {
  shop: "Бродач",
  since: 2019,               // рік відкриття: «років на ринку» рахується сама
  telegram: "your_barber",   // нік у Telegram без @
  viber: "+380000000000",    // номер Viber у міжнародному форматі
  workDays: { from: 10, to: 21, sunFrom: 11, sunTo: 19 }, // години роботи (Пн–Сб та неділя)
  step: 30,                  // крок сітки запису, хв
  leadMinutes: 30,           // записатись можна не пізніше ніж за стільки хв до початку
  busy: {},                  // зайняте: {"2026-10-12": ["12:00", "15:30"]}, кожен запис блокує 30 хв
};

const SERVICES = [
  { id: "cut", name: "Чоловіча стрижка", note: "Миття голови та укладання", price: 600, min: 60 },
  { id: "beard", name: "Борода", note: "Моделювання, контур, догляд", price: 400, min: 40 },
  { id: "combo", name: "Стрижка + борода", note: "Найпопулярніший комплекс", price: 950, min: 90 },
  { id: "razor", name: "Королівське гоління", note: "Гарячий рушник, небезпечна бритва", price: 550, min: 45 },
  { id: "kid", name: "Дитяча стрижка", note: "До 12 років", price: 400, min: 40 },
  { id: "dad", name: "Батько + син", note: "Дві стрижки поспіль", price: 950, min: 100 },
];

const MASTERS = [
  { id: "any", name: "Будь-який вільний майстер", hide: true },
  { id: "taras", name: "Тарас", role: "Старший барбер", img: "master1", pos: "50% 25%", bio: "9 років у професії. Класичні та фейд-стрижки, робота з ножицями й гребінцем." },
  { id: "dmytro", name: "Дмитро", role: "Барбер", img: "master2", pos: "50% 20%", bio: "Сучасні стрижки, текстура й укладання. Любить чіткі лінії та контрасти." },
  { id: "vlad", name: "Влад", role: "Барбер", img: "master3", pos: "50% 25%", bio: "Борода, догляд і королівське гоління. Спокійно й уважно працює з кожним клієнтом." },
];

const WORKS = [
  ["chair-red", "Крісло", "50% 60%"], ["shave", "Гоління", "50% 50%"], ["fade", "Фейд", "50% 40%"],
  ["tools", "Інструмент", "50% 50%"], ["detail", "Контур", "50% 30%"], ["chair-bw", "Простір", "50% 50%"],
];

const $ = (s, r = document) => r.querySelector(s);
const money = (n) => n.toLocaleString("uk-UA") + " ₴";
const pad = (n) => String(n).padStart(2, "0");
const hhmm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), m.length > 40 ? 5000 : 2600); }

/* ===== Рендер ===== */
const years = Math.max(1, new Date().getFullYear() - CONFIG.since);
$("#since").textContent = CONFIG.since;
$("#yearsOn").textContent = `${years} ${plural(years, "рік", "роки", "років")}`;

$("#priceList").innerHTML = SERVICES.map((s) => `
  <div class="price"><div><h3>${s.name}</h3><small>${s.note}</small></div><i class="dots"></i><div><b>від ${money(s.price)}</b><span class="t">${s.min} хв</span></div></div>`).join("");

$("#mastersGrid").innerHTML = MASTERS.filter((m) => !m.hide).map((m) => `
  <article class="master"><div class="ph"><img src="brodach-${m.img}.jpg" alt="Барбер ${m.name}" style="object-position:${m.pos}" loading="lazy"></div>
  <div class="bd"><h3>${m.name}</h3><p class="role">${m.role}</p><p>${m.bio}</p>
  <button class="btn line small" data-master="${m.id}">Обрати майстра</button></div></article>`).join("");

$("#gallery").innerHTML = WORKS.map(([f, l, pos]) => `<figure><img src="brodach-${f}.jpg" alt="${l}" style="object-position:${pos}" loading="lazy"><figcaption>${l}</figcaption></figure>`).join("");

$("#service").innerHTML = SERVICES.map((s) => `<option value="${s.id}">${s.name}: від ${money(s.price)}, ${s.min} хв</option>`).join("");
$("#master").innerHTML = MASTERS.map((m) => `<option value="${m.id}">${m.name}</option>`).join("");

/* ===== Дата й слоти ===== */
const dateEl = $("#date");
const today = new Date();
dateEl.min = iso(today);
const last = new Date(today); last.setDate(last.getDate() + 30); dateEl.max = iso(last);
let slot = null;
const service = () => SERVICES.find((x) => x.id === $("#service").value);

// усі початки візитів на дату: послуга має закінчитись до закриття, не накладатись на зайняте й не бути в минулому
function slotsFor(dateStr, need) {
  const d = new Date(dateStr + "T00:00"), w = CONFIG.workDays;
  const sun = d.getDay() === 0, from = (sun ? w.sunFrom : w.from) * 60, to = (sun ? w.sunTo : w.to) * 60;
  const busy = (CONFIG.busy[dateStr] || []).map(toMin);
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), isToday = dateStr === iso(now);
  const list = [];
  for (let t = from; t + need <= to; t += CONFIG.step) {
    const past = isToday && t < nowMin + CONFIG.leadMinutes;
    const taken = busy.some((b) => t < b + 30 && t + need > b);
    list.push({ t, off: past || taken });
  }
  return list;
}
function firstFreeDate(need) {
  for (let i = 0; i <= 30; i++) { const d = new Date(today); d.setDate(d.getDate() + i); if (slotsFor(iso(d), need).some((s) => !s.off)) return iso(d); }
  return iso(today);
}

function renderSlots() {
  if (!dateEl.value) dateEl.value = dateEl.min;
  const list = slotsFor(dateEl.value, service().min), box = $("#slots");
  if (slot && !list.some((s) => s.t === slot && !s.off)) slot = null;
  if (!list.some((s) => !s.off)) { box.innerHTML = `<p class="slots-empty">На цю дату вільного часу немає. Оберіть інший день.</p>`; return; }
  box.innerHTML = "";
  for (const s of list) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "slot"; b.textContent = hhmm(s.t); b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", s.t === slot); b.disabled = s.off;
    b.onclick = () => { slot = s.t; renderSlots(); summary(); };
    box.appendChild(b);
  }
}
function summary() {
  const s = service(), m = MASTERS.find((x) => x.id === $("#master").value);
  const d = new Date(dateEl.value + "T00:00").toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" });
  const when = slot == null ? "" : `, ${hhmm(slot)}–${hhmm(slot + s.min)}`;
  $("#summary").textContent = `${s.name}, ${m.hide ? "будь-який вільний майстер" : m.name} · ${d}${when} · від ${money(s.price)}`;
}
dateEl.onchange = () => { slot = null; renderSlots(); summary(); };
$("#service").onchange = () => { renderSlots(); summary(); };
$("#master").onchange = summary;
dateEl.value = firstFreeDate(service().min);
renderSlots(); summary();

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-master]"); if (!t) return;
  $("#master").value = t.dataset.master; summary(); $("#book").scrollIntoView(); $("#name").focus({ preventScroll: true });
});

/* ===== Надсилання ===== */
// Текст завжди копіюється в буфер: Viber не вміє підставляти текст у чат, а Telegram у деяких версіях теж
function sendMessage(text, via) {
  const url = via === "viber"
    ? `viber://chat?number=${encodeURIComponent(CONFIG.viber)}`
    : `https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(text)}`;
  const hint = via === "viber" ? "Вставте текст у чат Viber і надішліть." : "Якщо чат відкрився порожнім, вставте текст і надішліть.";
  const done = (ok) => toast(ok ? `Текст запису скопійовано. ${hint}` : "Відкриваємо месенджер: надішліть запис у чат.");
  try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch { done(false); }
  window.open(url, "_blank");
}

$("#bookForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#err"); err.textContent = "";
  const name = $("#name").value.trim(), phone = $("#phone").value;
  if (!dateEl.value || dateEl.value < dateEl.min || dateEl.value > dateEl.max) { err.textContent = "Оберіть дату в межах найближчих 30 днів."; return; }
  if (slot == null) { err.textContent = "Оберіть вільний час."; return; }
  if (!name) { err.textContent = "Вкажіть ім’я."; return; }
  if (phone.replace(/\D/g, "").length < 10) { err.textContent = "Вкажіть коректний номер телефону."; return; }
  const s = service(), m = MASTERS.find((x) => x.id === $("#master").value);
  const d = new Date(dateEl.value + "T00:00").toLocaleDateString("uk-UA", { day: "numeric", month: "long", weekday: "short" });
  const text = [`Запис до «${CONFIG.shop}»`, "", `Послуга: ${s.name} (від ${money(s.price)}, ${s.min} хв)`, `Майстер: ${m.name}`, `Коли: ${d}, ${hhmm(slot)}–${hhmm(slot + s.min)}`, `Ім’я: ${name}`, `Телефон: ${phone}`].join("\n");
  sendMessage(text, e.submitter?.dataset.via || "tg");
});

/* ===== Шапка та меню ===== */
const header = $("#header");
const onScroll = () => header.classList.toggle("solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
$("#burger").onclick = () => { const o = $("#nav").classList.toggle("open"); $("#burger").setAttribute("aria-expanded", o); if (o) header.classList.add("solid"); };
$("#nav").onclick = () => { $("#nav").classList.remove("open"); $("#burger").setAttribute("aria-expanded", false); onScroll(); };
$("#year").textContent = new Date().getFullYear();
