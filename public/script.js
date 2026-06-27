/* ─────────── GLOBALS & UTILS ─────────── */
let USE_KMH = false;
let currentLang = 'pt';

function v(id){ let e = document.getElementById(id); return e ? (parseFloat(e.value)||0) : 0; }
function s(id){ let e = document.getElementById(id); return e ? e.value : ''; }
function chk(id){ let e = document.getElementById(id); return e ? e.checked : false; }

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

/* ─────────── GRÁFICO & MOTOR (COM TORQUE) ─────────── */
function curveNfull(RPM, hp, peak, sharp, curveMult) {
  if(RPM <= 0 || peak <= 0 || hp <= 0) return 0;
  let r = RPM/1000, p = peak/1000, H = hp/100;
  if(H <= 0) return 0;
  let base = (-(r-p)*(r-p)) * Math.min(H/Math.pow(p,2), Math.pow(curveMult, p/H)) + H;
  return base * (r - (Math.pow(r, sharp) / (sharp * Math.pow(p, sharp-1))));
}

function calcHP() {
  let hp = v('hp'), peak = v('peakrpm'), redline = v('redline'), cr = v('cr');
  let tEn = chk('turbo-en'), tc = tEn ? v('tcount') : 0, tb = tEn ? v('tboost') : 0;
  let sEn = chk('super-en'), sc = sEn ? v('scount') : 0, sb = sEn ? v('sboost') : 0;
  let sharp = v('sharp') || 6.5, cm = v('curvemult') || 0.2;
  
  let TPsi = tb*tc, SPsi = sb*sc;
  let HTc = ((hp*TPsi*(cr/10)/7.5)/2)/100, HSc = ((hp*SPsi*(cr/10)/7.5)/2)/100;
  let HT = HTc*100, HS = HSc*100;
  let peakNA = Math.max(0.0001, curveNfull(peak, hp, peak, sharp, cm));

  document.getElementById('r-na').textContent = Math.round(hp);
  document.getElementById('r-turbo').textContent = (tEn && tc>0) ? '+'+Math.round(HT) : '+0';
  document.getElementById('r-super').textContent = (sEn && sc>0) ? '+'+Math.round(HS) : '+0';
  document.getElementById('r-total').textContent = Math.round(hp + HT + HS);

  let steps = 80, labels = [], dTot = [], dTorque = [];
  for(let i=0; i<=steps; i++){
    let rpm = redline * i / steps;
    labels.push(Math.round(rpm));
    let naR = Math.max(0, curveNfull(rpm, hp, peak, sharp, cm)), naHP = (naR/peakNA)*hp;
    let tR = Math.max(0, curveNfull(rpm, Math.max(1, HTc*100), peak, sharp, cm)), tHP = (tEn&&tc>0) ? (tR/peakNA)*HT : 0;
    let sR = Math.max(0, curveNfull(rpm, Math.max(1, HSc*100), peak, sharp, cm)), sHP = (sEn&&sc>0) ? (sR/peakNA)*HS : 0;
    
    let totalHP = Math.max(0, Math.round((naHP + tHP + sHP)*10)/10);
    dTot.push(totalHP);
    
    // Cálculo de Torque: TQ = (HP * 5252) / RPM
    let torque = rpm > 100 ? Math.round((totalHP * 5252) / rpm) : 0;
    dTorque.push(torque);
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
        plugins: { legend: {display: false} },
        scales: {
          x: { ticks: {color: '#9ca3af'}, grid: {color: 'rgba(255,255,255,.05)'} },
          y: { type: 'linear', display: true, position: 'left', title: {display:true, text:'Horsepower', color:'#9ca3af'}, ticks: {color: '#9ca3af'}, grid: {color: 'rgba(255,255,255,.05)'} },
          y1: { type: 'linear', display: true, position: 'right', title: {display:true, text:'Torque', color:'#9ca3af'}, ticks: {color: '#9ca3af'}, grid: {drawOnChartArea: false} }
        }
      }
    });
  }
}

/* ─────────── CALC MASTER (Debounced) ─────────── */
function calcCore(){
  calcHP();
  // Se você tiver as outras funções (calcPW, calcSus, etc), chame-as aqui.
}
const calc = debounce(calcCore, 100);

/* Listeners de Inputs */
document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', calc);
  el.addEventListener('change', calc);
});
calcCore(); // Executa 1x no load

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
      if(el.type === 'checkbox') el.checked = data[id];
      else el.value = data[id];
    }
  });
  calcCore();
}

// Salvar Local
document.getElementById('save-local-btn').addEventListener('click', () => {
  localStorage.setItem('ac6c_saved_tune', JSON.stringify(getFormValues()));
  showToast('Tune salvo na garagem local!', 'success');
});

// Carregar Local
document.getElementById('load-local-btn').addEventListener('click', () => {
  let saved = localStorage.getItem('ac6c_saved_tune');
  if(saved) {
    setFormValues(JSON.parse(saved));
    showToast('Tune carregado com sucesso!', 'success');
  } else {
    showToast('Nenhum tune salvo encontrado.', 'error');
  }
});

// Compartilhar via URL
document.getElementById('share-url-btn').addEventListener('click', () => {
  let base64 = btoa(JSON.stringify(getFormValues()));
  let url = window.location.origin + window.location.pathname + '?tune=' + base64;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copiado para a área de transferência!', 'success');
  });
});

// Ler URL no Load
window.addEventListener('DOMContentLoaded', () => {
  let params = new URLSearchParams(window.location.search);
  let tuneData = params.get('tune');
  if(tuneData) {
    try {
      setFormValues(JSON.parse(atob(tuneData)));
      showToast('Tune importado pelo Link!', 'success');
      // Limpa a URL para ficar bonito
      window.history.replaceState(null, '', window.location.pathname);
    } catch(e) {
      showToast('Link de tune inválido.', 'error');
    }
  }
});

/* ─────────── i18n (TRADUÇÃO) ─────────── */
const dict = {
  'pt': {
    'config': 'Configuração', 'file': 'Arquivo', 'import': 'Importar Tune',
    'export': 'Exportar Lua', 'speed': 'Velocidade:', 'save': '💾 Salvar Local',
    'load': '📂 Carregar', 'share': '🔗 Compartilhar Link', 'engine': 'Motor'
  },
  'en': {
    'config': 'Configuration', 'file': 'File', 'import': 'Import Tune',
    'export': 'Export Lua', 'speed': 'Speed Unit:', 'save': '💾 Save Local',
    'load': '📂 Load', 'share': '🔗 Share Link', 'engine': 'Engine'
  }
};

document.getElementById('lang-btn').addEventListener('click', (e) => {
  currentLang = currentLang === 'pt' ? 'en' : 'pt';
  e.target.textContent = currentLang === 'pt' ? '🇺🇸 EN-US' : '🇧🇷 PT-BR';
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    let key = el.getAttribute('data-i18n');
    if(dict[currentLang][key]) {
      el.textContent = dict[currentLang][key];
    }
  });
  showToast(`Idioma alterado para ${currentLang.toUpperCase()}`);
});

/* ─────────── SIDEBAR NAV ─────────── */
document.querySelectorAll('.nav-item[data-tab]').forEach(function(btn){
  btn.addEventListener('click',function(){
    document.querySelectorAll('.nav-item[data-tab]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector('.tab-panel[data-panel="'+btn.dataset.tab+'"]').classList.add('active');
    document.querySelector('.main').scrollTo(0,0);
  });
});