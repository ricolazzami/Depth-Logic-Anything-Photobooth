import * as THREE from 'three';
import { pipeline, env } from '@xenova/transformers';
env.allowLocalModels = false;
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';

let depthPipeline = null;
let depthLoading = false;
let scene, camera, renderer, mesh, geometry, material, light, rafId;
let texColor, texDepth;
let depthCanvas, depthCtx;
let currentImageURL = null;

const DEPTH_W = 256, DEPTH_H = 256;
// ponytail: cap displacement to avoid over-distortion. raise if real-depth export needed.
const MAX_DISPLACE = 0.45;

// ponytail: max 384x384 resize for web ML speed ceiling. upgrade if WebGPU pipeline added.
function resizeForInference(src, maxDim = 384) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export async function getEstimator(onProgress) {
  if (depthPipeline) return depthPipeline;
  if (depthLoading) {
    while (depthLoading) await new Promise(r=>setTimeout(r,200));
    return depthPipeline;
  }
  depthLoading = true;
  if (onProgress) onProgress('Initializing WebGPU Depth Engine...');
  try {
    depthPipeline = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf', {
      device: 'webgpu',
      dtype: 'fp16',
      progress_callback: d => { if (onProgress && d.status==='progress') onProgress(`Model ${Math.round(d.progress||0)}%`); }
    });
  } catch (e) {
    console.warn('WebGPU/FP16 failed, falling back to WASM/Quantized', e);
    depthPipeline = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf', {
      quantized: true,
      progress_callback: d => { if (onProgress && d.status==='progress') onProgress(`Model ${Math.round(d.progress||0)}%`); }
    });
  }
  depthLoading = false;
  if (onProgress) onProgress('Model ready');
  return depthPipeline;
}

export async function estimateDepth(imageSrc, onProgress) {
  try {
    const pipe = await getEstimator(onProgress);
    if (onProgress) onProgress('Optimizing input frame...');
    // ponytail: iPad Gen 11 performance ceiling at 384px for <500ms inference
    const resizedSrc = await resizeForInference(imageSrc, 384);
    
    if (onProgress) onProgress('Computing depth (WebGPU)...');
    const out = await pipe(resizedSrc);
    const t = out.predicted_depth;
    const data = t.data;
    const [h,w] = [t.dims[1], t.dims[2]] || [DEPTH_H, DEPTH_W];
    
    let min=Infinity,max=-Infinity;
    for (let v of data){ if(v<min)min=v; if(v>max)max=v; }
    const range = max-min || 1;

    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = w; rawCanvas.height = h;
    const rawCtx = rawCanvas.getContext('2d');
    const imgData = rawCtx.createImageData(w,h);
    for(let i=0;i<data.length;i++){
      const n = Math.round(((data[i]-min)/range)*255);
      const o=i*4; imgData.data[o]=n; imgData.data[o+1]=n; imgData.data[o+2]=n; imgData.data[o+3]=255;
    }
    rawCtx.putImageData(imgData,0,0);

    if (depthCanvas) { /* clean up reference */ }
    depthCanvas = document.createElement('canvas');
    depthCanvas.width = w; depthCanvas.height = h;
    depthCtx = depthCanvas.getContext('2d');
    depthCtx.filter = 'blur(4px)';
    depthCtx.drawImage(rawCanvas, 0, 0);

    if (onProgress) onProgress('Rendering 3D...');
    return depthCanvas;
  } catch(e){
    console.warn('ML depth failed, fallback luma', e);
    return lumaDepth(imageSrc);
  }
}

function lumaDepth(src){
  return new Promise(res=>{
    const img=new Image(); img.crossOrigin='anonymous'; img.src=src;
    img.onload=()=>{
      const c=document.createElement('canvas'); c.width=DEPTH_W; c.height=DEPTH_H;
      const x=c.getContext('2d'); x.drawImage(img,0,0,DEPTH_W,DEPTH_H);
      const d=x.getImageData(0,0,DEPTH_W,DEPTH_H);
      for(let i=0;i<d.data.length;i+=4){
        const l=0.299*d.data[i]+0.587*d.data[i+1]+0.114*d.data[i+2];
        d.data[i]=d.data[i+1]=d.data[i+2]=l;
      }
      x.putImageData(d,0,0); res(c);
    };
    img.onerror=()=>res(null);
  });
}

