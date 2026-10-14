import { estimateDepth, initThree, applyDepth, setDepthScale, setRoughness, setWireframe, snapshot, getDepthCanvas, getEstimator } from './depth3d.js';
const SCREENS=['screen-mode','screen-classic','screen-template','screen-depth','screen-export'];
const STRIP_W=1200, STRIP_H=3600, PHOTO_W=1000, PHOTO_H=750, PHOTO_X=100, PHOTO_Y=[100,920,1740,2560];
let mode='classic', stream=null, shots=[], stripBase64=null, depthColorSrc=null, depthMapCanvas=null, threeReady=false, selectedTpl=1, frameColor='#fffdf9', stampText='DEC 19 \u2022 Arc Studio Tokyo \u2022 Booth #04', isColor=true, uploading=false, countdownLock=false;

const $=s=>document.getElementById(s);
const show=id=>{SCREENS.forEach(s=>$(s).classList.remove('active')); $(id).classList.add('active'); window.scrollTo(0,0);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const updateKioskTime=()=>{const el=$('kiosk-time'); if(!el) return; el.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});};
updateKioskTime(); setInterval(updateKioskTime,10000);
setInterval(()=>{const a=$('glitch-anchor'); if(!a) return; a.classList.add('periodic-glitch-active'); setTimeout(()=>a.classList.remove('periodic-glitch-active'),160);},2200);

async function startCamera(videoEl){
  try{
    if(stream) stream.getTracks().forEach(t=>t.stop());
    const facing=$('btn-flip')?.dataset.facing==='environment'?'environment':'user';
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1920},height:{ideal:1080}},audio:false});
    videoEl.srcObject=stream; await videoEl.play().catch(()=>{});
    return true;
  }catch(e){
    const msg='Kamera tidak tersedia: '+(e.message||e.name)+' \u2014 butuh HTTPS & izin Safari.';
    const ec=$('camera-error-classic'), ed=$('camera-error-depth');
    if(ec){ec.textContent=msg; ec.classList.remove('hidden');}
    if(ed){ed.textContent=msg; ed.classList.remove('hidden');}
    return false;
  }
}

