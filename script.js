"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Safe localStorage helpers ---------- */
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

/* ---------- 1. Dark / light theme (remembered) ---------- */
const themeBtn = $("#themeToggle");
function applyTheme(dark) {
  document.body.classList.toggle("dark", dark);
  themeBtn.textContent = dark ? "☀️" : "🌙";
}
applyTheme(store.get("dark", false));
themeBtn.addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark");
  applyTheme(dark);
  store.set("dark", dark);
});

/* ---------- 2. Mobile menu ---------- */
$("#menuToggle").addEventListener("click", () => $("#nav").classList.toggle("open"));
$$("#nav a").forEach(a => a.addEventListener("click", () => $("#nav").classList.remove("open")));

/* ---------- 3. Live clock + greeting ---------- */
function updateClock() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleTimeString();
  const h = now.getHours();
  $("#greeting").textContent =
    h < 12 ? "Good morning ☀️" : h < 18 ? "Good afternoon 🌤️" : "Good evening 🌙";
}
updateClock();
setInterval(updateClock, 1000);
$("#year").textContent = new Date().getFullYear();

/* ---------- 4. Typing effect ---------- */
const words = ["Web Developer", "Problem Solver", "Student", "Creative Thinker"];
let w = 0, c = 0, deleting = false;
function type() {
  const word = words[w];
  $("#typing").textContent = word.slice(0, c);
  if (!deleting && c < word.length) c++;
  else if (!deleting) { deleting = true; return setTimeout(type, 1200); }
  else if (c > 0) c--;
  else { deleting = false; w = (w + 1) % words.length; }
  setTimeout(type, deleting ? 50 : 100);
}
type();

/* ---------- 5. Scroll: progress bar, back-to-top, active link ---------- */
const sections = $$("main section[id]");
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  $("#progress").style.width = (scrollY / max) * 100 + "%";
  $("#toTop").classList.toggle("hidden", scrollY < 400);

  let current = "home";
  sections.forEach(s => { if (scrollY >= s.offsetTop - 120) current = s.id; });
  $$("#nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
});
$("#toTop").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- 6. Reveal on scroll + counters + skill bars ---------- */
function animateCounter(el) {
  const target = +el.dataset.target;
  let n = 0;
  const step = Math.max(1, Math.ceil(target / 60));
  const t = setInterval(() => {
    n = Math.min(n + step, target);
    el.textContent = n;
    if (n >= target) clearInterval(t);
  }, 25);
}
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("visible");
    $$(".num", e.target).forEach(animateCounter);
    $$(".fill", e.target).forEach(f => f.style.width = f.dataset.level + "%");
    observer.unobserve(e.target);
  });
}, { threshold: 0.15 });
$$(".reveal").forEach(el => observer.observe(el));

/* ---------- 7. Project filter + search ---------- */
let activeFilter = "all";
function filterProjects() {
  const q = $("#search").value.trim().toLowerCase();
  let shown = 0;
  $$(".card").forEach(card => {
    const matchCat = activeFilter === "all" || card.dataset.cat === activeFilter;
    const matchText = card.textContent.toLowerCase().includes(q);
    const show = matchCat && matchText;
    card.classList.toggle("hidden", !show);
    if (show) shown++;
  });
  $("#noResult").classList.toggle("hidden", shown > 0);
}
$$(".filter").forEach(btn => btn.addEventListener("click", () => {
  $$(".filter").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activeFilter = btn.dataset.filter;
  filterProjects();
}));
$("#search").addEventListener("input", filterProjects);

/* ---------- 8. To-Do list (saved in localStorage) ---------- */
let todos = store.get("todos", []);
function renderTodos() {
  const list = $("#todoList");
  list.innerHTML = "";
  todos.forEach((t, i) => {
    const li = document.createElement("li");
    if (t.done) li.classList.add("done");
    const span = document.createElement("span");
    span.textContent = t.text;          // textContent prevents HTML injection
    const del = document.createElement("button");
    del.textContent = "✕";
    del.setAttribute("aria-label", "Delete task");
    li.append(span, del);
    li.addEventListener("click", () => { todos[i].done = !todos[i].done; saveTodos(); });
    del.addEventListener("click", e => { e.stopPropagation(); todos.splice(i, 1); saveTodos(); });
    list.appendChild(li);
  });
}
function saveTodos() { store.set("todos", todos); renderTodos(); }
$("#todoForm").addEventListener("submit", e => {
  e.preventDefault();
  const text = $("#todoInput").value.trim();
  if (!text) return;
  todos.push({ text, done: false });
  $("#todoInput").value = "";
  saveTodos();
});
renderTodos();

/* ---------- 9. Number guessing game ---------- */
let secret = Math.floor(Math.random() * 20) + 1;
let tries = 0;
$("#guessForm").addEventListener("submit", e => {
  e.preventDefault();
  const g = +$("#guessInput").value;
  tries++;
  const msg = $("#guessMsg");
  if (g === secret) msg.textContent = `🎉 Correct! You got it in ${tries} tries.`;
  else msg.textContent = g < secret ? "⬆️ Too low, try higher." : "⬇️ Too high, try lower.";
  $("#guessInput").value = "";
});
$("#guessReset").addEventListener("click", () => {
  secret = Math.floor(Math.random() * 20) + 1;
  tries = 0;
  $("#guessMsg").textContent = "New game started. Make a guess!";
});

/* ---------- 10. Contact form validation ---------- */
const form = $("#contactForm");
const msgBox = $("#message");
msgBox.addEventListener("input", () => $("#charCount").textContent = msgBox.value.length);

function setError(input, text) {
  input.classList.toggle("invalid", !!text);
  const err = input.parentElement.querySelector(".error");
  err.textContent = text;
  return !text;
}
form.addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#name"), email = $("#email");
  const okName = setError(name, name.value.trim().length < 3 ? "Name must be at least 3 characters." : "");
  const okEmail = setError(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? "" : "Enter a valid email address.");
  const okMsg = setError(msgBox, msgBox.value.trim().length < 10 ? "Message must be at least 10 characters." : "");

  const success = $("#formSuccess");
  if (okName && okEmail && okMsg) {
    success.textContent = `Thanks ${name.value.trim()}! Your message has been sent.`;
    success.classList.remove("hidden");
    form.reset();
    $("#charCount").textContent = 0;
  } else {
    success.classList.add("hidden");
  }
});