export function initThree(container, onReady){
  const w = container.clientWidth, h = container.clientHeight;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x121316);
  camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 1000);
  camera.position.set(0,0.8,2.2);
  camera.lookAt(0,0,0);
  renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(w,h);
  renderer.shadowMap.enabled=true;
  container.innerHTML=''; container.appendChild(renderer.domElement);

  geometry = new THREE.PlaneGeometry(1.6, 1.2, 256, 256);
  material = new THREE.MeshStandardMaterial({color:0xffffff, displacementScale:0.2, roughness:0.4, metalness:0.0, side:THREE.DoubleSide});
  mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -0.18;
  mesh.castShadow=true; mesh.receiveShadow=true;
  scene.add(mesh);

  const amb=new THREE.AmbientLight(0xffffff, 0.5); scene.add(amb);
  light=new THREE.DirectionalLight(0xffffff, 1.5); 
  light.position.set(1.5, 2.0, 1.8); 
  light.castShadow=true; 
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.bias = -0.0005;
  scene.add(light);


  const grid=new THREE.GridHelper(4,20,0xffffff,0x333333); grid.position.y=-0.62; grid.material.opacity=0.12; grid.material.transparent=true; scene.add(grid);

  let dragging=false, sx=0, sy=0, ry=0, rx=-0.18;
  const el=renderer.domElement;
  const down=(x,y)=>{dragging=true; sx=x; sy=y;};
  const move=(x,y)=>{ if(!dragging)return; const dx=(x-sx)*0.008, dy=(y-sy)*0.008; ry+=dx; rx=Math.max(-0.8,Math.min(0.6,rx+dy)); mesh.rotation.y=ry; mesh.rotation.x=rx; sx=x; sy=y; };
  el.addEventListener('mousedown',e=>down(e.clientX,e.clientY));
  window.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
  window.addEventListener('mouseup',()=>dragging=false);
  el.addEventListener('touchstart',e=>{if(e.touches[0])down(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
  window.addEventListener('touchmove',e=>{if(e.touches[0])move(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
  window.addEventListener('touchend',()=>dragging=false);
  container._resetView=()=>{ry=0; rx=-0.18; mesh.rotation.y=0; mesh.rotation.x=-0.18;};

  const ro=new ResizeObserver(()=>{ const nw=container.clientWidth, nh=container.clientHeight; if(!nw||!nh)return; camera.aspect=nw/nh; camera.updateProjectionMatrix(); renderer.setSize(nw,nh);});
  ro.observe(container);

  animate();
  if(onReady) onReady();
}

function animate(){ rafId=requestAnimationFrame(animate); if(renderer&&scene&&camera) renderer.render(scene,camera); }

export async function applyDepth(colorSrc, depthSrcCanvas, depthMm){
  currentImageURL = colorSrc;
  const loader=new THREE.TextureLoader();
  
  if (texColor) { texColor.dispose(); }
  texColor = await new Promise((res,rej)=>loader.load(colorSrc, res, undefined, rej));
  texColor.colorSpace = THREE.SRGBColorSpace;
  material.map = texColor; 
  
  if (texDepth) { texDepth.dispose(); }
  const dTex = new THREE.CanvasTexture(depthSrcCanvas);
  dTex.colorSpace = THREE.NoColorSpace;
  texDepth = dTex; 
  material.displacementMap = dTex; 
  material.displacementScale = Math.min((depthMm||40)/100, MAX_DISPLACE);
  
  material.needsUpdate = true;
  geometry.computeVertexNormals();
}

export function destroy(){ 
  if(rafId) cancelAnimationFrame(rafId); 
  if(renderer) {
    renderer.dispose();
    if(renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
  if(geometry) geometry.dispose();
  if(material) {
    if(material.map) material.map.dispose();
    if(material.displacementMap) material.displacementMap.dispose();
    material.dispose();
  }
  scene = null; camera = null; renderer = null; mesh = null; geometry = null; material = null;
}

export function setDepthScale(mm){ if(material) material.displacementScale=Math.min(mm/100, MAX_DISPLACE); }
export function setRoughness(v){ if(material) material.roughness=1 - v/100*0.6; }
export function setWireframe(b){ if(material) material.wireframe=!!b; }
export function snapshot(){ if(!renderer) return null; return renderer.domElement.toDataURL('image/jpeg',0.92); }
export function getDepthCanvas(){ return depthCanvas; }
