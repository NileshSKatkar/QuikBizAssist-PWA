/* QuikBizAssist PWA - simple camera + Tesseract OCR + API integration */

const video = document.getElementById('video');
const orientationEl = document.getElementById('orientation');
const snapFrontBtn = document.getElementById('snap-front');
const snapBackBtn = document.getElementById('snap-back');
const ocrFrontBtn = document.getElementById('ocr-front');
const ocrBackBtn = document.getElementById('ocr-back');
const canvasFront = document.getElementById('canvas-front');
const canvasBack = document.getElementById('canvas-back');
const ocrFrontText = document.getElementById('ocr-front-text');
const ocrBackText = document.getElementById('ocr-back-text');
const logOutput = document.getElementById('log-output');

const firstNameEl = document.getElementById('firstName');
const lastNameEl = document.getElementById('lastName');
const emailEl = document.getElementById('email');
const phoneEl = document.getElementById('phone');
const companyEl = document.getElementById('company');
const titleEl = document.getElementById('title');
const categoryEl = document.getElementById('category');
const tagsEl = document.getElementById('tags');
const productsList = document.getElementById('products-list');
const productNameEl = document.getElementById('product-name');
const productPriceEl = document.getElementById('product-price');
const addProductBtn = document.getElementById('add-product');
const saveContactBtn = document.getElementById('save-contact');
const apiBaseEl = document.getElementById('api-base');
const loginUsernameEl = document.getElementById('login-username');
const loginPasswordEl = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authStatusEl = document.getElementById('auth-status');

let frontDataUrl = null;
let backDataUrl = null;
let products = [];

// Canvas-based image compression
async function compressImage(dataUrl, maxWidth = 800, maxHeight = 600, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      // maintain aspect ratio
      if (w > h) {
        if (w > maxWidth) { h *= maxWidth / w; w = maxWidth; }
      } else {
        if (h > maxHeight) { w *= maxHeight / h; h = maxHeight; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

function log(msg){
  const time = new Date().toISOString();
  logOutput.textContent = `[${time}] ${msg}\n` + logOutput.textContent;
}

async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio:false });
    video.srcObject = stream;
    await video.play();
    log('Camera started');
  } catch(err){
    log('Camera error: ' + err.message);
  }
}

function captureCanvasForOrientation(destCanvas){
  const ctx = destCanvas.getContext('2d');
  const w = video.videoWidth;
  const h = video.videoHeight;
  const orientation = orientationEl.value;
  if(orientation === 'landscape'){
    destCanvas.width = Math.max(w,h);
    destCanvas.height = Math.min(w,h);
  } else {
    destCanvas.width = Math.min(w,h);
    destCanvas.height = Math.max(w,h);
  }
  ctx.drawImage(video, 0, 0, destCanvas.width, destCanvas.height);
}

snapFrontBtn.addEventListener('click', async ()=>{
  captureCanvasForOrientation(canvasFront);
  const raw = canvasFront.toDataURL('image/jpeg', 0.9);
  frontDataUrl = await compressImage(raw, 800, 600, 0.7);
  log('Captured & compressed front image');
});

snapBackBtn.addEventListener('click', async ()=>{
  captureCanvasForOrientation(canvasBack);
  const raw = canvasBack.toDataURL('image/jpeg', 0.9);
  backDataUrl = await compressImage(raw, 800, 600, 0.7);
  log('Captured & compressed back image');
});

async function runOCR(dataUrl, outEl){
  if(!dataUrl) { log('No image to OCR'); return; }
  outEl.value = 'Recognizing...';
  try{
    const worker = Tesseract.createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const res = await worker.recognize(dataUrl);
    await worker.terminate();
    outEl.value = res.data.text;
    log('OCR complete');
    return res.data.text;
  } catch(err){
    outEl.value = '';
    log('OCR error: ' + err.message);
    return '';
  }
}

ocrFrontBtn.addEventListener('click', async ()=>{
  const text = await runOCR(frontDataUrl, ocrFrontText);
  tryAutoFillFromOCR(text);
});
ocrBackBtn.addEventListener('click', async ()=>{
  await runOCR(backDataUrl, ocrBackText);
});