function captureFrame(video){
  const vw=video.videoWidth||1280, vh=video.videoHeight||720;
  const c=document.createElement('canvas'); c.width=vw; c.height=vh;
  const ctx=c.getContext('2d'); ctx.translate(vw,0); ctx.scale(-1,1); ctx.drawImage(video,0,0,vw,vh); return c;
}
async function composeStrip(frames, tint){
  const canvas=$('canvas'); canvas.width=STRIP_W; canvas.height=STRIP_H;
  const ctx=canvas.getContext('2d'); ctx.fillStyle=tint||'#ffffff'; ctx.fillRect(0,0,STRIP_W,STRIP_H);
  frames.forEach((fc,i)=>{
    const fw=fc.width,fh=fc.height, scale=Math.max(PHOTO_W/fw,PHOTO_H/fh), sw=PHOTO_W/scale, sh=PHOTO_H/scale, sx=(fw-sw)/2, sy=(fh-sh)/2;
    ctx.drawImage(fc,sx,sy,sw,sh,PHOTO_X,PHOTO_Y[i],PHOTO_W,PHOTO_H);
  });
  const tplSrc=selectedTpl<=2?`template-${selectedTpl===1?'a':'b'}.png`:null;
  if(tplSrc){
    const img=new Image(); img.crossOrigin='anonymous'; img.src=tplSrc;
    await new Promise(r=>{img.onload=r; img.onerror=r; setTimeout(r,800);});
    if(img.naturalWidth) ctx.drawImage(img,0,0,STRIP_W,STRIP_H);
  }
  ctx.fillStyle=tint==='@dark'?'#1c1c19':'transparent';
  if(tint==='#222222'||tint==='#1b2430'){ ctx.globalAlpha=0.08; ctx.fillRect(0,0,STRIP_W,STRIP_H); ctx.globalAlpha=1; }
  return canvas.toDataURL('image/jpeg',0.92);
}
function renderStripSlots(frames){
  const cont=$('strip-slots'); if(!cont) return; cont.innerHTML='';
  frames.forEach((c,i)=>{
    const url=c.toDataURL('image/jpeg',0.88);
    const d=document.createElement('div'); d.className='relative w-full h-[96px] rounded bg-black/5 overflow-hidden shadow-sm';
    d.innerHTML=`<img src="${url}" class="w-full h-full object-cover ${isColor?'':'grayscale'}"><span class="absolute top-1 left-1 px-1 py-0.2 bg-black/70 text-white font-mono text-[9px] rounded">#${i+1}</span>`;
    cont.appendChild(d);
  });
}
function flashEl(id){const el=$(id); if(!el) return; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),400);}
async function countdownClassic(n=3){
  const overlay=$('classic-countdown-overlay'), num=$('countdownDisplay'), flash=$('flash');
  if(!overlay||!num) return;
  overlay.style.display='flex';
  for(let i=n;i>=1;i--){ num.textContent=i; num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop'); await sleep(800); }
  num.textContent='!'; flashEl('flash'); await sleep(300); overlay.style.display='none';
}
async function countdownDepth(n=3){
  const box=$('depth-countdown'), num=$('depth-countdown-num');
  if(!box||!num) return;
  box.style.display='flex'; box.classList.remove('hidden'); box.classList.add('flex');
  for(let i=n;i>=1;i--){ num.textContent=i; await sleep(700); }
  num.textContent='📸'; flashEl('depth-flash'); await sleep(400); box.style.display='none';
}
function base64ToBlob(dataUrl){
  try{
    const [meta,b64]=dataUrl.split(',');
    const mime=(meta.match(/:(.*?);/)||[])[1]||'image/jpeg';
    const bin=atob(b64); const a=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) a[i]=bin.charCodeAt(i);
    return new Blob([a],{type:mime});
  }catch{ return null; }
}
function makeFallbackUrl(base64){
  try{ const b=base64ToBlob(base64); if(b) return URL.createObjectURL(b); }catch{}
  return `https://photobooth.local/preview?t=${Date.now()}`;
}
function generateQRCode(url){
  const el=$('qrcode')||document.getElementById('qr-code-container'); if(!el) return;
  el.innerHTML=''; el.style.display='flex'; el.style.visibility='visible';
  const p=el.parentElement; if(p) p.style.display='flex';
  el.classList.remove('hidden');
  try{
    if(typeof QRCode!=='undefined'){ new QRCode(el,{text:url,width:196,height:196,correctLevel:QRCode.CorrectLevel.M}); }
    else el.innerHTML=`<a href="${url}" target="_blank" class="font-mono text-[11px] break-all text-black underline">${url}</a>`;
  }catch{ el.innerHTML=`<a href="${url}" target="_blank" class="font-mono text-[11px] break-all text-black underline">${url}</a>`; }
}
function renderQR(url){ return generateQRCode(url); }
async function uploadToR2(base64){
  uploading=true; const st=$('upload-status'); if(st) st.textContent='Mengupload ke R2...';
  try{
    const res=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:base64})});
    const data=await res.json(); if(!res.ok) throw new Error(data.error||'Upload gagal');
    if(st) st.textContent='Berhasil \u2014 scan QR untuk download';
    generateQRCode(data.url);
    const dl=$('download-link'); if(dl){ dl.href=data.url; dl.textContent='Buka Gambar'; dl.classList.remove('hidden'); dl.style.display='flex'; }
    return data.url;
  }catch(e){
    const fb=makeFallbackUrl(base64);
    generateQRCode(fb);
    const dl=$('download-link'); if(dl){ dl.href=fb; dl.textContent='Preview Lokal (tap buka)'; dl.classList.remove('hidden'); dl.style.display='flex'; }
    if(st) st.textContent='Mode lokal \u2014 QR preview siap (offline mock)';
    return fb;
  }finally{ uploading=false; }
}

$('door-classic')?.addEventListener('click', async()=>{
  mode='classic'; shots=[]; stripBase64=null;
  show('screen-classic'); $('classic-badge').textContent='TEMPLATE '+selectedTpl;
  await startCamera($('video-classic'));
  $('frame-idx').textContent='1'; document.querySelectorAll('#classic-dots .dot').forEach((d,i)=>d.className='dot'+(i===0?' active':''));
});
$('door-spatial')?.addEventListener('click', async()=>{
  mode='depth'; depthColorSrc=null; depthMapCanvas=null; threeReady=false;
  show('screen-depth');
  $('depth-capture-box').classList.remove('hidden'); $('depth-capture-box').style.display='flex';
  $('depth-viewport-box').classList.add('hidden'); $('depth-viewport-box').style.display='none';
  $('depth-controls').classList.add('hidden'); $('depth-source-card').classList.add('hidden');
  $('depth-status').textContent='Siap capture setelah model terunduh';
  await startCamera($('video-depth'));
});

