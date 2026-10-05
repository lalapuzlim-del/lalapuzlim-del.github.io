/* ===== Налаштування клієнта ===== */
const CONFIG = {
  shop: "Крапка",
  telegram: "your_cafe",     // нік у Telegram без @
  viber: "+380000000000",    // номер Viber у міжнародному форматі
  hours: { week: [8, 21], weekend: [9, 22] }, // Пн–Пт та Сб–Нд, години роботи
  maxGuests: 10,             // більше гостей: писати в месенджер
  step: 30,                  // крок часу бронювання, хв
  leadMinutes: 30,           // забронювати можна не пізніше ніж за стільки хв до візиту
};

const MENU = {
  "Кава": [
    { n: "Еспресо", d: "Подвійний, зерно від місцевих обсмажувальників", p: 55 },
    { n: "Американо", d: "Еспресо з гарячою водою", p: 60 },
    { n: "Флет вайт", d: "Подвійний еспресо та оксамитове молоко", p: 85, b: "Хіт" },
    { n: "Капучино", d: "Класика з щільною молочною піною", p: 80 },
    { n: "Раф «Крапка»", d: "Вершки, ваніль, трохи карамелі", p: 105, b: "Авторський" },
    { n: "Фільтр-кава", d: "Сорт тижня, запитайте бариста", p: 75 },
  ],
  "Не кава": [
    { n: "Матча-латте", d: "Церемоніальна матча, молоко на вибір", p: 110 },
    { n: "Какао з маршмелоу", d: "Бельгійський шоколад", p: 90 },
    { n: "Чай чорний чи трав’яний", d: "Чайник на двох, мед окремо", p: 95, v: 1 },
    { n: "Лимонад сезонний", d: "Цитрус і м’ята, або ягоди", p: 85, v: 1 },
    { n: "Імбирний шот", d: "Імбир, лимон, мед", p: 60 },
  ],
  "Сніданки": [
    { n: "Сирники з варенням", d: "Три шт., сметана та домашнє варення", p: 145, b: "Хіт" },
    { n: "Вівсянка з ягодами", d: "На вівсяному молоці, ягоди, горіхи, кленовий сироп", p: 110, v: 1 },
    { n: "Яйце «пашот» на тості", d: "Авокадо, зерна, мікрозелень", p: 165 },
    { n: "Гранола з йогуртом", d: "Домашня гранола, сезонні фрукти", p: 120 },
    { n: "Сендвіч з індичкою", d: "Чіабата, сир, соус песто", p: 150 },
  ],
  "Десерти": [
    { n: "Круасан мигдальний", d: "Печемо щоранку", p: 85 },
    { n: "Чізкейк «Нью-Йорк»", d: "Класичний, з ягідним соусом", p: 130, b: "Хіт" },
    { n: "Медовик", d: "Тонкі коржі, ніжний крем", p: 115 },
    { n: "Брауні", d: "Темний шоколад і волоський горіх", p: 95 },
    { n: "Морквяний кекс", d: "Без молока та яєць", p: 105, v: 1 },
  ],
};

const $ = (s, r = document) => r.querySelector(s);
const pad = (n) => String(n).padStart(2, "0");
const hhmm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoursFor = (day) => (day === 0 || day === 6 ? CONFIG.hours.weekend : CONFIG.hours.week);
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), m.length > 40 ? 5000 : 2600); }

/* ===== Меню ===== */
let tab = Object.keys(MENU)[0];
function renderMenu() {
  $("#tabs").innerHTML = Object.keys(MENU).map((k) => `<button class="tab" role="tab" aria-selected="${k === tab}" data-tab="${k}">${k}</button>`).join("");
  $("#menuList").innerHTML = MENU[tab].map((x) => `
    <div class="item">
      <div><h3>${x.n}${x.b ? `<span class="badge">${x.b}</span>` : ""}${x.v ? `<span class="badge v">веган</span>` : ""}</h3><p>${x.d}</p></div>
      <div class="pr">${x.p} ₴</div></div>`).join("");
}
document.addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (t) { tab = t.dataset.tab; renderMenu(); } });
renderMenu();

/* ===== Відкрито / зачинено ===== */
function updateStatus() {
  const n = new Date(), d = n.getDay(), wk = hoursFor(d), h = n.getHours() + n.getMinutes() / 60;
  const open = h >= wk[0] && h < wk[1];
  const el = $("#status"); el.className = "status " + (open ? "open" : "closed");
  el.textContent = open ? `Відкрито до ${pad(wk[1])}:00`
    : h < wk[0] ? `Зачинено · відкриємось о ${pad(wk[0])}:00`
    : `Зачинено · завтра з ${pad(hoursFor((d + 1) % 7)[0])}:00`;
}
updateStatus(); setInterval(updateStatus, 60000);

