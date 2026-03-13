/* ═══════════════════════════════════════════
   ONCE OS — v0.2
   app.js — Clean unified script + Pomodoro
═══════════════════════════════════════════ */

/* ─── Schedule data ─── */
const HORARIO = {
  1: [
    { inicio:"7:00am",  fin:"11:27am", materia:"Color",                    salon:"3229B",     edificio:"CNTRAL" },
    { inicio:"11:30am", fin:"2:27pm",  materia:"Dibujo Vectorial",         salon:"Animatrix", edificio:"LIET"   }
  ],
  2: [
    { inicio:"7:00am",  fin:"8:27am",  materia:"H. para el emprendimiento",salon:"5121",      edificio:"5"      },
    { inicio:"10:00am", fin:"11:27am", materia:"Antropología",             salon:"5129A",     edificio:"5"      },
    { inicio:"11:30am", fin:"2:27pm",  materia:"Fundamentos del Diseño",   salon:"3229C",     edificio:"CNTRAL" },
    { inicio:"2:30pm",  fin:"3:27pm",  materia:"Inglés Inter: B",          salon:"5126",      edificio:"5"      }
  ],
  3: [
    { inicio:"7:00am",  fin:"11:27am", materia:"Fotografía",               salon:"5122",      edificio:"5"      }
  ],
  4: [
    { inicio:"7:00am",  fin:"9:57am",  materia:"Dibujo Analítico",         salon:"5122",      edificio:"5"      },
    { inicio:"10:00am", fin:"11:27am", materia:"Antropología",             salon:"5129A",     edificio:"5"      },
    { inicio:"11:30am", fin:"2:27pm",  materia:"Fundamentos del Diseño",   salon:"3229C",     edificio:"CNTRAL" },
    { inicio:"2:30pm",  fin:"3:57pm",  materia:"Inglés Inter: B",          salon:"5126",      edificio:"5"      }
  ],
  5: [
    { inicio:"8:30am",  fin:"11:27am", materia:"Dibujo Analítico",         salon:"5121",      edificio:"5"      }
  ]
};

const DIAS = { 1:"Lunes", 2:"Martes", 3:"Miércoles", 4:"Jueves", 5:"Viernes" };

/* ─────────────────────────────────────────
   TASKS
───────────────────────────────────────── */
const TASKS_KEY = "once_tasks_v2";
const AUTO_DELETE_HOURS = 8;

function getTasks() {
  try { return JSON.parse(localStorage.getItem(TASKS_KEY)) || []; }
  catch { return []; }
}

function saveTasks(t) { localStorage.setItem(TASKS_KEY, JSON.stringify(t)); }

function addTask({ titulo, materia, fechaEntrega }) {
  const t = getTasks();
  t.push({ id: crypto.randomUUID(), titulo, materia, fechaEntrega,
           completada: false, completadaEn: null, creadaEn: new Date().toISOString() });
  saveTasks(t);
}

function toggleTask(id) {
  const t = getTasks();
  const task = t.find(x => x.id === id);
  if (!task) return;
  task.completada = !task.completada;
  task.completadaEn = task.completada ? new Date().toISOString() : null;
  saveTasks(t);
  renderTasks();
  updateResumenTareas();
}

function deleteTask(id) {
  saveTasks(getTasks().filter(t => t.id !== id));
  renderTasks();
  updateResumenTareas();
}

function cleanupTasks() {
  const now = Date.now();
  const limit = AUTO_DELETE_HOURS * 3600000;
  saveTasks(getTasks().filter(t => {
    if (!t.completada || !t.completadaEn) return true;
    return now - new Date(t.completadaEn).getTime() < limit;
  }));
}