$('btn-download-model')?.addEventListener('click', async()=>{
  const btn = $('btn-download-model');
  btn.disabled = true;
  btn.classList.add('opacity-50', 'cursor-not-allowed');
  btn.textContent = '⏳ Mengunduh...';
  try {
    await getEstimator(t => {
      $('depth-model-badge').textContent = t;
      btn.textContent = t.includes('%') ? `⏳ ${t}` : '⏳ Mengunduh...';
    });
    btn.textContent = '✅ Model Siap';
    btn.classList.remove('bg-[#0073e0]', 'hover:bg-[#005ab3]');
    btn.classList.add('bg-[#00d26a]', 'text-black');
    $('depth-status').textContent = 'Model siap! Tekan Capture.';
  } catch(e) {
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
    btn.textContent = '❌ Gagal, Coba Lagi';
    $('depth-model-badge').textContent = 'Error: ' + e.message;
  }
});
$('btn-home')?.addEventListener('click',()=>{ if(stream) stream.getTracks().forEach(t=>t.stop()); show('screen-mode');});
$('btn-classic-back')?.addEventListener('click',()=>show('screen-mode'));
$('btn-depth-back')?.addEventListener('click',()=>show('screen-mode'));
$('btn-template-back')?.addEventListener('click',()=>{ if(mode==='classic') show('screen-classic'); else show('screen-depth'); });
$('btn-flip')?.addEventListener('click', async()=>{
  const b=$('btn-flip'); b.dataset.facing=b.dataset.facing==='environment'?'user':'environment';
  const v=mode==='depth'?$('video-depth'):$('video-classic'); await startCamera(v);
});
$('filterToggle')?.addEventListener('click',()=>{
  isColor=!isColor; const k=$('filterKnob'); if(isColor){k.classList.add('translate-x-8'); k.classList.remove('translate-x-0');} else {k.classList.remove('translate-x-8'); k.classList.add('translate-x-0');}
  const vid=$('video-classic'); if(vid) vid.style.filter=isColor?'none':'grayscale(1)';
});
$('btn-shutter')?.addEventListener('click', async()=>{
  if(countdownLock||uploading) return; countdownLock=true;
  shots=[];
  const dots=document.querySelectorAll('#classic-dots .dot');
  for(let i=0;i<4;i++){
    $('frame-idx').textContent=i+1;
    dots.forEach((d,idx)=>d.className='dot'+(idx<i?' done':idx===i?' active':''));
    await countdownClassic(3);
    shots.push(captureFrame($('video-classic')));
    dots.forEach((d,idx)=>d.className='dot'+(idx<=i?' done':''));
    await sleep(300);
    if(i<3) await sleep(1200);
  }
  stripBase64=await composeStrip(shots, frameColor);
  renderStripSlots(shots);
  $('preview-3d-img').src=stripBase64;
  $('template-preview-img').src=stripBase64; $('template-preview-img').classList.remove('hidden');
  window.switchOutputMode('2d');
  show('screen-template');
  countdownLock=false;
});

