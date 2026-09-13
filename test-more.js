const {CalculatorEngine}=require('./engine.js');
function run(seq){let c=new CalculatorEngine(); for(const a of seq)c.handleKey(a); return c;}
function p(name,seq){const c=run(seq);const d=c.formatDisplay();console.log(name, d.main, d.exp, d.raw, c.status, c.stats?.length);}
p('basic2', ['digit5','digit6','div','digit1','digit2','sign','div','digit2','decimal','digit5','sign','equals']);
p('precedence', ['digit7','mul','digit8','minus','digit4','mul','digit5','equals']);
p('sqrt expression',['digit2','shift','square','plus','digit3','shift','square','mul','digit5','shift','square','equals']);
p('cuberoot',['digit5','shift','sign','plus','digit2','digit7','sign','shift','sign','equals']);
p('recip',['digit3','shift','rparen','minus','digit4','shift','rparen','equals']);
p('memory',['digit5','digit3','plus','digit6','equals','shift','mr','digit2','digit3','minus','digit8','mplus','digit5','digit6','mul','digit2','mplus','digit9','digit9','div','digit4','mplus','mr']);
p('fix2',['mode','digit7','digit2','digit1','decimal','digit2','digit3','digit4','plus','digit1','decimal','digit2','digit3','digit4','equals']);
p('sci2',['mode','digit8','digit2','digit1','div','digit3','equals']);
p('norm1',['digit1','div','digit2','digit0','digit0','equals']);
p('norm2',['mode','digit9','digit1','div','digit2','digit0','digit0','equals']);
p('dmsadd',['digit1','digit4','dms','digit2','digit5','dms','digit3','digit6','dms','plus','digit1','digit2','dms','digit2','digit3','dms','digit3','digit4','dms','equals']);
p('coord',['digit3','shift','plus','digit4','equals']);
let c=new CalculatorEngine(); ['mode','decimal','shift','ac','digit5','digit5','mplus','digit5','digit4','mplus','digit5','digit1','mplus','digit5','digit5','mplus','digit5','digit3','mplus','mplus','digit5','digit4','mplus','digit5','digit2','mplus','shift','digit7'].forEach(k=>c.handleKey(k)); console.log('stats mean',c.formatDisplay(),c.stats);