/* ===== Картка лояльності (приклад) ===== */
$("#stamps").innerHTML = Array.from({ length: 10 }, (_, i) => `<i class="${i < 6 ? "on" : i === 9 ? "gift" : ""}">${i === 9 ? "★" : i < 6 ? "✓" : i + 1}</i>`).join("");

/* ===== Бронювання ===== */
const dateEl = $("#date");
const today = new Date();
dateEl.min = iso(today);
const last = new Date(today); last.setDate(last.getDate() + 30); dateEl.max = iso(last);
let guests = 2;

// початки візитів на дату: до закриття мінімум година, і не раніше ніж через leadMinutes від зараз
function slotsFor(dateStr) {
  const wk = hoursFor(new Date(dateStr + "T00:00").getDay());
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), isToday = dateStr === iso(now);
  const list = [];
  for (let t = wk[0] * 60; t <= wk[1] * 60 - 60; t += CONFIG.step) if (!(isToday && t < nowMin + CONFIG.leadMinutes)) list.push(t);
  return list;
}
function firstFreeDate() {
  for (let i = 0; i <= 30; i++) { const d = new Date(today); d.setDate(d.getDate() + i); if (slotsFor(iso(d)).length) return iso(d); }
  return iso(today);
}
function renderTimes() {
  if (!dateEl.value) dateEl.value = dateEl.min;
  const list = slotsFor(dateEl.value);
  $("#time").innerHTML = list.length ? list.map((t) => `<option>${hhmm(t)}</option>`).join("") : `<option value="">На цю дату вільного часу немає</option>`;
}
dateEl.onchange = renderTimes;
dateEl.value = firstFreeDate();
renderTimes();

function renderGuests() {
  $("#guests").innerHTML = Array.from({ length: CONFIG.maxGuests - 1 }, (_, i) => i + 2).map((n) => `<button type="button" class="g" role="radio" aria-checked="${n === guests}" data-g="${n}">${n}</button>`).join("");
}
document.addEventListener("click", (e) => { const t = e.target.closest("[data-g]"); if (t) { guests = +t.dataset.g; renderGuests(); } });
renderGuests();

/* Текст завжди копіюється в буфер: Viber не вміє підставляти текст у чат, а Telegram у деяких версіях теж */
function sendMessage(text, via) {
  const url = via === "viber"
    ? `viber://chat?number=${encodeURIComponent(CONFIG.viber)}`
    : `https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(text)}`;
  const hint = via === "viber" ? "Вставте текст у чат Viber і надішліть." : "Якщо чат відкрився порожнім, вставте текст і надішліть.";
  const done = (ok) => toast(ok ? `Текст броні скопійовано. ${hint}` : "Відкриваємо месенджер: надішліть бронь у чат.");
  try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch { done(false); }
  window.open(url, "_blank");
}

$("#tableForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#err"); err.textContent = "";
  const name = $("#name").value.trim(), phone = $("#phone").value, time = $("#time").value;
  if (!dateEl.value || dateEl.value < dateEl.min || dateEl.value > dateEl.max) { err.textContent = "Оберіть дату в межах найближчих 30 днів."; return; }
  if (!time) { err.textContent = "На цю дату немає вільного часу. Оберіть іншу."; return; }
  if (!name) { err.textContent = "Вкажіть ім’я."; return; }
  if (phone.replace(/\D/g, "").length < 10) { err.textContent = "Вкажіть коректний номер телефону."; return; }
  const d = new Date(dateEl.value + "T00:00").toLocaleDateString("uk-UA", { day: "numeric", month: "long", weekday: "short" });
  const wish = $("#wish").value.trim();
  const text = [`Бронь столика в «${CONFIG.shop}»`, "", `Коли: ${d}, ${time}`, `Гостей: ${guests}`, `Ім’я: ${name}`, `Телефон: ${phone}`, wish ? `Побажання: ${wish}` : ""].filter(Boolean).join("\n");
  sendMessage(text, e.submitter?.dataset.via || "tg");
});

/* ===== Меню навігації ===== */
$("#burger").onclick = () => { const o = $("#nav").classList.toggle("open"); $("#burger").setAttribute("aria-expanded", o); };
$("#nav").onclick = () => { $("#nav").classList.remove("open"); $("#burger").setAttribute("aria-expanded", false); };
$("#year").textContent = new Date().getFullYear();