$('btn-depth-shutter')?.addEventListener('click', async()=>{
  if(countdownLock) return; countdownLock=true;
  $('depth-status').textContent='Capturing...';
  await countdownDepth(3);
  const c= captureFrame($('video-depth'));
  depthColorSrc=c.toDataURL('image/jpeg',0.92);
  $('source-photo-thumb').src=depthColorSrc;
  $('depth-source-card').classList.remove('hidden');
  $('depth-status').textContent='Estimating depth (ML)...';
  $('depth-model-badge').textContent='Running Depth Anything...';
  try{
    depthMapCanvas=await estimateDepth(depthColorSrc, t=>{ $('depth-status').textContent=t; $('depth-model-badge').textContent=t; });
    const pv=$('depth-map-preview'); if(pv&&depthMapCanvas){ const x=pv.getContext('2d'); x.clearRect(0,0,pv.width,pv.height); x.drawImage(depthMapCanvas,0,0,pv.width,pv.height); }
    $('depth-model-badge').textContent='ML DEPTH READY';
    $('depth-status').textContent='Depth map ready \u2014 rendering 3D...';
    const cont=$('three-container');
    if(!threeReady){ initThree(cont); threeReady=true; }
    await applyDepth(depthColorSrc, depthMapCanvas, 40);
    $('depth-capture-box').style.display='none';
    const vp=$('depth-viewport-box'); vp.classList.remove('hidden'); vp.style.display='flex';
    $('depth-controls').classList.remove('hidden');
    $('depth-controls').style.display='flex';
    $('telemetry-depth').textContent='43.0';
  }catch(e){
    $('depth-status').textContent='Depth failed: '+e.message;
  }
  countdownLock=false;
});
$('btn-depth-retake')?.addEventListener('click',()=>{
  $('depth-viewport-box').style.display='none'; $('depth-controls').style.display='none';
  $('depth-capture-box').style.display='flex'; $('depth-status').textContent='Tap to capture again';
});
$('btn-depth-reset-view')?.addEventListener('click',()=>{ const c=$('three-container'); if(c&&c._resetView) c._resetView(); });
$('slider-depth')?.addEventListener('input',e=>{ const v=e.target.value; $('depth-val-badge').textContent=v+' mm'; $('telemetry-depth').textContent=(v*1.075).toFixed(1); setDepthScale(Number(v)); });
$('slider-smoothness')?.addEventListener('input',e=>{ $('smooth-val-badge').textContent=e.target.value+'%'; setRoughness(Number(e.target.value)); });
$('slider-texture')?.addEventListener('input',e=>{ $('texture-val-badge').textContent=e.target.value+'%'; const img=document.querySelector('#three-container canvas'); if(img) img.style.filter=`contrast(${100+Number(e.target.value)*0.35}%)`; });
$('slider-outline')?.addEventListener('input',e=>{ $('outline-val-badge').textContent=e.target.value+'%'; setWireframe(Number(e.target.value)>50); });
$('cam-perspective')?.addEventListener('click',()=>{ const c=$('three-container'); if(c&&c._resetView) c._resetView(); });
$('cam-front')?.addEventListener('click',()=>{ const c=$('three-container'); if(c&&c._resetView) c._resetView(); });
$('cam-top')?.addEventListener('click',()=>{ const m=document.querySelector('#three-container'); });
$('btn-wireframe')?.addEventListener('click',()=>{ const cur=$('slider-outline').value; const nv=Number(cur)>50?0:100; $('slider-outline').value=nv; $('outline-val-badge').textContent=nv+'%'; setWireframe(nv>50); });

$('btn-depth-save')?.addEventListener('click', async()=>{
  const snap=snapshot(); const img= snap || depthColorSrc;
  stripBase64 = snap ? snap : depthColorSrc;
  if(!stripBase64) return;
  const ed=$('export-depth-img'); if(ed) ed.src=stripBase64;
  const es=$('export-strip-img'); if(es) es.src=depthColorSrc||stripBase64;
  const dm=$('export-depth-map'); if(dm&&depthMapCanvas){ dm.classList.remove('hidden'); dm.style.display='block'; const x=dm.getContext('2d'); x.drawImage(depthMapCanvas,0,0,dm.width,dm.height); }
  show('screen-export');
  const qrBox=$('qrcode'); if(qrBox){ qrBox.style.display='flex'; qrBox.classList.remove('hidden'); }
  await uploadToR2(stripBase64);
  if(depthMapCanvas){
    const mapB64=depthMapCanvas.toDataURL('image/jpeg',0.88);
    try{
      const r=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:mapB64})});
      const d=await r.json(); if(r.ok){ const l=$('depth-download-link'); if(l){l.textContent='Depth map: '+d.url; l.href=d.url; l.classList.remove('hidden'); l.style.display='block';} }
      else throw new Error(d.error||'depth upload failed');
    }catch{
      const l=$('depth-download-link'); if(l){ const fb=makeFallbackUrl(mapB64); l.textContent='Depth map (lokal): '+fb; l.href=fb; l.classList.remove('hidden'); l.style.display='block'; }
    }
  }
});
$('btn-template-continue')?.addEventListener('click', async()=>{
  if(mode==='classic' && !stripBase64) { stripBase64=await composeStrip(shots, frameColor); }
  if(mode==='depth' && !stripBase64) stripBase64=depthColorSrc||snapshot()||stripBase64;
  const es=$('export-strip-img'); if(es) es.src=stripBase64||'';
  const ed=$('export-depth-img'); if(ed) ed.src=depthMapCanvas?depthMapCanvas.toDataURL():stripBase64||'';
  const dm=$('export-depth-map'); if(dm&&depthMapCanvas){ dm.classList.remove('hidden'); dm.style.display='block'; dm.getContext('2d').drawImage(depthMapCanvas,0,0,dm.width,dm.height); }
  show('screen-export');
  const qb=$('qrcode'); if(qb){ qb.style.display='flex'; qb.classList.remove('hidden'); }
  $('scan-job').textContent='JOB #'+Math.floor(1000+Math.random()*9000)+'-OK';
  $('scan-duration').textContent=(12+Math.random()*8).toFixed(1);
  if(stripBase64) await uploadToR2(stripBase64);
  else generateQRCode(makeFallbackUrl('https://photobooth.local/preview'));
});
$('btn-start-over')?.addEventListener('click',()=>{
  shots=[]; stripBase64=null; depthColorSrc=null; depthMapCanvas=null;
  $('qrcode').innerHTML=''; $('download-link').classList.add('hidden'); $('upload-status').textContent='';
  $('depth-download-link')?.classList.add('hidden');
  const dm=$('export-depth-map'); if(dm) dm.classList.add('hidden');
  show('screen-mode');
});
let autoTimer=null;
function startAutoReset(){
  let t=30; const el=$('countdownTimer'); if(!el) return;
  el.textContent=t;
  clearInterval(autoTimer);
  autoTimer=setInterval(()=>{
    t--;
    if(el) el.textContent=t;
    if(t<=0){
      clearInterval(autoTimer);
      const b=$('btn-start-over');
      if(b) b.click();
    }
  },1000);
}
new MutationObserver(()=>{
  if($('screen-export').classList.contains('active')) startAutoReset(); else clearInterval(autoTimer);
}).observe(document.body,{attributes:true,subtree:true,attributeFilter:['class']});

