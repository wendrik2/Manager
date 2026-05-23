// ============================================================
// TODO APP — app.js (з підтримкою i18n — перемикання мов)
// ============================================================


// -------------------------------------------------------
// 1. СЛОВНИК ПЕРЕКЛАДІВ (i18n)
//    Об'єкт з ключами-мовами. Кожна мова — об'єкт з рядками.
//    Щоб додати нову мову — просто додай новий ключ.
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
    // Форми лічильника: 1 активна / 2 активних / 5 активних
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
// 2. СТАН ПРОГРАМИ
// -------------------------------------------------------

let tasks  = loadFromStorage();
let filter = 'all';

// Мову також зберігаємо в localStorage — щоб запам'ятовувалась
let lang = localStorage.getItem('lang') || 'uk';


// -------------------------------------------------------
// 3. ПОСИЛАННЯ НА DOM-ЕЛЕМЕНТИ
// -------------------------------------------------------

const taskInput   = document.getElementById('taskInput');
const addBtn      = document.getElementById('addBtn');
const taskList    = document.getElementById('taskList');
const filters     = document.getElementById('filters');
const taskCount   = document.getElementById('taskCount');
const clearBtn    = document.getElementById('clearBtn');
const langSwitcher = document.getElementById('langSwitcher');


// -------------------------------------------------------
// 4. ІНІЦІАЛІЗАЦІЯ
// -------------------------------------------------------

applyLang(); // спочатку застосовуємо мову
render();    // потім малюємо список


// -------------------------------------------------------
// 5. ОБРОБНИКИ ПОДІЙ
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

// Перемикач мов — теж event delegation
langSwitcher.addEventListener('click', function(event) {
  const btn = event.target.closest('.lang-btn');
  if (!btn) return;

  lang = btn.dataset.lang; // 'uk' | 'en' | 'de'

  // Зберігаємо вибір мови в localStorage
  localStorage.setItem('lang', lang);

  // Підсвічуємо активну кнопку мови
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  applyLang(); // перекладаємо всі статичні тексти
  render();    // перемальовуємо динамічні (лічильник, порожній стан)
});


// -------------------------------------------------------
// 6. ФУНКЦІЯ ЗАСТОСУВАННЯ МОВИ
//    Знаходить всі елементи з data-i18n і замінює їх текст
// -------------------------------------------------------

function applyLang() {
  const t = TRANSLATIONS[lang]; // отримуємо словник поточної мови

  /*
    Шукаємо всі елементи, у яких є атрибут data-i18n.
    Формат значення: "тип:ключ"
    Приклади:
      data-i18n="text:filterAll"           → замінить innerText
      data-i18n="placeholder:inputPlaceholder" → замінить placeholder
  */
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    const [type, key] = el.dataset.i18n.split(':');
    // type — що саме міняємо: 'text' або 'placeholder'
    // key  — ключ в словнику TRANSLATIONS

    if (type === 'text') {
      el.textContent = t[key];
    } else if (type === 'placeholder') {
      el.placeholder = t[key];
    }
  });

  // Оновлюємо атрибут lang на <html> — важливо для accessibility і SEO
  document.documentElement.lang = lang;

  // Синхронізуємо підсвічування кнопки мови (при завантаженні сторінки)
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}


// -------------------------------------------------------
// 7. ФУНКЦІЯ ДОДАВАННЯ ЗАДАЧІ
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
// 8. ПЕРЕМИКАННЯ / ВИДАЛЕННЯ ЗАДАЧІ
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
// 9. ВІДРИСОВКА
// -------------------------------------------------------

function render() {
  const t = TRANSLATIONS[lang]; // перекладений словник

  let visibleTasks;
  if (filter === 'all')    visibleTasks = tasks;
  if (filter === 'active') visibleTasks = tasks.filter(t => !t.done);
  if (filter === 'done')   visibleTasks = tasks.filter(t =>  t.done);

  taskList.innerHTML = '';

  // Порожній стан — текст береться з перекладів
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

  // Лічильник активних задач
  const activeCount = tasks.filter(t => !t.done).length;
  taskCount.textContent = activeCount + ' ' + plural(activeCount, t.countOne, t.countFew, t.countMany);
}


// -------------------------------------------------------
// 10. ЛОКАЛЬНЕ СХОВИЩЕ
// -------------------------------------------------------

function saveToStorage() {
  localStorage.setItem('todos', JSON.stringify(tasks));
}

function loadFromStorage() {
  const data = localStorage.getItem('todos');
  return data ? JSON.parse(data) : [];
}


// -------------------------------------------------------
// 11. ДОПОМІЖНІ ФУНКЦІЇ
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

// Відмінювання: для EN/DE завжди повертає countOne (вони однакові)
function plural(n, one, few, many) {
  if (lang !== 'uk' && lang !== 'cs') return one; // в EN і DE форма одна
  const mod10  = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
