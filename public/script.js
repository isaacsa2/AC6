/* ─────────── GLOBALS & UTILS ─────────── */
let USE_KMH = true;
let currentLang = 'pt';
const CHASSIS_VARIANT = document.body?.dataset.chassisVariant || 'byisaacsa2';
const IS_BYINSPARE = CHASSIS_VARIANT.toLowerCase() === 'byinspare';
const STORAGE_KEY = IS_BYINSPARE ? 'ac6_byinspare_saved_tune' : 'ac6c_saved_tune';
let chassisTemplateSource = '';
const ARTICULATED_FIELD_MAP = {
  Weight2: 'weight',
  Config2: 'diffconfig',
  BrakeForce2: 'bk-force',
  BrakeBias2: 'bk-bias',
  PBrakeForce2: 'bk-pforce',
  PBrakeBias2: 'bk-pbias',
  EBrakeForce2: 'bk-eforce',
  SteerOuter2: 'st-outer',
  SteerInner2: 'st-inner',
  RSteerOuter2: 'rsteer-outer',
  RSteerInner2: 'rsteer-inner'
};

function hideElement(el) {
  if(el) el.style.display = 'none';
}

function hideFieldByTuneKey(key) {
  document.querySelectorAll('[data-tune="' + key + '"]').forEach(el => hideElement(el.closest('.field') || el.closest('.toggle-row') || el));
}

function hideCardByTitle(title) {
  document.querySelectorAll('.card-title').forEach(el => {
    if(el.textContent.trim().toLowerCase() === title.toLowerCase()) hideElement(el.closest('.card'));
  });
}

function setupByInspareUi() {
  if(!IS_BYINSPARE) return;

  ['electric', 'engswitch'].forEach(tab => {
    hideElement(document.querySelector('.nav-item[data-tab="' + tab + '"]'));
    hideElement(document.querySelector('.tab-panel[data-panel="' + tab + '"]'));
  });

  hideCardByTitle('Turbocharger');
  hideCardByTitle('Supercharger');
  hideCardByTitle('Suavização de Torque');
  hideCardByTitle('Embreagem');
  hideCardByTitle('4WS & Raio de Giro');

  [
    'Engine', 'CompressionRatio', 'Flywheel',
    'Turbochargers', 'T_Boost', 'T_BoostLag', 'Superchargers', 'S_Boost', 'S_Sensitivity',
    'Electric', 'E_Redline', 'E_Trans1', 'E_Trans2', 'E_Horsepower', 'EH_FrontMult', 'EH_EndMult',
    'EH_EndPercent', 'E_Torque', 'ET_EndMult', 'ET_EndPercent',
    'DifferentialType', 'TorqueVector', 'FDiffPower', 'FDiffCoast', 'FDiffPreload',
    'RDiffPower', 'RDiffCoast', 'RDiffPreload',
    'Clutch', 'Stall', 'ClutchType', 'ClutchMode', 'ClutchEngage', 'SpeedEngage',
    'ClutchKick', 'KickMult', 'KickSpeedThreshold', 'KickRPMThreshold', 'ClutchRPMMult',
    'RPMEngage', 'NeutralLimit', 'NeutralRevRPM', 'LimitClutch',
    'AutoShiftType', 'AutoShiftVers', 'ShiftThrot', 'ShiftUpTime', 'ShiftDnTime',
    'PBrakeBias', 'EBrakeForce', 'BrakeAccel', 'BrakeDecel',
    'SteeringType', 'LockToLock', 'SteerRatio', 'Ackerman',
    'FWSteer', 'RSteerOuter', 'RSteerInner', 'RSteerSpeed', 'RSteerDecay',
    'FCaster', 'RCaster'
  ].forEach(hideFieldByTuneKey);

  let clutchPanel = document.querySelector('.tab-panel[data-panel="drivetrain-clutch"] .grid2');
  if(clutchPanel) clutchPanel.style.gridTemplateColumns = '1fr';

  let exportStatus = document.querySelector('.export-status');
  if(exportStatus) exportStatus.textContent = 'Gera apenas os campos existentes no AC6 byInspare';
}

setupByInspareUi();

function syncArticulatedFields() {
  if(IS_BYINSPARE) return;
  let artHp = document.getElementById('art-hp-summary');
  let artTorque = document.getElementById('art-torque-summary');
  let artSpeed = document.getElementById('art-speed-summary');
  let artSpeedSub = document.getElementById('art-speed-sub');
  if(artHp) artHp.textContent = document.getElementById('r-total')?.textContent || '—';
  if(artTorque) {
    let torqueSamples = window._hpChart?.data?.datasets?.[1]?.data || [];
    let peakTorque = torqueSamples.reduce((max, value) => Math.max(max, parseFloat(value) || 0), 0);
    artTorque.textContent = peakTorque ? Math.round(peakTorque).toLocaleString() : '—';
  }
  if(artSpeed) artSpeed.textContent = document.getElementById('dt-top-spd')?.textContent || '—';
  if(artSpeedSub) artSpeedSub.textContent = spdLabel();

  if(!document.getElementById('art-sync')?.checked) return;

  Object.entries(ARTICULATED_FIELD_MAP).forEach(([targetKey, sourceId]) => {
    let target = document.querySelector('[data-tune-art="' + targetKey + '"]');
    let source = document.getElementById(sourceId);
    if(!target || !source) return;
    let rawValue = source.textContent && !source.value ? source.textContent : source.value;
    if(targetKey === 'Weight2') {
      let mainWeight = parseFloat(rawValue) || 0;
      target.value = mainWeight ? Math.round(mainWeight * 0.5) : '';
      return;
    }
    if((targetKey === 'SteerOuter2' || targetKey === 'SteerInner2') && Number.isNaN(parseFloat(rawValue))) {
      rawValue = document.getElementById('steer-lock')?.value || target.value;
    }
    target.value = rawValue;
  });

  let weight2 = document.getElementById('art-weight2');
  let config2 = document.getElementById('art-config2');
  let weightSummary = document.getElementById('art-weight-summary');
  let configSummary = document.getElementById('art-config-summary');
  if(weightSummary && weight2) weightSummary.textContent = Math.round(parseFloat(weight2.value) || 0).toLocaleString() + ' lbs';
  if(configSummary && config2) configSummary.textContent = config2.value || '—';
}

function updateArticulatedPills() {
  ['art-enable', 'art-sync'].forEach(id => {
    let el = document.getElementById(id);
    let pill = document.getElementById(id + '-pill');
    if(!el || !pill) return;
    pill.textContent = el.checked ? 'ON' : 'OFF';
    pill.className = 'pill ' + (el.checked ? 'pill-on' : 'pill-off');
  });
}

function collectArticulatedValues() {
  let values = {};
  if(IS_BYINSPARE || !document.getElementById('art-enable')?.checked) return values;
  syncArticulatedFields();
  document.querySelectorAll('[data-tune-art]').forEach(el => {
    let key = el.dataset.tuneArt;
    if(!key) return;
    values[key] = el.tagName === 'SELECT' ? el.value : (parseFloat(el.value) || 0);
  });
  return values;
}

function buildArticulatedBlock() {
  let values = collectArticulatedValues();
  let keys = Object.keys(values);
  if(keys.length === 0) return '';
  let lines = ['\n--[[Articulated Module 2]]'];
  keys.forEach(key => lines.push('Tune.' + key + '\t\t= ' + tuneLineValue(values[key])));
  return lines.join('\n') + '\n';
}

function setupArticulatedUi() {
  if(IS_BYINSPARE) return;
  ['art-enable', 'art-sync'].forEach(id => {
    let el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('change', () => {
      updateArticulatedPills();
      syncArticulatedFields();
    });
  });
  document.querySelectorAll('input[id], select[id]').forEach(el => {
    el.addEventListener('input', syncArticulatedFields);
    el.addEventListener('change', syncArticulatedFields);
  });
  updateArticulatedPills();
  syncArticulatedFields();
}

setupArticulatedUi();

function v(id){ let e = document.getElementById(id); return e ? (parseFloat(e.value)||0) : 0; }
function s(id){ let e = document.getElementById(id); return e ? e.value : ''; }
function chk(id){ let e = document.getElementById(id); return e ? e.checked : false; }

function spd(mph){ return USE_KMH ? mph*1.60934 : mph; }
function spdLabel(){ return USE_KMH ? 'km/h' : 'mph'; }
function spdFmt(mph, dp){ return spd(mph).toFixed(dp!==undefined?dp:1)+' '+spdLabel(); }

function refreshUnitLabels(){
  document.querySelectorAll('.spd-unit').forEach(el => el.textContent = spdLabel());
}

/* Toasts Notification System */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  if(type === 'error') toast.style.borderLeftColor = 'var(--red)';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* Debounce (Performance) */
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/* ─────────── MATEMÁTICA & FÍSICA ─────────── */
function curveNfull(RPM, hp, peak, sharp, curveMult) {
  if(RPM <= 0 || peak <= 0 || hp <= 0) return 0;
  let r = RPM/1000, p = peak/1000, H = hp/100;
  if(H <= 0) return 0;
  let base = (-(r-p)*(r-p)) * Math.min(H/Math.pow(p,2), Math.pow(curveMult, p/H)) + H;
  return base * (r - (Math.pow(r, sharp) / (sharp * Math.pow(p, sharp-1))));
}

function smoothTorqueCurve(samples, amount, windowSize) {
  if(!Array.isArray(samples) || samples.length < 3) return samples || [];
  let blend = Math.max(0, Math.min(1, (amount || 0) / 100));
  if(blend <= 0) return samples.slice();

  let radius = Math.max(1, Math.floor((Math.max(3, windowSize || 3) - 1) / 2));
  let sigma = Math.max(1, radius / 1.35);
  return samples.map((value, index) => {
    if(index === 0 || index === samples.length - 1) return value;
    let weighted = 0, weights = 0;
    for(let offset = -radius; offset <= radius; offset++) {
      let sampleIndex = Math.max(0, Math.min(samples.length - 1, index + offset));
      let weight = Math.exp(-(offset * offset) / (2 * sigma * sigma));
      weighted += samples[sampleIndex] * weight;
      weights += weight;
    }
    let filtered = weights > 0 ? weighted / weights : value;
    return Math.max(0, Math.round(value + (filtered - value) * blend));
  });
}

function hpFromTorque(torque, rpm) {
  return rpm > 100 ? (torque * rpm) / 5252 : 0;
}

