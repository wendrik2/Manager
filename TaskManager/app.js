// ============================================================
// TODO APP — app.js (with i18n support — language switching)
// ============================================================


// -------------------------------------------------------
// 1. TRANSLATIONS DICTIONARY (i18n)
//    Object with language keys. Each language is an object with strings.
//    To add a new language — just add a new key.
// -------------------------------------------------------

const TRANSLATIONS = {
  uk: {
    inputPlaceholder: 'Нова задача...',
    filterAll:        'Всі',
    filterActive:     'Активні',
    filterDone:       'Виконані',
    clearBtn:         'Очистити виконані',
    deleteTitle:      'Видалити',
    emptyList:        'Задач поки немає ✦',
    countOne:         'активна',
    countFew:         'активних',
    countMany:        'активних',
  },
  en: {
    inputPlaceholder: 'New task...',
    filterAll:        'All',
    filterActive:     'Active',
    filterDone:       'Done',
    clearBtn:         'Clear completed',
    deleteTitle:      'Delete',
    emptyList:        'No tasks yet ✦',
    countOne:         'active',
    countFew:         'active',
    countMany:        'active',
  },
  de: {
    inputPlaceholder: 'Neue Aufgabe...',
    filterAll:        'Alle',
    filterActive:     'Aktiv',
    filterDone:       'Erledigt',
    clearBtn:         'Erledigte löschen',
    deleteTitle:      'Löschen',
    emptyList:        'Noch keine Aufgaben ✦',
    countOne:         'aktiv',
    countFew:         'aktiv',
    countMany:        'aktiv',
  },
  cs: {
    inputPlaceholder: 'Nový úkol...',
    filterAll:        'Vše',
    filterActive:     'Aktivní',
    filterDone:       'Hotovo',
    clearBtn:         'Vymazat dokončené',
    deleteTitle:      'Smazat',
    emptyList:        'Zatím žádné úkoly ✦',
    countOne:         'aktivní',
    countFew:         'aktivní',
    countMany:        'aktivních',
  },
};


// -------------------------------------------------------
// 2. APPLICATION STATE
// -------------------------------------------------------

let tasks  = loadFromStorage();
let filter = 'all';

// Language is also stored in localStorage — to remember user preference
let lang = localStorage.getItem('lang') || 'uk';


// -------------------------------------------------------
// 3. DOM ELEMENT REFERENCES
// -------------------------------------------------------

const taskInput    = document.getElementById('taskInput');
const addBtn       = document.getElementById('addBtn');
const taskList     = document.getElementById('taskList');
const filters      = document.getElementById('filters');
const taskCount    = document.getElementById('taskCount');
const clearBtn     = document.getElementById('clearBtn');
const langSwitcher = document.getElementById('langSwitcher');


// -------------------------------------------------------
// 4. INITIALIZATION
// -------------------------------------------------------

applyLang(); // apply language first
render();    // then render the list


// -------------------------------------------------------
// 5. EVENT LISTENERS
// -------------------------------------------------------

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') addTask();
});

filters.addEventListener('click', function(event) {
  const btn = event.target.closest('.filter-btn');
  if (!btn) return;

  filter = btn.dataset.filter;

  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  render();
});

clearBtn.addEventListener('click', function() {
  tasks = tasks.filter(task => !task.done);
  saveToStorage();
  render();
});

// Language switcher — also uses event delegation
langSwitcher.addEventListener('click', function(event) {
  const btn = event.target.closest('.lang-btn');
  if (!btn) return;

  lang = btn.dataset.lang; // 'uk' | 'en' | 'de' | 'cs'

  // Save language choice to localStorage
  localStorage.setItem('lang', lang);

  // Highlight active language button
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  applyLang(); // translate all static texts
  render();    // re-render dynamic parts (counter, empty state)
});


// -------------------------------------------------------
// 6. APPLY LANGUAGE FUNCTION
//    Finds all elements with data-i18n and replaces their text
// -------------------------------------------------------

function applyLang() {
  const t = TRANSLATIONS[lang]; // get current language dictionary

  /*
    Find all elements with data-i18n attribute.
    Value format: "type:key"
    Examples:
      data-i18n="text:filterAll"               → replaces innerText
      data-i18n="placeholder:inputPlaceholder" → replaces placeholder
  */
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    const [type, key] = el.dataset.i18n.split(':');
    // type — what to change: 'text' or 'placeholder'
    // key  — key in TRANSLATIONS dictionary

    if (type === 'text') {
      el.textContent = t[key];
    } else if (type === 'placeholder') {
      el.placeholder = t[key];
    }
  });

  // Update lang attribute on <html> — important for accessibility and SEO
  document.documentElement.lang = lang;

  // Sync language button highlight (on page load)
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}


// -------------------------------------------------------
// 7. ADD TASK FUNCTION
// -------------------------------------------------------

function addTask() {
  const text = taskInput.value.trim();
  if (!text) { shakeInput(); return; }

  tasks.push({ id: Date.now(), text: text, done: false });
  saveToStorage();

  taskInput.value = '';
  taskInput.focus();
  render();
}


// -------------------------------------------------------
// 8. TOGGLE / DELETE TASK
// -------------------------------------------------------

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  saveToStorage();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveToStorage();
  render();
}


// -------------------------------------------------------
// 9. RENDER FUNCTION
// -------------------------------------------------------

function render() {
  const t = TRANSLATIONS[lang]; // translated dictionary

  let visibleTasks;
  if (filter === 'all')    visibleTasks = tasks;
  if (filter === 'active') visibleTasks = tasks.filter(t => !t.done);
  if (filter === 'done')   visibleTasks = tasks.filter(t =>  t.done);

  taskList.innerHTML = '';

  // Empty state — text comes from translations
  if (visibleTasks.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-msg';
    li.textContent = t.emptyList;
    taskList.appendChild(li);
  } else {
    visibleTasks.forEach(function(task) {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '');

      li.innerHTML = `
        <div class="task-checkbox"></div>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button class="delete-btn" title="${t.deleteTitle}">✕</button>
      `;

      li.addEventListener('click', function(event) {
        if (event.target.closest('.delete-btn')) return;
        toggleTask(task.id);
      });

      li.querySelector('.delete-btn').addEventListener('click', function(event) {
        event.stopPropagation();
        deleteTask(task.id);
      });

      taskList.appendChild(li);
    });
  }

  // Active tasks counter
  const activeCount = tasks.filter(t => !t.done).length;
  taskCount.textContent = activeCount + ' ' + plural(activeCount, t.countOne, t.countFew, t.countMany);
}


// -------------------------------------------------------
// 10. LOCAL STORAGE
// -------------------------------------------------------

function saveToStorage() {
  localStorage.setItem('todos', JSON.stringify(tasks));
}

function loadFromStorage() {
  const data = localStorage.getItem('todos');
  return data ? JSON.parse(data) : [];
}


// -------------------------------------------------------
// 11. HELPER FUNCTIONS
// -------------------------------------------------------

function shakeInput() {
  taskInput.style.animation = 'none';
  taskInput.offsetHeight;
  taskInput.style.animation = 'shake 0.3s ease';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Pluralization: for EN/DE always returns countOne (they are the same)
function plural(n, one, few, many) {
  if (lang !== 'uk' && lang !== 'cs') return one; // EN and DE have one form
  const mod10  = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}