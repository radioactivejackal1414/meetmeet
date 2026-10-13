(() => {
  const daysEl = document.getElementById('cal-days');
  const titleEl = document.getElementById('cal-title');
  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');
  const countEl = document.getElementById('cal-count');
  const clearBtn = document.getElementById('cal-clear');

  // Selected dates as "YYYY-MM-DD" strings. Kept across month changes.
  const selected = new Set();

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  let viewYear = thisYear;
  let viewMonth = thisMonth;

  // Build the string by hand; toISOString() converts to UTC and can be off by a day.
  const toIso = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayIso = toIso(thisYear, thisMonth, now.getDate());

  function render() {
    titleEl.textContent = new Date(viewYear, viewMonth, 1).toLocaleDateString(
      undefined, { month: 'long', year: 'numeric' }
    );
    prevBtn.disabled = viewYear === thisYear && viewMonth === thisMonth;

    daysEl.innerHTML = '';

    // Blank cells so day 1 lands under the right weekday (0 = Sunday)
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    for (let i = 0; i < firstWeekday; i++) {
      const blank = document.createElement('div');
      blank.className = 'cal-blank';
      daysEl.appendChild(blank);
    }

    // Day 0 of the next month is the last day of this one
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toIso(viewYear, viewMonth, d);
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.textContent = d;
      cell.dataset.date = iso;
      cell.setAttribute('role', 'gridcell');

      if (iso < todayIso) {
        // ISO strings sort the same as the dates they represent
        cell.classList.add('disabled');
        cell.setAttribute('aria-disabled', 'true');
      } else {
        cell.tabIndex = 0;
        cell.setAttribute('aria-selected', selected.has(iso));
      }
      if (iso === todayIso) cell.classList.add('today');
      if (selected.has(iso)) cell.classList.add('selected');

      daysEl.appendChild(cell);
    }
  }

  function updateSummary() {
    const n = selected.size;
    countEl.textContent =
      n === 0 ? 'No dates selected' : `${n} date${n === 1 ? '' : 's'} selected`;
  }

  function setCell(cell, on) {
    if (!cell || !cell.classList.contains('cal-day') ||
        cell.classList.contains('disabled')) return;
    if (on) selected.add(cell.dataset.date);
    else selected.delete(cell.dataset.date);
    cell.classList.toggle('selected', on);
    cell.setAttribute('aria-selected', on);
    updateSummary();
  }

  // Click-and-drag: the first cell decides whether the drag selects or deselects.
  let dragging = false;
  let paintOn = true;

  daysEl.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.cal-day');
    if (!cell || cell.classList.contains('disabled')) return;
    e.preventDefault();
    dragging = true;
    paintOn = !selected.has(cell.dataset.date);
    setCell(cell, paintOn);
  });

  daysEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    // elementFromPoint also works for touch, where events stay on the first cell
    const el = document.elementFromPoint(e.clientX, e.clientY);
    setCell(el && el.closest('.cal-day'), paintOn);
  });

  const stopDrag = () => { dragging = false; };
  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);

  // Keyboard support
  daysEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const cell = e.target.closest('.cal-day');
    if (!cell) return;
    e.preventDefault();
    setCell(cell, !selected.has(cell.dataset.date));
  });

  prevBtn.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    render();
  });
  nextBtn.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    render();
  });
  clearBtn.addEventListener('click', () => {
    selected.clear();
    render();
    updateSummary();
  });

  // The form on the right half can call this to get the chosen dates.
  window.getSelectedDates = () => [...selected].sort();

  render();
  updateSummary();
})();