function tryAutoFillFromOCR(text){
  if(!text) return;
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  // heuristics: first non-empty line -> name, find email, phone, company heuristically
  if(lines.length>0){
    const nameParts = lines[0].split(' ');
    firstNameEl.value = nameParts.shift() || '';
    lastNameEl.value = nameParts.join(' ') || '';
  }
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(emailMatch) emailEl.value = emailMatch[0];
  const phoneMatch = text.match(/(\+?\d[\d \-()]{6,}\d)/);
  if(phoneMatch) phoneEl.value = phoneMatch[0];
  const websiteMatch = text.match(/https?:\/\/[^\s]+/i) || text.match(/www\.[^\s]+/i);
  if(websiteMatch) log('Found website: ' + websiteMatch[0]);
  // company guess: second line if longer
  if(lines[1]) companyEl.value = lines[1];
}

addProductBtn.addEventListener('click', ()=>{
  const name = productNameEl.value.trim();
  const price = productPriceEl.value.trim();
  if(!name) return;
  products.push({name, price});
  renderProducts();
  productNameEl.value=''; productPriceEl.value='';
});

function renderProducts(){
  productsList.innerHTML='';
  products.forEach((p, i)=>{
    const div = document.createElement('div');
    div.className='product-item';
    div.innerHTML = `<span>${p.name} — ${p.price}</span> <button data-i="${i}">Remove</button>`;
    div.querySelector('button').addEventListener('click', ()=>{
      products.splice(i,1); renderProducts();
    });
    productsList.appendChild(div);
  });
}

function makeId(){
  return 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2,9);
}

saveContactBtn.addEventListener('click', async ()=>{
  const apiBase = (apiBaseEl.value || '').replace(/\/+$/,'');
  if(!apiBase){ alert('Set API base URL'); return; }
  const name = `${firstNameEl.value||''} ${lastNameEl.value||''}`.trim() || 'unknown';
  const contact = {
    id: makeId(),
    userId: 'default',
    firstName: firstNameEl.value || null,
    lastName: lastNameEl.value || null,
    title: titleEl.value || null,
    company: companyEl.value || null,
    emails: emailEl.value ? [emailEl.value] : null,
    phones: phoneEl.value ? [phoneEl.value] : null,
    website: null,
    address: null,
    services: null,
    products: products.length? products : null,
    socialLinks: null,
    notes: null,
    category: categoryEl.value || null,
    tags: tagsEl.value ? tagsEl.value.split(',').map(t=>t.trim()).filter(Boolean) : null,
    scannedAt: new Date().toISOString(),
    frontImage: frontDataUrl ? JSON.stringify({ name: (name.replace(/\s+/g,'_') + '_front.jpg'), data: frontDataUrl }) : null,
    backImage: backDataUrl ? JSON.stringify({ name: (name.replace(/\s+/g,'_') + '_back.jpg'), data: backDataUrl }) : null,
    confidenceScores: null
  };

  log('Saving contact to ' + apiBase + '/contacts');
  try{
    const token = localStorage.getItem('qba_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(apiBase + '/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify(contact)
    });
    const body = await res.text();
    log('Save response: ' + res.status + ' - ' + body);
    if(res.ok) alert('Contact saved');
  } catch(err){
    log('Save error: ' + err.message);
    alert('Save failed: ' + err.message);
  }
});

