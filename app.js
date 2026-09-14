(() => {
  'use strict';
  const calc = new CalculatorEngine();
  const $ = (s) => document.querySelector(s);
  const main = $('#displayMain');
  const exp = $('#displayExp');
  const parenCue = $('#parenCue');
  const historyEl = $('#history');
  const history = [];
  const flags = {
    shift: $('#flagShift'), hyp: $('#flagHyp'), sd: $('#flagSd'),
    angle: $('#flagAngle'), display: $('#flagDisplay'), k: $('#flagK'), m: $('#flagM')
  };
  const shiftButton = $('[data-action="shift"]');

  // Calculator zoom controls. 100% always means the responsive size the page
  // would normally use on the current browser/window.
  const calculatorPhoto = $('#calculatorPhoto');
  const zoomInButton = $('#zoomIn');
  const zoomOutButton = $('#zoomOut');
  const zoomResetButton = $('#zoomReset');
  const zoomPercentEl = $('#zoomPercent');
  const ZOOM_MIN = 70;
  const ZOOM_MAX = 200;
  const ZOOM_STEP = 10;
  let zoomPercent = 100;
  let baseCalculatorWidth = 0;
  let resizeTimer = 0;

  function toggleFlag(el, on){ el.classList.toggle('on', !!on); }

  function applyCalculatorZoom(){
    if(!calculatorPhoto || !baseCalculatorWidth) return;
    calculatorPhoto.style.width = `${baseCalculatorWidth * zoomPercent / 100}px`;
    zoomPercentEl.textContent = `${zoomPercent}%`;
    zoomInButton.disabled = zoomPercent >= ZOOM_MAX;
    zoomOutButton.disabled = zoomPercent <= ZOOM_MIN;
    zoomResetButton.disabled = zoomPercent === 100;
  }

  function measureBaseCalculatorWidth(){
    if(!calculatorPhoto) return;
    // Remove the inline zoomed width so CSS can determine this browser's
    // responsive 100% size, then scale from that baseline.
    calculatorPhoto.style.width = '';
    const measured = calculatorPhoto.getBoundingClientRect().width;
    if(measured > 0) baseCalculatorWidth = measured;
    applyCalculatorZoom();
  }

  function setCalculatorZoom(nextPercent){
    const snapped = Math.round(nextPercent / ZOOM_STEP) * ZOOM_STEP;
    zoomPercent = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, snapped));
    applyCalculatorZoom();
  }

  function render(){
    const d = calc.formatDisplay();
    main.textContent = d.main;
    exp.textContent = d.exp || '';
    parenCue.textContent = calc.parenCue ? `C${String(calc.parenCue).padStart(2,'0')}` : '';
    toggleFlag(flags.shift, d.flags.shift);
    toggleFlag(flags.hyp, d.flags.hyp);
    toggleFlag(flags.sd, d.flags.mode === 'SD');
    flags.angle.textContent = d.flags.angle;
    flags.angle.classList.add('on');
    flags.display.textContent = d.flags.displayMode === 'NORM' ? '' : d.flags.displayMode;
    toggleFlag(flags.display, d.flags.displayMode !== 'NORM');
    toggleFlag(flags.k, d.flags.constant);
    toggleFlag(flags.m, d.flags.memory);
    shiftButton.classList.toggle('shift-active', !!d.flags.shift);
    historyEl.textContent = history.length ? history.slice(-20).join(' ') : '—';
  }

  function pulse(button){
    if(!button) return;
    button.classList.add('pressed');
    window.setTimeout(() => button.classList.remove('pressed'), 95);
  }

  function press(action, label, button){
    const wasShift = calc.shift;
    calc.handleKey(action);
    history.push(action === 'shift' ? 'SHIFT' : `${wasShift ? '⇧' : ''}${label}`);
    if(history.length > 80) history.splice(0, history.length - 80);
    pulse(button);
    render();
  }

  document.querySelectorAll('.hotkey[data-action]').forEach(btn => {
    btn.addEventListener('click', () => press(btn.dataset.action, btn.dataset.label || btn.getAttribute('aria-label'), btn));
    btn.addEventListener('pointerdown', () => btn.classList.add('pressed'));
    btn.addEventListener('pointerup', () => btn.classList.remove('pressed'));
    btn.addEventListener('pointercancel', () => btn.classList.remove('pressed'));
  });

  const keyMap = {
    '0':'digit0','1':'digit1','2':'digit2','3':'digit3','4':'digit4','5':'digit5','6':'digit6','7':'digit7','8':'digit8','9':'digit9',
    '.':'decimal','+':'plus','-':'minus','*':'mul','/':'div','Enter':'equals','=':'equals','Backspace':'back','Escape':'ac','(':'lparen',')':'rparen'
  };
  window.addEventListener('keydown', (e) => {
    const action = keyMap[e.key];
    if(!action) return;
    e.preventDefault();
    const btn = document.querySelector(`[data-action="${action}"]`);
    press(action, btn?.dataset.label || e.key, btn);
  });

  $('#clearHistory').addEventListener('click', () => { history.length = 0; render(); });

  zoomInButton?.addEventListener('click', () => setCalculatorZoom(zoomPercent + ZOOM_STEP));
  zoomOutButton?.addEventListener('click', () => setCalculatorZoom(zoomPercent - ZOOM_STEP));
  zoomResetButton?.addEventListener('click', () => setCalculatorZoom(100));

  // Recalculate what 100% means if the user resizes the browser or rotates a tablet.
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(measureBaseCalculatorWidth, 120);
  });

  const helpToggle = $('#helpToggle');
  const guide = $('#guide');
  helpToggle?.addEventListener('click', () => {
    const collapsed = guide.classList.toggle('collapsed');
    helpToggle.setAttribute('aria-expanded', String(!collapsed));
    helpToggle.textContent = collapsed ? '顯示說明' : '隱藏說明';
  });

  render();
  // Measure after the first layout pass so 100% exactly matches the original
  // responsive calculator size on this machine.
  window.requestAnimationFrame(measureBaseCalculatorWidth);
  window.calculatorEngine = calc;
})();
