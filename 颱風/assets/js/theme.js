(()=>{
  const STORAGE_KEY = 'cyclone-theme';
  const body = document.body;
  const DEFAULT = body.classList.contains('theme-day') ? 'day' : 'night';
  let currentTheme = DEFAULT;

  function readStored(){
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if(stored === 'day' || stored === 'night'){
        return stored;
      }
    } catch (err) {
      console.warn('無法讀取主題設定，使用預設值', err);
    }
    return null;
  }

  function updateToggleLabels(){
    const isDay = currentTheme === 'day';
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      if(!(btn instanceof HTMLElement)) return;
      btn.textContent = isDay ? '🌙 夜間模式' : '☀️ 白天模式';
      btn.setAttribute('aria-pressed', isDay ? 'true' : 'false');
      btn.title = isDay ? '切換為夜間模式' : '切換為白天模式';
    });
  }

  function applyTheme(theme, {persist = true, silent = false} = {}){
    const next = (theme === 'day') ? 'day' : 'night';
    const previous = currentTheme;
    currentTheme = next;
    body.classList.toggle('theme-day', currentTheme === 'day');
    updateToggleLabels();
    if(persist){
      try { localStorage.setItem(STORAGE_KEY, currentTheme); } catch(err) {
        console.warn('無法儲存主題設定', err);
      }
    }
    if(!silent && previous !== currentTheme){
      document.dispatchEvent(new CustomEvent('cyclone-theme-change', {detail: {theme: currentTheme, previous}}));
    }
  }

  function toggleTheme(){
    applyTheme(currentTheme === 'day' ? 'night' : 'day');
  }

  function bindToggles(){
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      if(!(btn instanceof HTMLElement)) return;
      if(btn.dataset.themeBound === '1') return;
      btn.dataset.themeBound = '1';
      btn.addEventListener('click', evt => {
        evt.preventDefault();
        toggleTheme();
      });
    });
  }

  function init(){
    const stored = readStored();
    if(stored && stored !== currentTheme){
      applyTheme(stored, {persist: false, silent: true});
    } else {
      body.classList.toggle('theme-day', currentTheme === 'day');
      updateToggleLabels();
    }
    bindToggles();
    document.addEventListener('focusin', bindToggles);
    document.addEventListener('click', bindToggles, {once: true});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CycloneTheme = {
    get current(){ return currentTheme; },
    apply(theme, options){ applyTheme(theme, options); },
    toggle(){ toggleTheme(); },
    refreshToggles(){ updateToggleLabels(); }
  };
})();