async function login() {
  const apiBase = (apiBaseEl.value || '').replace(/\/+$/,'');
  if(!apiBase){ alert('Set API base URL'); return; }
  const username = loginUsernameEl.value.trim();
  const password = loginPasswordEl.value;
  if(!username || !password) return alert('username and password');
  try{
    const res = await fetch(apiBase + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if(!res.ok) throw new Error('Login failed');
    const body = await res.json();
    localStorage.setItem('qba_token', body.token);
    authStatusEl.textContent = 'Authenticated';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    log('Login successful');
  } catch(err){
    log('Login error: ' + err.message);
    alert('Login failed');
  }
}

function logout(){
  localStorage.removeItem('qba_token');
  authStatusEl.textContent = '';
  loginBtn.style.display = 'inline-block';
  logoutBtn.style.display = 'none';
  log('Logged out');
}

loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', logout);

// restore auth state
if(localStorage.getItem('qba_token')){
  authStatusEl.textContent = 'Authenticated';
  loginBtn.style.display = 'none';
  logoutBtn.style.display = 'inline-block';
}

// Start
startCamera();
renderProducts();
/* QuikBizAssist PWA - simple camera + Tesseract OCR + API integration */

const video = document.getElementById('video');
const orientationEl = document.getElementById('orientation');
const snapFrontBtn = document.getElementById('snap-front');
const snapBackBtn = document.getElementById('snap-back');
const ocrFrontBtn = document.getElementById('ocr-front');
const ocrBackBtn = document.getElementById('ocr-back');
const canvasFront = document.getElementById('canvas-front');
const canvasBack = document.getElementById('canvas-back');
const ocrFrontText = document.getElementById('ocr-front-text');
const ocrBackText = document.getElementById('ocr-back-text');
const logOutput = document.getElementById('log-output');

const firstNameEl = document.getElementById('firstName');
const lastNameEl = document.getElementById('lastName');
const emailEl = document.getElementById('email');
const phoneEl = document.getElementById('phone');
const companyEl = document.getElementById('company');
const titleEl = document.getElementById('title');
const categoryEl = document.getElementById('category');
const tagsEl = document.getElementById('tags');
const productsList = document.getElementById('products-list');
const productNameEl = document.getElementById('product-name');
const productPriceEl = document.getElementById('product-price');
const addProductBtn = document.getElementById('add-product');
const saveContactBtn = document.getElementById('save-contact');
const apiBaseEl = document.getElementById('api-base');
const loginUsernameEl = document.getElementById('login-username');
const loginPasswordEl = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authStatusEl = document.getElementById('auth-status');

let frontDataUrl = null;
let backDataUrl = null;
let products = [];

// Canvas-based image compression
async function compressImage(dataUrl, maxWidth = 800, maxHeight = 600, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      // maintain aspect ratio
      if (w > h) {
        if (w > maxWidth) { h *= maxWidth / w; w = maxWidth; }
      } else {
        if (h > maxHeight) { w *= maxHeight / h; h = maxHeight; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

function log(msg){
  const time = new Date().toISOString();
  logOutput.textContent = `[${time}] ${msg}\n` + logOutput.textContent;
}

async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio:false });
    video.srcObject = stream;
    await video.play();
    log('Camera started');
  } catch(err){
    log('Camera error: ' + err.message);
  }
}

function captureCanvasForOrientation(destCanvas){
  const ctx = destCanvas.getContext('2d');
  const w = video.videoWidth;
  const h = video.videoHeight;
  const orientation = orientationEl.value;
  if(orientation === 'landscape'){
    destCanvas.width = Math.max(w,h);
    destCanvas.height = Math.min(w,h);
  } else {
    destCanvas.width = Math.min(w,h);
    destCanvas.height = Math.max(w,h);
  }
  ctx.drawImage(video, 0, 0, destCanvas.width, destCanvas.height);
}

snapFrontBtn.addEventListener('click', async ()=>{
  captureCanvasForOrientation(canvasFront);
  const raw = canvasFront.toDataURL('image/jpeg', 0.9);
  frontDataUrl = await compressImage(raw, 800, 600, 0.7);
  log('Captured & compressed front image');
});

snapBackBtn.addEventListener('click', async ()=>{
  captureCanvasForOrientation(canvasBack);
  const raw = canvasBack.toDataURL('image/jpeg', 0.9);
  backDataUrl = await compressImage(raw, 800, 600, 0.7);
  log('Captured & compressed back image');
});

async function runOCR(dataUrl, outEl){
  if(!dataUrl) { log('No image to OCR'); return; }
  outEl.value = 'Recognizing...';
  try{
    const worker = Tesseract.createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const res = await worker.recognize(dataUrl);
    await worker.terminate();
    outEl.value = res.data.text;
    log('OCR complete');
    return res.data.text;
  } catch(err){
    outEl.value = '';
    log('OCR error: ' + err.message);
    return '';
  }
}

ocrFrontBtn.addEventListener('click', async ()=>{
  const text = await runOCR(frontDataUrl, ocrFrontText);
  tryAutoFillFromOCR(text);
});
ocrBackBtn.addEventListener('click', async ()=>{
  await runOCR(backDataUrl, ocrBackText);
});