function normalizeDynoCurve(hpSamples, torqueSamples, targetPeakHP) {
  let peak = hpSamples.reduce((max, value) => Math.max(max, value), 0);
  if(peak <= 0 || targetPeakHP <= 0) return { hp: hpSamples, torque: torqueSamples };
  let scale = targetPeakHP / peak;
  return {
    hp: hpSamples.map(value => Math.max(0, Math.round(value * scale * 10) / 10)),
    torque: torqueSamples.map(value => Math.max(0, Math.round(value * scale)))
  };
}

function peakIndex(samples) {
  let best = 0;
  for(let i = 1; i < samples.length; i++) {
    if(samples[i] > samples[best]) best = i;
  }
  return best;
}

function curveRoughness(samples) {
  if(!Array.isArray(samples) || samples.length < 5) return 0;
  let peak = samples.reduce((max, value) => Math.max(max, value), 0);
  if(peak <= 0) return 0;
  let sum = 0, count = 0;
  for(let i = 2; i < samples.length - 2; i++) {
    if(samples[i] <= 0) continue;
    sum += Math.abs(samples[i - 1] - (2 * samples[i]) + samples[i + 1]) / peak;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

function hpShapeError(reference, candidate) {
  let peak = reference.reduce((max, value) => Math.max(max, value), 0);
  if(peak <= 0) return 0;
  let sum = 0, weightSum = 0;
  for(let i = 0; i < reference.length; i++) {
    if(reference[i] <= peak * 0.05) continue;
    let weight = Math.max(0.2, reference[i] / peak);
    let err = (candidate[i] - reference[i]) / Math.max(10, reference[i]);
    sum += err * err * weight;
    weightSum += weight;
  }
  return weightSum > 0 ? Math.sqrt(sum / weightSum) : 0;
}

function dynoFromTorque(labels, torqueSamples, targetPeakHP) {
  let hpSamples = torqueSamples.map((torque, index) => Math.max(0, Math.round(hpFromTorque(torque, labels[index]) * 10) / 10));
  return normalizeDynoCurve(hpSamples, torqueSamples, targetPeakHP);
}

function autoSmoothDynoCurve(labels, hpSamples, torqueSamples) {
  let targetPeakHP = hpSamples.reduce((max, value) => Math.max(max, value), 0);
  let originalRoughness = curveRoughness(torqueSamples);
  if(targetPeakHP <= 0 || originalRoughness <= 0) return { hp: hpSamples, torque: torqueSamples };

  let originalPeakIndex = peakIndex(hpSamples);
  let bestStrict = null, bestFallback = null;
  let windows = [3, 5, 7, 9, 11];
  let amounts = [20, 30, 40, 50, 60, 70, 80];

  windows.forEach(windowSize => {
    amounts.forEach(amount => {
      let torque = smoothTorqueCurve(torqueSamples, amount, windowSize);
      let dyno = dynoFromTorque(labels, torque, targetPeakHP);
      let hpError = hpShapeError(hpSamples, dyno.hp);
      let roughness = curveRoughness(dyno.torque);
      let roughnessRatio = roughness / originalRoughness;
      let peakShift = Math.abs(peakIndex(dyno.hp) - originalPeakIndex) / Math.max(1, labels.length - 1);
      let fallbackScore = (hpError * 2.4) + (peakShift * 1.8) + (roughnessRatio * 0.35);
      let candidate = { hp: dyno.hp, torque: dyno.torque, hpError, peakShift, roughness, fallbackScore };

      if(hpError <= 0.045 && peakShift <= 0.035) {
        if(!bestStrict || roughness < bestStrict.roughness || (roughness === bestStrict.roughness && hpError < bestStrict.hpError)) {
          bestStrict = candidate;
        }
      }
      if(!bestFallback || fallbackScore < bestFallback.fallbackScore) bestFallback = candidate;
    });
  });

  let best = bestStrict || bestFallback;
  if(!best || best.roughness >= originalRoughness * 0.98) return { hp: hpSamples, torque: torqueSamples };
  return { hp: best.hp, torque: best.torque };
}

function calcCombustionDynoSamples(overrides = {}) {
  let hp = v('hp'), peak = overrides.peak || v('peakrpm'), redline = v('redline'), cr = v('cr');
  let tEn = chk('turbo-en'), tc = tEn ? v('tcount') : 0, tb = tEn ? v('tboost') : 0;
  let sEn = chk('super-en'), sc = sEn ? v('scount') : 0, sb = sEn ? v('sboost') : 0;
  let sharp = overrides.sharp || v('sharp') || 6.5, cm = overrides.curveMult || v('curvemult') || 0.2;
  let TPsi = tb * tc, SPsi = sb * sc;
  let HTc = ((hp * TPsi * (cr / 10) / 7.5) / 2) / 100;
  let HSc = ((hp * SPsi * (cr / 10) / 7.5) / 2) / 100;
  let HT = HTc * 100, HS = HSc * 100;
  let peakNA = Math.max(0.0001, curveNfull(peak, hp, peak, sharp, cm));
  let steps = 80, labels = [], hpSamples = [], torqueSamples = [];

  for(let i = 0; i <= steps; i++) {
    let rpm = redline * i / steps;
    labels.push(Math.round(rpm));
    let naR = Math.max(0, curveNfull(rpm, hp, peak, sharp, cm));
    let naHP = (naR / peakNA) * hp;
    let tR = Math.max(0, curveNfull(rpm, Math.max(1, HTc * 100), peak, sharp, cm));
    let tHP = (tEn && tc > 0) ? (tR / peakNA) * HT : 0;
    let sR = Math.max(0, curveNfull(rpm, Math.max(1, HSc * 100), peak, sharp, cm));
    let sHP = (sEn && sc > 0) ? (sR / peakNA) * HS : 0;
    let totalHP = Math.max(0, Math.round((naHP + tHP + sHP) * 10) / 10);
    hpSamples.push(totalHP);
    torqueSamples.push(rpm > 100 ? Math.round((totalHP * 5252) / rpm) : 0);
  }

  return { labels, hp: hpSamples, torque: torqueSamples };
}

function calcHP() {
  let hp = v('hp'), peak = v('peakrpm'), redline = v('redline'), cr = v('cr');
  let tEn = chk('turbo-en'), tc = tEn ? v('tcount') : 0, tb = tEn ? v('tboost') : 0;
  let sEn = chk('super-en'), sc = sEn ? v('scount') : 0, sb = sEn ? v('sboost') : 0;
  let sharp = v('sharp') || 6.5, cm = v('curvemult') || 0.2;
  let tqSmooth = chk('torque-smooth-en');
  
  let TPsi = tb*tc, SPsi = sb*sc;
  let HTc = ((hp*TPsi*(cr/10)/7.5)/2)/100, HSc = ((hp*SPsi*(cr/10)/7.5)/2)/100;
  let HT = HTc*100, HS = HSc*100;
  let peakNA = Math.max(0.0001, curveNfull(peak, hp, peak, sharp, cm));

  document.getElementById('r-na').textContent = Math.round(hp);
  document.getElementById('r-turbo').textContent = (tEn && tc>0) ? '+'+Math.round(HT) : '+0';
  document.getElementById('r-turbo-sub').textContent = (tEn && tc>0) ? tc+'× @ '+tb+' PSI' : 'desativado';
  document.getElementById('r-super').textContent = (sEn && sc>0) ? '+'+Math.round(HS) : '+0';
  document.getElementById('r-super-sub').textContent = (sEn && sc>0) ? sc+'× @ '+sb+' PSI' : 'desativado';
  document.getElementById('r-total').textContent = Math.round(hp + HT + HS);
  
  let fText = document.getElementById('formula-text');
  if(fText) fText.textContent = 'HP_NA='+Math.round(hp)+' HP_T='+(tEn&&tc>0?Math.round(HT):0)+' HP_S='+(sEn&&sc>0?Math.round(HS):0)+'\nTOTAL='+Math.round(hp+HT+HS)+' HP';

  let samples = calcCombustionDynoSamples({ sharp, curveMult: cm, peak });
  let labels = samples.labels, dTot = samples.hp, dTorque = samples.torque;
  if(tqSmooth) {
    let autoDyno = autoSmoothDynoCurve(labels, dTot, dTorque);
    dTot = autoDyno.hp;
    dTorque = autoDyno.torque;
  }

  if(window._hpChart){
    window._hpChart.data.labels = labels;
    window._hpChart.data.datasets[0].data = dTot;
    window._hpChart.data.datasets[1].data = dTorque;
    window._hpChart.update('none');
  } else {
    const ctx = document.getElementById('hpChart');
    if(!ctx) return;
    window._hpChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Total HP', data: dTot, borderColor: '#39e58c', borderWidth: 2.5, pointRadius: 0, tension: .4, yAxisID: 'y' },
          { label: 'Torque (lbf.ft)', data: dTorque, borderColor: '#f59e0b', borderWidth: 2, borderDash: [5,5], pointRadius: 0, tension: .4, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: {duration: 0},
        plugins: { legend: {display: false}, tooltip: {mode: 'index', intersect: false} },
        scales: {
          x: { ticks: {color: '#9ca3af'}, grid: {color: 'rgba(255,255,255,.05)'} },
          y: { type: 'linear', display: true, position: 'left', title: {display:true, text:'Horsepower', color:'#9ca3af'}, ticks: {color: '#9ca3af'}, grid: {color: 'rgba(255,255,255,.05)'} },
          y1: { type: 'linear', display: true, position: 'right', title: {display:true, text:'Torque', color:'#9ca3af'}, ticks: {color: '#9ca3af'}, grid: {drawOnChartArea: false} }
        }
      }
    });
  }
}

