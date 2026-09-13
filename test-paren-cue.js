const {CalculatorEngine}=require('./engine.js');
function key(c,a){ c.handleKey(a); }
function assert(cond,msg){ if(!cond) throw new Error(msg); }

const c=new CalculatorEngine();
key(c,'lparen');
assert(c.parenCue===1,'first ( should show C01');
assert(c.formatDisplay().main==='0','first ( should leave 0 on main display');
key(c,'digit9');
assert(c.parenCue===0,'digit should hide C01');
key(c,'plus'); key(c,'digit6'); key(c,'mul');
key(c,'lparen');
assert(c.parenCue===2,'nested ( before closing outer paren should show C02');
key(c,'digit2');
assert(c.parenCue===0,'digit should hide C02');

const d=new CalculatorEngine();
key(d,'lparen'); key(d,'lparen');
assert(d.parenCue===2,'consecutive (( should show C02');
key(d,'digit3'); key(d,'rparen'); key(d,'rparen'); key(d,'equals');
assert(Math.abs(d.currentValue-3)<1e-12,'nested parentheses should still evaluate');

const e=new CalculatorEngine();
for (const a of ['lparen','digit9','plus','digit6','rparen','mul','digit5','equals']) key(e,a);
assert(Math.abs(e.currentValue-75)<1e-12,'existing parentheses regression: (9+6)*5=75');
console.log('parenthesis cue tests passed');
