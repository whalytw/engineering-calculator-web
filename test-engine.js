const {CalculatorEngine}=require('./engine.js');
function run(seq){const c=new CalculatorEngine(); for(const a of seq)c.handleKey(a); return {d:c.formatDisplay(), c};}
function keys(str){return str.split(/\s+/).filter(Boolean)}
const cases=[
 ['23+4.5-53', ['digit2','digit3','plus','digit4','decimal','digit5','minus','digit5','digit3','equals']],
 ['sqrt2', ['digit2','shift','square']],
 ['sin45', ['digit4','digit5','sin']],
 ['rad sin pi/6', ['mode','digit5','shift','expkey','div','digit6','equals','sin']],
 ['log17.162', ['digit1','digit7','decimal','digit1','digit6','digit2','log']],
 ['2^5+5^2', ['digit2','power','digit5','plus','digit5','power','digit2','equals']],
 ['8!', ['digit8','shift','digit3']],
 ['10C4', ['digit1','digit0','shift','digit2','digit4','equals']],
 ['percent', ['digit1','digit5','digit0','digit0','mul','digit1','digit2','shift','equals']],
 ['increase', ['digit2','digit5','digit0','digit0','mul','digit1','digit5','shift','equals','plus']],
 ['change', ['digit4','digit6','minus','digit4','digit0','shift','equals']],
 ['fraction', ['digit2','frac','digit3','plus','digit4','frac','digit5','equals']],
 ['constant', ['digit2','decimal','digit3','plus','plus','digit3','equals']],
 ['constant2', ['digit1','digit9','plus','plus','equals','equals']],
];
for(const [name,seq] of cases){ const r=run(seq); console.log(name, r.d.main, r.d.exp, r.d.raw); }