function fitTuneValuesToAutoDyno() {
  let baseSharp = v('sharp') || 6.5;
  let baseCurveMult = v('curvemult') || 0.2;
  let basePeak = v('peakrpm');
  let base = calcCombustionDynoSamples({ sharp: baseSharp, curveMult: baseCurveMult, peak: basePeak });
  let target = autoSmoothDynoCurve(base.labels, base.hp, base.torque);
  let targetPeakIndex = peakIndex(target.hp);
  let best = null;

  for(let sharpStep = 25; sharpStep <= 130; sharpStep++) {
    let sharp = sharpStep / 10;
    for(let curveStep = 4; curveStep <= 120; curveStep += 2) {
      let curveMult = curveStep / 100;
      let candidate = calcCombustionDynoSamples({ sharp, curveMult, peak: basePeak });
      let hpError = hpShapeError(target.hp, candidate.hp);
      let torqueError = hpShapeError(target.torque, candidate.torque);
      let peakShift = Math.abs(peakIndex(candidate.hp) - targetPeakIndex) / Math.max(1, target.hp.length - 1);
      let peakDiff = Math.abs(
        candidate.hp.reduce((max, value) => Math.max(max, value), 0) -
        target.hp.reduce((max, value) => Math.max(max, value), 0)
      ) / Math.max(1, target.hp.reduce((max, value) => Math.max(max, value), 0));
      let score = (hpError * 3.5) + (torqueError * 1.4) + (peakShift * 1.8) + (peakDiff * 2);

      if(!best || score < best.score) {
        best = { sharp, curveMult, hpError, torqueError, peakShift, peakDiff, score };
      }
    }
  }

  if(!best) {
    showToast('Não foi possível otimizar a curva.', 'error');
    return;
  }

  document.getElementById('sharp').value = best.sharp.toFixed(1);
  document.getElementById('curvemult').value = best.curveMult.toFixed(2);

  let status = document.getElementById('fit-torque-values-status');
  if(status) {
    status.textContent = 'Aplicado: PeakSharpness ' + best.sharp.toFixed(1) + ' · CurveMult ' + best.curveMult.toFixed(2) + ' · erro HP ' + (best.hpError * 100).toFixed(1) + '%. A prévia automática continua como você deixou.';
  }
  calc();
  showToast('Valores AC6 ajustados para aproximar a curva realista.', 'success');
}

function calcPW() {
  let hp=v('hp'), tEn=chk('turbo-en'), tc=tEn?v('tcount'):0, tb=tEn?v('tboost'):0;
  let sEn=chk('super-en'), sc=sEn?v('scount'):0, sb=sEn?v('sboost'):0, cr=v('cr');
  let HT=((hp*tb*tc*(cr/10)/7.5)/2), HS=((hp*sb*sc*(cr/10)/7.5)/2);
  let eEn=chk('elec-en'), eHp=eEn?v('e-hp'):0;
  let hpT=hp+HT+HS+eHp, wt=v('weight'), wKg=wt/2.205, wTon=wKg/1000;
  let hpPT=hpT/Math.max(.001,wTon), pw=hpT/Math.max(1,wt), rolRes=wt*.015;
  
  let targetMph = USE_KMH ? 100/1.60934 : 60;
  let targetFtS = targetMph*1.467, mass = wt/32.2;
  let fAt = (hpT*550)/88, accelG = (fAt/mass)/32.2, accelAvg = accelG*.60*32.2;
  let t0 = targetFtS/Math.max(.01,accelAvg);
  let targetLabel = USE_KMH ? '0–100 km/h' : '0–60 mph';
  
  let vTxt, vSub, vColor;
  if(hpPT<50){ vTxt='Pesado demais'; vColor='#ef4444'; vSub='Motor subdimensionado'; }
  else if(hpPT<100){ vTxt='Equilibrado'; vColor='#f59e0b'; vSub='Adequado, sem folga'; }
  else if(hpPT<200){ vTxt='Bom'; vColor='#10b981'; vSub='Relação saudável'; }
  else { vTxt='Excelente'; vColor='#3b82f6'; vSub='Motor superdimensionado'; }
  
  document.getElementById('pw-hppt').textContent = Math.round(hpPT)+' hp/t';
  document.getElementById('pw-ratio').textContent = pw.toFixed(4)+' hp/lb';
  document.getElementById('pw-060').textContent = t0.toFixed(2)+'s';
  document.getElementById('pw-tqmin').textContent = Math.round(rolRes)+' lbf.ft';
  document.getElementById('pw-accel').textContent = accelG.toFixed(3)+' g';
  document.getElementById('pw-verdict-main').textContent = vTxt;
  document.getElementById('pw-verdict-main').style.color = vColor;
  document.getElementById('pw-verdict-sub').textContent = vSub;
  let lbl060 = document.getElementById('lbl-060'); if(lbl060) lbl060.textContent = targetLabel+' est.';
  document.getElementById('pw-formula-text').textContent='HP combustão='+(hp+HT+HS).toFixed(1)+(eEn?' + HP elétrico='+eHp:'')+'  TOTAL='+hpT.toFixed(1)+' HP\nPeso='+wt+' lbs / '+wKg.toFixed(0)+' kg / '+wTon.toFixed(3)+' t\nHP/t='+hpPT.toFixed(1)+'\n'+targetLabel+' est. = '+t0.toFixed(2)+' s';
}

function calcClutch() {
  let st=s('autoshifttype'), ut=v('shiftuptime'), rd=v('revdecay'), rl=v('redline'), ir=v('idlerpm');
  let cEn=chk('clutch-en');
  document.getElementById('cl-shiftup').textContent = (st==='DCT') ? ut.toFixed(2)+' s' : 'variável (Rev)';
  let loss = (st==='DCT') ? rd*(ut*60) : 0;
  document.getElementById('cl-rpmloss').textContent = (st==='DCT') ? Math.round(loss)+' RPM' : '—';
  
  let vTxt, vSub, vColor;
  if(!cEn){ vTxt='Sem embreagem'; vColor='#6b7280'; vSub='Eixo direto'; }
  else if(loss>(rl-ir)*.3){ vTxt='Troca lenta'; vColor='#ef4444'; vSub='Reduz ShiftUpTime'; }
  else{ vTxt='OK'; vColor='#10b981'; vSub='Perda RPM razoável'; }
  
  document.getElementById('cl-verdict').textContent = vTxt;
  document.getElementById('cl-verdict').style.color = vColor;
  document.getElementById('cl-verdict-sub').textContent = vSub;
}

function calcDiff() {
  let cfg=s('diffconfig'), tv=v('torquevector'), dt=s('difftype');
  let bf=(1-((tv+1)/2))*100, br=((tv+1)/2)*100;
  document.getElementById('diff-bias').textContent = (cfg==='AWD') ? bf.toFixed(0)+'% / '+br.toFixed(0)+'%' : (cfg==='FWD'?'100% / 0%':'0% / 100%');
  document.getElementById('diff-flock').textContent = (dt==='New') ? v('fdiffpower')+'%' : '—';
  document.getElementById('diff-rlock').textContent = (dt==='New') ? v('rdiffpower')+'%' : '—';
}

function calcSus() {
  let wt=v('weight'), wd=v('wdist')/100, fs=v('fstiff'), fd=v('fdamp'), fl=v('flen'), fp=v('fprecomp');
  let rs=v('rstiff'), rd=v('rdamp'), rl2=v('rlen'), rp=v('rprecomp');
  let wF=wt*wd, wR=wt*(1-wd), wKg=wt/2.205;
  let mF=wF, mR=wR;
  
  document.getElementById('s-wf').textContent = Math.round(wF)+' lbs';
  document.getElementById('s-wf-sub').textContent = Math.round(wd*100)+'% frontal';
  document.getElementById('s-wr').textContent = Math.round(wR)+' lbs';
  document.getElementById('s-wr-sub').textContent = Math.round((1-wd)*100)+'% traseiro';
  document.getElementById('s-wkg').textContent = Math.round(wKg)+' kg';
  
  let fnF = Math.sqrt(fs/Math.max(.01,mF))/(2*Math.PI);
  let fnR = Math.sqrt(rs/Math.max(.01,mR))/(2*Math.PI);
  document.getElementById('s-fnf').textContent = fnF.toFixed(2)+' Hz';
  document.getElementById('s-fnr').textContent = fnR.toFixed(2)+' Hz';
  
  let pitchOk = fnR >= fnF;
  document.getElementById('s-pitch').textContent = pitchOk ? 'Estável' : 'Instável';
  document.getElementById('s-pitch').style.color = pitchOk ? 'var(--green)' : 'var(--red)';
  document.getElementById('s-pitch-sub').textContent = 'fnR='+fnR.toFixed(2)+' fnF='+fnF.toFixed(2);
}

