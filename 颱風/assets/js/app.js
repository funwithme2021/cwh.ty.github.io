(()=>{
// ====== 基本狀態 ======
    let preferredUnit = 'kt'; // 'kt' | 'ms' | 'kmh'
    const KT_TO_MS = 0.514444, KT_TO_KMH = 1.852;
    const tz = 'Asia/Taipei';

    // 配色
    const C_GRAY   = '#8E8E8E';
    const C_BLUE   = '#1e88e5';
    const C_TEAL   = '#00d2a8';
    const C_YELLOW = '#ffd166';
    const C_ORANGE = '#ff8c42';
    const C_DEEPOR = '#ff7043';
    const C_RED    = '#e53935';
    const C_PURPLE = '#8e24aa';

    const INTENSITY_LEVELS=[
      {color:C_GRAY,   label:'熱帶擾動 / 低壓', kt:'<22 kt',     ms:'≤11.3 m/s',   kmh:'<41 km/h'},
      {color:C_BLUE,   label:'熱帶風暴',       kt:'22–33 kt',   ms:'11.3–17.1 m/s', kmh:'41–61 km/h'},
      {color:C_TEAL,   label:'一級颱風',       kt:'34–63 kt',   ms:'17.2–32.6 m/s', kmh:'63–117 km/h'},
      {color:C_YELLOW, label:'二級颱風',       kt:'64–82 kt',   ms:'32.7–42.2 m/s', kmh:'118–152 km/h'},
      {color:C_ORANGE, label:'三級颱風',       kt:'83–95 kt',   ms:'42.3–48.9 m/s', kmh:'153–176 km/h'},
      {color:C_RED,    label:'四級颱風',       kt:'96–113 kt',  ms:'49.0–58.1 m/s', kmh:'178–209 km/h'},
      {color:C_PURPLE, label:'五級颱風',       kt:'≥114 kt',   ms:'≥58.2 m/s',   kmh:'≥210 km/h'}
    ];

    // UI refs
    const rootStyle = document.documentElement.style;
    const explorerMain=document.querySelector('.explorer-main');
    const app=document.getElementById('app');
    const btnCollapse=document.getElementById('btnCollapse');
    const systemsDiv=document.getElementById('systems');
    const sidebarTabs=Array.from(document.querySelectorAll('.sidebar-tab'));
    const sidebarPanels=new Map();
    document.querySelectorAll('[data-tab-panel]').forEach(panel=>{
      const name=panel.getAttribute('data-tab-panel');
      if(name) sidebarPanels.set(name, panel);
    });

    const toggleDet=document.getElementById('toggleDet');
    const toggleEns=document.getElementById('toggleEns');
    const togglePts=document.getElementById('togglePts');
    const toggleRadii=document.getElementById('toggleRadii');

    const modeTracks=document.getElementById('modeTracks');
    const modeProb=document.getElementById('modeProb');
    const detBlack=document.getElementById('detBlack');
    const detIntensity=document.getElementById('detIntensity');

    const wsValue=document.getElementById('wsValue');
    const wsUnit=document.getElementById('wsUnit');
    const wsCalc=document.getElementById('wsCalc');
    const wsOut=document.getElementById('wsOut');

    const unitToggle=document.getElementById('unitToggle');
    const legendContainer=document.getElementById('legend');
    const legendGradient=document.getElementById('legendGradient');
    const legendScaleLabels=document.getElementById('legendScaleLabels');
    const legendItems=document.getElementById('legendItems');
    const btnShare=document.getElementById('btnShare');
    const btnShareTop=document.getElementById('btnShareTop');
    const btnLegendToggle=document.getElementById('btnLegendToggle');
    const btnOpenWL=document.getElementById('btnOpenWL');
    const btnShortcuts=document.getElementById('btnShortcuts');
    const shortcutModal=document.getElementById('shortcutModal');
    const shortcutBackdrop=document.getElementById('shortcutBackdrop');
    const shortcutClose=document.getElementById('shortcutClose');
    const intensityScaleItems=document.getElementById('intensityScaleItems');
    const intensityScaleUnit=document.getElementById('intensityScaleUnit');

    const systemSummary=document.getElementById('systemSummary');
    const metricSystems=document.getElementById('metricSystems');
    const metricDet=document.getElementById('metricDet');
    const metricEns=document.getElementById('metricEns');
    const metricPoints=document.getElementById('metricPoints');
    const systemFilter=document.getElementById('systemFilter');
    const systemEntryMap=new Map();

    const detailPanel=document.getElementById('detailPanel');
    const detailTitle=document.getElementById('detailTitle');
    const detailSubtitle=document.getElementById('detailSubtitle');
    const detailSystem=document.getElementById('detailSystem');
    const detailMember=document.getElementById('detailMember');
    const detailTimeTw=document.getElementById('detailTimeTw');
    const detailTimeUtc=document.getElementById('detailTimeUtc');
    const detailLocation=document.getElementById('detailLocation');
    const detailWind=document.getElementById('detailWind');
    const detailKtClass=document.getElementById('detailKtClass');
    const detailMsClass=document.getElementById('detailMsClass');
    const detailPressure=document.getElementById('detailPressure');
    const detailFooter=document.getElementById('detailFooter');
    const detailClose=document.getElementById('detailClose');
    const detailIntensityPill=document.getElementById('detailIntensityPill');
    const detailIntensityBar=document.getElementById('detailIntensityBar');
    const detailTimeline=document.getElementById('detailTimeline');
    const detailPrevBtn=document.getElementById('detailPrev');
    const detailNextBtn=document.getElementById('detailNext');
    const detailStepIndex=document.getElementById('detailStepIndex');
    const detailStepTotal=document.getElementById('detailStepTotal');
    const detailComparison=document.getElementById('detailComparison');
    const detailPrevCard=document.getElementById('detailPrevCard');
    const detailCurrentCard=document.getElementById('detailCurrentCard');
    const detailNextCard=document.getElementById('detailNextCard');

    const toastEl=document.getElementById('toast');
    function showToast(msg){ toastEl.textContent=msg; toastEl.style.display='block'; setTimeout(()=>toastEl.style.display='none', 1600); }

    function resetDetailPanel(){
      if(!detailPanel) return;
      currentDetailContext=null;
      detailPanel.classList.add('hidden');
      if(detailTitle) detailTitle.textContent='點選節點以檢視詳細資料';
      if(detailSubtitle) detailSubtitle.textContent='同時支援決定性與系集成員。';
      [detailSystem, detailMember, detailTimeTw, detailTimeUtc, detailLocation, detailWind, detailKtClass, detailMsClass, detailPressure].forEach(el=>{ if(el) el.textContent='—'; });
      if(detailIntensityPill){ detailIntensityPill.textContent='—'; detailIntensityPill.style.background=''; detailIntensityPill.style.color=''; }
      if(detailIntensityBar){ detailIntensityBar.style.width='0%'; detailIntensityBar.style.background=''; }
      if(detailTimeline){ detailTimeline.hidden=true; }
      if(detailComparison){ detailComparison.hidden=true; }
      if(detailPrevBtn) detailPrevBtn.disabled=true;
      if(detailNextBtn) detailNextBtn.disabled=true;
      if(detailStepIndex) detailStepIndex.textContent='0';
      if(detailStepTotal) detailStepTotal.textContent='0';
      if(detailPrevCard) detailPrevCard.innerHTML='';
      if(detailCurrentCard) detailCurrentCard.innerHTML='';
      if(detailNextCard) detailNextCard.innerHTML='';
      if(detailFooter) detailFooter.textContent='選擇節點後顯示更多提示與建議操作。';
    }

    function footerByWind(kt){
      if(kt==null || !isFinite(kt)) return '尚無風速資訊，可透過節點或系統列表確認資料來源。';
      if(kt>=130) return '⚠️ 極強熱帶氣旋，建議密切關注官方發布與防災資訊。';
      if(kt>=96) return '強颱層級，留意可能的快速增強或路徑變化。';
      if(kt>=64) return '中度以上颱風，建議提前評估防颱措施與應變計畫。';
      if(kt>=34) return '熱帶風暴或以上，注意未來 24 小時的變化趨勢。';
      return '熱帶性低壓或擾動，持續觀察是否有發展跡象。';
    }

    function showDetailPanel(info){
      if(!detailPanel || !info) return;
      detailPanel.classList.remove('hidden');
      if(detailTitle) detailTitle.textContent = info.title || '節點資訊';
      if(detailSubtitle) detailSubtitle.textContent = info.subtitle || '';
      if(detailSystem) detailSystem.textContent = info.system || '—';
      if(detailMember) detailMember.textContent = info.member || '—';
      if(detailTimeTw) detailTimeTw.textContent = info.timeTw || '—';
      if(detailTimeUtc) detailTimeUtc.textContent = info.timeUtc || '—';
      if(detailLocation) detailLocation.textContent = info.location || '—';
      if(detailWind) detailWind.innerHTML = info.wind || '—';
      if(detailKtClass) detailKtClass.textContent = info.ktClass || '—';
      if(detailMsClass) detailMsClass.textContent = info.msClass || '—';
      if(detailPressure) detailPressure.textContent = info.pressure || '—';
      if(detailIntensityPill){
        if(info.intensityLabel){
          detailIntensityPill.textContent = info.intensityLabel;
          if(info.intensityColor){
            detailIntensityPill.style.background = `linear-gradient(90deg, ${info.intensityColor}33, ${info.intensityColor}55)`;
            detailIntensityPill.style.color = '#ffffff';
          }else{
            detailIntensityPill.style.background=''; detailIntensityPill.style.color='';
          }
        }else{
          detailIntensityPill.textContent='—';
          detailIntensityPill.style.background='';
          detailIntensityPill.style.color='';
        }
      }
      if(detailIntensityBar){
        if(info.intensityPct!=null){
          detailIntensityBar.style.width = `${Math.max(0, Math.min(100, info.intensityPct))}%`;
          detailIntensityBar.style.background = info.intensityColor ? `linear-gradient(90deg, ${info.intensityColor}44, ${info.intensityColor})` : '';
        }else{
          detailIntensityBar.style.width='0%';
          detailIntensityBar.style.background='';
        }
      }
      if(detailFooter) detailFooter.textContent = info.footer || '—';
      if(detailTimeline){
        if(info.timeline){
          detailTimeline.hidden=false;
          const {hasPrev, hasNext, index, total} = info.timeline;
          if(detailPrevBtn) detailPrevBtn.disabled = !hasPrev;
          if(detailNextBtn) detailNextBtn.disabled = !hasNext;
          if(detailStepIndex) detailStepIndex.textContent = String(index+1);
          if(detailStepTotal) detailStepTotal.textContent = String(total);
        }else{
          detailTimeline.hidden=true;
        }
      }
      if(detailComparison){
        if(info.cards){
          detailComparison.hidden=false;
          if(detailPrevCard) detailPrevCard.innerHTML = info.cards.prev || '';
          if(detailCurrentCard) detailCurrentCard.innerHTML = info.cards.current || '';
          if(detailNextCard) detailNextCard.innerHTML = info.cards.next || '';
        }else{
          detailComparison.hidden=true;
        }
      }
    }

    if(detailClose) detailClose.addEventListener('click', ()=>{ resetDetailPanel(); logOp('關閉節點詳細面板'); });
    if(detailPrevBtn) detailPrevBtn.addEventListener('click', ()=>navigateDetail(-1,'prev'));
    if(detailNextBtn) detailNextBtn.addEventListener('click', ()=>navigateDetail(1,'next'));
    resetDetailPanel();

    function buildCardMarkup(title, point, referenceKt){
      if(!point){
        return `<strong>${title}</strong><span>尚無資料</span><span>—</span>`;
      }
      const tw = point.valid_time ? fmtTaiwan(point.valid_time) : '—';
      const ktVal = (point.wind!=null && isFinite(point.wind)) ? Number(point.wind) : null;
      const windText = formatWindCard(ktVal);
      const classLabel = ktVal!=null ? (preferredUnit==='ms' ? shortClassLabel(classifyMS(toMsFromKt(ktVal))) : shortClassLabel(classifyKT(ktVal))) : '—';
      let diffHtml='';
      if(referenceKt!=null && ktVal!=null){
        const diff = ktVal - referenceKt;
        const diffText = formatDeltaFromKt(diff);
        if(diffText){
          const trendClass = diff>0 ? 'up' : diff<0 ? 'down' : 'even';
          const trendLabel = diff>0 ? '較目前增強' : diff<0 ? '較目前減弱' : '與目前相同';
          if(trendClass==='even'){
            diffHtml = `<span class="compare-trend even">${trendLabel}</span>`;
          }else{
            diffHtml = `<span class="compare-trend ${trendClass}">${trendLabel} ${diffText}</span>`;
          }
        }
      }
      const classHtml = `<span class="compare-class">分級：${classLabel}</span>`;
      return `<strong>${title}</strong><span>${tw}</span><span>${windText}</span>${classHtml}${diffHtml}`;
    }

    function renderDetailContext(options={}){
      if(!currentDetailContext) return;
      const {points, index, label, memberLabel:ml, sampleRaw, isDet} = currentDetailContext;
      const memberLabel = ml || (sampleRaw ? `sample ${sampleRaw}` : '—');
      const point = points[index];
      if(!point){ resetDetailPanel(); return; }
      const kt = (point.wind!=null && isFinite(point.wind)) ? Number(point.wind) : null;
      const ms = (kt!=null) ? toMsFromKt(kt) : null;
      const info={
        title: label,
        subtitle: isDet ? '決定性路徑節點' : `系集成員 ${memberLabel}`,
        system: label,
        member: memberLabel,
        timeTw: point.valid_time ? fmtTaiwan(point.valid_time) : '—',
        timeUtc: point.valid_time || '—',
        location: (point.lat!=null && point.lon!=null) ? `${(+point.lat).toFixed(2)}, ${(+point.lon).toFixed(2)}` : '—',
        wind: formatWindDetailed(kt),
        ktClass: classifyKT(kt),
        msClass: classifyMS(ms),
        pressure: (point.mslp!=null && isFinite(point.mslp)) ? `${Number(point.mslp).toFixed(1)} hPa` : '—'
      };
      if(kt!=null){
        const primary = unitValueFromKt(kt);
        const decimals = unitLabel()==='km/h' ? 0 : 1;
        const rawClass = (preferredUnit==='ms' ? classifyMS(ms) : classifyKT(kt)) || '';
        const shortClass = rawClass.includes('（') ? rawClass.split('（')[0] : rawClass;
        info.intensityLabel = `${primary.toFixed(decimals)} ${unitLabel()}｜${shortClass}`;
        info.intensityColor = colorDynamic(kt);
        info.intensityPct = intensityPercentage(kt);
      }else{
        info.intensityLabel = '風速資料待確認';
        info.intensityColor = null;
        info.intensityPct = null;
      }
      const total = points.length;
      info.timeline = total>1 ? {hasPrev:index>0, hasNext:index<total-1, index, total} : null;
      const prev = index>0 ? points[index-1] : null;
      const next = index<total-1 ? points[index+1] : null;
      info.cards = {
        prev: buildCardMarkup('上一時刻', prev, kt),
        current: buildCardMarkup('目前', point, kt),
        next: buildCardMarkup('下一時刻', next, kt)
      };
      const prevKt = prev && prev.wind!=null && isFinite(prev.wind) ? Number(prev.wind) : null;
      const nextKt = next && next.wind!=null && isFinite(next.wind) ? Number(next.wind) : null;
      let footer = footerByWind(kt);
      const prevDelta = (prevKt!=null && kt!=null) ? kt-prevKt : null;
      if(prevDelta!=null && Math.abs(prevDelta)>=0.5){
        const diffText = formatDeltaFromKt(prevDelta);
        if(diffText) footer += `｜較上一時刻${prevDelta>0?'增強':'減弱'} ${diffText}`;
      }
      const nextDelta = (nextKt!=null && kt!=null) ? nextKt-kt : null;
      if(nextDelta!=null && Math.abs(nextDelta)>=0.5){
        const diffText = formatDeltaFromKt(nextDelta);
        if(diffText) footer += `｜下一時刻可能${nextDelta>0?'增強':'減弱'} ${diffText}`;
      }
      info.footer = footer;
      showDetailPanel(info);
      if(options.focusMap && point.lat!=null && point.lon!=null){
        try{ map.panTo([+point.lat,+point.lon], {animate:true}); }catch{}
      }
      if(options.log){
        const when = info.timeTw || info.timeUtc || '';
        if(options.log==='open'){
          logOp(`檢視節點詳細：${label} ${memberLabel} @ ${when}`);
        }else if(options.log==='prev'){
          logOp(`節點上一時刻：${label} ${memberLabel} @ ${when}`);
        }else if(options.log==='next'){
          logOp(`節點下一時刻：${label} ${memberLabel} @ ${when}`);
        }else if(typeof options.log==='string'){
          logOp(options.log);
        }
      }
    }

    function openDetailContext(ctx){
      currentDetailContext = {...ctx};
      renderDetailContext({focusMap:true, log:'open'});
    }

    function navigateDetail(step, logKey){
      if(!currentDetailContext) return;
      const newIndex = currentDetailContext.index + step;
      if(newIndex<0 || newIndex>=currentDetailContext.points.length) return;
      currentDetailContext.index = newIndex;
      renderDetailContext({focusMap:true, log:logKey});
    }

    function openShortcuts(log=true){
      if(!shortcutModal) return;
      if(!shortcutModal.classList.contains('hidden')) return;
      shortcutModal.classList.remove('hidden');
      shortcutModal.setAttribute('aria-hidden','false');
      if(log) logOp('開啟快捷鍵總覽');
    }

    function closeShortcuts(log=true){
      if(!shortcutModal) return;
      if(shortcutModal.classList.contains('hidden')) return;
      shortcutModal.classList.add('hidden');
      shortcutModal.setAttribute('aria-hidden','true');
      if(log) logOp('關閉快捷鍵總覽');
    }

    function toggleShortcuts(){
      if(!shortcutModal) return;
      if(shortcutModal.classList.contains('hidden')) openShortcuts(true);
      else closeShortcuts(true);
    }

    // Online loader refs
    const dmModelSel=document.getElementById('dmModel');
    const dmCycleSel=document.getElementById('dmCycle');
    const dmStatus=document.getElementById('dmStatus');
    const btnLoadCycle=document.getElementById('btnLoadCycle');
    const btnLatest=document.getElementById('btnLatest');

    // TS chart refs
    const tsSystemSel=document.getElementById('tsSystemSel');
    const tsModeDet=document.getElementById('tsModeDet');
    const tsModeEns=document.getElementById('tsModeEns');
    let tsChart=null;

    // 歷史操作
    const historyLogEl=document.getElementById('historyLog');
    function logOp(msg){
      const t = new Date().toLocaleString('zh-TW',{hour12:false});
      historyLogEl.textContent += `[${t}] ${msg}\n`;
      historyLogEl.scrollTop = historyLogEl.scrollHeight;
    }

    // App state
    const systemLayers=new Map(); // key -> {group, det:[], ens:[], color, visible:true, label}
    let allRows=[]; let heatLayer=null;
    let showTracks=true; let allDetVisible=true, allEnsVisible=true, showPts=true, showRadii=true;
    let detUseBlack=true;
    let currentDetailContext=null;
    let legendVisible=true;
    let pendingSystemVisibility=null;
    let pendingMapView=null;
    let shouldPreserveView=false;
    let pendingBaseName=null;
    let suppressHashUpdate=false;

    function extractSharedState(){
      const hash = location.hash || '';
      const match = hash.match(/(?:#|&)s=([^&]+)/);
      if(!match) return null;
      const obj = decodeHash(match[1]);
      return (obj && typeof obj==='object') ? obj : null;
    }

    function applyInitialStateFromHash(){
      const state = extractSharedState();
      if(!state) return;
      suppressHashUpdate=true;
      if(state.u && ['kt','ms','kmh'].includes(state.u)){
        preferredUnit = state.u;
      }
      if(state.md!=null){
        showTracks = (+state.md)===0;
      }
      if(state.det!=null){
        allDetVisible = !!(+state.det);
      }
      if(state.ens!=null){
        allEnsVisible = !!(+state.ens);
      }
      if(state.pts!=null){
        showPts = !!(+state.pts);
      }
      if(state.rad!=null){
        showRadii = !!(+state.rad);
      }
      if(state.dm!=null){
        detUseBlack = !!(+state.dm);
      }
      if(state.lg!=null){
        legendVisible = !!(+state.lg);
      }
      if(state.b && typeof state.b==='string'){
        pendingBaseName = state.b;
      }
      if(Array.isArray(state.c) && state.c.length===2){
        const lat = Number(state.c[0]);
        const lng = Number(state.c[1]);
        if(isFinite(lat) && isFinite(lng)){
          pendingMapView = pendingMapView || {};
          pendingMapView.center = [lat, lng];
          shouldPreserveView = true;
        }
      }
      if(state.z!=null){
        const zoom = Number(state.z);
        if(isFinite(zoom)){
          pendingMapView = pendingMapView || {};
          pendingMapView.zoom = zoom;
          shouldPreserveView = true;
        }
      }
      if(state.sv && typeof state.sv==='object'){
        pendingSystemVisibility = state.sv;
      }

      if(toggleDet) toggleDet.checked = allDetVisible;
      if(toggleEns) toggleEns.checked = allEnsVisible;
      if(togglePts) togglePts.checked = showPts;
      if(toggleRadii) toggleRadii.checked = showRadii;
      if(modeTracks && modeProb){
        modeTracks.dataset.active = showTracks ? 'true' : 'false';
        modeProb.dataset.active = showTracks ? 'false' : 'true';
      }
      if(detBlack && detIntensity){
        detBlack.dataset.active = detUseBlack ? 'true' : 'false';
        detIntensity.dataset.active = detUseBlack ? 'false' : 'true';
      }
      suppressHashUpdate=false;
    }

    function updateSystemSummary(){
      const totalSystems = systemLayers.size;
      let detCount=0, ensCount=0;
      systemLayers.forEach(entry=>{ detCount += entry.det.length; ensCount += entry.ens.length; });
      const pointCount = allRows.length;
      if(systemSummary){
        systemSummary.textContent = totalSystems ? `系統：${totalSystems}｜決定性：${detCount} 組｜系集：${ensCount} 組｜節點：${pointCount}` : '尚無資料';
      }
      if(metricSystems) metricSystems.textContent = String(totalSystems);
      if(metricDet) metricDet.textContent = String(detCount);
      if(metricEns) metricEns.textContent = String(ensCount);
      if(metricPoints) metricPoints.textContent = String(pointCount);
    }
    function applySystemFilter(){
      if(!systemFilter) return;
      const q = systemFilter.value.trim().toLowerCase();
      systemEntryMap.forEach((row, key)=>{
        const label = row.dataset.label || '';
        const match = !q || label.includes(q) || key.toLowerCase().includes(q);
        row.style.display = match ? '' : 'none';
      });
    }
    if(systemFilter){
      systemFilter.addEventListener('input', ()=>{
        applySystemFilter();
        const val = systemFilter.value.trim();
        logOp(`系統清單搜尋：${val || '（全部）'}`);
      });
    }
    if(btnShortcuts) btnShortcuts.addEventListener('click', ()=>toggleShortcuts());
    if(shortcutBackdrop) shortcutBackdrop.addEventListener('click', ()=>closeShortcuts(true));
    if(shortcutClose) shortcutClose.addEventListener('click', ()=>closeShortcuts(true));
    function setSidebarTab(name, shouldLog=true){
      if(!sidebarPanels.size) return;
      const key = sidebarPanels.has(name) ? name : 'data';
      sidebarTabs.forEach(tab=>{
        const active = (tab.dataset.tab===key);
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active?'true':'false');
      });
      sidebarPanels.forEach((panel, panelKey)=>{
        const active = panelKey===key;
        panel.classList.toggle('active', active);
        if(active){ panel.removeAttribute('hidden'); }
        else { panel.setAttribute('hidden',''); }
      });
      if(shouldLog) logOp(`側欄分頁切換：${key}`);
    }
    if(sidebarTabs.length){
      const defaultTab = sidebarTabs.find(tab=>tab.classList.contains('active'))?.dataset.tab || 'data';
      setSidebarTab(defaultTab, false);
      sidebarTabs.forEach(tab=>{
        tab.addEventListener('click', ()=>{
          const target = tab.dataset.tab || 'data';
          setSidebarTab(target, true);
        });
      });
    }
    updateSystemSummary();
    applyInitialStateFromHash();

    // ====== Helpers ======
    function toMsFromKt(kt){ return kt*KT_TO_MS; }
    function toKmhFromKt(kt){ return kt*KT_TO_KMH; }

    function toUTCDate(s){
      if(!s) return new Date(NaN);
      const t = String(s).trim();
      if (/[zZ]$/.test(t) || /[+\-]\d{2}:?\d{2}$/.test(t)) return new Date(t);
      if (t.includes('T')) return new Date(t + 'Z');
      return new Date(t.replace(' ','T') + 'Z');
    }
    function fmtTaiwan(sUTC){
      const d = toUTCDate(sUTC);
      return d.toLocaleString('zh-TW', { timeZone: tz, hour12:false, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
    }
    function hashColor(key){let h=0;for(let i=0;i<key.length;i++){h=(h*31+key.charCodeAt(i))>>>0;}return `hsl(${h%360} 90% 55%)`; }
    function offsetLatLon(lat, lon, bearingDeg, distKm){
      const rad=Math.PI/180, deg=180/Math.PI;
      const dByR=distKm/6371.0, φ1=lat*rad, λ1=lon*rad, θ=bearingDeg*rad;
      const φ2=Math.asin(Math.sin(φ1)*Math.cos(dByR)+Math.cos(φ1)*Math.sin(dByR)*Math.cos(θ));
      const λ2=λ1+Math.atan2(Math.sin(θ)*Math.sin(dByR)*Math.cos(φ1),Math.cos(dByR)-Math.sin(φ1)*Math.sin(φ2));
      return [φ2*deg, ((λ2*deg+540)%360)-180];
    }
    function mergedRingOutline(center, rNE, rSE, rSW, rNW, stepDeg=3){
      const arr=[]; for(let ang=0; ang<=360; ang+=stepDeg){
        let r=0;
        if(ang>=0 && ang<90) r = rNE||0;
        else if(ang>=90 && ang<180) r = rSE||0;
        else if(ang>=180 && ang<270) r = rSW||0;
        else r = rNW||0;
        arr.push(offsetLatLon(center[0], center[1], ang, r));
      }
      return arr;
    }
    function traverse(layer, fn){
      if(layer && layer.eachLayer){ layer.eachLayer(l=>traverse(l, fn)); }
      if(layer) fn(layer);
    }

    // ====== Color & Classification ======
    function colorByKT6(kt){
      if(kt==null || !isFinite(kt)) return C_BLUE;
      if(kt<33.4) return C_GRAY;      // 熱帶擾動
      if(kt<=62) return C_BLUE;     // 熱帶風暴
      if(kt<=82) return C_TEAL;     // 一級
      if(kt<=95) return C_YELLOW;   // 二級
      if(kt<=113) return C_ORANGE;  // 三級
      if(kt<=135) return C_RED;     // 四級
      return C_PURPLE;              // 五級
    }
    function colorByKMH8_fromKT(kt){
      if(kt==null || !isFinite(kt)) return C_BLUE;
      if(kt<22)  return C_GRAY;    // <40.7
      if(kt<33.4)  return C_BLUE;    // 41-56
      if(kt<64)  return C_TEAL;    // 56–117
      if(kt<83)  return C_YELLOW;  // 118–152
      if(kt<96)  return C_ORANGE;  // 153–176
      if(kt<111) return C_DEEPOR;  // 178–209
      if(kt<130) return C_RED;     // 210–247
      if(kt<157) return '#d50000'; // 248–289
      return C_PURPLE;             // ≥291
    }
    function colorByMS4(ms){
      if(ms==null || !isFinite(ms)) return C_BLUE;
      if(ms<=11.32) return C_GRAY;      // 熱帶擾動
      if(ms<=17.19) return C_BLUE;      // 熱帶性低氣壓
      if(ms<=32.69) return C_TEAL;      // 輕度
      if(ms<=50.99) return C_ORANGE;    // 中度（黃橘）
      return C_RED;                    // 強烈
    }
    function classifyKT(kt){
      if(kt==null || !isFinite(kt)) return '—';
      if(kt<22) return '熱帶擾動/低壓（<22 kt）';
      if(kt<=33.4) return '熱帶性低氣壓（22-33.4 kt）';
      if(kt<=63) return '熱帶風暴（35–63 kt）';
      if(kt<=82) return '一級颱風（64–82 kt）';
      if(kt<=95) return '二級颱風（83–95 kt）';
      if(kt<=113) return '三級颱風（96–113 kt）';
      if(kt<=135) return '四級颱風（114–135 kt）';
      return '五級颱風（≥136 kt）';
    }
    function classifyMS(ms){
      if(ms==null || !isFinite(ms)) return '—';
      if(ms<=11.319) return '熱帶擾動/低壓（≤11.32 m/s）';
      if(ms<=17.19) return '熱帶性低氣壓（11.33-17.1 m/s）';
      if(ms<=32.69) return '輕度颱風（17.2–32.6 m/s）';
      if(ms<=50.99) return '中度颱風（32.7–50.9 m/s）';
      return '強烈颱風（≥51 m/s）';
    }
    function colorDynamic(kt){
      if(preferredUnit==='ms'){
        const ms = (kt!=null && isFinite(kt)) ? toMsFromKt(kt) : null;
        return colorByMS4(ms);
      } else if(preferredUnit==='kmh'){
        return colorByKMH8_fromKT(kt);
      } else {
        return colorByKT6(kt);
      }
    }
    function intensityPercentage(kt){
      if(kt==null || !isFinite(kt)) return null;
      const maxKt = 150;
      return Math.min(100, Math.max(0, (Number(kt)/maxKt)*100));
    }
    function unitValueFromKt(kt){
      if(kt==null || !isFinite(kt)) return null;
      if(preferredUnit==='ms') return toMsFromKt(kt);
      if(preferredUnit==='kmh') return toKmhFromKt(kt);
      return kt;
    }
    function unitLabel(){ return preferredUnit==='ms'?'m/s':(preferredUnit==='kmh'?'km/h':'kt'); }

    function formatWindDetailed(kt){
      if(kt==null || !isFinite(kt)) return '—';
      const ms = toMsFromKt(kt);
      const kmh = toKmhFromKt(kt);
      const sKt = `${kt.toFixed(0)} kt`;
      const sMs = `${ms.toFixed(2)} m/s`;
      const sKmh = `${kmh.toFixed(1)} km/h`;
      if(preferredUnit==='ms') return `${sKt}｜<b>${sMs}</b>｜${sKmh}`;
      if(preferredUnit==='kmh') return `${sKt}｜${sMs}｜<b>${sKmh}</b>`;
      return `<b>${sKt}</b>｜${sMs}｜${sKmh}`;
    }

    function formatWindCard(kt){
      if(kt==null || !isFinite(kt)) return '風速：—';
      const val = unitValueFromKt(kt);
      if(val==null) return '風速：—';
      const unit = unitLabel();
      const decimals = unit==='km/h' ? 0 : 1;
      return `風速：${val.toFixed(decimals)} ${unit}`;
    }

    function formatDeltaFromKt(deltaKt){
      if(deltaKt==null || !isFinite(deltaKt) || deltaKt===0) return null;
      const unit = unitLabel();
      const val = unitValueFromKt(Math.abs(deltaKt));
      if(val==null) return null;
      const decimals = unit==='km/h' ? 0 : 1;
      return `${val.toFixed(decimals)} ${unit}`;
    }
    function shortClassLabel(full){
      if(!full) return '—';
      return full.includes('（') ? full.split('（')[0] : full;
    }

    function isTypingTarget(el){
      if(!el) return false;
      if(el.isContentEditable) return true;
      const tag = el.tagName;
      return tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT';
    }

    // ====== Legend ======
    function legendConfigFor(unit){
      if(unit==='ms'){
        return {
          scale:{min:'0', max:'60+'},
          gradient:[
            {value:0, color:C_GRAY},
            {value:11.3, color:C_GRAY},
            {value:11.4, color:C_BLUE},
            {value:17.2, color:C_TEAL},
            {value:32.7, color:C_ORANGE},
            {value:51, color:C_RED}
          ],
          items:[
            {color:C_GRAY, label:'熱帶擾動（<11.3 m/s）'},
            {color:C_BLUE, label:'熱帶性低氣壓（11.3–17.1）'},
            {color:C_TEAL, label:'輕度颱風（17.2–32.6）'},
            {color:C_ORANGE, label:'中度颱風（32.7–50.9）'},
            {color:C_RED, label:'強烈颱風（≥51）'}
          ]
        };
      }
      if(unit==='kmh'){
        const km = v=>Math.round(v*KT_TO_KMH);
        return {
          scale:{min:'0', max:`${km(160)}+`},
          gradient:[
            {value:km(0), color:C_GRAY},
            {value:km(22), color:C_GRAY},
            {value:km(22.1), color:C_BLUE},
            {value:km(33.4), color:C_TEAL},
            {value:km(64), color:C_YELLOW},
            {value:km(83), color:C_ORANGE},
            {value:km(96), color:C_DEEPOR},
            {value:km(111), color:C_RED},
            {value:km(130), color:'#d50000'},
            {value:km(157), color:C_PURPLE}
          ],
          items:[
            {color:C_GRAY, label:'<41 km/h 熱帶擾動'},
            {color:C_BLUE, label:'41–55 km/h 熱帶低壓'},
            {color:C_TEAL, label:'56–117 km/h 熱帶風暴'},
            {color:C_YELLOW, label:'118–152 km/h 二級'},
            {color:C_ORANGE, label:'153–176 km/h 三級'},
            {color:C_DEEPOR, label:'178–209 km/h 強化'},
            {color:C_RED, label:'210–247 km/h 四級'},
            {color:'#d50000', label:'248–289 km/h 五級'},
            {color:C_PURPLE, label:'≥291 km/h 超強'}
          ]
        };
      }
      return {
        scale:{min:'0', max:'140+'},
        gradient:[
          {value:0, color:C_GRAY},
          {value:22, color:C_GRAY},
          {value:22.1, color:C_BLUE},
          {value:33.4, color:C_TEAL},
          {value:64, color:C_YELLOW},
          {value:83, color:C_ORANGE},
          {value:96, color:C_RED},
          {value:113, color:C_PURPLE}
        ],
        items:[
          {color:C_GRAY, label:'熱帶擾動 / 低壓（<22 kt）'},
          {color:C_BLUE, label:'熱帶風暴（22–33 kt）'},
          {color:C_TEAL, label:'一級颱風（34–63 kt）'},
          {color:C_YELLOW, label:'二級颱風（64–82 kt）'},
          {color:C_ORANGE, label:'三級颱風（83–95 kt）'},
          {color:C_RED, label:'四級颱風（96–113 kt）'},
          {color:C_PURPLE, label:'五級颱風（≥114 kt）'}
        ]
      };
    }
    function updateLegend(){
      if(unitToggle) unitToggle.textContent = '單位：' + preferredUnit;
      const cfg = legendConfigFor(preferredUnit);
      if(legendScaleLabels){
        legendScaleLabels.innerHTML = `<span>${cfg.scale.min}</span><span>${cfg.scale.max}</span>`;
      }
      if(legendGradient && cfg.gradient.length){
        const maxVal = cfg.gradient[cfg.gradient.length-1].value || 1;
        const stops = cfg.gradient.map(stop=>{
          const pct = Math.min(100, Math.max(0, (stop.value/maxVal)*100));
          return `${stop.color} ${pct.toFixed(2)}%`;
        }).join(', ');
        legendGradient.style.background = `linear-gradient(90deg, ${stops})`;
      }
      if(legendItems){
        legendItems.innerHTML = cfg.items.map(it=>`<span class="item"><span class="dot" style="background:${it.color}"></span>${it.label}</span>`).join('');
      }
      refreshLegendVisibilityUI();
      updateIntensityScale();
    }
    function refreshLegendVisibilityUI(){
      if(legendContainer){
        legendContainer.classList.toggle('is-hidden', !legendVisible);
        legendContainer.setAttribute('aria-hidden', legendVisible ? 'false' : 'true');
      }
      if(btnLegendToggle){
        btnLegendToggle.textContent = legendVisible ? '隱藏圖例' : '顯示圖例';
        btnLegendToggle.setAttribute('aria-pressed', legendVisible ? 'true' : 'false');
      }
    }
    function setLegendVisibility(show, shouldLog=true){
      legendVisible = !!show;
      refreshLegendVisibilityUI();
      if(shouldLog) logOp(legendVisible ? '顯示地圖圖例' : '隱藏地圖圖例');
    }
    function toggleLegendVisibility(shouldLog=true){
      setLegendVisibility(!legendVisible, shouldLog);
    }
    function updateIntensityScale(){
      if(intensityScaleUnit){
        const unit = unitLabel();
        intensityScaleUnit.textContent = `（${unit}）`;
      }
      if(!intensityScaleItems) return;
      const key = preferredUnit==='ms' ? 'ms' : (preferredUnit==='kmh' ? 'kmh' : 'kt');
      intensityScaleItems.innerHTML = INTENSITY_LEVELS.map(level=>{
        const rangeText = level[key] || '';
        return `<div class="scale-chip"><span class="chip-color" style="background:${level.color}"></span><div class="chip-label"><strong>${level.label}</strong><span>${rangeText}</span></div></div>`;
      }).join('');
    }
    function cycleUnit(){
      preferredUnit = (preferredUnit==='kt') ? 'ms' : (preferredUnit==='ms' ? 'kmh' : 'kt');
      updateLegend();
      recolorAll();
      updateHashNow();
      if(currentDetailContext) renderDetailContext({focusMap:false});
      logOp(`單位切換為：${preferredUnit}`);
    }

    // ====== Map ======
    const baseDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {attribution:'© Carto', maxZoom: 18});
    const baseOSM  = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap', maxZoom: 18});
    const baseSat  = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {attribution:'© Esri', maxZoom: 18});
    const basemaps = {"Carto Dark":baseDark, "OSM":baseOSM, "Esri 衛星":baseSat};
    let currentBase = "Carto Dark";
    if(pendingBaseName && basemaps[pendingBaseName]){
      currentBase = pendingBaseName;
    }
    const initialBase = basemaps[currentBase] || baseDark;
    const initialCenter = (pendingMapView && Array.isArray(pendingMapView.center) && pendingMapView.center.length===2)
      ? pendingMapView.center
      : [18,130];
    const initialZoom = (pendingMapView && typeof pendingMapView.zoom==='number' && isFinite(pendingMapView.zoom))
      ? pendingMapView.zoom
      : 3;
    const map = L.map('map', { zoomControl:true, worldCopyJump:true, layers:[initialBase] }).setView(initialCenter, initialZoom);
    pendingBaseName=null;
    map.on('click', ()=>{ resetDetailPanel(); });
    L.control.layers(basemaps, null, {position:'topright'}).addTo(map);
    map.createPane('probPane');  map.getPane('probPane').style.zIndex  = 300;
    map.createPane('ensPane');   map.getPane('ensPane').style.zIndex   = 500;
    map.createPane('radiiPane'); map.getPane('radiiPane').style.zIndex = 700;
    map.createPane('detPane');   map.getPane('detPane').style.zIndex   = 900;
    map.on('baselayerchange', e=>{ currentBase = e.name; updateHashNow(); });

    // ====== Build tracks ======
    function buildColoredSegments(latlngs, winds, pane, isDet){
      const segs=[];
      for(let i=1;i<latlngs.length;i++){
        const w = winds[i] ?? winds[i-1] ?? null;
        const c = (isDet && detUseBlack) ? '#000000' : colorDynamic(w);
        const seg = L.polyline([latlngs[i-1], latlngs[i]], {color:c, weight:isDet?5:3, opacity:0.98, pane});
        seg.__meta = {type:'segment', isDet, wind:w};
        segs.push(seg);
      }
      return segs;
    }
    function buildRadiiGroupsDet(pts){
      const groups=[];
      pts.forEach(p=>{
        const center=[+p.lat,+p.lon];
        const r34 = mergedRingOutline(center, p.r34ne||0,p.r34se||0,p.r34sw||0,p.r34nw||0, 3);
        const r50 = mergedRingOutline(center, p.r50ne||0,p.r50se||0,p.r50sw||0,p.r50nw||0, 3);
        const r64 = mergedRingOutline(center, p.r64ne||0,p.r64se||0,p.r64sw||0,p.r64nw||0, 3);
        const fg=L.featureGroup(undefined,{pane:'radiiPane'});
        if(r34.length) fg.addLayer(L.polygon(r34, {pane:'radiiPane', color:'#FF8000', fillColor:'#FF8000', fillOpacity:0.10, weight:1.4, opacity:0.85}));
        if(r50.length) fg.addLayer(L.polygon(r50, {pane:'radiiPane', color:'#EA0000', fillColor:'#EA0000', fillOpacity:0.15, weight:1.4, opacity:0.85}));
        if(r64.length) fg.addLayer(L.polygon(r64, {pane:'radiiPane', color:'#5B00AE', fillColor:'#5B00AE', fillOpacity:0.20, weight:1.6, opacity:0.90 }));
        fg.__meta={type:'radii'};
        groups.push(fg);
      });
      return groups;
    }
    function add24hTags(detPts){
      if(!detPts.length) return [];
      const first = toUTCDate(detPts[0].valid_time);
      const tagLayers=[];
      for(let i=1;i<detPts.length;i++){
        const t = toUTCDate(detPts[i].valid_time);
        const dh = Math.round((t-first)/36e5);
        if(dh>0 && dh%24===0){
          const txt = `+${dh}h`;
          const ic = L.divIcon({ className:'tag24', html: txt, iconAnchor: [-14, 10] });
          const mk = L.marker([+detPts[i].lat, +detPts[i].lon], {icon: ic, pane:'detPane'});
          mk.__meta = {type:'tag24', isDet:true};
          tagLayers.push(mk);
        }
      }
      return tagLayers;
    }
    function addSystemControl(key, color, label){
      if(!systemsDiv) return;
      const row=document.createElement('div');
      row.className='sys-row';
      row.dataset.label = label.toLowerCase();
      row.dataset.key = key;

      const name=document.createElement('div');
      name.className='sys-name';
      name.innerHTML=`<span class="dot" style="background:${color}"></span>${label}`;

      const ctl=document.createElement('label');
      ctl.className='toggle';
      const cb=document.createElement('input');
      cb.type='checkbox';
      cb.checked=true;
      cb.addEventListener('change',()=>{
        const e=systemLayers.get(key);
        e.visible=cb.checked;
        refreshVisibility();
        updateHashNow();
        logOp(`切換系統可見：${label} → ${cb.checked?'顯示':'隱藏'}`);
      });
      ctl.appendChild(cb);
      const span=document.createElement('span'); span.textContent='顯示';
      ctl.appendChild(span);

      row.appendChild(name);
      row.appendChild(ctl);
      systemsDiv.appendChild(row);
      systemEntryMap.set(key, row);
      applySystemFilter();
    }
    function addTrack(key, sample, pts, color, label){
      pts.sort((a,b)=>toUTCDate(a.valid_time)-toUTCDate(b.valid_time));
      const latlngs=pts.map(p=>[+p.lat,+p.lon]);
      const winds  =pts.map(p=> p.wind!=null? +p.wind : null);
      const isDet=(String(sample)==='-1' || sample==='auto-det');
      const pane = isDet? 'detPane' : 'ensPane';

      const segs = buildColoredSegments(latlngs, winds, pane, isDet);

      const markers=[];
      const sampleLabel = String(sample);
      const memberLabel = isDet ? (sampleLabel==='auto-det' ? '代表性決定性 (auto-det)' : '決定性 (-1)') : `sample ${sampleLabel}`;
      pts.forEach((p, idx)=>{
        const kt = (p.wind!=null? +p.wind : null);
        const ms = (kt!=null? toMsFromKt(kt) : null);
        const c = (isDet && detUseBlack) ? '#000000' : colorDynamic(kt);
        const m=L.circleMarker([+p.lat,+p.lon], {
          pane, radius:isDet?5:3.5, color:'#111', weight: isDet? 1.2 : 0.8, fillColor:c, fillOpacity:1.0, opacity:0.95
        });
        m.__meta = {type:'marker', isDet, wind:kt};
        const twt = fmtTaiwan(p.valid_time);
        const utc = p.valid_time;
        const pres=(p.mslp!=null&&!isNaN(p.mslp))?p.mslp.toFixed(1)+' hPa':'—';
        const bestLine = formatWindDetailed(kt);
        const ktClass = (kt!=null) ? classifyKT(kt) : '—';
        const msClass = (ms!=null) ? classifyMS(ms) : '—';
        m.bindPopup(`<b>${label}</b> | sample: <b>${sample}</b><br>
          -時間（台灣）：${twt}<br>-時間（UTC）：${utc}<br>
          -位置：${(+p.lat).toFixed(2)}, ${(+p.lon).toFixed(2)}<br>
          -風速：${bestLine}<br>
          -分級（kt）：${ktClass}<br>
          -分級（m/s）：${msClass}<br>
          -中心氣壓：${pres}`);
        m.on('click', ()=>{
          openDetailContext({
            label,
            memberLabel,
            sampleRaw: sampleLabel,
            isDet,
            points: pts,
            index: idx
          });
        });
        markers.push(m);
      });

      const tag24s = isDet ? add24hTags(pts) : [];
      const radiiGroups = isDet ? buildRadiiGroupsDet(pts) : [];
      const group=L.featureGroup([...segs, ...markers, ...tag24s, ...radiiGroups]);
      if(!systemLayers.has(key)) systemLayers.set(key, {group:L.featureGroup().addTo(map), det:[], ens:[], color, visible:true, label});
      const entry=systemLayers.get(key);
      entry.group.addLayer(group);
      if(isDet) entry.det.push(group); else entry.ens.push(group);
      return group;
    }
// WeatherLab 按鈕
    if(btnOpenWL){
      btnOpenWL.addEventListener('click', ()=>{
        window.open('https://deepmind.google.com/science/weatherlab','_blank','noopener');
        logOp('開啟 WeatherLab 官方網站');
      });
    }
    // ====== Recolor / visibility ======
    function recolorAll(){
      systemLayers.forEach(entry=>{
        entry.group.eachLayer(g=>{
          traverse(g, (child)=>{
            if(!child || !child.__meta) return;
            if(child.__meta.type==='segment'){
              const w = child.__meta.wind;
              const isDet = child.__meta.isDet;
              const c = (isDet && detUseBlack) ? '#000000' : colorDynamic(w);
              child.setStyle({color:c, weight:isDet?5:3});
            }else if(child.__meta.type==='marker'){
              const w = child.__meta.wind;
              const isDet = child.__meta.isDet;
              const c = (isDet && detUseBlack) ? '#000000' : colorDynamic(w);
              child.setStyle({fillColor:c});
            }
          });
        });
      });
      updateLegend();
      buildTsChart(); // 單位或可見性改變 → 同步重繪圖表
    }
    function recolorDeterministic(){
      systemLayers.forEach(entry=>{
        entry.det.forEach(g=>{
          traverse(g, (child)=>{
            if(child && child.__meta && child.__meta.isDet){
              if(child.__meta.type==='segment'){
                const w = child.__meta.wind;
                const c = detUseBlack ? '#000000' : colorDynamic(w);
                child.setStyle({color:c, weight:5});
              } else if(child.__meta.type==='marker'){
                const w = child.__meta.wind;
                const c = detUseBlack ? '#000000' : colorDynamic(w);
                child.setStyle({fillColor:c});
              }
            }
          });
        });
      });
      buildTsChart();
    }
    function refreshVisibility(){
      if(showTracks){
        if(heatLayer){ map.removeLayer(heatLayer); heatLayer=null; }
        systemLayers.forEach(entry=>{
          entry.group.eachLayer(g=>map.removeLayer(g));
          if(!entry.visible) return;
          if(allEnsVisible) entry.ens.forEach(g=>g.addTo(map));
          if(allDetVisible) entry.det.forEach(g=>g.addTo(map));
        });
        systemLayers.forEach(entry=>{
          entry.group.eachLayer(g=>{
            traverse(g, (child)=>{
              if(child && child.__meta && (child.__meta.type==='marker' || child.__meta.type==='tag24')){
                const isDetMarker = child.__meta.isDet;
                const parentOn = isDetMarker ? allDetVisible : allEnsVisible;
                if(showPts && parentOn) { child.addTo(map); } else { map.removeLayer(child); }
              } else if(child && child.__meta && child.__meta.type==='radii'){
                if(showRadii && allDetVisible) { child.addTo(map); } else { map.removeLayer(child); }
              }
            });
          });
        });
      }else{
        systemLayers.forEach(entry=>entry.group.eachLayer(g=>map.removeLayer(g)));
        rebuildHeatAllVisibleEns();
      }
      buildTsSystemOptions();
      buildTsChart();
    }

    // ====== Probability（與時間無關） ======
    function rebuildHeatAllVisibleEns(){
      if(heatLayer){ map.removeLayer(heatLayer); heatLayer=null; }
      if(!allEnsVisible || !showPts){
        logOp('機率圖重建：系集或節點隱藏，跳過繪製');
        return;
      }
      const pts=[];
      systemLayers.forEach((entry)=>{
        if(!entry.visible) return;
        entry.ens.forEach(group=>{
          traverse(group, (child)=>{
            if(!child || !child.__meta) return;
            if(child.__meta.type==='marker' && !child.__meta.isDet){
              const w = child.__meta.wind;
              const wt = (w!=null && !isNaN(w)) ? Math.min(1, Math.max(0, (w-20)/120)) : 0.3;
              const ll = child.getLatLng();
              pts.push([ll.lat, ll.lng, wt]);
            }
          });
        });
      });
      if(pts.length){
        heatLayer = L.heatLayer(pts, {pane:'probPane', radius: 18, blur: 24, maxZoom: 6, minOpacity: 0.22});
        heatLayer.addTo(map);
      }
      logOp(`機率圖重建：樣本點數 ${pts.length}`);
    }

    // ====== Auto-det（代表性成員） ======
    const KM_PER_DEG=111.32;
    function buildAutoDet(samplesMap){
      const times=[]; const tsSet=new Set();
      samplesMap.forEach(rows=>rows.forEach(r=>{ if(r.valid_time && !tsSet.has(r.valid_time)){ tsSet.add(r.valid_time); times.push(r.valid_time);} }));
      times.sort((a,b)=>toUTCDate(a)-toUTCDate(b));
      const centroids=new Map();
      times.forEach(t=>{
        const pts=[];
        samplesMap.forEach(rows=>rows.forEach(r=>{ if(r.valid_time===t) pts.push([+r.lat,+r.lon]); }));
        if(pts.length){
          const mlat=pts.reduce((a,p)=>a+p[0],0)/pts.length;
          const mlon=pts.reduce((a,p)=>a+p[1],0)/pts.length;
          centroids.set(t,[mlat,mlon]);
        }
      });
      let bestSample=null, bestScore=Infinity;
      samplesMap.forEach((rows,sample)=>{
        let s=0,n=0;
        rows.forEach(r=>{
          const c=centroids.get(r.valid_time);
          if(c){
            const dLat=(+r.lat-c[0]), dLon=(+r.lon-c[1])*Math.cos((+r.lat)*Math.PI/180);
            const d=Math.sqrt(dLat*dLat + dLon*dLon)*KM_PER_DEG;
            s+=d*d; n++;
          }
        });
        if(n>0 && s<bestScore){ bestScore=s; bestSample=sample; }
      });
      if(bestSample==null) return null;
      return { sample: bestSample, rows: samplesMap.get(bestSample) };
    }

    // ====== Import & render ======
    function nnum(v){ const x=Number(v); return isFinite(x)?x:null; }
    function pick(obj, keys){ for(const k of keys){ if(obj[k]!=null && obj[k]!=='' && obj[k]!=='NaN') return obj[k]; } return null; }
    function normalizeRow(r, sourceName){
      const time = pick(r, ['valid_time','Valid_Time','valid time','time','datetime','forecast_time','forecast valid','valid_time_utc','Valid Time']);
      const lat  = pick(r, ['lat','latitude','Lat','LAT']);
      const lon  = pick(r, ['lon','longitude','Lon','LON','long']);
      const id   = pick(r, ['track_id','Track_ID','id','system','storm_id','stormid']);
      const sample = pick(r, ['sample','Sample','member','ens_member','ensemble_member']);
      const wind = pick(r, ['maximum_sustained_wind_speed_knots','max_wind','wind','Wind','Vmax','vmax_kt','Vmax_kt']);
      const mslp = pick(r, ['minimum_sea_level_pressure_hpa','mslp','pressure','MSLP','Pmin']);
      const r34ne = pick(r, ['radius_34_knot_winds_ne_km','r34ne','r34_ne_km','r34NE']);
      const r34se = pick(r, ['radius_34_knot_winds_se_km','r34se','r34_se_km','r34SE']);
      const r34sw = pick(r, ['radius_34_knot_winds_sw_km','r34sw','r34_sw_km','r34SW']);
      const r34nw = pick(r, ['radius_34_knot_winds_nw_km','r34nw','r34_nw_km','r34NW']);
      const r50ne = pick(r, ['radius_50_knot_winds_ne_km','r50ne']); const r50se = pick(r, ['radius_50_knot_winds_se_km','r50se']);
      const r50sw = pick(r, ['radius_50_knot_winds_sw_km','r50sw']); const r50nw = pick(r, ['radius_50_knot_winds_nw_km','r50nw']);
      const r64ne = pick(r, ['radius_64_knot_winds_ne_km','r64ne']); const r64se = pick(r, ['radius_64_knot_winds_se_km','r64se']);
      const r64sw = pick(r, ['radius_64_knot_winds_sw_km','r64sw']); const r64nw = pick(r, ['radius_64_knot_winds_nw_km','r64nw']);
      if(time==null || lat==null || lon==null) return null;
      return {
        source: sourceName, track_id: String(id ?? 'UNKNOWN').trim(), sample: (sample!=null ? sample : -1),
        valid_time: String(time).trim(),
        lat: nnum(lat), lon: nnum(lon),
        wind: (wind!=null ? nnum(wind) : null),
        mslp: (mslp!=null ? nnum(mslp) : null),
        r34ne: nnum(r34ne), r34se: nnum(r34se), r34sw: nnum(r34sw), r34nw: nnum(r34nw),
        r50ne: nnum(r50ne), r50se: nnum(r50se), r50sw: nnum(r50sw), r50nw: nnum(r50nw),
        r64ne: nnum(r64ne), r64se: nnum(r64se), r64sw: nnum(r64sw), r64nw: nnum(r64nw),
      };
    }
    function parseFiles(files){
      const rowsAll=[]; let filesDone=0;
      files.forEach(file=>{
        const reader=new FileReader();
        reader.onload=(ev)=>{
          try{
            let raw=ev.target.result;
            if(raw.charCodeAt(0)===0xFEFF){ raw = raw.slice(1); }
            const idx=raw.indexOf('# BEGIN DATA');
            const text=idx>=0 ? raw.slice(idx+'# BEGIN DATA'.length) : raw;
            const parsed=Papa.parse(text, {header:true, skipEmptyLines:true, dynamicTyping:false});
            const cleaned = parsed.data.map(obj=>normalizeRow(obj, file.name)).filter(x=>x && isFinite(x.lat) && isFinite(x.lon));
            rowsAll.push(...cleaned);
            filesDone++;
            if(filesDone===files.length){ renderAll(rowsAll); logOp(`本地匯入完成：檔案 ${files.length}、點位 ${rowsAll.length}`); }
          }catch(e){
            alert('匯入錯誤：'+(e.message||e));
            logOp('匯入錯誤：'+(e.message||e));
          }
        };
        reader.readAsText(file);
      });
    }
    function applyPendingSystemVisibility(){
      if(!pendingSystemVisibility) return;
      systemLayers.forEach((entry, key)=>{
        if(Object.prototype.hasOwnProperty.call(pendingSystemVisibility, key)){
          const shouldShow = !!pendingSystemVisibility[key];
          entry.visible = shouldShow;
          const row = systemEntryMap.get(key);
          const cb = row ? row.querySelector('input[type="checkbox"]') : null;
          if(cb) cb.checked = shouldShow;
        }
      });
      pendingSystemVisibility=null;
    }
    function renderAll(rows){
      // Reset
      if(systemsDiv) systemsDiv.innerHTML='';
      systemEntryMap.clear();
      systemLayers.forEach(e=>map.removeLayer(e.group)); systemLayers.clear();
      if(heatLayer){ map.removeLayer(heatLayer); heatLayer=null; }
      allRows = rows.slice();
      resetDetailPanel();

      // group by system -> sample
      const bySys=new Map();
      rows.forEach(r=>{
        const key=`${r.source} | ${r.track_id}`;
        if(!bySys.has(key)) bySys.set(key, new Map());
        const m=bySys.get(key);
        const sKey=String(r.sample);
        if(!m.has(sKey)) m.set(sKey, []);
        m.get(sKey).push(r);
      });

      const bounds=L.latLngBounds(); let has=false;
      bySys.forEach((samples, key)=>{
        const [source, track] = key.split(' | ');
        const color=hashColor(key);
        const label=`${track} (${source})`;

        // ensemble
        samples.forEach((pts, s)=>{
          if(String(s)==='-1') return;
          const g=addTrack(key, s, pts.slice(), color, label);
          try{ bounds.extend(g.getBounds()); has=true; }catch{}
        });
        // deterministic (provided or auto-det)
        if(samples.has('-1')){
          const g=addTrack(key, -1, samples.get('-1').slice(), color, label);
          try{ bounds.extend(g.getBounds()); has=true; }catch{}
        }else{
          const rep = buildAutoDet(samples);
          if(rep){
            const g=addTrack(key, 'auto-det', rep.rows.slice(), color, label);
            try{ bounds.extend(g.getBounds()); has=true; }catch{}
          }
        }
        addSystemControl(key, color, `${track} | ${source}`);
      });

      applyPendingSystemVisibility();
      refreshVisibility();
      if(shouldPreserveView){
        if(pendingMapView){
          const center = (Array.isArray(pendingMapView.center) && pendingMapView.center.length===2) ? pendingMapView.center : null;
          const zoom = (pendingMapView && typeof pendingMapView.zoom==='number' && isFinite(pendingMapView.zoom)) ? pendingMapView.zoom : null;
          if(center){
            map.setView(center, zoom!=null ? zoom : map.getZoom());
          }else if(zoom!=null){
            map.setZoom(zoom);
          }
        }
      }else{
        if(has && bounds.isValid()){ map.fitBounds(bounds.pad(0.2)); } else { map.setView([18,130], 3); }
      }
      shouldPreserveView=false;
      pendingMapView=null;

      buildTsSystemOptions();
      buildTsChart();
      updateSystemSummary();
      logOp(`重繪地圖完成：系統 ${systemLayers.size}`);
    }

    // ====== 時間 × 強度圖 ======
    function gatherRowsForChart(mode, sysKey){
      const out=[];
      const entry = systemLayers.get(sysKey);
      if(!entry) return out;

      if(mode==='det'){
        entry.det.forEach(group=>{
          traverse(group, (child)=>{
            if(child && child.__meta && child.__meta.type==='marker' && child.__meta.isDet){
              const ll=child.getLatLng();
              const kt=child.__meta.wind;
              out.push({t: findTimeFromLatLon(sysKey, ll.lat, ll.lng) ?? '', kt});
            }
          });
        });
      }else{
        entry.ens.forEach(group=>{
          traverse(group, (child)=>{
            if(child && child.__meta && child.__meta.type==='marker' && !child.__meta.isDet){
              const ll=child.getLatLng();
              const kt=child.__meta.wind;
              out.push({t: findTimeFromLatLon(sysKey, ll.lat, ll.lng) ?? '', kt});
            }
          });
        });
      }
      out.sort((a,b)=>toUTCDate(a.t)-toUTCDate(b.t));
      return out.filter(r=>r.t && r.kt!=null && isFinite(r.kt));
    }
    function findTimeFromLatLon(sysKey, lat, lon){
      const [source, track] = sysKey.split(' | ');
      for(const r of allRows){
        if(r.source===source && r.track_id===track){
          if(Math.abs(r.lat-lat)<1e-4 && Math.abs(r.lon-lon)<1e-4){
            return r.valid_time;
          }
        }
      }
      return null;
    }
    function buildTsSystemOptions(){
      const prev = tsSystemSel.value;
      tsSystemSel.innerHTML='';
      let firstKey=null;
      systemLayers.forEach((entry,key)=>{
        if(!entry.visible) return; // 只列出可見系統
        if(!firstKey) firstKey=key;
        const opt=document.createElement('option');
        opt.value=key; opt.textContent = entry.label || key;
        tsSystemSel.appendChild(opt);
      });
      if(prev && Array.from(systemLayers.keys()).includes(prev) && systemLayers.get(prev)?.visible){
        tsSystemSel.value = prev;
      }else if(firstKey){
        tsSystemSel.value = firstKey;
      }
    }
    function buildTsChart(){
      const canvas = document.getElementById('tsChart');
      if(!canvas){ logOp('找不到 tsChart 畫布'); return; }

      const keys = Array.from(systemLayers.keys()).filter(k=>systemLayers.get(k)?.visible);
      const key = tsSystemSel.value || keys[0];
      if(!key){
        if(tsChart){ tsChart.destroy(); tsChart=null; }
        logOp('時間×強度：無可見系統可繪製'); return;
      }

      const mode = (tsModeDet.dataset.active==='true') ? 'det' : 'ensAll';
      const rows = gatherRowsForChart(mode, key);
      if(!rows.length){
        if(tsChart){ tsChart.destroy(); tsChart=null; }
        logOp(`時間×強度：${key}（${mode==='det'?'決定性':'所有系集'}）無資料`);
        return;
      }

      const labels = rows.map(r=> fmtTaiwan(r.t));
      const kts    = rows.map(r=> r.kt);
      const values = rows.map(r=> unitValueFromKt(r.kt));

      const safeIdx = (i)=> Math.max(0, Math.min(i ?? 0, kts.length-1));
      const ptColor = (ctx)=> colorDynamic(kts[safeIdx(ctx.dataIndex)]);

      const data = {
        labels,
        datasets: [{
          label: (mode==='det'?'決定性':'系集（N）'),
          data: values,
          fill: false,
          borderColor: '#9aa7c0', // 線固定色（需求）
          borderWidth: 2,
          pointRadius: 3.5,
          pointHoverRadius: 5,
          pointBackgroundColor: ptColor,
          pointBorderColor: '#111',
          tension: 0.25
        }]
      };

      const cfg = {
        type: 'line',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks:{ color:'#cfe3ff' }, grid:{ color:'#223' }},
            y: { ticks:{ color:'#cfe3ff' }, grid:{ color:'#223' }, title:{ display:true, text: unitLabel(), color:'#cfe3ff'} }
          },
          plugins: {
            legend: { labels: { color:'#cfe3ff' } },
            tooltip: {
              callbacks: {
                label: (ctx)=>{
                  const i = safeIdx(ctx.dataIndex);
                  const kt  = kts[i];
                  const ms  = (kt!=null)? toMsFromKt(kt).toFixed(2) : '—';
                  const kmh = (kt!=null)? (kt*1.852).toFixed(1) : '—';
                  const grade = (preferredUnit==='ms') ? classifyMS(kt!=null?toMsFromKt(kt):null) : classifyKT(kt);
                  const val = (typeof ctx.raw==='number') ? ctx.raw.toFixed(2) : ctx.raw;
                  return ` ${val} ${unitLabel()}｜${kt??'—'} kt｜${ms} m/s｜${kmh} km/h｜${grade}`;
                }
              }
            }
          }
        }
      };

      try{
        if(tsChart){ tsChart.destroy(); }
        tsChart = new Chart(canvas, cfg);
        logOp(`時間×強度圖重繪：${key}（${mode==='det'?'決定性':'所有系集'}），樣本 ${values.length}`);
      }catch(err){
        logOp('時間×強度圖繪製失敗：'+ (err && err.message ? err.message : err));
        console.error(err);
      }
    }

    // ====== 分享（狀態） ======
    function serializeState(){
      const c = map.getCenter(), z = map.getZoom();
      const sysVis = {}; systemLayers.forEach((e,k)=>{ sysVis[k]=!!e.visible; });
      return {
        u: preferredUnit, b: currentBase, c: [ +c.lat.toFixed(4), +c.lng.toFixed(4) ], z,
        md: showTracks ? 0 : 1, det: +allDetVisible, ens: +allEnsVisible, pts: +showPts, rad: +showRadii, dm: +detUseBlack,
        lg: +legendVisible,
        sv: sysVis
      };
    }
    function encodeHash(obj){ return btoa(encodeURIComponent(JSON.stringify(obj))); }
    function decodeHash(h){ try{ return JSON.parse(decodeURIComponent(atob(h))); }catch(e){ return null; } }
    function updateHashNow(){
      if(suppressHashUpdate) return;
      location.hash = 's=' + encodeHash(serializeState());
    }
    async function shareView(){
      updateHashNow();
      const url = location.href;
      try{ await navigator.clipboard.writeText(url); showToast('已複製連結！'); }
      catch{ showToast('無法自動複製，請手動複製網址'); }
      logOp('產生分享連結');
    }
    if(btnShare) btnShare.addEventListener('click', shareView);
    if(btnShareTop) btnShareTop.addEventListener('click', shareView);
    if(btnLegendToggle) btnLegendToggle.addEventListener('click', ()=>toggleLegendVisibility(true));

    // ====== Converter ======
    function round(n, d){ const p=Math.pow(10,d); return Math.round(n*p)/p; }
    function updateWsOut(){
      const v = parseFloat(wsValue.value);
      const u = wsUnit.value;
      if(isNaN(v)){ wsOut.innerHTML='<span class="muted">結果：</span>—'; return; }
      let kt, ms, kmh;
      if(u==='kt'){ kt=v; ms=kt*KT_TO_MS; kmh=kt*KT_TO_KMH; }
      else if(u==='ms'){ ms=v; kt=ms/KT_TO_MS; kmh=kt*KT_TO_KMH; }
      else { kmh=v; kt=kmh/KT_TO_KMH; ms=kt*KT_TO_MS; }
      wsOut.innerHTML = `<span class="muted">結果：</span>${round(kt,2)} kt ｜ ${round(ms,2)} m/s ｜ ${round(kmh,1)} km/h`;
      logOp(`風速換算：${v} ${u} → ${round(kt,2)} kt / ${round(ms,2)} m/s / ${round(kmh,1)} km/h`);
    }
    wsCalc.addEventListener('click', updateWsOut);

    // ====== Mode & toggles ======
    function setDetMode(useBlack){
      detUseBlack = useBlack;
      detBlack.dataset.active = useBlack ? 'true' : 'false';
      detIntensity.dataset.active = useBlack ? 'false' : 'true';
      recolorDeterministic();
      updateHashNow();
      logOp(`決定性顏色：${useBlack?'黑線':'強度上色'}`);
    }
    modeTracks.addEventListener('click', ()=>{ showTracks=true; modeTracks.dataset.active='true'; modeProb.dataset.active='false'; refreshVisibility(); updateHashNow(); logOp('模式：路線圖'); });
    modeProb.addEventListener('click', ()=>{ showTracks=false; modeTracks.dataset.active='false'; modeProb.dataset.active='true'; refreshVisibility(); updateHashNow(); logOp('模式：機率圖'); });
    detBlack.addEventListener('click', ()=>setDetMode(true));
    detIntensity.addEventListener('click', ()=>setDetMode(false));
    toggleDet.addEventListener('change', ()=>{ allDetVisible=toggleDet.checked; refreshVisibility(); updateHashNow(); logOp(`顯示決定性：${allDetVisible}`); });
    toggleEns.addEventListener('change', ()=>{ allEnsVisible=toggleEns.checked; refreshVisibility(); updateHashNow(); logOp(`顯示系集：${allEnsVisible}`); });
    togglePts.addEventListener('change', ()=>{ showPts=togglePts.checked; refreshVisibility(); updateHashNow(); logOp(`顯示節點：${showPts}`); });
    toggleRadii.addEventListener('change', ()=>{ showRadii=toggleRadii.checked; refreshVisibility(); updateHashNow(); logOp(`顯示風圈：${showRadii}`); });

    unitToggle.addEventListener('click', cycleUnit);

    // 「決定性 / 所有系集」按鈕修正（事件＋視覺狀態切換）
    function setTsMode(isDet){
      tsModeDet.dataset.active = isDet ? 'true' : 'false';
      tsModeEns.dataset.active = isDet ? 'false' : 'true';
      buildTsChart();
      logOp(`時間×強度圖模式：${isDet?'決定性':'所有系集'}`);
    }
    tsModeDet.addEventListener('click', ()=> setTsMode(true));
    tsModeEns.addEventListener('click', ()=> setTsMode(false));
    tsSystemSel.addEventListener('change', ()=>{ buildTsChart(); logOp(`時間×強度圖系統切換：${tsSystemSel.value}`); });

    // ====== Collapse sidebar（同步 legend 位置） ======
    btnCollapse.addEventListener('click', ()=>{
      const willCollapse = !app.classList.contains('collapsed');
      if(willCollapse){
        app.classList.add('collapsed');
        rootStyle.setProperty('--sidebar-w','0px');
        btnCollapse.textContent='顯示資料面板';
        if(explorerMain) explorerMain.classList.add('full-map');
        logOp('收合資料面板');
      }else{
        app.classList.remove('collapsed');
        rootStyle.setProperty('--sidebar-w','440px');
        btnCollapse.textContent='隱藏資料面板';
        if(explorerMain) explorerMain.classList.remove('full-map');
        logOp('展開資料面板');
      }
      setTimeout(()=>{ try{ map.invalidateSize(); }catch(e){} }, 280);
    });

    document.addEventListener('keydown', (e)=>{
      const typing = isTypingTarget(document.activeElement);
      const shortcutsOpen = shortcutModal && !shortcutModal.classList.contains('hidden');
      const noModifier = !e.ctrlKey && !e.metaKey && !e.altKey;
      const shiftOnly = noModifier && e.shiftKey;
      if(noModifier && !typing && (e.key==='?' || (e.key==='/' && e.shiftKey))){
        e.preventDefault();
        toggleShortcuts();
        return;
      }
      if(noModifier && e.key==='Escape'){
        if(shortcutsOpen){
          e.preventDefault();
          closeShortcuts(true);
          return;
        }
        if(currentDetailContext){
          e.preventDefault();
          logOp('關閉節點詳細面板（鍵盤）');
          resetDetailPanel();
          return;
        }
      }
      if(shortcutsOpen) return;
      if(shiftOnly && !typing){
        const keyLower = e.key.toLowerCase();
        if(keyLower==='f'){
          e.preventDefault();
          if(sidebarPanels.has('analysis')) setSidebarTab('analysis', false);
          if(systemFilter){ systemFilter.focus(); systemFilter.select(); logOp('快捷鍵：聚焦系統搜尋'); }
          return;
        }
        if(keyLower==='l'){
          e.preventDefault();
          toggleLegendVisibility(true);
          return;
        }
        if(e.code==='Digit1'){
          e.preventDefault();
          setSidebarTab('data');
          return;
        }
        if(e.code==='Digit2'){
          e.preventDefault();
          setSidebarTab('view');
          return;
        }
        if(e.code==='Digit3'){
          e.preventDefault();
          setSidebarTab('analysis');
          return;
        }
      }
      if(noModifier && typing) return;
      if(noModifier){
        const keyLower = e.key.toLowerCase();
        if(keyLower==='c' && !e.shiftKey){
          if(btnCollapse){ e.preventDefault(); btnCollapse.click(); }
          return;
        }
        if(keyLower==='m' && !e.shiftKey){
          if(modeTracks && modeProb){
            e.preventDefault();
            if(showTracks){ modeProb.click(); } else { modeTracks.click(); }
          }
          return;
        }
        if((e.key==='[' || e.key==='{') && currentDetailContext){
          e.preventDefault();
          navigateDetail(-1,'prev');
          return;
        }
        if((e.key===']' || e.key==='}') && currentDetailContext){
          e.preventDefault();
          navigateDetail(1,'next');
          return;
        }
      }
      if(e.key==='Escape' && (shortcutsOpen || currentDetailContext)){
        e.preventDefault();
        if(shortcutsOpen) closeShortcuts(true);
        else { logOp('關閉節點詳細面板（鍵盤）'); resetDetailPanel(); }
      }
    });

    // ====== File UI ======
    document.getElementById('csvFiles').addEventListener('change', (e)=>{
      const files=Array.from(e.target.files||[]);
      if(!files.length) return;
      parseFiles(files);
      e.target.value = "";
    });

    // ====== Online loader（URL 路徑依你指定） ======
    const dmBase = 'https://deepmind.google.com/science/weatherlab/download/cyclones';
    function pad(n){ return String(n).padStart(2,'0'); }
    function buildDMUrl(model, dateUtc){
      const yyyy = dateUtc.getUTCFullYear();
      const MM = pad(dateUtc.getUTCMonth()+1);
      const DD = pad(dateUtc.getUTCDate());
      const HH = pad(dateUtc.getUTCHours());
      const fname = `${model}_${yyyy}_${MM}_${DD}T${HH}_00_paired.csv`;
      if(model==='GRPH'){
        return `${dmBase}/GRPH/paired/csv/${fname}`;
      }else{
        return `${dmBase}/${model}/ensemble/paired/csv/${fname}`;
      }
    }
    function nearestCycleUTC(dateUtc){
      const h = dateUtc.getUTCHours();
      const cycle = h>=18 ? 18 : h>=12 ? 12 : h>=6 ? 6 : 0;
      return new Date(Date.UTC(dateUtc.getUTCFullYear(), dateUtc.getUTCMonth(), dateUtc.getUTCDate(), cycle, 0, 0));
    }
    function makeLast48Cycles(){
      const arr=[]; let t = nearestCycleUTC(new Date());
      for(let i=0;i<8;i++){
        const d = new Date(t.getTime() - i*6*3600*1000);
        const label = d.toISOString().replace(/:\d{2}\.\d{3}Z$/,'Z').slice(0,13) + 'Z';
        arr.push({date:d, label});
      }
      return arr;
    }
    function fillCycles(){
      dmCycleSel.innerHTML='';
      makeLast48Cycles().forEach((c, idx)=>{
        const opt=document.createElement('option');
        opt.value = c.date.toISOString();
        opt.textContent = c.label;
        if(idx===0) opt.selected = true;
        dmCycleSel.appendChild(opt);
      });
    }
    async function fetchOne(model, dateUtc){
      const url = buildDMUrl(model, dateUtc);
      const res = await fetch(url, {mode:'cors'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const text = await res.text();
      return {url, text};
    }
    function showDmStatus(msg, ok=true){
      if(!dmStatus) return;
      dmStatus.hidden=false;
      dmStatus.classList.remove('ok','err');
      dmStatus.classList.add(ok ? 'ok' : 'err');
      dmStatus.textContent = msg;
      logOp(`線上載入：${msg}`);
    }
    function resetAndRenderFromText(csvText, virtualName){
      try{
        let raw=csvText;
        if(raw.charCodeAt(0)===0xFEFF){ raw = raw.slice(1); }
        const idx=raw.indexOf('# BEGIN DATA');
        const text=idx>=0 ? raw.slice(idx+'# BEGIN DATA'.length) : raw;
        const parsed=Papa.parse(text, {header:true, skipEmptyLines:true, dynamicTyping:false});
        const cleaned = parsed.data.map(obj=>normalizeRow(obj, virtualName)).filter(x=>x && isFinite(x.lat) && isFinite(x.lon));
        renderAll(cleaned);
      }catch(e){
        showDmStatus('資料解析失敗：'+(e.message||e), false);
      }
    }
    btnLoadCycle.addEventListener('click', async ()=>{
      const model = dmModelSel.value;
      const iso = dmCycleSel.value;
      const dateUtc = new Date(iso);
      showDmStatus('下載中…');
      try{
        const out = await fetchOne(model, dateUtc);
        showDmStatus('已載入：'+ out.url);
        resetAndRenderFromText(out.text, `${model}_${iso}_online.csv`);
      }catch(e){
        showDmStatus('抓取失敗（可能未發布或 CORS 限制）：'+(e.message||e), false);
      }
    });
    btnLatest.addEventListener('click', async ()=>{
      const model = dmModelSel.value;
      const cycles = makeLast48Cycles();
      showDmStatus('測試最近循環…');
      for(const c of cycles){
        try{
          const out = await fetchOne(model, c.date);
          showDmStatus('已載入：'+ out.url);
          resetAndRenderFromText(out.text, `${model}_${c.date.toISOString()}_online.csv`);
          return;
        }catch(e){}
      }
      showDmStatus('近 48h 皆無法抓取（可能未發布或 CORS 限制）', false);
    });
    fillCycles();
    dmModelSel.addEventListener('change', fillCycles);

    // ====== Init ======
    function updateLegendAndLog(){ updateLegend(); logOp('介面初始化完成'); }
    updateLegendAndLog();
})();
