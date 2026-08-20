// SimpleHabit - minimal interactivity + persistence (localStorage)
// Drop this file into the repo and include <script src="app.js"></script> before </body>.

(function () {
  const STORAGE_KEY = 'simpleHabit.habits.v1';

  // Elements
  const form = document.getElementById('habitForm');
  const nameInput = document.getElementById('habitName');
  const categoryInput = document.getElementById('habitCategory');
  const frequencyInput = document.getElementById('habitFrequency');
  const habitListContainer = document.querySelector('.habit-list-section');

  // Utilities
  const todayString = () => new Date().toISOString().slice(0, 10);

  function loadHabits() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse habits', e);
      return null;
    }
  }

  function saveHabits(habits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }

  // If no data in storage, import existing static cards so user doesn't lose them
  function importStaticCardsIfNeeded() {
    let habits = loadHabits();
    if (habits && habits.length) return habits;

    const staticCards = Array.from(document.querySelectorAll('.habit-card'));
    if (!staticCards.length) return [];

    habits = staticCards.map((card) => {
      const title = card.querySelector('h3')?.textContent?.trim() || 'Untitled';
      const desc = card.querySelector('p')?.textContent?.trim() || '';
      const tags = Array.from(card.querySelectorAll('.habit-tag')).map(t => t.textContent.trim());
      // naive: map tags to category & frequency if possible
      const frequencyCandidates = ['Mỗi ngày', '3 lần/tuần', 'Cuối tuần'];
      const category = tags.find(t => !frequencyCandidates.includes(t)) || 'Tự do';
      const frequency = tags.find(t => frequencyCandidates.includes(t)) || 'Mỗi ngày';

      return {
        id: 'import-' + Date.now() + Math.random().toString(16).slice(2),
        name: title,
        description: desc,
        category,
        frequency,
        completed: false,
        completions: 0,
        lastCompleted: null,
        createdAt: new Date().toISOString()
      };
    });

    saveHabits(habits);
    return habits;
  }

  function renderHabits(habits) {
    habitListContainer.innerHTML = ''; // clear
    if (!habits || !habits.length) {
      habitListContainer.innerHTML = '<p style="color:#666">Chưa có thói quen nào. Thêm thói quen mới bằng form bên trái.</p>';
      return;
    }

    habits.forEach(habit => {
      const card = document.createElement('div');
      card.className = 'habit-card';
      card.setAttribute('data-id', habit.id);
      card.setAttribute('role', 'listitem');

      const info = document.createElement('div');
      info.className = 'habit-info';

      const h3 = document.createElement('h3');
      h3.textContent = habit.name;
      info.appendChild(h3);

      if (habit.description) {
        const p = document.createElement('p');
        p.textContent = habit.description;
        info.appendChild(p);
      }

      const tagCategory = document.createElement('span');
      tagCategory.className = 'habit-tag';
      tagCategory.textContent = habit.category;
      info.appendChild(tagCategory);

      const tagFreq = document.createElement('span');
      tagFreq.className = 'habit-tag';
      tagFreq.textContent = habit.frequency;
      info.appendChild(tagFreq);

      // Right side controls
      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '8px';
      controls.style.alignItems = 'center';

      const checkBtn = document.createElement('button');
      checkBtn.className = 'check-btn';
      checkBtn.type = 'button';
      checkBtn.title = 'Đánh dấu hoàn thành';
      checkBtn.setAttribute('aria-pressed', String(!!habit.completed));
      checkBtn.textContent = '✓';
      if (habit.completed) {
        checkBtn.classList.add('completed');
      }

      checkBtn.addEventListener('click', () => {
        const habits = loadHabits() || [];
        const idx = habits.findIndex(h => h.id === habit.id);
        if (idx === -1) return;
        const now = todayString();
        // toggle: if not completed today, mark completed and increment
        if (habits[idx].lastCompleted !== now) {
          habits[idx].completions = (habits[idx].completions || 0) + 1;
          habits[idx].lastCompleted = now;
          habits[idx].completed = true;
          checkBtn.classList.add('completed');
          checkBtn.setAttribute('aria-pressed', 'true');
        } else {
          // unmark (allow toggling)
          habits[idx].completed = false;
          habits[idx].lastCompleted = null;
          checkBtn.classList.remove('completed');
          checkBtn.setAttribute('aria-pressed', 'false');
        }
        saveHabits(habits);
        renderHabits(habits);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.title = 'Xóa thói quen';
      delBtn.setAttribute('aria-label', `Xóa ${habit.name}`);
      delBtn.style.border = 'none';
      delBtn.style.background = '#ff6b6b';
      delBtn.style.color = 'white';
      delBtn.style.padding = '6px 10px';
      delBtn.style.borderRadius = '6px';
      delBtn.style.cursor = 'pointer';
      delBtn.textContent = 'Xóa';
      delBtn.addEventListener('click', () => {
        if (!confirm(`Bạn có chắc muốn xóa "${habit.name}"?`)) return;
        let habits = loadHabits() || [];
        habits = habits.filter(h => h.id !== habit.id);
        saveHabits(habits);
        renderHabits(habits);
      });

      // small meta
      const meta = document.createElement('div');
      meta.style.fontSize = '.9rem';
      meta.style.color = '#666';
      meta.style.marginTop = '8px';
      meta.textContent = `Hoàn thành: ${habit.completions || 0}`;

      card.appendChild(info);
      controls.appendChild(checkBtn);
      controls.appendChild(delBtn);
      card.appendChild(controls);
      card.appendChild(meta);

      habitListContainer.appendChild(card);
    });
  }

  function addHabitFromForm(e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    const category = categoryInput.value;
    const frequency = frequencyInput.value;

    const newHabit = {
      id: 'h' + Date.now(),
      name,
      description: '',
      category,
      frequency,
      completed: false,
      completions: 0,
      lastCompleted: null,
      createdAt: new Date().toISOString()
    };

    const habits = loadHabits() || [];
    habits.unshift(newHabit);
    saveHabits(habits);
    renderHabits(habits);
    form.reset();
    nameInput.focus();
  }

  // init
  document.addEventListener('DOMContentLoaded', () => {
    const imported = importStaticCardsIfNeeded();
    const habits = loadHabits() || imported || [];
    renderHabits(habits);
  });

  form.addEventListener('submit', addHabitFromForm);
})();