function renderTasks() {
  cleanupTasks();
  const lista = document.getElementById("listaTareas");
  if (!lista) return;

  const tasks = getTasks().sort((a, b) => {
    if (a.completada !== b.completada) return a.completada ? 1 : -1;
    return new Date(a.fechaEntrega||"9999") - new Date(b.fechaEntrega||"9999");
  });

  if (!tasks.length) {
    lista.innerHTML = `<div class="empty-tasks"><span>✨</span><p>Sin tareas pendientes</p></div>`;
    return;
  }

  lista.innerHTML = "";

  tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = `task-card${task.completada ? " completada" : ""}`;

    const check = document.createElement("div");
    check.className = `task-check${task.completada ? " done" : ""}`;
    check.textContent = task.completada ? "✓" : "";
    check.setAttribute("role","checkbox");
    check.setAttribute("aria-checked", task.completada);
    check.setAttribute("tabindex","0");
    check.addEventListener("click", () => toggleTask(task.id));
    check.addEventListener("keypress", e => { if(e.key==="Enter"||e.key===" ") toggleTask(task.id); });

    const info = document.createElement("div");
    info.className = "task-info";

    const titulo = document.createElement("div");
    titulo.className = "task-title";
    titulo.textContent = task.titulo;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const tag = document.createElement("span");
    tag.className = "task-materia-tag";
    tag.textContent = task.materia;

    meta.appendChild(tag);

    if (task.fechaEntrega) {
      const fecha = document.createElement("span");
      fecha.textContent = `📅 ${task.fechaEntrega}`;
      meta.appendChild(fecha);
    }

    info.appendChild(titulo);
    info.appendChild(meta);

    const del = document.createElement("button");
    del.className = "task-delete";
    del.setAttribute("aria-label","Eliminar");
    del.textContent = "🗑";
    del.addEventListener("click", e => { e.stopPropagation(); deleteTask(task.id); });

    card.appendChild(check);
    card.appendChild(info);
    card.appendChild(del);
    lista.appendChild(card);
  });
}

function updateResumenTareas() {
  const el = document.getElementById("resTareas");
  if (!el) return;
  const txt = el.querySelector(".r-text");
  if (!txt) return;
  const pendientes = getTasks().filter(t => !t.completada).length;
  txt.textContent = pendientes === 0
    ? "Sin tareas pendientes 🎉"
    : `${pendientes} tarea${pendientes > 1 ? "s" : ""} pendiente${pendientes > 1 ? "s" : ""}`;
}

/* ─────────────────────────────────────────
   POMODORO
───────────────────────────────────────── */
const POM_STATS_KEY = "once_pom_stats";

const pomState = {
  running:    false,
  mode:       "work",
  minutesMap: { work: 25, short: 5, long: 15 },
  labelMap:   { work: "ENFOQUE", short: "DESCANSO", long: "DESCANSO LARGO" },
  colorMap:   { work: "var(--accent)", short: "var(--mint)", long: "var(--lavender)" },
  seconds:    25 * 60,
  totalSeconds: 25 * 60,
  interval:   null,
  sessionsToday: 0,
  minutesFocused: 0,
  streak:     0,
};

function pomGetStats() {
  try { return JSON.parse(localStorage.getItem(POM_STATS_KEY)) || {}; }
  catch { return {}; }
}

function pomSaveStats() {
  const today = new Date().toDateString();
  const s = pomGetStats();
  s[today] = {
    sessions: pomState.sessionsToday,
    minutes:  pomState.minutesFocused,
    streak:   pomState.streak,
  };
  localStorage.setItem(POM_STATS_KEY, JSON.stringify(s));
}

function pomLoadStats() {
  const today = new Date().toDateString();
  const s = pomGetStats();
  if (s[today]) {
    pomState.sessionsToday  = s[today].sessions || 0;
    pomState.minutesFocused = s[today].minutes  || 0;
    pomState.streak         = s[today].streak   || 0;
  }
}