function calcDrivetrain() {
  let fd=v('dt-finaldrive'), fm=v('dt-fdmult'), rl=v('redline'), wD=v('dt-wdia-x'), rR=v('dt-ratio-r');
  let ratRaw = document.getElementById('dt-ratios').value;
  let rats = ratRaw.split(',').map(x => parseFloat(x.trim())).filter(n => !isNaN(n) && n>0);
  let fFD = fd*fm;
  let tbody = document.querySelector('#dt-table tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  const SPD_SCALE = (10/12)*(60/88);
  function gearSpeed(ratio){
    let wRPM = rl/(ratio*fFD), wRS = wRPM*2*Math.PI/60, sPS = wRS*(wD/2), mph = sPS*SPD_SCALE;
    return {wRPM, mph};
  }
  
  let revC = gearSpeed(rR);
  tbody.innerHTML += `<tr><td>R</td><td class="num">${rR.toFixed(2)}</td><td class="num">${revC.wRPM.toFixed(0)}</td><td class="num">${spd(revC.mph).toFixed(1)}</td></tr>`;
  
  let topMph = 0;
  rats.forEach((rt, i) => {
    let c = gearSpeed(rt);
    topMph = c.mph;
    tbody.innerHTML += `<tr><td>${i+1}ª</td><td class="num">${rt.toFixed(2)}</td><td class="num">${c.wRPM.toFixed(0)}</td><td class="num">${spd(c.mph).toFixed(1)}</td></tr>`;
  });
  
  document.getElementById('dt-rev-spd').textContent = spdFmt(revC.mph);
  if(rats.length > 0) {
    document.getElementById('dt-top-spd').textContent = spdFmt(topMph);
    document.getElementById('dt-spread').textContent = (rats[0]/rats[rats.length-1]).toFixed(2)+'x';
  }
}

function calcBrakes() {
  let bf=v('bk-force'), bias=v('bk-bias')/100, wt=v('weight'), mu=v('bk-mu');
  let spdInput = v('bk-speed');
  let speedMph = USE_KMH ? spdInput/1.60934 : spdInput;
  let fF = bf*bias, fR = bf*(1-bias);
  
  document.getElementById('bk-ffront').textContent = Math.round(fF).toLocaleString();
  document.getElementById('bk-frear').textContent = Math.round(fR).toLocaleString();
  
  let speedFtS = speedMph*1.467, g = 32.2;
  let distFt = (speedFtS*speedFtS)/(2*mu*g);
  let distDisp = USE_KMH ? (distFt*.3048).toFixed(0)+' m' : distFt.toFixed(0)+' ft';
  
  document.getElementById('bk-dist').textContent = distDisp;
  document.getElementById('bk-dist-sub').textContent = 'de '+spdInput+' '+spdLabel();
}

function calcSteering() {
  let ltl=v('st-locktolock'), sr=v('st-ratio'), ack=v('st-ackerman')/100;
  let wb=v('st-wheelbase'), tr=v('st-track');
  let sO = (ltl*180)/sr, sI = Math.min(sO - (sO*(1-ack)), sO*1.2);
  
  document.getElementById('st-outer').textContent = sO.toFixed(1)+'°';
  document.getElementById('st-inner').textContent = sI.toFixed(1)+'°';
  
  let iR = sI*Math.PI/180, turnR = (iR>.001) ? (wb/Math.tan(iR))+(tr/2) : Infinity;
  document.getElementById('st-radius').textContent = isFinite(turnR) ? turnR.toFixed(1)+' studs' : '—';
}

function calcElec() {
  let en = chk('elec-en'), eHp = v('e-hp'), eTq = v('e-tq'), eRl = v('e-redline');
  document.getElementById('elec-hp').textContent = en ? eHp : '—';
  document.getElementById('elec-tq').textContent = en ? eTq : '—';
  document.getElementById('elec-rl').textContent = en ? eRl.toLocaleString() : '—';
  
  let combEl = document.getElementById('elec-combined');
  let modeEl = document.getElementById('elec-mode');
  let eng = chk('engine-en');
  
  if(en && eng) {
    let hp=v('hp'), cr=v('cr'), tEn=chk('turbo-en'), tc=tEn?v('tcount'):0, tb=tEn?v('tboost'):0;
    let sEn=chk('super-en'), sc=sEn?v('scount'):0, sb=sEn?v('sboost'):0;
    let HT=((hp*tb*tc*(cr/10)/7.5)/2), HS=((hp*sb*sc*(cr/10)/7.5)/2);
    combEl.textContent = Math.round(hp+HT+HS+eHp)+' HP';
    modeEl.textContent = 'Híbrido';
  } else if(en) {
    combEl.textContent = eHp+' HP (só elétrico)';
    modeEl.textContent = 'Só elétrico';
  } else if(eng) {
    combEl.textContent = '—';
    modeEl.textContent = 'Só combustão';
  } else {
    combEl.textContent = '—';
    modeEl.textContent = 'Nenhum ativo';
  }
}

function updateBanner() {
  let hp=v('hp'), cr=v('cr'), tEn=chk('turbo-en'), tc=tEn?v('tcount'):0, tb=tEn?v('tboost'):0;
  let sEn=chk('super-en'), sc=sEn?v('scount'):0, sb=sEn?v('sboost'):0;
  let HT=((hp*tb*tc*(cr/10)/7.5)/2), HS=((hp*sb*sc*(cr/10)/7.5)/2);
  let eEn=chk('elec-en'), eHp=eEn?v('e-hp'):0;
  let total=Math.round(hp+HT+HS+eHp);
  let wt=v('weight'), wKg=Math.round(wt/2.205);
  let cfg=s('diffconfig')||'RWD';
  let fd=v('dt-finaldrive')*v('dt-fdmult'), wDia=v('dt-wdia-x'), redline=v('redline');
  let rats=document.getElementById('dt-ratios').value.split(',').map(x=>parseFloat(x.trim())).filter(n=>!isNaN(n)&&n>0);
  let lastR=rats.length?rats[rats.length-1]:1;
  let SCALE=(10/12)*(60/88);
  let wheelRadS=(redline/(lastR*fd))*2*Math.PI/60;
  let topMph=wheelRadS*(wDia/2)*SCALE;
  let topSpd=USE_KMH?topMph*1.60934:topMph;
  
  document.getElementById('bn-hp').textContent=total+' HP';
  document.getElementById('bn-wt').textContent=wKg.toLocaleString()+' kg';
  document.getElementById('bn-cfg').textContent=cfg;
  document.getElementById('bn-top').textContent=topSpd.toFixed(0)+' '+spdLabel();
  document.getElementById('bn-elec').textContent=eEn?'Híbrido':'Combustão';
}

function updateGearIndicator() {
  let rats=document.getElementById('dt-ratios').value.split(',').map(x=>parseFloat(x.trim())).filter(n=>!isNaN(n)&&n>0);
  let container=document.getElementById('gear-indicator');
  container.querySelectorAll('.gear-num').forEach(el=>el.remove());
  rats.forEach((_,i) => {
    let box=document.createElement('div');
    box.className='gear-box gear-num';
    box.textContent=(i+1)+'ª';
    container.appendChild(box);
  });
}

/* ─────────── CORE EXECUTION ─────────── */
function calcCore(){
  calcHP(); calcPW(); calcClutch(); calcDiff(); calcSus(); 
  calcDrivetrain(); calcBrakes(); calcSteering(); calcElec();
  updateBanner(); updateGearIndicator(); refreshUnitLabels(); syncArticulatedFields();
}
const calc = debounce(calcCore, 100);

/* Listeners */
document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', calc);
  el.addEventListener('change', calc);
});
let fitTorqueValuesBtn = document.getElementById('fit-torque-values-btn');
if(fitTorqueValuesBtn) fitTorqueValuesBtn.addEventListener('click', fitTuneValuesToAutoDyno);
calcCore();

/* Toggle Pills */
function bindToggle(cbId, pillId) {
  let cb = document.getElementById(cbId);
  if(!cb) return;
  cb.addEventListener('change', function() {
    if(pillId) {
      let p = document.getElementById(pillId);
      if(p) { p.textContent = this.checked ? 'ON' : 'OFF'; p.className = 'pill ' + (this.checked ? 'pill-on' : 'pill-off'); }
    }
  });
}
bindToggle('turbo-en','turbo-pill'); bindToggle('super-en','super-pill'); bindToggle('engine-en','engine-pill');
bindToggle('torque-smooth-en','torque-smooth-pill');
bindToggle('clutch-en','clutch-pill'); bindToggle('abs-en','abs-pill'); bindToggle('tcs-en','tcs-pill');
bindToggle('ck-en','ck-pill'); bindToggle('elec-en','elec-pill');

/* Unidades */
document.getElementById('unit-kmh').addEventListener('click', () => {
  if(USE_KMH) return;
  let bkSpd = document.getElementById('bk-speed');
  bkSpd.value = Math.round((parseFloat(bkSpd.value)||60)*1.60934);
  USE_KMH = true;
  document.getElementById('unit-kmh').classList.add('active');
  document.getElementById('unit-mph').classList.remove('active');
  calc();
});
document.getElementById('unit-mph').addEventListener('click', () => {
  if(!USE_KMH) return;
  let bkSpd = document.getElementById('bk-speed');
  bkSpd.value = Math.round((parseFloat(bkSpd.value)||100)/1.60934);
  USE_KMH = false;
  document.getElementById('unit-mph').classList.add('active');
  document.getElementById('unit-kmh').classList.remove('active');
  calc();
});

/* Presets Suspensão */
const SUS_PRESETS={
  comfort:{fstiff:8000,fdamp:150,fprecomp:0.8,rstiff:7000,rdamp:130,rprecomp:0.7},
  sport:  {fstiff:18000,fdamp:350,fprecomp:0.5,rstiff:20000,rdamp:380,rprecomp:0.45},
  race:   {fstiff:38000,fdamp:700,fprecomp:0.25,rstiff:42000,rdamp:750,rprecomp:0.2},
  offroad:{fstiff:6000,fdamp:200,fprecomp:1.2,rstiff:5500,rdamp:180,rprecomp:1.3}
};
document.querySelectorAll('.sus-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    let p = SUS_PRESETS[btn.dataset.preset];
    if(!p) return;
    Object.keys(p).forEach(k => { let el=document.getElementById(k); if(el) el.value=p[k]; });
    calc();
    showToast('Preset de suspensão aplicado!', 'success');
  });
});

/* Ride Height Calc */
document.getElementById('rh-calc-btn').addEventListener('click', () => {
  let rhF=v('rh-target-f'), rhR=v('rh-target-r');
  let wt=v('weight'), wd=v('wdist')/100, wF=wt*wd, wR=wt*(1-wd);
  let kF=Math.round(wF/Math.max(.001,rhF)), kR=Math.round(wR/Math.max(.001,rhR));
  let pcF=Math.round((rhF+(wF/Math.max(1,kF)))*100)/100, pcR=Math.round((rhR+(wR/Math.max(1,kR)))*100)/100;
  document.getElementById('rh-result').innerHTML = 
    `FSusStiffness: <b style="color:var(--amber)">${kF.toLocaleString()}</b><br>` +
    `RSusStiffness: <b style="color:var(--green)">${kR.toLocaleString()}</b><br>` +
    `FPreCompress: <b style="color:var(--amber)">${pcF}</b><br>` +
    `RPreCompress: <b style="color:var(--green)">${pcR}</b>`;
});

/* EngineSwitch Calc */
let _esResult = null;
document.getElementById('es-calc-btn').addEventListener('click', () => {
  let fd=v('dt-finaldrive'), fm=v('dt-fdmult'), fFD=fd*fm, wDia=v('dt-wdia-x');
  let rats=document.getElementById('dt-ratios').value.split(',').map(x=>parseFloat(x.trim())).filter(n=>!isNaN(n)&&n>0);
  let lastRatio=rats.length>0?rats[rats.length-1]:1;
  let wt=v('weight'), vmaxSpd=v('es-vmax'), t100=v('es-t100'), hpLimit=v('es-hplimit');
  let vmaxMph = USE_KMH ? vmaxSpd/1.60934 : vmaxSpd;
  const SPD_SCALE = (10/12)*(60/88);
  
  let eRedline = Math.round((vmaxMph/SPD_SCALE)*(60/(2*Math.PI))*(lastRatio*fFD)/(wDia/2));
  let eTrans2 = Math.round(eRedline*0.70), eTrans1 = Math.round(eRedline*0.30);
  
  let targetFtS = (USE_KMH?100/1.60934:60)*1.467, massSlug = wt/32.2;
  let eHP = Math.round((massSlug*(targetFtS/Math.max(0.1,t100))*(targetFtS/2))/550);
  eHP = Math.min(eHP, hpLimit);
  let eTQ = Math.round((eHP*5252)/Math.max(100,eTrans1));
  
  let wheelRPM_low = (5/SPD_SCALE)/((wDia/2)*2*Math.PI/60);
  let efg = Math.round((eRedline/(wheelRPM_low*fFD))*10)/10;
  
  _esResult = { eRedline, eTrans1, eTrans2, eHP, eTQ, efg, hpLimit };
  
  document.getElementById('es-redline').textContent = eRedline.toLocaleString();
  document.getElementById('es-trans2').textContent = eTrans2.toLocaleString();
  document.getElementById('es-trans1').textContent = eTrans1.toLocaleString();
  document.getElementById('es-hp').textContent = eHP;
  document.getElementById('es-tq').textContent = eTQ;
  document.getElementById('es-firstgear').textContent = efg.toFixed(1);
  showToast('Parâmetros elétricos calculados!', 'success');
});

