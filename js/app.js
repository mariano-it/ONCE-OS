/* ════════════════════════════════════════════════════════════
   ONCE OS v2.0 - APP.JS
   ════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════

const APP = {
  currentSection: 'inicio',
  theme: localStorage.getItem('once_theme') || 'dark',
  color: localStorage.getItem('once_color') || 'rose',
  initialized: false
};

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initTasks();
  initPomodoro();
  initGallery();
  initFinances();
  initHabits();
  updateGreeting();
  updateTasksStatus();
  setupEventListeners();
  APP.initialized = true;
});

// ═══════════════════════════════════════════════════════════
// THEME SYSTEM
// ═══════════════════════════════════════════════════════════

function initTheme() {
  document.body.setAttribute('data-theme', APP.theme);
  document.body.setAttribute('data-color', APP.color);
  updateThemeIcon();
}

function toggleTheme() {
  APP.theme = APP.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('once_theme', APP.theme);
  document.body.setAttribute('data-theme', APP.theme);
  updateThemeIcon();
  showToast(APP.theme === 'dark' ? '🌙 Modo oscuro' : '☀️ Modo claro');
}

function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.textContent = APP.theme === 'dark' ? '🌙' : '☀️';
  }
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION SYSTEM
// ═══════════════════════════════════════════════════════════

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const navToggle = document.getElementById('navToggle');
  const sidebar = document.getElementById('sidebar');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      showSection(section);
      closeSidebar();
    });
  });

  if (navToggle) {
    navToggle.addEventListener('click', toggleSidebar);
  }

  // Close sidebar on outside click
  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('active')) {
      if (!e.target.closest('.sidebar') && !e.target.closest('.nav-toggle')) {
        closeSidebar();
      }
    }
  });
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('navToggle');
  if (sidebar) {
    sidebar.classList.toggle('active');
    toggle?.classList.toggle('active');
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('navToggle');
  if (sidebar) {
    sidebar.classList.remove('active');
    toggle?.classList.remove('active');
  }
}

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show new section
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
    APP.currentSection = sectionId;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.section === sectionId) {
        item.classList.add('active');
      }
    });

    // Update header title
    const navItem = document.querySelector(`[data-section="${sectionId}"]`);
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle && navItem) {
      headerTitle.textContent = navItem.querySelector('.nav-label')?.textContent || 'ONCE OS';
    }

    // Scroll to top
    const content = document.getElementById('appContent');
    if (content) {
      content.scrollTop = 0;
    }
  }
}

// Handle back buttons
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('back-btn')) {
    const backSection = e.target.dataset.back;
    if (backSection) {
      showSection(backSection);
    }
  }
});

// Handle service card buttons
document.addEventListener('click', (e) => {
  const card = e.target.closest('[data-section]');
  if (card && !card.classList.contains('hero')) {
    const section = card.dataset.section;
    if (section) {
      showSection(section);
    }
  }
});

// ═══════════════════════════════════════════════════════════
// GREETING & TIME SYSTEM
// ═══════════════════════════════════════════════════════════

const greetings = {
  morning: {
    saludo: '¡Buenos días! ☀️',
    frases: [
      '¡Que tengas un día hermoso!',
      'Espero que disfrutes este día',
      'Un nuevo día para ser increíble'
    ]
  },
  afternoon: {
    saludo: '¡Buenas tardes! 🌤️',
    frases: [
      'Mitad del día, mitad del éxito',
      'Sigue adelante, lo estás haciendo bien',
      'Que la tarde sea productiva'
    ]
  },
  evening: {
    saludo: '¡Buenas noches! 🌙',
    frases: [
      'Reflexiona en lo que lograste hoy',
      'Descansa, lo merecías',
      'Que descanses hermoso'
    ]
  }
};

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function updateGreeting() {
  const timeOfDay = getTimeOfDay();
  const greeting = greetings[timeOfDay];
  const randomFrase = greeting.frases[Math.floor(Math.random() * greeting.frases.length)];

  const saludoEl = document.getElementById('saludo');
  const fraseEl = document.getElementById('frase');

  if (saludoEl) saludoEl.textContent = greeting.saludo;
  if (fraseEl) fraseEl.textContent = randomFrase;
}

// ═══════════════════════════════════════════════════════════
// TASKS SYSTEM
// ═══════════════════════════════════════════════════════════

const TASKS_KEY = 'once_tasks_v3';

function getTasks() {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function addTask() {
  const input = document.getElementById('tareaInput');
  const materiaSelect = document.getElementById('materiaSelect');
  const fechaInput = document.getElementById('fechaEntrega');

  if (!input || !input.value.trim()) {
    showToast('⚠️ Escribe una tarea primero');
    return;
  }

  const task = {
    id: crypto.randomUUID(),
    titulo: input.value.trim(),
    materia: materiaSelect?.value || 'General',
    fechaEntrega: fechaInput?.value || null,
    completada: false,
    createdAt: new Date().toISOString()
  };

  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);

  input.value = '';
  fechaInput.value = '';
  materiaSelect.value = 'General';

  renderTasks();
  updateTasksStatus();
  showToast('✅ Tarea agregada');
}

function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completada = !task.completada;
    saveTasks(tasks);
    renderTasks();
    updateTasksStatus();
    
    if (task.completada) {
      showToast('🎉 ¡Tarea completada!');
    }
  }
}

function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks();
  updateTasksStatus();
  showToast('🗑️ Tarea eliminada');
}

function renderTasks() {
  const list = document.getElementById('listaTareas');
  if (!list) return;

  const tasks = getTasks().sort((a, b) => {
    if (a.completada !== b.completada) return a.completada ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <p>Sin tareas pendientes</p>
        <p class="empty-desc">¡Tienes un día libre! 🎉</p>
      </div>
    `;
    return;
  }

  list.innerHTML = tasks.map((task, index) => `
    <div class="task-card ${task.completada ? 'completada' : ''}" style="animation-delay: ${index * 0.05}s">
      <div class="task-check ${task.completada ? 'done' : ''}" 
           onclick="toggleTask('${task.id}')" 
           role="checkbox" 
           aria-checked="${task.completada}"
           tabindex="0">
        ${task.completada ? '✓' : ''}
      </div>
      <div class="task-info">
        <div class="task-title">${escapeHtml(task.titulo)}</div>
        <div class="task-meta">
          <span class="task-materia-tag">${task.materia}</span>
          ${task.fechaEntrega ? `<span>📅 ${task.fechaEntrega}</span>` : ''}
        </div>
      </div>
      <button class="task-delete" onclick="deleteTask('${task.id}')" aria-label="Eliminar">🗑️</button>
    </div>
  `).join('');
}

function updateTasksStatus() {
  const pendientes = getTasks().filter(t => !t.completada).length;
  const statusEl = document.getElementById('statusTasks');
  if (statusEl) {
    if (pendientes === 0) {
      statusEl.textContent = '¡Sin tareas!';
    } else {
      statusEl.textContent = `${pendientes} tarea${pendientes > 1 ? 's' : ''}`;
    }
  }
}

function initTasks() {
  const btn = document.getElementById('agregarTarea');
  if (btn) {
    btn.addEventListener('click', addTask);
  }

  const input = document.getElementById('tareaInput');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask();
    });
  }

  renderTasks();
}

// ═══════════════════════════════════════════════════════════
// POMODORO SYSTEM
// ═══════════════════════════════════════════════════════════

const POM_KEY = 'once_pom_stats';

let pomState = {
  running: false,
  mode: 'work',
  seconds: 25 * 60,
  totalSeconds: 25 * 60,
  interval: null,
  sessionsToday: 0,
  minutesFocused: 0,
  streak: 0,
  modes: {
    work: { minutes: 25, label: 'ENFOQUE', color: '#ff6b9d' },
    short: { minutes: 5, label: 'DESCANSO', color: '#80d4c0' },
    long: { minutes: 15, label: 'DESCANSO LARGO', color: '#b8a8f4' }
  }
};

function pomLoadStats() {
  const today = new Date().toDateString();
  const stats = JSON.parse(localStorage.getItem(POM_KEY)) || {};
  const todayStats = stats[today] || {};

  pomState.sessionsToday = todayStats.sessions || 0;
  pomState.minutesFocused = todayStats.minutes || 0;
  pomState.streak = todayStats.streak || 0;
}

function pomSaveStats() {
  const today = new Date().toDateString();
  const stats = JSON.parse(localStorage.getItem(POM_KEY)) || {};
  stats[today] = {
    sessions: pomState.sessionsToday,
    minutes: pomState.minutesFocused,
    streak: pomState.streak
  };
  localStorage.setItem(POM_KEY, JSON.stringify(stats));
}

function pomUpdateUI() {
  const mins = Math.floor(pomState.seconds / 60).toString().padStart(2, '0');
  const secs = (pomState.seconds % 60).toString().padStart(2, '0');

  const timeEl = document.getElementById('pomTime');
  if (timeEl) timeEl.textContent = `${mins}:${secs}`;

  const label = document.getElementById('pomLabel');
  if (label) label.textContent = pomState.modes[pomState.mode].label;

  // Update ring progress
  const ring = document.querySelector('.timer-progress');
  if (ring) {
    const circumference = 754; // 2 * Math.PI * 120
    const progress = pomState.seconds / pomState.totalSeconds;
    ring.style.strokeDashoffset = circumference * (1 - progress);
    ring.style.stroke = pomState.modes[pomState.mode].color;
  }

  // Update dots
  const dots = document.querySelectorAll('.timer-dots .dot');
  dots.forEach((d, i) => {
    d.classList.toggle('done', i < (pomState.sessionsToday % 4));
  });

  // Update button
  const btn = document.getElementById('pomStartBtn');
  if (btn) {
    btn.textContent = pomState.running ? '⏸ Pausar' : '▶ Iniciar';
  }

  // Update stats
  document.getElementById('pomStatSessions').textContent = pomState.sessionsToday;
  document.getElementById('pomStatMinutes').textContent = `${pomState.minutesFocused}m`;
  document.getElementById('pomStatStreak').textContent = pomState.streak;
}

function pomStart() {
  if (pomState.running) {
    pomState.running = false;
    clearInterval(pomState.interval);
    pomUpdateUI();
    return;
  }

  pomState.running = true;

  pomState.interval = setInterval(() => {
    pomState.seconds--;

    if (pomState.mode === 'work') {
      pomState.minutesFocused = Math.floor((pomState.totalSeconds - pomState.seconds) / 60);
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

function pomReset() {
  clearInterval(pomState.interval);
  pomState.running = false;
  pomState.seconds = pomState.totalSeconds;
  pomUpdateUI();
}

function pomComplete() {
  if (pomState.mode === 'work') {
    pomState.sessionsToday++;
    pomState.streak++;
    pomState.minutesFocused = Math.round(pomState.totalSeconds / 60);
    pomSaveStats();
    showToast('🍅 ¡Sesión completada! Toma un descanso 🌸');
    pomSetMode('short');
  } else {
    showToast('☀️ ¡Listo! A seguir enfocada 💪');
    pomSetMode('work');
  }

  pomUpdateUI();
}

function pomSetMode(mode) {
  clearInterval(pomState.interval);
  pomState.running = false;
  pomState.mode = mode;
  pomState.seconds = pomState.modes[mode].minutes * 60;
  pomState.totalSeconds = pomState.seconds;
  pomUpdateUI();

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === mode) {
      btn.classList.add('active');
    }
  });
}

function initPomodoro() {
  pomLoadStats();
  pomUpdateUI();

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      pomSetMode(btn.dataset.mode);
    });
  });

  document.getElementById('pomStartBtn')?.addEventListener('click', pomStart);
  document.getElementById('pomResetBtn')?.addEventListener('click', pomReset);

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ═══════════════════════════════════════════════════════════
// GALLERY CAROUSEL WITH AUTO-SCROLL
// ═══════════════════════════════════════════════════════════

let galleryAutoScroll = null;
let galleryIsManual = false;

function initGallery() {
  const track = document.getElementById('galleryTrack');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');

  if (!track) return;

  const scroll = (direction) => {
    const scrollAmount = 220; // item width + gap
    if (direction === 'next') {
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
    
    // Reset manual scroll timer
    galleryIsManual = true;
    clearInterval(galleryAutoScroll);
    setTimeout(() => {
      galleryIsManual = false;
      startGalleryAutoScroll();
    }, 5000); // Reinicia auto-scroll después de 5 segundos
  };

  if (prevBtn) prevBtn.addEventListener('click', () => scroll('prev'));
  if (nextBtn) nextBtn.addEventListener('click', () => scroll('next'));

  // Start auto-scroll
  startGalleryAutoScroll();
}

function startGalleryAutoScroll() {
  const track = document.getElementById('galleryTrack');
  if (!track || galleryIsManual) return;

  galleryAutoScroll = setInterval(() => {
    const scrollAmount = 220;
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (track.scrollLeft >= maxScroll) {
      // Reset to beginning with animation
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, 4000); // Auto-scroll cada 4 segundos
}

// ═══════════════════════════════════════════════════════════
// FINANCES SYSTEM
// ═══════════════════════════════════════════════════════════

const FINANCES_KEY = 'once_finances_v1';

function getFinances() {
  try {
    return JSON.parse(localStorage.getItem(FINANCES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFinances(finances) {
  localStorage.setItem(FINANCES_KEY, JSON.stringify(finances));
}

function addFinance() {
  const descripcion = document.getElementById('gastoDescripcion');
  const monto = document.getElementById('gastoMonto');
  const categoria = document.getElementById('gastoCategoria');

  if (!descripcion || !descripcion.value.trim()) {
    showToast('⚠️ Describe el gasto primero');
    return;
  }

  if (!monto || !monto.value || monto.value <= 0) {
    showToast('⚠️ Ingresa un monto válido');
    return;
  }

  const gasto = {
    id: crypto.randomUUID(),
    descripcion: descripcion.value.trim(),
    monto: parseFloat(monto.value),
    categoria: categoria?.value || 'Otro',
    fecha: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  const finances = getFinances();
  finances.push(gasto);
  saveFinances(finances);

  descripcion.value = '';
  monto.value = '';
  categoria.value = 'Alimentación';

  renderFinances();
  updateFinanceStats();
  showToast('💰 Gasto registrado');
}

function deleteFinance(id) {
  const finances = getFinances().filter(g => g.id !== id);
  saveFinances(finances);
  renderFinances();
  updateFinanceStats();
  showToast('🗑️ Gasto eliminado');
}

function renderFinances() {
  const list = document.getElementById('listaGastos');
  if (!list) return;

  const finances = getFinances().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (finances.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <p>Sin gastos registrados</p>
        <p class="empty-desc">¡Empieza a registrar! 📊</p>
      </div>
    `;
    return;
  }

  list.innerHTML = finances.map((gasto, index) => {
    const fecha = new Date(gasto.fecha).toLocaleDateString('es-ES');
    return `
      <div class="finance-card" style="animation-delay: ${index * 0.05}s">
        <div class="finance-left">
          <div class="finance-category">${gasto.categoria}</div>
          <div class="finance-description">${escapeHtml(gasto.descripcion)}</div>
          <div class="finance-fecha">${fecha}</div>
        </div>
        <div class="finance-right">
          <div class="finance-amount">$${gasto.monto.toFixed(2)}</div>
          <button class="finance-delete" onclick="deleteFinance('${gasto.id}')" aria-label="Eliminar">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function updateFinanceStats() {
  const finances = getFinances();
  
  if (finances.length === 0) {
    document.getElementById('financeTotal').textContent = '$0.00';
    document.getElementById('financeAverage').textContent = '$0.00';
    document.getElementById('financeMax').textContent = '$0.00';
    return;
  }

  const total = finances.reduce((sum, g) => sum + g.monto, 0);
  const promedio = total / finances.length;
  const maximo = Math.max(...finances.map(g => g.monto));

  document.getElementById('financeTotal').textContent = `$${total.toFixed(2)}`;
  document.getElementById('financeAverage').textContent = `$${promedio.toFixed(2)}`;
  document.getElementById('financeMax').textContent = `$${maximo.toFixed(2)}`;
}

function initFinances() {
  const btn = document.getElementById('agregarGasto');
  if (btn) {
    btn.addEventListener('click', addFinance);
  }

  const input = document.getElementById('gastoDescripcion');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addFinance();
    });
  }

  renderFinances();
  updateFinanceStats();
}

// ═══════════════════════════════════════════════════════════
// HABITS SYSTEM
// ═══════════════════════════════════════════════════════════

const HABITS_KEY = 'once_habits_v1';

function getHabits() {
  try {
    return JSON.parse(localStorage.getItem(HABITS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHabits(habits) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

function addHabit() {
  const nombre = document.getElementById('habitoNombre');
  const frecuencia = document.getElementById('habitoFrecuencia');

  if (!nombre || !nombre.value.trim()) {
    showToast('⚠️ Describe tu hábito primero');
    return;
  }

  const habit = {
    id: crypto.randomUUID(),
    nombre: nombre.value.trim(),
    frecuencia: frecuencia?.value || 'daily',
    completados: [],
    racha: 0,
    maxRacha: 0,
    createdAt: new Date().toISOString()
  };

  const habits = getHabits();
  habits.push(habit);
  saveHabits(habits);

  nombre.value = '';
  frecuencia.value = 'daily';

  renderHabits();
  updateHabitStats();
  showToast('🎯 Hábito agregado');
}

function toggleHabit(id) {
  const habits = getHabits();
  const habit = habits.find(h => h.id === id);
  
  if (habit) {
    const today = new Date().toDateString();
    const completados = habit.completados || [];
    
    const index = completados.indexOf(today);
    if (index > -1) {
      completados.splice(index, 1);
      habit.racha = 0;
    } else {
      completados.push(today);
      habit.completados = completados;
      habit.racha = (habit.racha || 0) + 1;
      if (habit.racha > (habit.maxRacha || 0)) {
        habit.maxRacha = habit.racha;
      }
    }
    
    saveHabits(habits);
    renderHabits();
    updateHabitStats();
    
    if (index === -1) {
      showToast('🔥 ¡Lo estás logrando! Racha: ' + habit.racha);
    }
  }
}

function deleteHabit(id) {
  const habits = getHabits().filter(h => h.id !== id);
  saveHabits(habits);
  renderHabits();
  updateHabitStats();
  showToast('🗑️ Hábito eliminado');
}

function renderHabits() {
  const list = document.getElementById('listaHabitos');
  if (!list) return;

  const habits = getHabits().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const today = new Date().toDateString();

  if (habits.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <p>Sin hábitos creados</p>
        <p class="empty-desc">¡Empieza tu transformación! ✨</p>
      </div>
    `;
    return;
  }

  list.innerHTML = habits.map((habit, index) => {
    const completado = (habit.completados || []).includes(today);
    const frecuenciaEmoji = habit.frecuencia === 'daily' ? '📅' : habit.frecuencia === 'weekly' ? '📆' : '📊';
    
    return `
      <div class="habit-card ${completado ? 'completado' : ''}" style="animation-delay: ${index * 0.05}s">
        <div class="habit-check ${completado ? 'done' : ''}" 
             onclick="toggleHabit('${habit.id}')"
             role="checkbox" 
             aria-checked="${completado}"
             tabindex="0">
          ${completado ? '✓' : ''}
        </div>
        <div class="habit-info">
          <div class="habit-nombre">${escapeHtml(habit.nombre)}</div>
          <div class="habit-meta">
            <span class="habit-frecuencia">${frecuenciaEmoji} ${habit.frecuencia === 'daily' ? 'Diario' : habit.frecuencia === 'weekly' ? 'Semanal' : 'Mensual'}</span>
            <span class="habit-racha">🔥 Racha: ${habit.racha || 0}</span>
            <span class="habit-max">🏆 Max: ${habit.maxRacha || 0}</span>
          </div>
        </div>
        <button class="habit-delete" onclick="deleteHabit('${habit.id}')" aria-label="Eliminar">🗑️</button>
      </div>
    `;
  }).join('');
}

function updateHabitStats() {
  const habits = getHabits();
  const today = new Date().toDateString();
  const completadosHoy = habits.filter(h => (h.completados || []).includes(today)).length;
  const maxRacha = Math.max(...habits.map(h => h.maxRacha || 0), 0);

  document.getElementById('habitsTotal').textContent = habits.length;
  document.getElementById('habitsMaxStreak').textContent = maxRacha;
  document.getElementById('habitsCompleted').textContent = completadosHoy;
}

function initHabits() {
  const btn = document.getElementById('agregarHabito');
  if (btn) {
    btn.addEventListener('click', addHabit);
  }

  const input = document.getElementById('habitoNombre');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addHabit();
    });
  }

  renderHabits();
  updateHabitStats();
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function setupEventListeners() {
  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // Profile button (placeholder)
  document.getElementById('profileBtn')?.addEventListener('click', () => {
    showToast('👑 Eres increíble');
  });
}

// ═══════════════════════════════════════════════════════════
// GRADIENTS FOR SVG (Pomodoro)
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const svg = document.querySelector('.timer-ring');
  if (svg) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'gradientStroke');
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#ff6b9d');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#00b4d8');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.insertBefore(defs, svg.firstChild);
  }
});

// ═══════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + 1: Inicio
  if ((e.ctrlKey || e.metaKey) && e.key === '1') {
    e.preventDefault();
    showSection('inicio');
  }
  // Ctrl/Cmd + 2: Tareas
  if ((e.ctrlKey || e.metaKey) && e.key === '2') {
    e.preventDefault();
    showSection('tareas');
  }
  // Ctrl/Cmd + 3: Pomodoro
  if ((e.ctrlKey || e.metaKey) && e.key === '3') {
    e.preventDefault();
    showSection('pomodoro');
  }
});

// ═══════════════════════════════════════════════════════════
// REFRESH GREETING EVERY HOUR
// ═══════════════════════════════════════════════════════════

setInterval(updateGreeting, 3600000); // Update every hour