(function () {
  // Ближайшая игра: дата и время (Кишинёв). Меняется одной строкой.
  var GAME = { iso: "2026-10-07T19:00:00+03:00", place: "Twins Cafe, str. Puskin, 32, Sun City, 3-й этаж" };
  var TG = "oleg_golitsa";
  var $ = function (s) { return document.querySelector(s); };
  var game = new Date(GAME.iso);
  var fmt = function (o) { return new Intl.DateTimeFormat("ru-RU", Object.assign({ timeZone: "Europe/Chisinau" }, o)).format(game); };
  var dateStr = fmt({ weekday: "long", day: "numeric", month: "long" });
  var bookStr = fmt({ day: "numeric", month: "long" }) + ", " + fmt({ hour: "2-digit", minute: "2-digit" });

  function plural(n, a) { var m = n % 10, c = n % 100; return n + " " + (m == 1 && c != 11 ? a[0] : m > 1 && m < 5 && (c < 12 || c > 14) ? a[1] : a[2]); }
  function tick() {
    var left = game - Date.now(), el = $("#nextCount");
    if (left <= 0) { el.textContent = "Игра уже идёт, ждём тебя на следующей"; return; }
    var d = Math.floor(left / 864e5), h = Math.floor(left % 864e5 / 36e5), m = Math.floor(left % 36e5 / 6e4);
    el.textContent = "Через " + (d ? plural(d, ["день", "дня", "дней"]) + " " : "") + plural(h, ["час", "часа", "часов"]) + (d ? "" : " " + plural(m, ["минуту", "минуты", "минут"]));
  }
  $("#nextDate").textContent = dateStr;
  $("#bookDate").textContent = bookStr;
  tick(); setInterval(tick, 30000);

  // Счётчики
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      if (reduce) return;
      var el = e.target, to = +el.dataset.to, t0 = performance.now();
      (function step(t) { var p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
    });
  }, { threshold: .6 });
  document.querySelectorAll("[data-to]").forEach(function (el) { io.observe(el); });

  // Карта роли
  var ROLES = [
    ["Мирный житель", "Твоя задача: вычислить мафию и не дать ей победить. Слушай, сравнивай, голосуй.", 6],
    ["Мафия", "Ты знаешь своего напарника. Ночью выбираете жертву, днём убеждаете всех, что вы мирные.", 2],
    ["Дон", "Глава мафии. Играешь с командой и ищешь шерифа, пока тебя не нашли.", 1],
    ["Шериф", "Главная роль мирных. Каждую ночь проверяешь одного игрока и ищешь способ рассказать правду.", 1]
  ];
  var card = $("#card"), redraw = $("#redraw");
  function draw() {
    var r = Math.random() * 10, acc = 0, pick = ROLES[0];
    for (var i = 0; i < ROLES.length; i++) { acc += ROLES[i][2]; if (r < acc) { pick = ROLES[i]; break; } }
    $("#roleName").textContent = pick[0]; $("#roleText").textContent = pick[1];
    card.classList.toggle("rare", pick[2] === 1);
  }
  card.addEventListener("click", function () {
    if (card.classList.contains("open")) { card.classList.remove("open"); redraw.hidden = true; return; }
    draw(); card.classList.add("open"); redraw.hidden = false;
  });
  redraw.addEventListener("click", function () {
    card.classList.remove("open");
    setTimeout(function () { draw(); card.classList.add("open"); }, reduce ? 0 : 450);
  });

  // Форма -> Телеграм организатору
  var form = $("#form"), err = $("#err");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(form), name = (f.get("name") || "").trim(), contact = (f.get("contact") || "").trim();
    form.name.removeAttribute("aria-invalid"); form.contact.removeAttribute("aria-invalid");
    var bad = !name ? form.name : !contact ? form.contact : null;
    if (bad) { bad.setAttribute("aria-invalid", "true"); err.textContent = "Заполни имя и контакт, чтобы организатор мог ответить."; err.hidden = false; bad.focus(); return; }
    err.hidden = true;
    var text = "Привет! Хочу записаться на Мафию " + bookStr + ". Меня зовут " + name + ", " + f.get("exp") + ", придёт: " + f.get("n") + ". Мой контакт: " + contact + ".";
    window.open("https://t.me/" + TG + "?text=" + encodeURIComponent(text), "_blank", "noopener");
  });
})();