document.getElementById('es-apply-btn').addEventListener('click', () => {
  if(!_esResult){ showToast('Calcule primeiro!', 'error'); return; }
  document.getElementById('e-redline').value = _esResult.eRedline;
  document.getElementById('e-trans1').value = _esResult.eTrans1;
  document.getElementById('e-trans2').value = _esResult.eTrans2;
  document.getElementById('e-hp').value = _esResult.eHP;
  document.getElementById('e-tq').value = _esResult.eTQ;
  document.getElementById('elec-en').checked = true;
  let p = document.getElementById('elec-pill'); if(p){ p.textContent='ON'; p.className='pill pill-on'; }
  calc();
  showToast('Aplicado ao painel elétrico!', 'success');
});

document.getElementById('es-apply-sw-btn').addEventListener('click', () => {
  if(!_esResult){ showToast('Calcule primeiro!', 'error'); return; }
  document.getElementById('sw-firstgear').value = _esResult.efg.toFixed(1);
  document.getElementById('sw-hplimit').value = _esResult.hpLimit;
  showToast('Aplicado ao EngineSwitch!', 'success');
});

/* Export Lua */
function luaN(n){ return Number.isInteger(n) ? String(n) : String(Math.round(n*1000)/1000); }
function tuneLineValue(value) {
  if(typeof value === 'boolean') return value ? 'true' : 'false';
  if(typeof value === 'string') return '"' + value + '"';
  return luaN(value);
}

function collectTuneValues() {
  let vals = {};
  document.querySelectorAll('[data-tune]').forEach(el => {
    let k = el.dataset.tune;
    if(vals[k] !== undefined) return;
    if(el.dataset.tuneBool !== undefined) vals[k] = el.checked;
    else if(el.dataset.tuneStr !== undefined) vals[k] = el.value;
    else vals[k] = parseFloat(el.value) || 0;
  });
  return vals;
}

function replaceTuneLine(source, key, value) {
  let escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let re = new RegExp('(^[\\t ]*Tune\\.' + escaped + '[\\t ]*=[\\t ]*)([^\\r\\n]*?)([\\t ]*(?:--.*)?$)', 'm');
  if(!re.test(source)) return source;
  return source.replace(re, (_, prefix, _oldValue, suffix) => prefix + tuneLineValue(value) + suffix);
}

function buildRatiosBlock() {
  let rR = v('dt-ratio-r');
  let rats = document.getElementById('dt-ratios').value.split(',').map(x => parseFloat(x.trim())).filter(n => !isNaN(n) && n > 0);
  let ratBlock = 'Tune.Ratios\t\t\t= {\n\t--[[Reverse]]\t' + luaN(rR) + '\t,\n\t--[[Neutral]]\t0\t,\n';
  rats.forEach((r, i) => ratBlock += '\t--[[' + (i + 1) + ']]\t\t' + luaN(r) + '\t,\n');
  ratBlock += '}';
  return ratBlock;
}

function buildByInspareLua() {
  let source = chassisTemplateSource || '';
  if(!source) return buildLuaIsaacsa2();

  let vals = collectTuneValues();
  vals.SusEnabled = true;
  vals.TCSGradient = 20;
  vals.FBrakeForce = Math.round(v('bk-force') * (v('bk-bias') / 100));
  vals.RBrakeForce = Math.round(v('bk-force') * (1 - (v('bk-bias') / 100)));
  vals.PBrakeForce = v('bk-pforce');

  Object.keys(vals).forEach(key => {
    if(key === 'Ratios' || key === 'BrakeForce' || key === 'BrakeBias') return;
    source = replaceTuneLine(source, key, vals[key]);
  });

  source = source.replace(/Tune\.Ratios\s*=\s*\{[\s\S]*?\n\}/, buildRatiosBlock());
  return source;
}

function buildLua() {
  if(IS_BYINSPARE) return buildByInspareLua();
  return buildByIsaacsa2Lua();
}

function injectArticulatedBlock(source) {
  let block = buildArticulatedBlock();
  if(!block) return source;
  if(/--\[\[Articulated Module 2\]\][\s\S]*?\n(?=return Tune)/.test(source)) {
    return source.replace(/--\[\[Articulated Module 2\]\][\s\S]*?\n(?=return Tune)/, block);
  }
  return source.replace(/\nreturn Tune\s*$/m, block + '\nreturn Tune');
}

function buildByIsaacsa2Lua() {
  let source = chassisTemplateSource || '';
  if(!source) return injectArticulatedBlock(buildLuaIsaacsa2());

  let vals = collectTuneValues();
  Object.keys(vals).forEach(key => {
    if(key === 'Ratios') return;
    source = replaceTuneLine(source, key, vals[key]);
  });

  source = source.replace(/Tune\.Ratios\s*=\s*\{[\s\S]*?\n\}/, buildRatiosBlock());
  return injectArticulatedBlock(source);
}

