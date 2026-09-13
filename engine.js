(function (global) {
  'use strict';

  const OPS = {
    '+': { p: 1, a: 'L', fn: (a,b)=>a+b },
    '-': { p: 1, a: 'L', fn: (a,b)=>a-b },
    '*': { p: 2, a: 'L', fn: (a,b)=>a*b },
    '/': { p: 2, a: 'L', fn: (a,b)=>a/b },
    '^': { p: 3, a: 'R', fn: (a,b)=>Math.pow(a,b) },
    'root': { p: 3, a: 'R', fn: (a,b)=>{ if(b===0)return NaN; if(a<0 && isIntegerLike(b) && Math.abs(Math.round(b))%2===1) return -Math.pow(-a,1/b); return Math.pow(a,1/b); } },
    'nPr': { p: 3, a: 'L', fn: (a,b)=>perm(a,b) },
    'nCr': { p: 3, a: 'L', fn: (a,b)=>comb(a,b) }
  };

  function isIntegerLike(n) { return Number.isFinite(n) && Math.abs(n - Math.round(n)) < 1e-12; }
  function factorial(n) {
    if (!isIntegerLike(n) || n < 0 || n > 170) return NaN;
    let r = 1;
    for (let i = 2; i <= Math.round(n); i++) r *= i;
    return r;
  }
  function perm(n,r) {
    if (!isIntegerLike(n) || !isIntegerLike(r) || n < 0 || r < 0 || r > n) return NaN;
    n=Math.round(n); r=Math.round(r);
    let v=1; for(let i=0;i<r;i++) v*=n-i; return v;
  }
  function comb(n,r) {
    if (!isIntegerLike(n) || !isIntegerLike(r) || n < 0 || r < 0 || r > n) return NaN;
    n=Math.round(n); r=Math.round(r); r=Math.min(r,n-r);
    let v=1; for(let i=1;i<=r;i++) v=v*(n-r+i)/i; return v;
  }

  function gcdBig(a,b){ a=a<0n?-a:a; b=b<0n?-b:b; while(b){ const t=a%b; a=b; b=t; } return a||1n; }
  function approxFraction(x, maxDen=1000000) {
    if (!Number.isFinite(x)) return null;
    const sign = x < 0 ? -1 : 1; x = Math.abs(x);
    if (Math.abs(x - Math.round(x)) < 1e-12) return {n: BigInt(sign*Math.round(x)), d:1n};
    let h1=1, h0=0, k1=0, k0=1, b=x;
    for(let i=0;i<30;i++){
      const a=Math.floor(b); const h2=a*h1+h0; const k2=a*k1+k0;
      if(k2>maxDen) break;
      h0=h1; h1=h2; k0=k1; k1=k2;
      const frac=b-a;
      if(frac<1e-14) break;
      b=1/frac;
    }
    let n=BigInt(Math.round(sign*h1)), d=BigInt(Math.round(k1)); const g=gcdBig(n,d); n/=g; d/=g;
    if (Math.abs(Number(n)/Number(d) - sign*x) > 2e-10) return null;
    return {n,d};
  }

  class CalculatorEngine {
    constructor(){ this.resetAll(); }

    resetAll(){
      this.calcMode='COMP'; this.angle='DEG'; this.displayMode='NORM'; this.norm=1;
      this.fixDigits=2; this.sciDigits=2; this.memory=0; this.stats=[];
      this.shift=false; this.hyp=false; this.modePending=false; this.angleConvertPending=false; this.precisionPending=null;
      this.constant=null; this.constantFirstUse=false; this.secondary=null;
      this.clearAll(false);
    }

    clearAll(keepModes=true){
      this.tokens=[]; this.entry='0'; this.entering=true; this.currentValue=0; this.operandReady=true;
      this.lastWasEquals=false; this.error=null; this.percentContext=null;
      this.fractionParts=[]; this.fractionUsed=false; this.fractionEligible=false; this.fractionDisplay=false; this.improperFraction=false;
      this.decimalUsed=false; this.nonRationalUsed=false; this.dmsParts=[]; this.dmsDisplay=null; this.dmsUsed=false; this.dmsMixedDecimal=false;
      this.constant = null; this.constantFirstUse=false; this.secondary=null;
      this.modePending=false; this.angleConvertPending=false; this.precisionPending=null; this.hyp=false; this.shift=false;
    }

    clearEntry(){
      if(this.error){ this.error=null; this.entry='0'; this.currentValue=0; this.entering=true; return; }
      this.entry='0'; this.currentValue=0; this.entering=true; this.operandReady=true; this.fractionParts=[]; this.dmsParts=[]; this.dmsDisplay=null;
    }

    backspace(){
      if(this.error){ this.clearEntry(); return; }
      if(!this.entering){ this.entry='0'; this.currentValue=0; this.entering=true; return; }
      if(this.entry.includes('e')){
        if(this.entry.endsWith('e')||this.entry.endsWith('e-')||this.entry.endsWith('e+')) this.entry=this.entry.slice(0,-1);
        else this.entry=this.entry.slice(0,-1);
      } else {
        this.entry=this.entry.slice(0,-1);
      }
      if(this.entry===''||this.entry==='-'||this.entry==='-0') this.entry='0';
      this.currentValue=this._parseEntry(); this.operandReady=true;
    }

    toggleShift(){ this.shift=!this.shift; }
    pressHyp(){ this.hyp=!this.hyp; }

    _digitCount(s){ return (s.split('e')[0].match(/\d/g)||[]).length; }
    inputDigit(d){
      if(this._handleModeInput(String(d))) return;
      if(this.error) this.clearEntry();
      if(this.lastWasEquals && !this.tokens.length){ this.tokens=[]; this.entry='0'; this.currentValue=0; this.lastWasEquals=false; this.fractionUsed=false; this.fractionEligible=false; this.nonRationalUsed=false; this.decimalUsed=false; }
      if(!this.entering){ this.entry='0'; this.entering=true; }
      if(this.entry.includes('e')){
        const [m,e='']=this.entry.split('e');
        let es=e;
        if(es==='0') es='';
        if((es.replace(/[+-]/g,'').length)<2) es += d;
        this.entry=m+'e'+es;
      } else {
        if(this._digitCount(this.entry)>=10) return;
        if(this.entry==='0') this.entry=d;
        else if(this.entry==='-0') this.entry='-'+d;
        else this.entry+=d;
      }
      this.currentValue=this._parseEntry(); this.dmsDisplay=null; this.operandReady=true;
    }

    inputDecimal(){
      if(this._handleModeInput('.')) return;
      if(this.error) this.clearEntry();
      if(this.lastWasEquals && !this.tokens.length){ this.entry='0'; this.currentValue=0; this.lastWasEquals=false; }
      if(!this.entering){ this.entry='0'; this.entering=true; }
      const mant=this.entry.split('e')[0];
      if(!mant.includes('.') && !this.entry.includes('e')) this.entry+='.';
      this.decimalUsed=true; this.fractionEligible=false; this.operandReady=true; if(this.dmsUsed && this.dmsParts.length===0) this.dmsMixedDecimal=true;
    }

    inputExp(){
      if(this.error) this.clearEntry();

      // Real-machine behavior: pressing EXP by itself from the initial/cleared
      // display inserts π immediately.  Keep the normal EXP scientific-notation
      // entry behavior when a mantissa has already been typed (for example 2 EXP 3).
      const isBareInitialDisplay = this.tokens.length===0 && this.entering && this.entry==='0' && this.currentValue===0 && !this.lastWasEquals;
      if(isBareInitialDisplay){
        this.setPi();
        return;
      }

      // Legacy convenience: EXP immediately after an operator inserts π.
      if(!this.operandReady && this.tokens.length && typeof this.tokens[this.tokens.length-1]==='string' && this.tokens[this.tokens.length-1]!==')'){
        this.setValue(Math.PI,true); this.nonRationalUsed=true; return;
      }
      if(!this.entering){ this.entry='1'; this.entering=true; }
      if(!this.entry.includes('e')) this.entry += 'e';
      this.nonRationalUsed=true; this.fractionEligible=false; this.operandReady=true;
    }

    toggleSign(){
      if(this.error) return;
      if(this.entering){
        if(this.entry.includes('e')){
          const [m,e='']=this.entry.split('e');
          let es=e;
          if(es.startsWith('-')) es=es.slice(1); else if(es.startsWith('+')) es='-'+es.slice(1); else es='-'+es;
          this.entry=m+'e'+es;
        } else {
          this.entry=this.entry.startsWith('-')?this.entry.slice(1):'-'+this.entry;
          if(this.entry==='-0') this.currentValue=-0;
        }
        this.currentValue=this._parseEntry();
      } else this.setValue(-this.currentValue,true);
    }

    _parseEntry(){
      if(this.entry.endsWith('e')||this.entry.endsWith('e-')||this.entry.endsWith('e+')) return Number(this.entry.split('e')[0]);
      const v=Number(this.entry); return Number.isFinite(v)?v:0;
    }

    _finalizeSpecialInput(){
      if(this.dmsParts.length){
        const cur=this.entering?this._parseEntry():0;
        if(this.dmsParts.length===1) this.dmsParts.push(cur,0);
        else if(this.dmsParts.length===2) this.dmsParts.push(cur);
        const [deg,min=0,sec=0]=this.dmsParts;
        const sign=deg<0?-1:1;
        const v=sign*(Math.abs(deg)+Math.abs(min)/60+Math.abs(sec)/3600);
        this.dmsDisplay={deg,min,sec}; this.dmsParts=[]; this.setValue(v,false);
      }
      if(this.fractionParts.length){
        const cur=this.entering?this._parseEntry():0;
        let v;
        if(this.fractionParts.length===1){
          const n=this.fractionParts[0], d=cur;
          if(d===0){ this._setError(); return NaN; }
          v=n/d;
        } else {
          const w=this.fractionParts[0], n=this.fractionParts[1], d=cur;
          if(d===0){ this._setError(); return NaN; }
          const s=w<0?-1:1; v=s*(Math.abs(w)+Math.abs(n/d));
        }
        this.fractionParts=[]; this.fractionUsed=true; this.fractionEligible=!this.decimalUsed&&!this.nonRationalUsed; this.fractionDisplay=true;
        this.setValue(v,false);
      }
      return this.currentValue;
    }

    setValue(v, markNonRational=false){
      if(!this._valid(v)){ this._setError(); return; }
      this.currentValue=this._normalize(v); this.entry=null; this.entering=false; this.operandReady=true; this.lastWasEquals=false;
      if(markNonRational){ this.nonRationalUsed=true; this.fractionEligible=false; }
      this.dmsDisplay=null;
    }

    _normalize(v){ if(Math.abs(v)>0 && Math.abs(v)<1e-99) return 0; return v; }
    _valid(v){ return Number.isFinite(v) && Math.abs(v)<=9.999999999e99; }
    _setError(msg='-E-'){ this.error=msg; this.entry=null; this.entering=false; this.tokens=[]; }

    pressParen(p){
      if(this.error) return;
      if(p==='('){
        if(this.entering && !(this.entry==='0' && this.tokens.length===0)){ return; }
        this.tokens.push('('); this.entry='0'; this.entering=true; this.operandReady=false; this.lastWasEquals=false;
      } else {
        this._finalizeSpecialInput(); if(this.error) return;
        if(this.entering || this.entry===null) this._pushCurrentIfNeeded();
        this.tokens.push(')'); this.entering=false; this.operandReady=true;
        try { const idx=this.tokens.lastIndexOf('('); if(idx>=0) this.currentValue=this._evaluate(this.tokens.slice(idx+1,-1)); } catch(e){}
      }
    }

    pressOperator(op){
      if(this.error) return;
      if(this.percentContext && (op==='+'||op==='-')){
        const r=op==='+'?this.percentContext.base+this.percentContext.value:this.percentContext.base-this.percentContext.value;
        this.percentContext=null; this.tokens=[]; this.setValue(r); this.lastWasEquals=true; return;
      }
      this._finalizeSpecialInput(); if(this.error) return;
      if(this.lastWasEquals){ this.tokens=[this.currentValue]; this.lastWasEquals=false; }

      // Double operator sets a legacy constant.
      if(!this.operandReady && this.tokens.length===2 && typeof this.tokens[0]==='number' && this.tokens[1]===op){
        this.constant={op,value:this.tokens[0]}; this.constantFirstUse=true; this.tokens=[]; this.operandReady=false; return;
      }

      if(!this.operandReady && this.tokens.length && typeof this.tokens[this.tokens.length-1]==='string' && this.tokens[this.tokens.length-1]!==')'){
        this.tokens[this.tokens.length-1]=op; this.entering=false; return;
      }
      this._pushCurrentIfNeeded(); this.tokens.push(op); this.entering=false; this.operandReady=false; this.entry=null; this.fractionDisplay=false;
      if(['^','root','nPr','nCr'].includes(op)){ this.nonRationalUsed=true; this.fractionEligible=false; }
    }

    _pushCurrentIfNeeded(){
      if(this.error) return;
      let v=this.currentValue;
      if(this.entering) v=this._parseEntry();
      if(this.tokens.length===0 || typeof this.tokens[this.tokens.length-1]==='string') this.tokens.push(v);
      this.currentValue=v; this.entry=null; this.entering=false; this.operandReady=true;
    }

    equals(){
      if(this.error) return;
      this._finalizeSpecialInput(); if(this.error) return;
      try{
        if(this.constant && this.tokens.length===0){
          const x=this.entering?this._parseEntry():this.currentValue;
          let r;
          if(this.constantFirstUse){ r=OPS[this.constant.op].fn(this.constant.value,x); this.constantFirstUse=false; }
          else { r=OPS[this.constant.op].fn(x,this.constant.value); }
          if(!this._valid(r)) throw new Error('domain');
          this.setValue(r); this.lastWasEquals=true; return;
        }
        if(this.tokens.length){
          if(this.entering || this.entry!==null || (this.tokens.length && OPS[this.tokens[this.tokens.length-1]])) this._pushCurrentIfNeeded();
          while(this.tokens.length && typeof this.tokens[this.tokens.length-1]==='string' && this.tokens[this.tokens.length-1]!==')') this.tokens.pop();
          const r=this._evaluate(this.tokens);
          this.tokens=[]; this.setValue(r); this.lastWasEquals=true;
          if(this.fractionUsed && this.fractionEligible) this.fractionDisplay=true;
          if(this.dmsUsed && !this.dmsMixedDecimal) this.dmsDisplay=this._toDMS(r);
          return;
        }
        this.currentValue=this.entering?this._parseEntry():this.currentValue; this.entry=null; this.entering=false; this.lastWasEquals=true;
      }catch(e){ this._setError(); }
    }

    _evaluate(tokens){
      const out=[], st=[];
      for(const t of tokens){
        if(typeof t==='number') out.push(t);
        else if(t==='(') st.push(t);
        else if(t===')'){
          while(st.length && st[st.length-1]!=='(') out.push(st.pop());
          if(!st.length) throw new Error('paren'); st.pop();
        } else if(OPS[t]){
          const o1=OPS[t];
          while(st.length && OPS[st[st.length-1]]){
            const o2=OPS[st[st.length-1]];
            if((o1.a==='L'&&o1.p<=o2.p)||(o1.a==='R'&&o1.p<o2.p)) out.push(st.pop()); else break;
          }
          st.push(t);
        } else throw new Error('op');
      }
      while(st.length){ const x=st.pop(); if(x==='(') throw new Error('paren'); out.push(x); }
      const vs=[];
      for(const t of out){
        if(typeof t==='number') vs.push(t); else { const b=vs.pop(), a=vs.pop(); if(a===undefined||b===undefined) throw new Error('expr'); const r=OPS[t].fn(a,b); if(!this._valid(r)) throw new Error('domain'); vs.push(r); }
      }
      if(vs.length!==1) throw new Error('expr'); return vs[0];
    }

    unary(name){
      if(this.error) return;
      this._finalizeSpecialInput(); if(this.error) return;
      const x=this.entering?this._parseEntry():this.currentValue;
      let r;
      switch(name){
        case 'square': r=x*x; break;
        case 'cube': r=x*x*x; break;
        case 'sqrt': r=x<0?NaN:Math.sqrt(x); break;
        case 'cbrt': r=Math.cbrt(x); break;
        case 'reciprocal': r=x===0?NaN:1/x; break;
        case 'log': r=x<=0?NaN:Math.log10(x); break;
        case 'ln': r=x<=0?NaN:Math.log(x); break;
        case 'pow10': r=Math.pow(10,x); break;
        case 'exp': r=Math.exp(x); break;
        case 'factorial': r=factorial(x); break;
        case 'sin': r=this._trig(x,'sin',false); break;
        case 'cos': r=this._trig(x,'cos',false); break;
        case 'tan': r=this._trig(x,'tan',false); break;
        case 'asin': r=this._trig(x,'sin',true); break;
        case 'acos': r=this._trig(x,'cos',true); break;
        case 'atan': r=this._trig(x,'tan',true); break;
        case 'sinh': r=Math.sinh(x); break;
        case 'cosh': r=Math.cosh(x); break;
        case 'tanh': r=Math.tanh(x); break;
        case 'asinh': r=Math.asinh(x); break;
        case 'acosh': r=Math.acosh(x); break;
        case 'atanh': r=Math.atanh(x); break;
        default: r=NaN;
      }
      if(!this._valid(r)){ this._setError(); return; }
      this.nonRationalUsed=true; this.fractionEligible=false; this.setValue(r,true);
    }

    trig(main){
      let inverse=this.shift; const hyp=this.hyp; this.shift=false; this.hyp=false;
      if(hyp) this.unary((inverse?'a':'')+main+'h'); else this.unary((inverse?'a':'')+main);
    }

    _trig(x,kind,inverse){
      if(inverse){
        let r=kind==='sin'?Math.asin(x):kind==='cos'?Math.acos(x):Math.atan(x);
        return this._fromRad(r);
      }
      const r=this._toRad(x); return kind==='sin'?Math.sin(r):kind==='cos'?Math.cos(r):Math.tan(r);
    }
    _toRad(x){ return this.angle==='DEG'?x*Math.PI/180:this.angle==='GRA'?x*Math.PI/200:x; }
    _fromRad(x){ return this.angle==='DEG'?x*180/Math.PI:this.angle==='GRA'?x*200/Math.PI:x; }

    pressFraction(){
      if(this.error) return;
      if(!this.entering && this.lastWasEquals){ this.fractionDisplay=!this.fractionDisplay; return; }
      if(!this.entering){ this.entry=String(this.currentValue); this.entering=true; }
      const v=this._parseEntry();
      if(this.fractionParts.length<2){ this.fractionParts.push(v); this.entry='0'; this.currentValue=0; this.entering=true; this.fractionUsed=true; this.fractionEligible=!this.decimalUsed&&!this.nonRationalUsed; }
    }
    shiftFraction(){ this.improperFraction=!this.improperFraction; this.fractionDisplay=true; this.shift=false; }

    pressDMS(){
      if(this.error) return;
      this.dmsUsed=true;
      if(!this.entering && this.dmsDisplay){ this.dmsDisplay=null; return; }
      if(!this.entering && this.lastWasEquals){ this.dmsDisplay=this._toDMS(this.currentValue); return; }
      const v=this._parseEntry(); this.dmsParts.push(v); this.entry='0'; this.currentValue=0; this.entering=true;
      if(this.dmsParts.length===3){ const parts=this.dmsParts.slice(); this._finalizeSpecialInput(); this.dmsDisplay={deg:parts[0],min:parts[1],sec:parts[2]}; }
    }
    _toDMS(v){ const s=v<0?-1:1, a=Math.abs(v); const deg=Math.floor(a)*s; const rem=(a-Math.floor(a))*60; const min=Math.floor(rem); const sec=(rem-min)*60; return {deg,min,sec}; }

    percent(){
      if(this.error) return;
      this._finalizeSpecialInput(); if(this.error) return;
      const right=this.entering?this._parseEntry():this.currentValue;
      if(this.tokens.length>=2 && OPS[this.tokens[this.tokens.length-1]]){
        const op=this.tokens[this.tokens.length-1]; const leftTokens=this.tokens.slice(0,-1);
        let left;
        try{ left=leftTokens.length===1?leftTokens[0]:this._evaluate(leftTokens); }catch(e){ this._setError(); return; }
        let r;
        if(op==='*'){ r=left*right/100; this.percentContext={base:left,value:r}; }
        else if(op==='/'){ r=left/right*100; this.percentContext=null; }
        else if(op==='+'){ r=(left+right)/right*100; this.percentContext=null; }
        else if(op==='-'){ r=Math.abs(left-right)/Math.abs(right)*100; this.percentContext=null; }
        else { r=right/100; }
        this.tokens=[]; if(!this._valid(r)){ this._setError(); return; } this.setValue(r); this.lastWasEquals=false;
      } else { this.setValue(right/100); }
    }

    pressMode(convert=false){ if(convert){this.angleConvertPending=true;this.modePending=false;} else {this.modePending=true;this.angleConvertPending=false;} this.precisionPending=null; this.shift=false; }
    _handleModeInput(k){
      if(this.angleConvertPending){
        const target=k==='5'?'RAD':k==='6'?'GRA':k==='7'?'DEG':null;
        if(target){
          const x=this.entering?this._parseEntry():this.currentValue;
          const rad=this._toRad(x); const old=this.angle; this.angle=target; const v=this._fromRad(rad); this.setValue(v,true); this.angle=target; this.angleConvertPending=false; return true;
        }
        this.angleConvertPending=false; return false;
      }
      if(this.precisionPending){
        if(/^\d$/.test(k)){
          const n=Number(k); if(this.precisionPending==='FIX'){this.displayMode='FIX';this.fixDigits=n;} else {this.displayMode='SCI';this.sciDigits=n===0?10:n;}
          this.precisionPending=null; this.modePending=false; return true;
        }
        return false;
      }
      if(!this.modePending) return false;
      if(k==='.') { this.calcMode='SD'; this.modePending=false; this.entry='0'; this.currentValue=0; this.entering=true; return true; }
      if(k==='0') { this.calcMode='COMP'; this.modePending=false; return true; }
      if(k==='4'){ this.angle='DEG'; this.modePending=false; return true; }
      if(k==='5'){ this.angle='RAD'; this.modePending=false; return true; }
      if(k==='6'){ this.angle='GRA'; this.modePending=false; return true; }
      if(k==='7'){ this.precisionPending='FIX'; return true; }
      if(k==='8'){ this.precisionPending='SCI'; return true; }
      if(k==='9'){ this.displayMode='NORM'; this.norm=this.norm===1?2:1; this.modePending=false; return true; }
      this.modePending=false; return false;
    }

    setPi(){ this.setValue(Math.PI,true); this.shift=false; }
    random(){ const r=Math.floor(Math.random()*1000)/1000; this.setValue(r,true); this.shift=false; }
    rnd(){
      const x=this.entering?this._parseEntry():this.currentValue; let r=x;
      if(this.displayMode==='FIX'){ const p=Math.pow(10,this.fixDigits); r=Math.round(x*p)/p; }
      else if(this.displayMode==='SCI'){ const d=this.sciDigits; if(x!==0){ const e=Math.floor(Math.log10(Math.abs(x))); const p=Math.pow(10,d-1-e); r=Math.round(x*p)/p; } }
      else r=Number(x.toPrecision(10));
      this.setValue(r); this.shift=false;
    }

    eng(direction=1){
      const x=this.entering?this._parseEntry():this.currentValue; if(x===0){this.setValue(0); return;}
      let e=Math.floor(Math.log10(Math.abs(x))/3)*3;
      if(direction<0) e-=3;
      this.engOverride=e; this.setValue(x); this.shift=false;
    }

    memoryInput(){ this._finalizeSpecialInput(); if(this.error)return; this.memory=this.entering?this._parseEntry():this.currentValue; this.shift=false; }
    memoryRecall(){ this.setValue(this.memory); this.shift=false; }
    memoryPlus(sign=1){
      if(this.calcMode==='SD'){ if(sign<0) this.statDelete(); else this.statAdd(); this.shift=false; return; }
      if(this.tokens.length) this.equals(); else this._finalizeSpecialInput(); if(this.error)return;
      this.memory += sign*(this.entering?this._parseEntry():this.currentValue); this.shift=false;
    }
    swapMemory(){ const x=this.entering?this._parseEntry():this.currentValue; const m=this.memory; this.memory=x; this.setValue(m); this.shift=false; }

    statClear(){ this.stats=[]; this.shift=false; }
    statAdd(){
      if(this.calcMode!=='SD') return;
      // Frequency shorthand: value * frequency DATA
      if(this.tokens.length===2 && typeof this.tokens[0]==='number' && this.tokens[1]==='*' && this.entering){
        const v=this.tokens[0], f=Math.max(0,Math.floor(this._parseEntry())); for(let i=0;i<f;i++) this.stats.push(v); this.tokens=[]; this.setValue(v); return;
      }
      this._finalizeSpecialInput(); if(this.error)return;
      const v=this.entering?this._parseEntry():this.currentValue; this.stats.push(v); this.setValue(v);
    }
    statDelete(){
      if(this.calcMode!=='SD') return;
      if(this.tokens.length===2 && typeof this.tokens[0]==='number' && this.tokens[1]==='*' && this.entering){
        const v=this.tokens[0], f=Math.max(0,Math.floor(this._parseEntry())); let count=f;
        for(let i=this.stats.length-1;i>=0&&count>0;i--) if(Math.abs(this.stats[i]-v)<1e-12){this.stats.splice(i,1);count--;}
        this.tokens=[]; this.setValue(v); return;
      }
      const v=this.entering?this._parseEntry():this.currentValue;
      for(let i=this.stats.length-1;i>=0;i--) if(Math.abs(this.stats[i]-v)<1e-12){ this.stats.splice(i,1); break; }
      this.setValue(v);
    }
    statValue(kind){
      if(this.calcMode!=='SD'){this._setError();return;}
      const n=this.stats.length; if(n===0){this._setError();return;}
      const sum=this.stats.reduce((a,b)=>a+b,0), sumsq=this.stats.reduce((a,b)=>a+b*b,0), mean=sum/n;
      let r;
      if(kind==='mean') r=mean; else if(kind==='n')r=n; else if(kind==='sum')r=sum; else if(kind==='sumsq')r=sumsq;
      else if(kind==='sigmaN') r=Math.sqrt(this.stats.reduce((a,b)=>a+(b-mean)*(b-mean),0)/n);
      else if(kind==='sigmaN1'){ if(n<2){this._setError();return;} r=Math.sqrt(this.stats.reduce((a,b)=>a+(b-mean)*(b-mean),0)/(n-1)); }
      this.setValue(r,true); this.shift=false;
    }

    coord(op){ this.pressOperator(op); this.shift=false; }
    coordEquals(op){ /* reserved */ }
    coordinate(op){
      this._finalizeSpecialInput(); if(this.error)return;
      const b=this.entering?this._parseEntry():this.currentValue;
      if(this.tokens.length<2){this._setError();return;}
      const a=this.tokens[0];
      let first,second;
      if(op==='R2P'){ first=Math.hypot(a,b); second=this._fromRad(Math.atan2(b,a)); }
      else { const th=this._toRad(b); first=a*Math.cos(th); second=a*Math.sin(th); }
      this.tokens=[]; this.secondary=second; this.setValue(first,true); this.lastWasEquals=true;
    }
    swapXY(){ if(this.secondary===null)return; const t=this.currentValue; this.currentValue=this.secondary; this.secondary=t; this.entry=null; this.entering=false; this.shift=false; }

    get status(){ return {shift:this.shift,hyp:this.hyp,mode:this.calcMode,angle:this.angle,displayMode:this.displayMode,memory:this.memory!==0,constant:!!this.constant}; }

    _formatFraction(v){
      const f=approxFraction(v); if(!f) return null;
      let n=f.n,d=f.d; const neg=n<0n; if(neg)n=-n;
      if(this.improperFraction || n<d){ const s=(neg?'-':'')+n.toString()+'⌟'+d.toString(); return s.length<=10?s:null; }
      const w=n/d, r=n%d;
      if(r===0n) return (neg?'-':'')+w.toString()+'.';
      const s=(neg?'-':'')+w.toString()+'⌟'+r.toString()+'⌟'+d.toString(); return s.length<=10?s:null;
    }
    _formatDMS(o){
      const sec=Number(o.sec.toFixed(4)); return `${o.deg}°${o.min}′${sec}″`;
    }

    formatDisplay(){
      const flags=this.status;
      if(this.error) return {main:this.error,exp:'',flags,raw:this.error};
      if(this.modePending || this.precisionPending || this.angleConvertPending) return {main:this.angleConvertPending?'DRG▶':(this.precisionPending?this.precisionPending:'MODE'),exp:'',flags,raw:'MODE'};
      if(this.dmsDisplay) return {main:this._formatDMS(this.dmsDisplay),exp:'',flags,raw:this.currentValue};
      if(this.fractionDisplay && !this.entering){ const s=this._formatFraction(this.currentValue); if(s) return {main:s,exp:'',flags,raw:this.currentValue}; }
      if(this.entering && this.entry!==null){
        if(this.fractionParts.length){
          const parts=this.fractionParts.map(x=>String(x)); const cur=this.entry==='0'?'':this.entry; return {main:[...parts,cur].filter(Boolean).join('⌟')||'0',exp:'',flags,raw:this._parseEntry()};
        }
        if(this.dmsParts.length){ return {main:this.dmsParts.map((x,i)=>`${x}${i===0?'°':'′'}`).join('')+(this.entry==='0'?'':this.entry),exp:'',flags,raw:this._parseEntry()}; }
        if(this.entry.includes('e')){ const [m,e='']=this.entry.split('e'); return {main:m,exp:e,flags,raw:this._parseEntry()}; }
        return {main:this.entry,exp:'',flags,raw:this._parseEntry()};
      }
      return this._formatNumber(this.currentValue,flags);
    }

    _formatNumber(x,flags){
      if(!this._valid(x)) return {main:'-E-',exp:'',flags,raw:x};
      x=this._normalize(x);
      if(this.engOverride!==undefined){ const e=this.engOverride; delete this.engOverride; const m=x/Math.pow(10,e); return {main:this._trimFixed(m, Math.max(0,9-Math.floor(Math.log10(Math.abs(m)||1)))),exp:String(e),flags,raw:x}; }
      const ax=Math.abs(x);
      if(this.displayMode==='FIX'){
        const s=x.toFixed(this.fixDigits); const digits=(s.match(/\d/g)||[]).length;
        if(digits<=10) return {main:s,exp:'',flags,raw:x};
        return this._scientific(x,Math.min(10,this.fixDigits+1),flags);
      }
      if(this.displayMode==='SCI') return this._scientific(x,this.sciDigits,flags);
      const useSci=ax!==0 && (ax>=1e10 || (this.norm===1?ax<1e-2:ax<1e-9));
      if(useSci) return this._scientific(x,10,flags);
      if(ax===0) return {main:'0.',exp:'',flags,raw:x};
      const integerDigits=ax>=1?Math.floor(Math.log10(ax))+1:1;
      const decimals=Math.max(0,10-integerDigits); let s=x.toFixed(Math.min(20,decimals));
      s=s.replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,'.');
      if(!s.includes('.') && isIntegerLike(x)) s+='.';
      return {main:s,exp:'',flags,raw:x};
    }
    _trimFixed(x,d){ let s=x.toFixed(Math.min(20,d)); s=s.replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,''); return s; }
    _scientific(x,sig,flags){
      if(x===0) return {main:(0).toFixed(Math.max(0,sig-1)),exp:'00',flags,raw:x};
      const e=Math.floor(Math.log10(Math.abs(x))); const m=x/Math.pow(10,e); let s=m.toFixed(Math.max(0,sig-1));
      if(this.displayMode!=='SCI') s=s.replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,'');
      const es=(e>=0?String(e):'-'+String(Math.abs(e)).padStart(2,'0'));
      return {main:s,exp:es,flags,raw:x};
    }

    handleKey(action){
      const shifted=this.shift;
      // Mode consumes next key before shift routing.
      if(this.modePending || this.precisionPending || this.angleConvertPending){
        if(action==='decimal') return this.inputDecimal();
        if(/^digit[0-9]$/.test(action)) return this.inputDigit(action.slice(-1));
      }
      switch(action){
        case 'shift': return this.toggleShift();
        case 'mode': return this.pressMode(shifted);
        case 'on': return this.resetAll();
        case 'ac': if(shifted&&this.calcMode==='SD'){this.statClear();} else {this.clearAll();} this.shift=false; return;
        case 'c': if(shifted){this.swapMemory();} else this.clearEntry(); this.shift=false; return;
        case 'back': if(shifted)this.unary('cube'); else this.backspace(); this.shift=false; return;
        case 'frac': if(shifted)this.shiftFraction(); else this.pressFraction(); return;
        case 'dms': return this.pressDMS();
        case 'hyp': return this.pressHyp();
        case 'sin': return this.trig('sin');
        case 'cos': return this.trig('cos');
        case 'tan': return this.trig('tan');
        case 'square': if(shifted)this.unary('sqrt'); else this.unary('square'); this.shift=false; return;
        case 'log': if(shifted)this.unary('pow10'); else this.unary('log'); this.shift=false; return;
        case 'ln': if(shifted)this.unary('exp'); else this.unary('ln'); this.shift=false; return;
        case 'sign': if(shifted)this.unary('cbrt'); else this.toggleSign(); this.shift=false; return;
        case 'lparen': if(shifted)this.swapXY(); else this.pressParen('('); this.shift=false; return;
        case 'rparen': if(shifted)this.unary('reciprocal'); else this.pressParen(')'); this.shift=false; return;
        case 'power': if(shifted)this.pressOperator('root'); else this.pressOperator('^'); this.shift=false; return;
        case 'mr': if(shifted)this.memoryInput(); else this.memoryRecall(); this.shift=false; return;
        case 'mul': if(shifted)this.eng(1); else this.pressOperator('*'); this.shift=false; return;
        case 'div': if(shifted)this.eng(-1); else this.pressOperator('/'); this.shift=false; return;
        case 'plus': if(shifted){ this.pressOperator('R2P'); } else this.pressOperator('+'); this.shift=false; return;
        case 'minus': if(shifted){ this.pressOperator('P2R'); } else this.pressOperator('-'); this.shift=false; return;
        case 'equals': if(shifted)this.percent(); else {
          if(this.tokens.length>=2 && (this.tokens[this.tokens.length-1]==='R2P'||this.tokens[this.tokens.length-1]==='P2R')){
            const op=this.tokens[this.tokens.length-1]; this.coordinate(op);
          } else this.equals();
        } this.shift=false; return;
        case 'mplus': if(shifted)this.memoryPlus(-1); else this.memoryPlus(1); this.shift=false; return;
        case 'expkey': if(shifted)this.setPi(); else this.inputExp(); this.shift=false; return;
        case 'decimal': if(shifted)this.random(); else this.inputDecimal(); this.shift=false; return;
        case 'digit0': if(shifted)this.rnd(); else this.inputDigit('0'); this.shift=false; return;
        case 'digit1': if(shifted)this.pressOperator('nPr'); else this.inputDigit('1'); this.shift=false; return;
        case 'digit2': if(shifted)this.pressOperator('nCr'); else this.inputDigit('2'); this.shift=false; return;
        case 'digit3': if(shifted)this.unary('factorial'); else this.inputDigit('3'); this.shift=false; return;
        case 'digit4': if(shifted&&this.calcMode==='SD')this.statValue('sumsq'); else this.inputDigit('4'); this.shift=false; return;
        case 'digit5': if(shifted&&this.calcMode==='SD')this.statValue('sum'); else this.inputDigit('5'); this.shift=false; return;
        case 'digit6': if(shifted&&this.calcMode==='SD')this.statValue('n'); else this.inputDigit('6'); this.shift=false; return;
        case 'digit7': if(shifted&&this.calcMode==='SD')this.statValue('mean'); else this.inputDigit('7'); this.shift=false; return;
        case 'digit8': if(shifted&&this.calcMode==='SD')this.statValue('sigmaN'); else this.inputDigit('8'); this.shift=false; return;
        case 'digit9': if(shifted&&this.calcMode==='SD')this.statValue('sigmaN1'); else this.inputDigit('9'); this.shift=false; return;
      }
    }
  }

  global.CalculatorEngine=CalculatorEngine;
  if(typeof module!=='undefined'&&module.exports) module.exports={CalculatorEngine,approxFraction};
})(typeof window!=='undefined'?window:globalThis);
