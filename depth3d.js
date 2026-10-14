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
const MAX_DISPLACE = 0.55;

// Solid bas-relief slab: subdivided front face (displaced by depthmap) + back + 4 side walls.
// UVs only matter on the front grid; back/sides render clay (map=null) so distortion is irrelevant.
function createReliefSlab(width = 1.6, height = 1.2, baseDepth = 0.12, segX = 200, segY = 200) {
  const geom = new THREE.BufferGeometry();
  const halfW = width / 2, halfH = height / 2;
  const positions = [], uvs = [], indices = [];
  const cols = segX + 1, rows = segY + 1;

  for (let iy = 0; iy < rows; iy++) {
    const v = iy / segY, y = halfH - v * height;
    for (let ix = 0; ix < cols; ix++) {
      const u = ix / segX, x = -halfW + u * width;
      positions.push(x, y, 0);
      uvs.push(u, 1 - v);
    }
  }
  for (let iy = 0; iy < segY; iy++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iy * cols + ix, b = (iy + 1) * cols + ix;
      const c = (iy + 1) * cols + (ix + 1), d = iy * cols + (ix + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const bl = 0, br = segX, tr = segY * cols + segX, tl = segY * cols;
  const baseZ = -baseDepth;
  const backIdx = positions.length / 3;
  positions.push(-halfW, -halfH, baseZ, halfW, -halfH, baseZ, halfW, halfH, baseZ, -halfW, halfH, baseZ);
  uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
  indices.push(backIdx, backIdx + 2, backIdx + 1, backIdx, backIdx + 3, backIdx + 2);

  const wall = (f0, f1, b1, b0) => {
    const b = positions.length / 3;
    [f0, f1, b1, b0].forEach(vi => { positions.push(positions[vi*3], positions[vi*3+1], positions[vi*3+2]); uvs.push(uvs[vi*2], uvs[vi*2+1]); });
    indices.push(b, b + 2, b + 1, b, b + 3, b + 2);
  };
  wall(bl, br, backIdx + 1, backIdx);
  wall(br, tr, backIdx + 2, backIdx + 1);
  wall(tr, tl, backIdx + 3, backIdx + 2);
  wall(tl, bl, backIdx, backIdx + 3);

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

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
    try {
      depthPipeline = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf', {
        device: 'wasm',
        dtype: 'q8',
        progress_callback: d => { if (onProgress && d.status==='progress') onProgress(`Model ${Math.round(d.progress||0)}%`); }
      });
    } catch(e2) {
      console.warn('WASM fallback failed, trying default quantized', e2);
      depthPipeline = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf', {
        quantized: true,
        progress_callback: d => { if (onProgress && d.status==='progress') onProgress(`Model ${Math.round(d.progress||0)}%`); }
      });
    }
  } finally {
    depthLoading = false;
  }
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
  scene.background = new THREE.Color(0x1a1b1e); // Studio dark matte
  camera = new THREE.PerspectiveCamera(40, w/h, 0.1, 1000);
  camera.position.set(0, 0.5, 2.5);
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.innerHTML = ''; 
  container.appendChild(renderer.domElement);

  // Solid bas-relief sculpture slab
  geometry = createReliefSlab(1.6, 1.2, 0.12, 200, 200);

  // Tactura-style plaster/clay sculpture material
  material = new THREE.MeshStandardMaterial({
    color: 0xefede8, // Plaster stone/matte clay finish
    roughness: 0.68,
    metalness: 0.04,
    displacementScale: 0.28,
    side: THREE.DoubleSide
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -0.12;
  mesh.castShadow = true; 
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Studio 3-point lighting setup for crisp 3D relief contours
  const keyLight = new THREE.DirectionalLight(0xfff8ed, 1.8);
  keyLight.position.set(2.0, 2.8, 2.2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0003;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xbad4ff, 0.7);
  fillLight.position.set(-2.0, 1.0, 1.8);
  scene.add(fillLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);

  // Studio floor grid like tactile 3D CAD preview
  const grid = new THREE.GridHelper(5, 25, 0x666666, 0x2c2d30);
  grid.position.y = -0.7;
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  scene.add(grid);

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

export async function applyDepth(colorSrc, depthSrcCanvas, depthMm, showTexture = false){
  currentImageURL = colorSrc;
  const loader=new THREE.TextureLoader();
  
  if (texColor) { texColor.dispose(); }
  texColor = await new Promise((res,rej)=>loader.load(colorSrc, res, undefined, rej));
  texColor.colorSpace = THREE.SRGBColorSpace;
  
  // By default in Tactura/Sculpture Studio, use solid clay/plaster to highlight 3D reliefs
  material.map = showTexture ? texColor : null; 
  material.needsUpdate = true;
  
  if (texDepth) { texDepth.dispose(); }
  const dTex = new THREE.CanvasTexture(depthSrcCanvas);
  dTex.colorSpace = THREE.NoColorSpace;
  texDepth = dTex; 
  material.displacementMap = dTex; 
  material.displacementScale = Math.min((depthMm||40)/100, MAX_DISPLACE);
  
  material.needsUpdate = true;
  geometry.computeVertexNormals();
}

export function setTextureVisible(visible){
  if(!material) return;
  material.map = visible ? texColor : null;
  material.needsUpdate = true;
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