function buildLuaIsaacsa2() {
  let vals={};
  document.querySelectorAll('[data-tune]').forEach(el => {
    let k = el.dataset.tune;
    if(vals[k]!==undefined) return;
    if(el.dataset.tuneBool!==undefined) vals[k] = el.checked ? 'true' : 'false';
    else if(el.dataset.tuneStr!==undefined) vals[k] = '"'+el.value+'"';
    else vals[k] = luaN(parseFloat(el.value)||0);
  });
  function L(key, comment){
    let v2 = vals[key]; if(v2===undefined) return '';
    let pad = '\t\t\t'; if(key.length<8) pad='\t\t\t\t'; else if(key.length<14) pad='\t\t\t'; else if(key.length<20) pad='\t\t'; else pad='\t';
    let line = 'Tune.'+key+pad+'= '+v2;
    if(comment) line += (line.length<40?'\t\t':'  ')+'-- '+comment;
    return line+'\n';
  }
  
  let rR=v('dt-ratio-r');
  let rats=document.getElementById('dt-ratios').value.split(',').map(x=>parseFloat(x.trim())).filter(n=>!isNaN(n)&&n>0);
  let ratBlock='Tune.Ratios\t\t\t= {\n\t\t--[[Reverse]]\t'+luaN(rR)+'\t,\n\t\t--[[Neutral]]\t0\t,\n';
  rats.forEach((r,i) => ratBlock+='\t\t--[[ '+(i+1)+' ]]\t\t\t'+luaN(r)+'\t,\n');
  ratBlock+='}\n';

  let t = '--[[\n       ___  _____\n      / _ |/ ___/\tpointclouded | NVNA\n     / __ / /__\t\t\t  LuaInt | NVNA\n    /_/ |_\\___/   Build 6C, Version 1.5, Update 2.1\n\n    Gerado pelo AC6C Tune Maker (isaacsa2)\n]]\n\nlocal Tune = {}\n\n';
  t+='--[[Misc]]\n'+L('LoadDelay')+L('AutoStart')+L('AutoFlip')+'\n';
  t+='--[[Wheel Alignment]]\n'+L('FCamber')+L('RCamber')+L('FCaster')+L('RCaster')+L('FToe')+L('RToe')+'\n';
  t+='--[[Weight and CG]]\n'+L('Weight');
  t+='Tune.WeightBSize\t\t= {\n\t\t--[[Width]]\t\t10.4\t,\n\t\t--[[Height]]\t11.6\t,\n\t\t--[[Length]]\t47\t}\n';
  t+=L('WeightDist')+L('CGHeight')+'Tune.WBVisible\t\t\t= false\n\n--Unsprung Weight\n'+L('FWheelDensity')+L('RWheelDensity')+'\n';
  t+='Tune.AxleSize\t\t\t= 2\n'+L('AxleDensity')+'Tune.CustomSuspensionDensity\t= 0.01\n\n';
  
  t+='--[[Suspension]]\nTune.SuspensionEnabled\t\t= true\n\n--Front Strut\n'+L('FSusStiffness')+L('FSusDamping')+L('FSusLength')+L('FPreCompress')+L('FExtensionLim')+L('FCompressLim')+'Tune.FGyroDampening\t\t= 50\n\n';
  t+='--Rear Strut\n'+L('RSusStiffness')+L('RSusDamping')+L('RSusLength')+L('RPreCompress')+L('RExtensionLim')+L('RCompressLim')+'Tune.RGyroDampening\t\t= 50\n\n';
  t+='--Old Suspension Settings\nTune.FSusAngle\t\t\t= 80\nTune.FWsBoneLen\t\t\t= 4\nTune.FWsBoneAngle\t\t= 0\nTune.FAnchorOffset\t\t= { -.4, -.5, 0 }\nTune.FSpringOffset\t\t= { 0, 0, 0 }\nTune.RSusAngle\t\t\t= 80\nTune.RWsBoneLen\t\t\t= 4\nTune.RWsBoneAngle\t\t= 0\nTune.RAnchorOffset\t\t= { -.4, -.5, 0 }\nTune.RSpringOffset\t\t= { 0, 0, 0 }\n\n';
  t+='--Aesthetics\nTune.SusVisible\t\t\t= false\nTune.SusRadius\t\t\t= .2\nTune.SusThickness\t\t= .1\nTune.SusColor\t\t\t= "Bright red"\nTune.SusCoilCount\t\t= 6\n\n';
  
  t+='--[[Wheel Stabilizer Gyro]]\nTune.FGyroDamp\t\t\t= 100\nTune.RGyroDamp\t\t\t= 100\n\n';
  t+='--[[Steering]]\n'+L('SteeringType')+'-- New Options\n'+L('SteerRatio')+L('LockToLock')+L('Ackerman')+'\n-- Old Options\nTune.SteerInner\t\t\t= 60\nTune.SteerOuter\t\t\t= 60\n\n-- General Steering\n'+L('SteerSpeed')+L('ReturnSpeed')+L('SteerDecay')+L('MinSteer')+'Tune.MSteerExp\t\t\t= 1\n\n-- Steer Gyro\nTune.SteerD\t\t\t\t= 1000\nTune.SteerMaxTorque\t\t= 45000\nTune.SteerP\t\t\t\t= 100000\n\n';
  t+='--Four Wheel Steering (LuaInt)\n'+L('FWSteer')+L('RSteerOuter')+L('RSteerInner')+L('RSteerSpeed')+L('RSteerDecay')+'Tune.RSteerD\t\t\t= 1000\nTune.RSteerMaxTorque\t= 50000\nTune.RSteerP\t\t\t= 100000\n\n';
  
  t+='--[[Engine]]\n'+L('Engine')+L('Horsepower')+L('IdleRPM')+L('PeakRPM')+L('Redline')+L('PeakSharpness')+L('CurveMult')+'Tune.EqPoint\t\t\t= 5252\n\n'+L('CompressionRatio')+'\n';
  t+='-- Electric Engine\n'+L('Electric')+L('E_Redline')+L('E_Trans1')+L('E_Trans2')+'-- Horsepower\n'+L('E_Horsepower')+L('EH_FrontMult')+L('EH_EndMult')+L('EH_EndPercent')+'-- Torque\n'+L('E_Torque')+L('ET_EndMult')+L('ET_EndPercent')+'\n';
  t+='-- Turbocharger\n'+L('Turbochargers')+L('T_Boost')+L('T_BoostLag')+'Tune.T2_BoostLag\t\t= '+luaN(v('tlag'))+'\n\n';
  t+='-- Supercharger\n'+L('Superchargers')+L('S_Boost')+L('S_Sensitivity')+'\n--Misc\n'+L('ThrotAccel')+L('ThrotDecel')+'\nTune.BrakeAccel\t\t\t= '+luaN(v('brakeaccel'))+'\nTune.BrakeDecel\t\t\t= '+luaN(v('brakedecel'))+'\n\n'+L('RevAccel')+L('RevDecay')+L('RevBounce')+'\n'+L('IdleThrottle')+L('Flywheel')+'\n'+L('InclineComp')+'\n';
  
  t+='--[[Drivetrain]]\n'+L('Config')+L('TorqueVector')+'\n-- Differential Settings\n'+L('DifferentialType')+'\n-- Old Options\n'+L('FDiffSlipThres')+L('FDiffLockThres')+L('RDiffSlipThres')+L('RDiffLockThres')+L('CDiffSlipThres')+L('CDiffLockThres')+'\n-- New Options\n'+L('FDiffPower')+L('FDiffCoast')+L('FDiffPreload')+L('RDiffPower')+L('RDiffCoast')+L('RDiffPreload')+'\n-- Traction Control\n'+L('TCSEnabled')+L('TCSThreshold')+'Tune.TCSGradient\t\t= 10\n'+L('TCSLimit')+'\n';
  
  t+='--[[Transmission]]\n'+L('Clutch')+'Tune.TransModes\t\t\t= {"Auto", "Semi"}\n\n'+L('ClutchMode')+L('ClutchType')+'\n--[[Transmission]]\n'+L('Stall')+'Tune.ClutchRel\t\t\t= false\n'+L('ClutchEngage')+L('SpeedEngage')+'\n--Clutch Kick\n'+L('ClutchKick')+L('KickMult')+L('KickSpeedThreshold')+L('KickRPMThreshold')+'\n--Clutch: Old mode\n'+L('ClutchRPMMult')+'\n--Torque Converter:\nTune.TQLock\t\t\t\t= false\n\n--Torque Converter and CVT:\n'+L('RPMEngage')+'\n--Neutral Rev Limiter\n'+L('NeutralLimit')+L('NeutralRevRPM')+'Tune.LimitClutch\t\t= '+vals['LimitClutch']+'\n\n';
  t+='--Automatic Settings\n'+L('AutoShiftMode')+L('AutoShiftType')+L('AutoShiftVers')+L('AutoUpThresh')+L('AutoDownThresh')+'\n--Automatic: Revmatching\n'+L('ShiftThrot')+'\n--Automatic: DCT\n'+L('ShiftUpTime')+L('ShiftDnTime')+'\n--Gear Ratios\n'+L('FinalDrive')+ratBlock+L('FDMult')+'\n';
  
  t+='--[[Brakes]]\n'+L('ABSEnabled')+L('ABSThreshold')+'\n'+L('BrakeForce')+L('BrakeBias')+L('PBrakeForce')+L('PBrakeBias')+L('EBrakeForce')+'\n';
  
  t+='--[[Default Controls]]\nTune.Peripherals = {\n\tMSteerWidth\t\t\t\t= 67,\n\tMSteerDZone\t\t\t\t= 10,\n\tControlLDZone\t\t\t= 5,\n\tControlRDZone\t\t\t= 5,\n}\n\nTune.Controls = {\n\tToggleTCS\t\t\t\t= Enum.KeyCode.T,\n\tToggleABS\t\t\t\t= Enum.KeyCode.Y,\n\tToggleTransMode\t\t\t= Enum.KeyCode.LeftAlt,\n\tToggleMouseDrive\t\t= Enum.KeyCode.Insert,\n\tThrottle\t\t\t\t= Enum.KeyCode.Up,\n\tBrake\t\t\t\t\t= Enum.KeyCode.Down,\n\tSteerLeft\t\t\t\t= Enum.KeyCode.Left,\n\tSteerRight\t\t\t\t= Enum.KeyCode.Right,\n\tThrottle2\t\t\t\t= Enum.KeyCode.W,\n\tBrake2\t\t\t\t\t= Enum.KeyCode.S,\n\tSteerLeft2\t\t\t\t= Enum.KeyCode.A,\n\tSteerRight2\t\t\t\t= Enum.KeyCode.D,\n\tShiftUp\t\t\t\t\t= Enum.KeyCode.E,\n\tShiftDown\t\t\t\t= Enum.KeyCode.Q,\n\tClutch\t\t\t\t\t= Enum.KeyCode.LeftShift,\n\tPBrake\t\t\t\t\t= Enum.KeyCode.Asterisk,\n\tMouseThrottle\t\t\t= Enum.UserInputType.MouseButton1,\n\tMouseBrake\t\t\t\t= Enum.UserInputType.MouseButton2,\n\tMouseClutch\t\t\t\t= Enum.KeyCode.W,\n\tMouseShiftUp\t\t\t= Enum.KeyCode.E,\n\tMouseShiftDown\t\t\t= Enum.KeyCode.Q,\n\tMousePBrake\t\t\t\t= Enum.KeyCode.LeftShift,\n\tContlrThrottle\t\t\t= Enum.KeyCode.ButtonR2,\n\tContlrBrake\t\t\t\t= Enum.KeyCode.ButtonL2,\n\tContlrSteer\t\t\t\t= Enum.KeyCode.Thumbstick1,\n\tContlrShiftUp\t\t\t= Enum.KeyCode.ButtonY,\n\tContlrShiftDown\t\t\t= Enum.KeyCode.ButtonX,\n\tContlrClutch\t\t\t= Enum.KeyCode.ButtonR1,\n\tContlrPBrake\t\t\t= Enum.KeyCode.ButtonL1,\n\tContlrToggleTMode\t\t= Enum.KeyCode.DPadUp,\n\tContlrToggleTCS\t\t\t= Enum.KeyCode.DPadDown,\n\tContlrToggleABS\t\t\t= Enum.KeyCode.DPadRight,\n}\n\nreturn Tune\n';
  return t;
}

const expBack = document.getElementById('export-modal-backdrop');
const expOut = document.getElementById('export-output');
function openExport(){ expOut.textContent=buildLua(); expBack.classList.add('open'); }
document.getElementById('export-btn').addEventListener('click', openExport);
document.getElementById('export-btn-side').addEventListener('click', openExport);
document.getElementById('export-modal-close').addEventListener('click', () => expBack.classList.remove('open'));
expBack.addEventListener('click', e => { if(e.target===expBack) expBack.classList.remove('open'); });

document.getElementById('export-copy-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(expOut.textContent).then(() => {
    showToast('Código copiado!', 'success');
  });
});
document.getElementById('export-download-btn').addEventListener('click', () => {
  let bl = new Blob([expOut.textContent], {type:'text/plain'}), u = URL.createObjectURL(bl), a = document.createElement('a');
  a.href=u; a.download='A-Chassis-Tune.lua'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
});

/* EngineSwitch Script Gen */
document.getElementById('sw-export-btn').addEventListener('click', () => {
  let manual = document.getElementById('sw-manual').checked;
  let changeAtSpd = manual ? 0 : v('sw-speed');
  let key = document.getElementById('sw-key').value;
  let firstGear = v('sw-firstgear');
  let hpLimit = v('sw-hplimit');
  let printStates = document.getElementById('sw-print').checked;

  let lua = `-- EngineSwitch — gerado pelo AC6C Tune Maker\nlocal UserInputService = game:GetService("UserInputService")\nlocal tuneModule = require(script.Parent.Car.Value["A-Chassis Tune"]) :: ModuleScript\nlocal driveScript = script.Parent.Drive :: LocalScript\nlocal valuesFolder = script.Parent.Values :: Folder\n\nlocal PRINT_STATES = ${printStates}\nlocal TOGGLE_KEY = Enum.KeyCode.${key}\nlocal CHANGE_AT_SPEED = ${changeAtSpd}\nlocal ELECTRIC_FIRST_GEAR = ${firstGear}\nlocal ELECTRIC_HP_LIMIT = ${hpLimit}\n\nlocal cachedTune = {}\nlocal changed = false\nfor key, value in tuneModule do\n\tcachedTune[key] = value\nend\n\nlocal function toggleEngineState(electric: boolean)\n\tif PRINT_STATES then print(electric and "Electric" or "Combustion") end\n\ttuneModule.Electric = electric\n\ttuneModule.Engine = not electric\n\ttuneModule.Redline = electric and cachedTune.E_Redline or cachedTune.Redline\n\ttuneModule.ShiftRPM = electric and cachedTune.E_Redline or cachedTune.ShiftRPM\n\ttuneModule.Turbochargers = electric and 0 or cachedTune.Turbochargers\n\ttuneModule.Superchargers = electric and 0 or cachedTune.Superchargers\n\ttuneModule.Clutch = not electric and cachedTune.Clutch or false\n\ttuneModule.IdleRPM = electric and 0 or cachedTune.IdleRPM\n\ttuneModule.IdleThrottle = electric and 0 or cachedTune.IdleThrottle\n\ttuneModule.ClutchType = electric and "Clutch" or cachedTune.ClutchType\n\ttuneModule.AutoShiftType = electric and "DCT" or cachedTune.AutoShiftType\n\ttuneModule.Ratios[3] = electric and ELECTRIC_FIRST_GEAR or cachedTune.Ratios[3]\n\ttuneModule.HPLimit = electric and ELECTRIC_HP_LIMIT or cachedTune.HPLimit\nend\n\n`;
  if(changeAtSpd > 0){
    lua += `local function onVelocityChanged(value: Vector3)\n\tif value.Magnitude < 5 then changed = false end\n\tif changed then return end\n\n\tif value.Magnitude >= CHANGE_AT_SPEED and tuneModule.Electric then\n\t\ttoggleEngineState(false)\n\t\tchanged = true\n\telseif value.Magnitude < CHANGE_AT_SPEED and not tuneModule.Electric then\n\t\ttoggleEngineState(true)\n\tend\nend\n\nvaluesFolder.Velocity.Changed:Connect(onVelocityChanged)\n`;
  } else {
    lua += `local function onInputBegan(input: InputObject, gameProcessed: boolean)\n\tif gameProcessed or input.KeyCode ~= TOGGLE_KEY then return end\n\tlocal electric = not tuneModule.Electric and true or false\n\ttoggleEngineState(electric)\nend\n\nUserInputService.InputBegan:Connect(onInputBegan)\n`;
  }
  lua += `\ntoggleEngineState(true)\n`;

  let out = document.getElementById('sw-output');
  out.textContent = lua; out.style.display = 'block';
  document.getElementById('sw-copy-btn').style.display = '';
});
document.getElementById('sw-copy-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('sw-output').textContent).then(() => showToast('EngineSwitch copiado!', 'success'));
});