function pomUpdateUI() {
  const mins = Math.floor(pomState.seconds / 60).toString().padStart(2,"0");
  const secs = (pomState.seconds % 60).toString().padStart(2,"0");
  const timeEl = document.getElementById("pomTime");
  if (timeEl) timeEl.textContent = `${mins}:${secs}`;

  const ring = document.getElementById("pomRingProgress");
  if (ring) {
    const circumference = 2 * Math.PI * 108;
    const progress = pomState.seconds / pomState.totalSeconds;
    ring.style.strokeDashoffset = circumference * (1 - progress);
    ring.style.stroke = pomState.colorMap[pomState.mode];
  }

  const label = document.getElementById("pomLabel");
  if (label) label.textContent = pomState.labelMap[pomState.mode];

  const dots = document.querySelectorAll(".pom-dot");
  dots.forEach((d, i) => {
    d.classList.toggle("done", i < (pomState.sessionsToday % 4 || (pomState.sessionsToday > 0 && pomState.sessionsToday % 4 === 0 ? 4 : 0)));
  });

  const btn = document.getElementById("pomStartBtn");
  if (btn) btn.textContent = pomState.running ? "⏸ Pausar" : "▶ Iniciar";

  const ss = document.getElementById("pomStatSessions");
  const sm = document.getElementById("pomStatMinutes");
  const sk = document.getElementById("pomStatStreak");
  if (ss) ss.textContent = pomState.sessionsToday;
  if (sm) sm.textContent = `${pomState.minutesFocused}m`;
  if (sk) sk.textContent = pomState.streak;
}

function pomStart() {
  pomState.running = true;
  pomState.interval = setInterval(() => {
    pomState.seconds--;

    if (pomState.mode === "work") {
      pomState.minutesFocused = Math.floor(
        (pomState.totalSeconds - pomState.seconds) / 60
      );
    }

    pomUpdateUI();

    if (pomState.seconds <= 0) {
      clearInterval(pomState.interval);
      pomState.running = false;
      pomComplete();
    }
  }, 1000);
  pomUpdateUI();
}

function pomPause() {
  clearInterval(pomState.interval);
  pomState.running = false;
  pomUpdateUI();
}

function pomComplete() {
  if (pomState.mode === "work") {
    pomState.sessionsToday++;
    pomState.streak++;
    pomState.minutesFocused = Math.round(pomState.totalSeconds / 60);
    pomSaveStats();
    showToast("🍅 ¡Sesión completada! Toma un descanso 🌸");
    pomSetMode("short");
  } else {
    showToast("☀️ ¡Listo! A seguir enfocada 💪");
    pomSetMode("work");
  }

  if (Notification && Notification.permission === "granted") {
    const msg = pomState.mode === "work"
      ? "¡Sesión completada! Mereces un descanso 🌸"
      : "¡Descanso terminado! Vamos a trabajar 💪";
    new Notification("ONCE OS · Pomodoro", { body: msg, icon: "assets/LogoA.png" });
  }

  pomUpdateUI();
}

