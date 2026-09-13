const fs = require('fs');
const vm = require('vm');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
const ctx = { console, Math };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(src, ctx);
const CalculatorEngine = ctx.CalculatorEngine;

function press(c, seq){ seq.forEach(k => c.handleKey(k)); return c; }
function assertClose(actual, expected, msg){
  if (!Number.isFinite(actual) || Math.abs(actual-expected) > 1e-10) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

// User-reported regression: (9+6)×5 = 75
{
  const c = new CalculatorEngine();
  press(c, ['lparen','digit9','plus','digit6','rparen','mul','digit5','equals']);
  if (c.error) throw new Error(`(9+6)*5 unexpectedly errored: ${c.error}`);
  assertClose(c.currentValue, 75, '(9+6)*5');
}

// Parentheses in the right-hand side of an expression.
{
  const c = new CalculatorEngine();
  press(c, ['digit2','mul','lparen','digit3','plus','digit4','rparen','equals']);
  if (c.error) throw new Error(`2*(3+4) unexpectedly errored: ${c.error}`);
  assertClose(c.currentValue, 14, '2*(3+4)');
}

// Two parenthesized factors separated by an explicit multiplication sign.
{
  const c = new CalculatorEngine();
  press(c, ['lparen','digit4','minus','digit1','rparen','mul','lparen','digit6','digit7','digit0','plus','digit3','rparen','equals']);
  if (c.error) throw new Error(`(4-1)*(670+3) unexpectedly errored: ${c.error}`);
  assertClose(c.currentValue, 2019, '(4-1)*(670+3)');
}

// Nested parentheses.
{
  const c = new CalculatorEngine();
  press(c, ['digit2','mul','lparen','digit7','plus','digit6','mul','lparen','digit5','plus','digit4','rparen','rparen','equals']);
  if (c.error) throw new Error(`nested parentheses unexpectedly errored: ${c.error}`);
  assertClose(c.currentValue, 122, '2*(7+6*(5+4))');
}

console.log('Parentheses regression tests passed.');