window.switchOutputMode=(m)=>{
  const a=$('preview-mode-2d'), b=$('preview-mode-3d'), meta=$('preview-meta');
  if(m==='2d'){ a.style.display='flex'; b.style.display='none'; if(meta) meta.textContent='50.8 \u00d7 152.4 mm \u00b7 4 POSE STRIP'; }
  else { a.style.display='none'; b.style.display='flex'; if(meta) meta.textContent='200 \u00d7 150 \u00d7 43.0 mm \u00b7 3D CNC RELIEF'; if(depthMapCanvas) $('preview-3d-img').src=depthMapCanvas.toDataURL(); }
};
window.selectTemplate=id=>{
  selectedTpl=id;
  document.querySelectorAll('.template-card').forEach(c=>c.classList.remove('selected'));
  const el=$('card-tpl-'+id); if(el) el.classList.add('selected');
  $('classic-badge').textContent='TEMPLATE '+id;
  const hdr=$('stamp-header-text'); if(hdr) hdr.textContent=id===2?'NOIR ARCHIVE':id===3?"GLITCH '99 ARCADE":id===4?'OAK PLINTH':'SPATIAL SCULPT';
  const strip=$('photostrip-body'); if(strip) strip.style.backgroundColor=frameColor;
};
window.setFrameColor=(hex,btn)=>{
  frameColor=hex; const s=$('photostrip-body'); if(s){ s.style.backgroundColor=hex; s.style.color=(hex==='#222222'||hex==='#1b2430')?'#fff':'#1c1c19'; }
  document.querySelectorAll('.swatch-btn').forEach(b=>b.style.outline='none'); if(btn) btn.style.outline='2px solid #006d34';
};
window.updateCustomStamp=v=>{ stampText=v; const l=$('strip-footer-label'); if(l) l.textContent=v.slice(0,28); };
window.randomizeStampText=()=>{
  const presets=["DEC 19 \u2022 Arc Studio Tokyo \u2022 Booth #04","SHIBUYA LAB \u2022 3D DEPTH KIOSK \u2022 2025","MEMORIES IN 3D \u2022 ARCADE ARCHIVE #12","NEO TOKYO \u2022 43.0MM RELIEF \u2022 PASS #08"];
  const p=presets[Math.floor(Math.random()*presets.length)]; const inp=$('input-stamp-text'); if(inp) inp.value=p; window.updateCustomStamp(p);
};
window.cycleTemplate=d=>{ let n=selectedTpl+d; if(n<1) n=4; if(n>4) n=1; window.selectTemplate(n); };
window.toggleFilterMode=()=>{
  isColor=!isColor; const k=$('filter-knob2'); if(k) k.style.transform=isColor?'translateX(20px)':'translateX(0px)';
  const s=$('photostrip-body'); if(s) s.style.filter=isColor?'none':'grayscale(1) contrast(1.1)';
  const p=$('preview-3d-img'); if(p) p.style.filter=isColor?'none':'grayscale(1)';
};
window.switchOutputMode('2d');