function pomSetMode(mode) {
  clearInterval(pomState.interval);
  pomState.running = false;
  pomState.mode = mode;
  pomState.seconds = pomState.minutesMap[mode] * 60;
  pomState.totalSeconds = pomState.seconds;
  pomUpdateUI();

  document.querySelectorAll(".pom-mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

function pomReset() {
  clearInterval(pomState.interval);
  pomState.running = false;
  pomState.seconds = pomState.totalSeconds;
  pomUpdateUI();
}

function initPomodoro() {
  pomLoadStats();
  pomUpdateUI();

  document.querySelectorAll(".pom-mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      pomSetMode(btn.dataset.mode);
      const mins = parseInt(btn.dataset.minutes);
      pomState.minutesMap[btn.dataset.mode] = mins;
    });
  });

  document.getElementById("pomStartBtn")?.addEventListener("click", () => {
    if (pomState.running) pomPause();
    else pomStart();
  });

  document.getElementById("pomResetBtn")?.addEventListener("click", pomReset);

  if (Notification && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

/* ─────────────────────────────────────────
   SCHEDULE HELPERS
───────────────────────────────────────── */
function horaAMinutos(hora) {
  const m = hora.match(/(\d+):(\d+)(am|pm)/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const p = m[3].toLowerCase();
  if (p==="pm" && h!==12) h+=12;
  if (p==="am" && h===12) h=0;
  return h*60+min;
}

function obtenerClaseActual() {
  const ahora = new Date();
  const dia = ahora.getDay();
  const mins = ahora.getHours()*60 + ahora.getMinutes();

  if (!HORARIO[dia] || !HORARIO[dia].length) return "📚 Hoy no tienes clases";

  for (const clase of HORARIO[dia]) {
    const ini = horaAMinutos(clase.inicio);
    const fin = horaAMinutos(clase.fin);
    if (ini!==null && fin!==null && mins>=ini && mins<=fin)
      return `📖 Ahora: ${clase.materia}\n🏫 ${clase.salon} · Edif. ${clase.edificio}`;
  }

  for (const clase of HORARIO[dia]) {
    const ini = horaAMinutos(clase.inicio);
    if (ini!==null && mins<ini)
      return `⏰ Próxima: ${clase.materia} (${clase.inicio})\n🏫 ${clase.salon} · Edif. ${clase.edificio}`;
  }

  return "🎉 Clases terminadas por hoy";
}

function renderHorario() {
  const container = document.getElementById("horarioSemana");
  if (!container) return;
  container.innerHTML = "";

  const hoy = new Date().getDay();

  for (const [diaNum, clases] of Object.entries(HORARIO)) {
    const num = parseInt(diaNum);
    const esHoy = num === hoy;

    const card = document.createElement("div");
    card.className = "horario-dia";

    const header = document.createElement("div");
    header.className = "dia-header";

    const nombre = document.createElement("span");
    nombre.className = "dia-nombre";
    nombre.textContent = DIAS[num];

    const badge = document.createElement("span");
    badge.className = `dia-badge${esHoy ? " hoy" : ""}`;
    badge.textContent = esHoy ? "Hoy" : `${clases.length} clase${clases.length>1?"s":""}`;

    header.appendChild(nombre);
    header.appendChild(badge);

    const lista = document.createElement("div");
    lista.className = "clases-list";

    const mins = new Date().getHours()*60 + new Date().getMinutes();

    clases.forEach(clase => {
      const item = document.createElement("div");
      item.className = "clase-item";

      if (esHoy) {
        const ini = horaAMinutos(clase.inicio);
        const fin = horaAMinutos(clase.fin);
        if (ini!==null && fin!==null && mins>=ini && mins<=fin) item.classList.add("activa");
      }

      const hora = document.createElement("div");
      hora.className = "clase-hora";
      hora.textContent = `${clase.inicio}\n${clase.fin}`;
      hora.style.whiteSpace = "pre-line";

      const info = document.createElement("div");
      info.className = "clase-info";

      const mat = document.createElement("h4");
      mat.textContent = clase.materia;

      const salon = document.createElement("p");
      salon.textContent = `${clase.salon} · Edif. ${clase.edificio}`;

      info.appendChild(mat);
      info.appendChild(salon);
      item.appendChild(hora);
      item.appendChild(info);
      lista.appendChild(item);
    });

    card.appendChild(header);
    card.appendChild(lista);
    container.appendChild(card);
  }

  const banner = document.getElementById("claseActualBanner");
  if (banner) {
    const status = obtenerClaseActual();
    banner.textContent = status;
    banner.classList.toggle("visible", !status.includes("no tienes"));
  }
}

/* ─────────────────────────────────────────
   CLOCK
───────────────────────────────────────── */
function actualizarReloj() {
  const ahora = new Date();
  const utc = ahora.getTime() + ahora.getTimezoneOffset()*60000;
  const merida = new Date(utc - 6*3600000);

  let h = merida.getHours();
  const m = merida.getMinutes().toString().padStart(2,"0");
  const ampm = h>=12 ? "PM" : "AM";
  h = h%12 || 12;

  const eH = document.getElementById("hora");
  const eA = document.getElementById("ampm");
  const eF = document.getElementById("fecha-corta");

  if (eH) eH.textContent = `${h}:${m}`;
  if (eA) eA.textContent = ampm;
  if (eF) {
    const dias = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    eF.textContent = `${dias[merida.getDay()]} ${merida.getDate()} ${meses[merida.getMonth()]}`;
  }
}

/* ─────────────────────────────────────────
   GREETING
───────────────────────────────────────── */
function inicioEmocional() {
  const hora = new Date().getHours();
  const saludo = document.getElementById("saludo");
  const frase  = document.getElementById("frase");
  const subfrase = document.getElementById("subfrase");
  if (!saludo) return;

  const nombre = cargarPerfil().nombre || "cielito";

  let momento, frases;
  if (hora < 12) {
    momento = `Buenos días, ${nombre} ☀️`;
    frases = [
      "Hoy vamos con todo, diseñadora 💪",
      "¡Diseñar hoy, facturar mañana!",
      "Todo lo que haces importa 🌺"
    ];
  } else if (hora < 19) {
    momento = `Buenas tardes, ${nombre} 🌸`;
    frases = [
      "Ya casi, ya casi… ¡tú puedes!",
      "Chi que puede, chi que puedeee 💕",
      "Un paso a la vez, amor mío"
    ];
  } else {
    momento = `Buenas noches, ${nombre} 🌙`;
    frases = [
      "Hoy lo hiciste genial 🌟",
      "Descansa, amor mío 💤",
      "Mañana será otro gran día 🩷"
    ];
  }

  saludo.textContent = momento;
  frase.textContent = frases[Math.floor(Math.random() * frases.length)];
  subfrase.textContent = "Once OS — creado con amor, para mi amor";
}

/* ─────────────────────────────────────────
   PROFILE
───────────────────────────────────────── */
const EMOJI_LIST = ["🌙","🌸","⭐","🌺","💫","🦋","🌻","👑","🎨","✨","💎","🌷","🌈","🦄","🎀","🍀"];

function cargarPerfil() {
  try { return JSON.parse(localStorage.getItem("once_perfil")) || {}; }
  catch { return {}; }
}

function guardarPerfil(p) { localStorage.setItem("once_perfil", JSON.stringify(p)); }

function aplicarPerfil() {
  const p = cargarPerfil();

  if (p.avatar) {
    const el = document.getElementById("perfilEmoji");
    const av = document.getElementById("profileAvatar");
    if (el) el.textContent = p.avatar;
    if (av) av.textContent = p.avatar;
  }

  if (p.color) {
    document.body.dataset.color = p.color;
    document.querySelectorAll(".color-dot").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.color === p.color);
    });
  }

  if (p.nombre) {
    const ni = document.getElementById("perfilNombre");
    if (ni) ni.value = p.nombre;
  }

  if (p.campus) {
    const ci = document.getElementById("perfilCampus");
    if (ci) ci.value = p.campus;
  }
}

