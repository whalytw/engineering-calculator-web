const {CalculatorEngine}=require('./engine.js');
function assert(cond,msg){ if(!cond) throw new Error(msg); }
const c=new CalculatorEngine();
c.handleKey('mode'); c.handleKey('decimal'); // SD
assert(c.calcMode==='SD','should enter SD mode');
c.handleKey('digit1'); c.handleKey('digit2'); c.handleKey('mplus'); // 12 DATA
c.handleKey('digit3'); c.handleKey('digit4'); c.handleKey('mplus'); // 34 DATA
assert(c.stats.length===2,'two data values should be stored');
c.handleKey('shift'); c.handleKey('ac'); // SAC
assert(c.calcMode==='SD','SAC must remain in SD mode');
assert(c.stats.length===0,'SAC must clear all statistical data');
assert(c.currentValue===0 && c.entry==='0','SAC must return display/input to zero');
assert(!c.error,'SAC should not cause an error');
// n should report 0 after SAC.
c.handleKey('shift'); c.handleKey('digit6');
assert(c.currentValue===0 && !c.error,'n should be 0 after SAC');
console.log('PASS: SHIFT+AC (SAC) clears DATA and leaves SD with n=0');
