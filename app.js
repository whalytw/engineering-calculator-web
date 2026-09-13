(() => {
  'use strict';
  const calc = new CalculatorEngine();
  const $ = (s) => document.querySelector(s);
  const main = $('#displayMain');
  const exp = $('#displayExp');
  const historyEl = $('#history');
  const history = [];
  const flags = {
    shift: $('#flagShift'), hyp: $('#flagHyp'), sd: $('#flagSd'),
    angle: $('#flagAngle'), display: $('#flagDisplay'), k: $('#flagK'), m: $('#flagM')
  };
  const shiftButton = $('[data-action="shift"]');

  function toggleFlag(el, on){ el.classList.toggle('on', !!on); }

  function render(){
    const d = calc.formatDisplay();
    main.textContent = d.main;
    exp.textContent = d.exp || '';
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
  const helpToggle = $('#helpToggle');
  const guide = $('#guide');
  helpToggle?.addEventListener('click', () => {
    const collapsed = guide.classList.toggle('collapsed');
    helpToggle.setAttribute('aria-expanded', String(!collapsed));
    helpToggle.textContent = collapsed ? '顯示說明' : '隱藏說明';
  });

  render();
  window.calculatorEngine = calc;
})();