function initPerfil() {
  const avatarLabel = document.querySelector(".perfil-avatar-label");

  if (avatarLabel) {
    avatarLabel.addEventListener("click", e => {
      e.preventDefault();
      const p = cargarPerfil();
      const current = p.avatar || "🌙";
      const idx = EMOJI_LIST.indexOf(current);
      p.avatar = EMOJI_LIST[(idx + 1) % EMOJI_LIST.length];
      guardarPerfil(p);
      aplicarPerfil();
      showToast(`Avatar: ${p.avatar}`);
    });
  }

  document.querySelectorAll(".color-dot").forEach(btn => {
    btn.addEventListener("click", () => {
      document.body.dataset.color = btn.dataset.color;
      document.querySelectorAll(".color-dot").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const p = cargarPerfil();
      p.color = btn.dataset.color;
      guardarPerfil(p);
      showToast("Color aplicado 🎨");
    });
  });

  document.getElementById("guardarPerfil")?.addEventListener("click", () => {
    const p = cargarPerfil();
    const ni = document.getElementById("perfilNombre");
    const ci = document.getElementById("perfilCampus");
    if (ni) p.nombre = ni.value.trim();
    if (ci) p.campus = ci.value;
    guardarPerfil(p);
    aplicarPerfil();
    inicioEmocional();
    showToast("Perfil guardado 💾");
  });
}

