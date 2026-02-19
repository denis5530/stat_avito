(function () {
  'use strict';

  var DAYS_COUNT = 30;

  var WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  var MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

  function splitToSegments(total) {
    if (total <= 0) return { contacts: 0, messages: 0, calls: 0 };
    var c = Math.min(total, Math.round(total * (0.45 + Math.random() * 0.15)));
    var rest = total - c;
    var p = Math.random() < 0.6 ? Math.min(rest, Math.round(rest * (0.08 + Math.random() * 0.15))) : 0;
    var m = rest - p;
    return { contacts: c, messages: m, calls: p };
  }

  // Всегда ровно 30 дней от startDate
  function generateData(opts) {
    var start = new Date(opts.startDate);
    if (isNaN(start.getTime())) start = new Date(2026, 0, 21);

    var out = [];
    var startCount = opts.startCount || 4;
    var endCount = opts.endCount || 11;
    var spread = opts.spread || 0.35;

    for (var i = 0; i < DAYS_COUNT; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var t = i / (DAYS_COUNT - 1);
      var base = startCount + (endCount - startCount) * t;
      var noise = (Math.random() * 2 - 1) * spread;
      var total = Math.max(0, Math.round(base * (1 + noise)));
      var seg = splitToSegments(total);
      out.push({
        date: String(d.getDate()),
        weekday: WEEKDAYS[d.getDay()],
        contacts: seg.contacts,
        messages: seg.messages,
        calls: seg.calls
      });
    }

    return out;
  }

  function totalOfDay(day) {
    return (day.contacts || 0) + (day.messages || 0) + (day.calls || 0);
  }

  function monthText(d, withYear) {
    var name = MONTHS[d.getMonth()];
    return withYear ? name + ' ' + d.getFullYear() : name;
  }

  function renderChart(root, data) {
    if (!root) return;

    root.innerHTML = '';

    // Жёстко: только 30 дней
    if (!data || data.length !== DAYS_COUNT) {
      data = generateData({ startDate: '2026-01-21', startCount: 4, endCount: 11, spread: 0.35 });
    }

    var maxVal = 1;
    for (var i = 0; i < DAYS_COUNT; i++) {
      var v = totalOfDay(data[i]);
      if (v > maxVal) maxVal = v;
    }

    // Порядок сегментов снизу вверх: calls, messages, contacts
    var keys = ['calls', 'messages', 'contacts'];

    // Ряд столбиков — все на одной базовой линии
    var barsRow = document.createElement('div');
    barsRow.className = 'chart__bars';

    // Ряд подписей — ниже уровня столбиков, ячейки в одну сетку со столбами
    var labelsRow = document.createElement('div');
    labelsRow.className = 'chart__labels';

    for (var idx = 0; idx < DAYS_COUNT; idx++) {
      var item = data[idx];

      var bar = document.createElement('div');
      bar.className = 'chart__bar';

      var segWrap = document.createElement('div');
      segWrap.className = 'chart__segments';

      for (var k = 0; k < keys.length; k++) {
        var val = item[keys[k]] || 0;
        if (val <= 0) continue;
        var seg = document.createElement('div');
        seg.className = 'chart__segment chart__segment--' + keys[k];
        seg.style.height = (val / maxVal) * 100 + '%';
        segWrap.appendChild(seg);
      }

      bar.appendChild(segWrap);
      barsRow.appendChild(bar);

      // Ячейка подписи: текст только у 2-го, 4-го, 6-го... столбика; первая без подписи
      var cell = document.createElement('div');
      cell.className = 'chart__label-cell';
      if (idx > 0 && idx % 2 === 1) {
        cell.innerHTML = '<span class="chart__label-date">' + item.date + '</span><span class="chart__label-weekday">' + item.weekday + '</span>';
      }
      labelsRow.appendChild(cell);
    }

    root.appendChild(barsRow);
    root.appendChild(labelsRow);
  }

  function setTotal(el, data) {
    if (!el || !data) return;
    var sum = 0;
    for (var i = 0; i < data.length; i++) sum += totalOfDay(data[i]);
    el.textContent = sum;
  }

  function setMonths(leftEl, rightEl, startDate, endDate) {
    if (!leftEl || !rightEl) return;
    var start = new Date(startDate);
    var end = new Date(endDate);
    leftEl.textContent = monthText(start, true);
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      rightEl.textContent = '';
    } else {
      rightEl.textContent = monthText(end, start.getFullYear() !== end.getFullYear());
    }
  }

  function init() {
    var root = document.querySelector('[data-chart-root]');
    var totalEl = document.getElementById('total-value');
    var startInput = document.getElementById('start-date');
    var endInput = document.getElementById('end-date');
    var startCountInput = document.getElementById('start-count');
    var endCountInput = document.getElementById('end-count');
    var spreadInput = document.getElementById('spread');
    var spreadValEl = document.getElementById('spread-value');
    var btn = document.getElementById('generate-chart');
    var errEl = document.getElementById('error-message');

    if (!root || !totalEl || !startInput || !btn) return;

    var defaults = {
      startDate: '2026-01-21',
      startCount: 4,
      endCount: 11,
      spread: 0.35
    };

    startInput.value = defaults.startDate;
    var endDefault = new Date(defaults.startDate);
    endDefault.setDate(endDefault.getDate() + DAYS_COUNT - 1);
    endInput.value = endDefault.toISOString().slice(0, 10);
    startCountInput.value = defaults.startCount;
    endCountInput.value = defaults.endCount;
    spreadInput.value = defaults.spread;
    if (spreadValEl) spreadValEl.textContent = Math.round(defaults.spread * 100) + '%';

    var chartData = generateData(defaults);
    renderChart(root, chartData);
    setTotal(totalEl, chartData);
    setMonths(
      document.getElementById('left-month'),
      document.getElementById('right-month'),
      defaults.startDate,
      endDefault.toISOString().slice(0, 10)
    );

    if (spreadInput && spreadValEl) {
      spreadInput.addEventListener('input', function () {
        spreadValEl.textContent = Math.round(Number(spreadInput.value) * 100) + '%';
      });
    }

    if (startInput && endInput) {
      startInput.addEventListener('change', function () {
        var s = startInput.value;
        if (!s) return;
        var d = new Date(s);
        if (isNaN(d.getTime())) return;
        var e = new Date(d);
        e.setDate(e.getDate() + DAYS_COUNT - 1);
        endInput.value = e.toISOString().slice(0, 10);
      });
    }

    btn.addEventListener('click', function () {
      if (errEl) errEl.textContent = '';

      var startStr = startInput.value;
      if (!startStr) {
        if (errEl) errEl.textContent = 'Выбери дату начала.';
        return;
      }

      var startNum = Number(startCountInput.value);
      var endNum = Number(endCountInput.value);
      if (isNaN(startNum) || isNaN(endNum) || startNum < 0 || endNum < 0) {
        if (errEl) errEl.textContent = 'Укажи число заявок (0 или больше).';
        return;
      }

      var chartData = generateData({
        startDate: startStr,
        startCount: startNum,
        endCount: endNum,
        spread: Number(spreadInput.value) || 0.35
      });

      renderChart(root, chartData);
      setTotal(totalEl, chartData);

      var start = new Date(startStr);
      var end = new Date(start);
      end.setDate(end.getDate() + DAYS_COUNT - 1);
      setMonths(
        document.getElementById('left-month'),
        document.getElementById('right-month'),
        startStr,
        end.toISOString().slice(0, 10)
      );
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
