/* ===== Reefscape — Interactions ===== */
'use strict';

/* ---------- 1. Underwater Canvas Animation ---------- */
const canvas = document.getElementById('ocean');
const ctx = canvas.getContext('2d');
let W, H;
let bubbles = [];
let fish = [];
let lightRays = [];

function resize(){
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function makeBubble(){
  return {
    x: Math.random()*W,
    y: H + 20 + Math.random()*H,
    r: 1 + Math.random()*4,
    speed: 0.3 + Math.random()*1.2,
    drift: (Math.random()-0.5)*0.4,
    wobble: Math.random()*Math.PI*2
  };
}
function makeFish(){
  const colors = ['#ff6b6b','#ffd166','#2dd4bf','#22d3ee','#f472b6','#a78bfa'];
  return {
    x: Math.random()*W,
    y: 100 + Math.random()*(H-200),
    size: 6 + Math.random()*10,
    speed: 0.3 + Math.random()*0.9,
    dir: Math.random() > 0.5 ? 1 : -1,
    color: colors[Math.floor(Math.random()*colors.length)],
    phase: Math.random()*Math.PI*2
  };
}
function makeRay(){
  return {
    x: Math.random()*W,
    w: 40 + Math.random()*80,
    speed: 0.02 + Math.random()*0.03,
    phase: Math.random()*Math.PI*2
  };
}

for(let i=0;i<60;i++) bubbles.push(makeBubble());
for(let i=0;i<14;i++) fish.push(makeFish());
for(let i=0;i<5;i++) lightRays.push(makeRay());

function drawOcean(t){
  // deep gradient background
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#02121f');
  g.addColorStop(0.5,'#04283f');
  g.addColorStop(1,'#063a52');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // light rays
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  lightRays.forEach(r=>{
    const sway = Math.sin(t*r.speed + r.phase)*30;
    const grad = ctx.createLinearGradient(r.x,0,r.x+sway,H);
    grad.addColorStop(0,'rgba(34,211,238,0.10)');
    grad.addColorStop(1,'rgba(34,211,238,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(r.x - r.w/2, 0);
    ctx.lineTo(r.x + r.w/2, 0);
    ctx.lineTo(r.x + r.w/2 + sway, H);
    ctx.lineTo(r.x - r.w/2 + sway, H);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  // bubbles
  bubbles.forEach(b=>{
    b.y -= b.speed;
    b.wobble += 0.03;
    b.x += b.drift + Math.sin(b.wobble)*0.3;
    if(b.y < -20){ Object.assign(b, makeBubble()); b.y = H+20; }
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(230,246,255,0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,246,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // fish
  fish.forEach(f=>{
    f.x += f.speed * f.dir;
    f.phase += 0.05;
    if(f.x > W+40) f.x = -40;
    if(f.x < -40) f.x = W+40;
    const y = f.y + Math.sin(f.phase)*4;
    ctx.save();
    ctx.translate(f.x, y);
    ctx.scale(f.dir, 1);
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.ellipse(0,0,f.size,f.size*0.5,0,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(f.size,0);
    ctx.lineTo(f.size+f.size*0.7,-f.size*0.5);
    ctx.lineTo(f.size+f.size*0.7,f.size*0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#02121f';
    ctx.beginPath();
    ctx.arc(f.size*0.4,-f.size*0.15,f.size*0.12,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
}

function animate(t){
  drawOcean(t);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

/* ---------- 2. Ambient Sound (Web Audio) ---------- */
let audioCtx = null;
let soundOn = false;
const soundBtn = document.getElementById('soundToggle');

function playTone(freq, dur, type, vol){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + dur);
}

function toggleSound(){
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  soundOn = !soundOn;
  soundBtn.classList.toggle('muted', !soundOn);
  if(soundOn){
    audioCtx.resume();
    // gentle ambient chime loop
    const loop = () => {
      if(!soundOn) return;
      playTone(523.25, 1.2, 'sine', 0.05);
      setTimeout(()=>{ if(soundOn) playTone(659.25, 1.4, 'sine', 0.04); }, 400);
      setTimeout(loop, 2600);
    };
    loop();
    playTone(392, 0.3, 'triangle', 0.08);
  }
}
soundBtn.addEventListener('click', toggleSound);
document.querySelectorAll('.sound-btn').forEach(b=>b.addEventListener('click', toggleSound));

/* ---------- 3. Species cards play a sound ---------- */
document.querySelectorAll('.species-card').forEach(card=>{
  card.addEventListener('click', ()=>{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    audioCtx.resume();
    const kind = card.dataset.sound;
    const map = {
      clown:[880,660], turtle:[330,440], ray:[110,165],
      coral:[523,784], anemone:[440,523], parrot:[660,880]
    };
    const [a,b] = map[kind] || [440,660];
    playTone(a, 0.25, 'triangle', 0.12);
    setTimeout(()=>playTone(b, 0.3, 'triangle', 0.1), 120);
    // little pop animation
    card.style.transform = 'scale(0.96)';
    setTimeout(()=>card.style.transform='', 150);
  });
});

/* ---------- 4. Threat bars animate on scroll ---------- */
const barObserver = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const fill = e.target;
      fill.style.width = fill.dataset.w + '%';
      barObserver.unobserve(fill);
    }
  });
},{threshold:0.4});
document.querySelectorAll('.bar-fill').forEach(f=>barObserver.observe(f));

/* ---------- 5. Reveal on scroll ---------- */
const revealObserver = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
  });
},{threshold:0.15});
document.querySelectorAll('.card,.species-card,.threat,.title,.lead,.eyebrow').forEach(el=>{
  el.classList.add('reveal');
  revealObserver.observe(el);
});

/* ---------- 6. Nav background on scroll ---------- */
window.addEventListener('scroll', ()=>{
  document.querySelector('.nav').classList.toggle('scrolled', window.scrollY > 40);
});

/* ---------- 7. Pledge form ---------- */
const form = document.getElementById('pledgeForm');
const msg = document.getElementById('pledgeMsg');
const countEl = document.getElementById('pledgeCount');
let pledgeCount = parseInt(localStorage.getItem('reefPledges')||'0',10);
countEl.textContent = pledgeCount.toLocaleString();

form.addEventListener('submit', e=>{
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  pledgeCount += 1;
  localStorage.setItem('reefPledges', pledgeCount);
  countEl.textContent = pledgeCount.toLocaleString();
  msg.hidden = false;
  msg.textContent = 'Thank you, ' + (name || 'friend') + '! 🌊 Your pledge helps protect the reefs.';
  form.reset();
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  audioCtx.resume();
  playTone(523,0.2,'sine',0.1);
  setTimeout(()=>playTone(659,0.2,'sine',0.1),120);
  setTimeout(()=>playTone(784,0.4,'sine',0.1),240);
  setTimeout(()=>{ msg.scrollIntoView({behavior:'smooth',block:'center'}); }, 200);
});

/* ---------- 8. Wire .btn click handlers (play a soft click) ---------- */
document.querySelectorAll('.btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    audioCtx.resume();
    playTone(660, 0.12, 'triangle', 0.08);
  });
});