function tryAutoFillFromOCR(text){
  if(!text) return;
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if(lines.length>0){
    const nameParts = lines[0].split(' ');
    firstNameEl.value = nameParts.shift() || '';
    lastNameEl.value = nameParts.join(' ') || '';
  }
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if(emailMatch) emailEl.value = emailMatch[0];
  const phoneMatch = text.match(/(\+?\d[\d \-()]{6,}\d)/);
  if(phoneMatch) phoneEl.value = phoneMatch[0];
  const websiteMatch = text.match(/https?:\/\/[^\s]+/i) || text.match(/www\.[^\s]+/i);
  if(websiteMatch) log('Found website: ' + websiteMatch[0]);
  if(lines[1]) companyEl.value = lines[1];
}

addProductBtn.addEventListener('click', ()=>{
  const name = productNameEl.value.trim();
  const price = productPriceEl.value.trim();
  if(!name) return;
  products.push({name, price});
  renderProducts();
  productNameEl.value=''; productPriceEl.value='';
});

function renderProducts(){
  productsList.innerHTML='';
  products.forEach((p, i)=>{
    const div = document.createElement('div');
    div.className='product-item';
    div.innerHTML = `<span>${p.name} — ${p.price}</span> <button data-i="${i}">Remove</button>`;
    div.querySelector('button').addEventListener('click', ()=>{
      products.splice(i,1); renderProducts();
    });
    productsList.appendChild(div);
  });
}

function makeId(){
  return 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2,9);
}

saveContactBtn.addEventListener('click', async ()=>{
  const apiBase = (apiBaseEl.value || '').replace(/\/+$/,'');
  if(!apiBase){ alert('Set API base URL'); return; }
  const name = `${firstNameEl.value||''} ${lastNameEl.value||''}`.trim() || 'unknown';
  const contact = {
    id: makeId(),
    userId: 'default',
    firstName: firstNameEl.value || null,
    lastName: lastNameEl.value || null,
    title: titleEl.value || null,
    company: companyEl.value || null,
    emails: emailEl.value ? [emailEl.value] : null,
    phones: phoneEl.value ? [phoneEl.value] : null,
    website: null,
    address: null,
    services: null,
    products: products.length? products : null,
    socialLinks: null,
    notes: null,
    category: categoryEl.value || null,
    tags: tagsEl.value ? tagsEl.value.split(',').map(t=>t.trim()).filter(Boolean) : null,
    scannedAt: new Date().toISOString(),
    frontImage: frontDataUrl ? JSON.stringify({ name: (name.replace(/\s+/g,'_') + '_front.jpg'), data: frontDataUrl }) : null,
    backImage: backDataUrl ? JSON.stringify({ name: (name.replace(/\s+/g,'_') + '_back.jpg'), data: backDataUrl }) : null,
    confidenceScores: null
  };

  log('Saving contact to ' + apiBase + '/contacts');
  try{
    const token = localStorage.getItem('qba_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(apiBase + '/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify(contact)
    });
    const body = await res.text();
    log('Save response: ' + res.status + ' - ' + body);
    if(res.ok) alert('Contact saved');
  } catch(err){
    log('Save error: ' + err.message);
    alert('Save failed: ' + err.message);
  }
});

async function login() {
  const apiBase = (apiBaseEl.value || '').replace(/\/+$/,'');
  if(!apiBase){ alert('Set API base URL'); return; }
  const username = loginUsernameEl.value.trim();
  const password = loginPasswordEl.value;
  if(!username || !password) return alert('username and password');
  try{
    const res = await fetch(apiBase + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if(!res.ok) throw new Error('Login failed');
    const body = await res.json();
    localStorage.setItem('qba_token', body.token);
    authStatusEl.textContent = 'Authenticated';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    log('Login successful');
  } catch(err){
    log('Login error: ' + err.message);
    alert('Login failed');
  }
}

function logout(){
  localStorage.removeItem('qba_token');
  authStatusEl.textContent = '';
  loginBtn.style.display = 'inline-block';
  logoutBtn.style.display = 'none';
  log('Logged out');
}

loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', logout);

if(localStorage.getItem('qba_token')){
  authStatusEl.textContent = 'Authenticated';
  loginBtn.style.display = 'none';
  logoutBtn.style.display = 'inline-block';
}

startCamera();
renderProducts();