/* Import Parser */
const impBack = document.getElementById('import-modal-backdrop');
const impTA = document.getElementById('import-textarea');
const impSt = document.getElementById('import-status');
document.getElementById('open-import-btn').addEventListener('click', () => impBack.classList.add('open'));
document.getElementById('import-modal-close').addEventListener('click', () => impBack.classList.remove('open'));
document.getElementById('import-modal-close2').addEventListener('click', () => impBack.classList.remove('open'));
impBack.addEventListener('click', e => { if(e.target===impBack) impBack.classList.remove('open'); });

document.getElementById('import-file-input').addEventListener('change', e => {
  let f = e.target.files[0]; if(!f) return;
  let r = new FileReader();
  r.onload = ev => { impTA.value = ev.target.result; impSt.textContent = '✓ '+f.name; impSt.className = 'import-status'; impSt.style.display = ''; };
  r.readAsText(f); e.target.value = '';
});

const KM={'Horsepower':'hp','PeakRPM':'peakrpm','Redline':'redline','CompressionRatio':'cr','IdleRPM':'idlerpm','IdleThrottle':'idlethrot','RevAccel':'revaccel','RevDecay':'revdecay','RevBounce':'revbounce','Flywheel':'flywheel','PeakSharpness':'sharp','CurveMult':'curvemult','ThrotAccel':'throtaccel','ThrotDecel':'throtdecel','InclineComp':'inclinecomp','Turbochargers':'tcount','T_Boost':'tboost','T_BoostLag':'tlag','Superchargers':'scount','S_Boost':'sboost','S_Sensitivity':'ssens','ShiftUpTime':'shiftuptime','ShiftDnTime':'shiftdntime','ShiftThrot':'shiftthrot','AutoUpThresh':'autoupthresh','AutoDownThresh':'autodownthresh','ClutchEngage':'clutchengage','ClutchRPMMult':'clutchrpmmult','SpeedEngage':'speedengage','RPMEngage':'rpmengage','KickMult':'kickmult','KickSpeedThreshold':'kickspeed','KickRPMThreshold':'kickrpm','TorqueVector':'torquevector','FDiffPower':'fdiffpower','FDiffCoast':'fdiffcoast','FDiffPreload':'fdiffpreload','FDiffSlipThres':'fdiffslip','FDiffLockThres':'fdifflock','RDiffPower':'rdiffpower','RDiffCoast':'rdiffcoast','RDiffPreload':'rdiffpreload','RDiffSlipThres':'rdiffslip','RDiffLockThres':'rdifflock','CDiffSlipThres':'cdiffslip','CDiffLockThres':'cdifflock','Weight':'weight','WeightDist':'wdist','CGHeight':'cgh','FWheelDensity':'fwd','RWheelDensity':'rwd','AxleDensity':'axd','FSusStiffness':'fstiff','FSusDamping':'fdamp','FSusLength':'flen','FPreCompress':'fprecomp','FExtensionLim':'fext','FCompressLim':'fcomp','RSusStiffness':'rstiff','RSusDamping':'rdamp','RSusLength':'rlen','RPreCompress':'rprecomp','RExtensionLim':'rext','RCompressLim':'rcomp','FinalDrive':'dt-finaldrive','FDMult':'dt-fdmult','BrakeForce':'bk-force','BrakeBias':'bk-bias','PBrakeForce':'bk-pforce','PBrakeBias':'bk-pbias','EBrakeForce':'bk-eforce','BrakeAccel':'brakeaccel','BrakeDecel':'brakedecel','ABSThreshold':'absthreshold','TCSThreshold':'tcsthreshold','TCSLimit':'tcslimit','LockToLock':'st-locktolock','SteerRatio':'st-ratio','Ackerman':'st-ackerman','SteerSpeed':'steerspeed','ReturnSpeed':'returnspeed','SteerDecay':'steerdecay','MinSteer':'minsteer','RSteerOuter':'rsteer-outer','RSteerInner':'rsteer-inner','RSteerSpeed':'rsteer-speed','RSteerDecay':'rsteer-decay','E_Redline':'e-redline','E_Trans1':'e-trans1','E_Trans2':'e-trans2','E_Horsepower':'e-hp','EH_FrontMult':'e-hfrontmult','EH_EndMult':'e-hendmult','EH_EndPercent':'e-hendpct','E_Torque':'e-tq','ET_EndMult':'e-tqendmult','ET_EndPercent':'e-tqendpct','LoadDelay':'loaddelay','NeutralRevRPM':'neutralrevrpm','FCamber':'fcamber','RCamber':'rcamber','FCaster':'fcaster','RCaster':'rcaster','FToe':'ftoe','RToe':'rtoe'};
const KB={'Engine':'engine-en','ABSEnabled':'abs-en','TCSEnabled':'tcs-en','Clutch':'clutch-en','Stall':'stall-en','ClutchKick':'ck-en','Electric':'elec-en','AutoFlip':'autoflip-en','AutoStart':'autostart-en','NeutralLimit':'neutrallimit-en','LimitClutch':'limitclutch-en'};
const KS={'AutoShiftType':'autoshifttype','AutoShiftVers':'autoshiftvers','AutoShiftMode':'autoshiftmode','ClutchType':'clutchtype','ClutchMode':'clutchmode','DifferentialType':'difftype','Config':'diffconfig','SteeringType':'steeringtype','FWSteer':'fwsteer'};

function decodeXmlEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractTuneSource(text) {
  if(!/<roblox[\s>]/i.test(text)) return text;
  let protectedMatches = [...text.matchAll(/<ProtectedString name="Source"><!\[CDATA\[([\s\S]*?)\]\]><\/ProtectedString>/g)];
  if(protectedMatches.length === 0) {
    protectedMatches = [...text.matchAll(/<ProtectedString name="Source">([\s\S]*?)<\/ProtectedString>/g)];
  }
  for(let match of protectedMatches) {
    let source = decodeXmlEntities(match[1] || '');
    if(/local\s+Tune\s*=\s*\{\}/.test(source) && /return\s+Tune/.test(source)) return source;
  }
  return text;
}

function applyTuneTextToForm(txt) {
  txt = extractTuneSource(txt);
  let applied = 0;
  
  let ratBlock = txt.match(/Tune\.Ratios\s*=\s*\{([\s\S]*?)\}/);
  if(ratBlock){
    let inner = ratBlock[1].replace(/--\[\[.*?\]\]/g,'').replace(/--[^\n]*/g,'');
    let ns = inner.split(',').map(x=>parseFloat(x.trim())).filter(n=>!isNaN(n));
    if(ns.length>=3){
      document.getElementById('dt-ratio-r').value = ns[0];
      document.getElementById('dt-ratios').value = ns.slice(2).join(', ');
      applied++;
    }
  }

  let fBrake = txt.match(/Tune\.FBrakeForce\s*=\s*([.\d]+)/);
  let rBrake = txt.match(/Tune\.RBrakeForce\s*=\s*([.\d]+)/);
  if(fBrake && rBrake) {
    let f = parseFloat(fBrake[1]) || 0;
    let r = parseFloat(rBrake[1]) || 0;
    let total = f + r;
    if(total > 0) {
      document.getElementById('bk-force').value = Math.round(total);
      document.getElementById('bk-bias').value = Math.round((f / total) * 100);
      applied += 2;
    }
  }
  
  txt.split('\n').forEach(line => {
    line = line.replace(/--.*$/,'').trim();
    if(/Tune\.Ratios/.test(line)) return;
    let m = line.match(/Tune\.(\w+)\s*=\s*(.+)/); if(!m) return;
    let k = m[1], raw = m[2].trim().replace(/,.*$/,'').trim();
    
    if(KB[k]){ 
      let val = raw==='true'; let el=document.getElementById(KB[k]); 
      if(el){ el.checked=val; let p=document.getElementById(KB[k].replace('-en','-pill')); if(p){ p.textContent=val?'ON':'OFF'; p.className='pill '+(val?'pill-on':'pill-off'); } applied++; }
    } else if(KS[k]){ 
      let sv = raw.replace(/^"(.*)"$/,'$1'); let sel=document.getElementById(KS[k]); 
      if(sel){ for(let i=0;i<sel.options.length;i++){ if(sel.options[i].value===sv){ sel.selectedIndex=i; applied++; break; } } }
    } else if(KM[k]){ 
      let num = parseFloat(raw); let nel=document.getElementById(KM[k]); 
      if(nel && !isNaN(num)){ nel.value=num; applied++; }
    }
  });
  
  calc();
  syncArticulatedFields();
  return applied;
}