/* ─────────────────────────────────────────
   THEME
───────────────────────────────────────── */
function initTheme() {
  const btn = document.getElementById("themeToggle");
  const saved = localStorage.getItem("once_tema");

  if (saved === "soft") {
    document.body.setAttribute("data-theme","soft");
    if (btn) btn.textContent = "🌸";
  }

  btn?.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme");
    if (current === "soft") {
      document.body.removeAttribute("data-theme");
      localStorage.setItem("once_tema","dark");
      btn.textContent = "🌙";
    } else {
      document.body.setAttribute("data-theme","soft");
      localStorage.setItem("once_tema","soft");
      btn.textContent = "🌸";
    }
  });
}

/* ─────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────── */
let currentSection = "inicio";

function showSection(id) {
  document.querySelectorAll("main section").forEach(s => s.style.display = "none");
  const target = document.getElementById(id);
  if (!target) return;

  target.style.display = "block";
  currentSection = id;

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === id);
  });

  if (id === "horario")  renderHorario();
  if (id === "tareas")   renderTasks();
  if (id === "inicio") {
    updateResumenTareas();
    inicioEmocional();
    const r = document.getElementById("resApuntes");
    if (r) {
      const rt = r.querySelector(".r-text");
      if (rt) rt.textContent = obtenerClaseActual();
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.showSection = showSection;

function initNavigation() {
  document.querySelectorAll(".nav-btn[data-section]").forEach(btn => {
    btn.addEventListener("click", () => showSection(btn.dataset.section));
  });

  document.getElementById("profileBtn")?.addEventListener("click", () => showSection("perfil"));

  document.addEventListener("click", e => {
    const row = e.target.closest("[data-section]:not(.nav-btn):not(#profileBtn)");
    if (row) { showSection(row.dataset.section); return; }

    const link = e.target.closest("[data-link]");
    if (link) { window.open(link.dataset.link, "_blank", "noopener"); return; }

    const back = e.target.closest(".back-btn[data-back]");
    if (back) { showSection(back.dataset.back); return; }

    const storageType = e.target.closest("[data-type]");
    if (storageType) {
      const t = storageType.dataset.type;
      if (t === "fotos")  showSection("galeriaFotos");
      if (t === "videos") showSection("galeriaVideos");
    }
  });
}

/* ─────────────────────────────────────────
   INDEXEDDB GALLERY
───────────────────────────────────────── */
let db;

function initDB() {
  const req = indexedDB.open("OnceOS_DB", 2);

  req.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("fotos"))  db.createObjectStore("fotos",  { keyPath:"id", autoIncrement:true });
    if (!db.objectStoreNames.contains("videos")) db.createObjectStore("videos", { keyPath:"id", autoIncrement:true });
  };

  req.onsuccess = e => {
    db = e.target.result;
    cargarFotos();
    cargarVideos();
  };

  req.onerror = () => console.warn("IndexedDB no disponible");
}

function cargarFotos()  { if(db) renderMediaStore("fotos",  document.getElementById("gridFotos"),  "img"); }
function cargarVideos() { if(db) renderMediaStore("videos", document.getElementById("gridVideos"), "video"); }

function renderMediaStore(store, grid, type) {
  if (!grid) return;
  grid.innerHTML = "";
  const tx = db.transaction(store,"readonly");
  tx.objectStore(store).openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (!cursor) return;

    const wrapper = document.createElement("div");
    wrapper.className = "media-wrapper";

    const url = URL.createObjectURL(cursor.value.archivo);
    const key = cursor.key;

    let media;
    if (type === "img") {
      media = document.createElement("img");
      media.src = url;
      media.alt = "";
    } else {
      media = document.createElement("video");
      media.src = url;
      media.muted = true;
    }

    media.onclick = () => abrirViewer(type, url);

    const borrar = document.createElement("button");
    borrar.className = "delete-btn";
    borrar.textContent = "✕";
    borrar.onclick = () => {
      const txD = db.transaction(store,"readwrite");
      txD.objectStore(store).delete(key);
      txD.oncomplete = store==="fotos" ? cargarFotos : cargarVideos;
    };

    wrapper.appendChild(borrar);
    wrapper.appendChild(media);
    grid.appendChild(wrapper);
    cursor.continue();
  };
}

