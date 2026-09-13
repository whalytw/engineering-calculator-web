const {CalculatorEngine}=require('./engine.js');
function near(a,b,eps=1e-12){return Math.abs(a-b)<eps;}
function value(c){ return c.entering ? c._parseEntry() : c.currentValue; }
let c=new CalculatorEngine();
c.handleKey('expkey');
if(!near(value(c),Math.PI)) throw new Error('Bare EXP should display pi');

c=new CalculatorEngine();
c.handleKey('shift'); c.handleKey('expkey');
if(!near(value(c),Math.PI)) throw new Error('SHIFT+EXP should display pi');

c=new CalculatorEngine();
c.handleKey('digit2'); c.handleKey('expkey'); c.handleKey('digit3');
if(Math.abs(value(c)-2000)>1e-9) throw new Error('2 EXP 3 should still mean 2e3');
console.log('EXP/π regression tests passed');