document.getElementById('import-apply-btn').addEventListener('click', () => {
  let txt = impTA.value;
  if(!txt.trim()){ impSt.textContent='✗ Cole ou carregue um Tune'; impSt.className='import-status err'; impSt.style.display=''; return; }
  let applied = applyTuneTextToForm(txt);
  if(applied > 0) {
    showToast(`${applied} campos aplicados!`, 'success');
    setTimeout(() => impBack.classList.remove('open'), 700);
  } else {
    showToast('Nenhum campo reconhecido.', 'error');
  }
});

window.addEventListener('DOMContentLoaded', () => {
  let templatePath = IS_BYINSPARE ? '/chassis/AC6byInspareTUNE.luau' : '/chassis/AC6byisaacsa2TUNE.luau';
  fetch(templatePath)
    .then(resp => resp.ok ? resp.text() : Promise.reject(new Error('HTTP ' + resp.status)))
    .then(txt => {
      chassisTemplateSource = extractTuneSource(txt);
      applyTuneTextToForm(chassisTemplateSource);
      applyLanguage(false);
    })
    .catch(() => {
      if(IS_BYINSPARE) showToast(tr('templateError'), 'error');
    });
});

/* ─────────── LOCAL STORAGE & SHARE URL ─────────── */
function getFormValues() {
  let data = {};
  document.querySelectorAll('input[id], select[id]').forEach(el => {
    if(el.type === 'checkbox') data[el.id] = el.checked;
    else data[el.id] = el.value;
  });
  return data;
}

function setFormValues(data) {
  Object.keys(data).forEach(id => {
    let el = document.getElementById(id);
    if(el) {
      if(el.type === 'checkbox') {
        el.checked = data[id];
        let p = document.getElementById(id.replace('-en','-pill'));
        if(p) { p.textContent = data[id] ? 'ON' : 'OFF'; p.className = 'pill ' + (data[id] ? 'pill-on' : 'pill-off'); }
      }
      else el.value = data[id];
    }
  });
  calcCore();
}

document.getElementById('save-local-btn').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormValues()));
  showToast(tr('saved'), 'success');
});

document.getElementById('load-local-btn').addEventListener('click', () => {
  let saved = localStorage.getItem(STORAGE_KEY);
  if(saved) {
    setFormValues(JSON.parse(saved));
    showToast(tr('loaded'), 'success');
  } else {
    showToast(tr('noSavedTune'), 'error');
  }
});

document.getElementById('share-url-btn').addEventListener('click', () => {
  let base64 = btoa(JSON.stringify(getFormValues()));
  let url = window.location.origin + window.location.pathname + '?tune=' + base64;
  navigator.clipboard.writeText(url).then(() => {
    showToast(tr('linkCopied'), 'success');
  });
});

window.addEventListener('DOMContentLoaded', () => {
  let params = new URLSearchParams(window.location.search);
  let tuneData = params.get('tune');
  if(tuneData) {
    try {
      setFormValues(JSON.parse(atob(tuneData)));
      showToast(tr('tuneFromLink'), 'success');
      window.history.replaceState(null, '', window.location.pathname);
    } catch(e) {
      showToast(tr('invalidTune'), 'error');
    }
  }
});

/* ─────────── TRADUÇÃO (i18n) ─────────── */
const LANG_KEY = STORAGE_KEY + '_lang';
const dict = {
  pt: {
    htmlLang: 'pt-BR',
    switchLabel: '🇺🇸 EN-US',
    changed: 'Idioma alterado para PT-BR',
    titleSuffix: 'Tune Maker',
    config: 'Configuração',
    file: 'Arquivo',
    import: 'Importar Tune',
    export: 'Exportar Lua',
    speed: 'Velocidade:',
    save: '💾 Salvar Local',
    load: '📂 Carregar',
    share: '🔗 Compartilhar Link',
    engine: 'Motor',
    transmission: 'Câmbio & Embreagem',
    diff: 'Diferencial',
    weight: 'Peso & Suspensão',
    drivetrain: 'Drivetrain',
    brakes: 'Freios',
    steering: 'Direção',
    electric: 'Motor Elétrico',
    extras: 'Extras & Misc',
    articulated: 'Articulado',
    articulatedTitle: 'ARTICULADO',
    articulatedSub: 'Overrides do modulo 2 - Body2/Wheels2/AJoint',
    articulatedSync: 'Sincronizacao',
    articulatedNote: 'O Drive do byisaacsa2 usa campos com sufixo 2 quando existem e volta para o valor principal quando nao existem.',
    summary: 'Resumo',
    body2Weight: 'Peso Body2',
    module2Config: 'Config modulo 2',
    sharedHp: 'HP compartilhado',
    sharedTorque: 'Torque compartilhado',
    sharedSpeed: 'Vel. compartilhada',
    weightTraction: 'Peso & Tracao',
    module2Steering: 'Direcao do modulo 2',
    engineSub: 'Curva de potência · torque no dyno',
    exportStatusIsaac: 'Gera o A-Chassis Tune pronto pro Roblox',
    exportStatusInspare: 'Gera só os campos que existem no AC6 byInspare',
    templateError: 'Não consegui carregar o template byInspare em public/chassis.',
    invalidTune: 'Link de tune inválido.',
    tuneFromLink: 'Tune importado pelo Link!',
    saved: 'Tune salvo na garagem local!',
    loaded: 'Tune carregado com sucesso!',
    noSavedTune: 'Nenhum tune salvo encontrado.',
    linkCopied: 'Link copiado para a área de transferência!'
  },
  en: {
    htmlLang: 'en-US',
    switchLabel: '🇧🇷 PT-BR',
    changed: 'Language changed to EN-US',
    titleSuffix: 'Tune Maker',
    config: 'Configuration',
    file: 'File',
    import: 'Import Tune',
    export: 'Export Lua',
    speed: 'Speed:',
    save: '💾 Save Local',
    load: '📂 Load',
    share: '🔗 Share Link',
    engine: 'Engine',
    transmission: 'Transmission & Clutch',
    diff: 'Differential',
    weight: 'Weight & Suspension',
    drivetrain: 'Drivetrain',
    brakes: 'Brakes',
    steering: 'Steering',
    electric: 'Electric Motor',
    extras: 'Extras & Misc',
    articulated: 'Articulated',
    articulatedTitle: 'ARTICULATED',
    articulatedSub: 'Module 2 overrides - Body2/Wheels2/AJoint',
    articulatedSync: 'Sync',
    articulatedNote: 'The byisaacsa2 Drive uses fields with suffix 2 when they exist and falls back to the main value when they do not.',
    summary: 'Summary',
    body2Weight: 'Body2 Weight',
    module2Config: 'Module 2 Config',
    sharedHp: 'Shared HP',
    sharedTorque: 'Shared Torque',
    sharedSpeed: 'Shared Speed',
    weightTraction: 'Weight & Traction',
    module2Steering: 'Module 2 Steering',
    engineSub: 'Power curve · dyno torque',
    exportStatusIsaac: 'Generates the A-Chassis Tune ready for Roblox',
    exportStatusInspare: 'Generates only fields that exist in AC6 byInspare',
    templateError: 'Could not load the byInspare template in public/chassis.',
    invalidTune: 'Invalid tune link.',
    tuneFromLink: 'Tune imported from link!',
    saved: 'Tune saved locally!',
    loaded: 'Tune loaded successfully!',
    noSavedTune: 'No saved tune found.',
    linkCopied: 'Link copied to clipboard!'
  }
};

function tr(key) {
  return (dict[currentLang] && dict[currentLang][key]) || dict.pt[key] || key;
}

function applyLanguage(showMessage = false) {
  document.documentElement.lang = tr('htmlLang');
  document.title = (IS_BYINSPARE ? 'AC6 byInspare' : 'AC6C') + ' — ' + tr('titleSuffix');
  let langBtn = document.getElementById('lang-btn');
  if(langBtn) langBtn.textContent = tr('switchLabel');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    let key = el.getAttribute('data-i18n');
    if(dict[currentLang][key]) el.textContent = tr(key);
  });
  let status = document.querySelector('.export-status');
  if(status) status.textContent = IS_BYINSPARE ? tr('exportStatusInspare') : tr('exportStatusIsaac');
  localStorage.setItem(LANG_KEY, currentLang);
  if(showMessage) showToast(tr('changed'));
}

document.getElementById('lang-btn').addEventListener('click', () => {
  currentLang = currentLang === 'pt' ? 'en' : 'pt';
  applyLanguage(true);
});

currentLang = localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'pt';
applyLanguage(false);

/* ─────────── UI INTERACTIONS ─────────── */
document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item[data-tab]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector('.tab-panel[data-panel="'+btn.dataset.tab+'"]').classList.add('active');
    document.querySelector('.main').scrollTo(0,0);
  });
});

document.querySelectorAll('.formula-card[data-collapsible]').forEach(card => {
  card.querySelector('.formula-toggle').addEventListener('click', () => card.classList.toggle('open'));
});

/* ─────────── ENGINE SWITCH (Velocidade e UI) ─────────── */
function spsToSpd(sps){ return USE_KMH ? sps * 1.09728 : sps * 0.681818; }

function updateSwSpeedLabel() {
  let sps = v('sw-speed');
  let manual = document.getElementById('sw-manual').checked;
  let spdVal = spsToSpd(sps);
  
  let swSpeedKmh = document.getElementById('sw-speed-kmh');
  if(swSpeedKmh) swSpeedKmh.textContent = '≈ ' + spdVal.toFixed(1) + ' ' + spdLabel() + (manual ? ' (ignorado)' : '');
  
  let swSpdSps = document.getElementById('sw-spd-sps');
  if(swSpSpd = document.getElementById('sw-spd-sps')) swSpSpd.textContent = manual ? '0' : sps.toFixed(0) + ' SPS';
  
  let swSpdKmh = document.getElementById('sw-spd-kmh');
  if(swSpdKmh) swSpdKmh.textContent = manual ? 'Manual' : spdVal.toFixed(1);
  
  let swSpdSub = document.getElementById('sw-spd-sub');
  if(swSpdSub) swSpdSub.textContent = spdLabel();
}

// Eventos para atualizar os valores em tempo real
document.getElementById('sw-speed').addEventListener('input', updateSwSpeedLabel);
document.getElementById('sw-manual').addEventListener('change', updateSwSpeedLabel);

// Chama a função uma vez ao carregar a página e também quando mudar de km/h para mph
window.addEventListener('DOMContentLoaded', updateSwSpeedLabel);
document.getElementById('unit-kmh').addEventListener('click', updateSwSpeedLabel);
document.getElementById('unit-mph').addEventListener('click', updateSwSpeedLabel);