function initGallery() {
  document.getElementById("inputFotos")?.addEventListener("change", e => {
    if (!db) return;
    const tx = db.transaction("fotos","readwrite");
    const store = tx.objectStore("fotos");
    for (const file of e.target.files) store.add({ archivo: file });
    tx.oncomplete = cargarFotos;
    e.target.value = "";
  });

  document.getElementById("inputVideos")?.addEventListener("change", e => {
    if (!db) return;
    const tx = db.transaction("videos","readwrite");
    const store = tx.objectStore("videos");
    for (const file of e.target.files) store.add({ archivo: file });
    tx.oncomplete = cargarVideos;
    e.target.value = "";
  });
}

/* ─────────────────────────────────────────
   VIEWER
───────────────────────────────────────── */
function abrirViewer(tipo, url) {
  const viewer    = document.getElementById("viewer");
  const contenido = document.getElementById("viewerContenido");
  if (!viewer || !contenido) return;

  contenido.innerHTML = "";

  let media;
  if (tipo === "img") {
    media = document.createElement("img");
    media.src = url;
    media.alt = "";
  } else {
    media = document.createElement("video");
    media.src = url;
    media.controls = true;
    media.autoplay = true;
  }

  contenido.appendChild(media);
  viewer.style.display = "flex";
  setTimeout(() => { media.requestFullscreen?.().catch(()=>{}); }, 100);
}

function initViewer() {
  document.getElementById("cerrarViewer")?.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    const viewer    = document.getElementById("viewer");
    const contenido = document.getElementById("viewerContenido");
    if (contenido) contenido.innerHTML = "";
    if (viewer)    viewer.style.display = "none";
  });

  document.getElementById("viewer")?.addEventListener("click", e => {
    if (e.target === document.getElementById("viewer"))
      document.getElementById("cerrarViewer")?.click();
  });
}

/* ─────────────────────────────────────────
   TASKS FORM
───────────────────────────────────────── */
function initTasksForm() {
  const btn    = document.getElementById("agregarTarea");
  const input  = document.getElementById("tareaInput");
  const select = document.getElementById("materiaSelect");
  const fecha  = document.getElementById("fechaEntrega");
  if (!btn) return;

  const doAdd = () => {
    if (!input.value.trim()) { showToast("Escribe una tarea primero 📝"); return; }
    addTask({
      titulo: input.value.trim(),
      materia: select?.value || "General",
      fechaEntrega: fecha?.value || ""
    });
    input.value = "";
    if (fecha) fecha.value = "";
    renderTasks();
    updateResumenTareas();
    showToast("Tarea agregada ✅");
  };

  btn.addEventListener("click", doAdd);
  input.addEventListener("keypress", e => { if (e.key==="Enter") doAdd(); });
}

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  aplicarPerfil();
  initNavigation();
  initPerfil();
  initTasksForm();
  initViewer();
  initPomodoro();
  initDB();
  initGallery();

  actualizarReloj();
  setInterval(actualizarReloj, 1000);

  inicioEmocional();

  const r = document.getElementById("resApuntes");
  if (r) {
    const rt = r.querySelector(".r-text");
    if (rt) rt.textContent = obtenerClaseActual();
  }

  updateResumenTareas();
  setInterval(() => {
    const r2 = document.getElementById("resApuntes");
    if (r2) {
      const rt2 = r2.querySelector(".r-text");
      if (rt2) rt2.textContent = obtenerClaseActual();
    }
    updateResumenTareas();
  }, 60000);

  showSection("inicio");
});