'use strict';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 700px)');
const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#navigation');
menuButton.hidden = false;
function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.innerHTML = 'Меню <span aria-hidden="true">+</span>';
}
menuButton.addEventListener('click', () => {
  const opened = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(opened));
  menuButton.innerHTML = `${opened ? 'Закрити' : 'Меню'} <span aria-hidden="true">${opened ? '−' : '+'}</span>`;
});
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menuButton.focus(); } });
mobile.addEventListener('change', closeMenu);

const video = document.querySelector('#hero-video');
const videoToggle = document.querySelector('#video-toggle');
video.muted = true;
video.defaultMuted = true;
video.playsInline = true;
video.autoplay = true;
video.setAttribute('muted', '');
video.setAttribute('playsinline', '');
video.setAttribute('webkit-playsinline', '');
let userPaused = false;
let heroVisible = true;
videoToggle.hidden = false;
function videoLabel() { videoToggle.textContent = video.paused ? 'Відтворити відео' : 'Призупинити відео'; }
function syncVideo() {
  if (document.hidden || !heroVisible || userPaused) video.pause();
  else video.play().catch(() => videoLabel());
}
video.addEventListener('play', videoLabel);
video.addEventListener('pause', videoLabel);
video.addEventListener('error', () => { videoToggle.hidden = true; });
videoToggle.addEventListener('click', () => {
  if (video.paused) { userPaused = false; video.play().catch(() => { videoToggle.textContent = 'Відео недоступне'; }); }
  else { userPaused = true; video.pause(); }
});
new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; syncVideo(); }, {threshold:0}).observe(document.querySelector('.hero'));
document.addEventListener('visibilitychange', syncVideo);
video.addEventListener('loadeddata', syncVideo);
video.addEventListener('canplay', syncVideo);
window.addEventListener('pageshow', syncVideo);
window.addEventListener('load', syncVideo);
[300, 1000, 2500].forEach(delay => setTimeout(() => { if (video.paused) syncVideo(); }, delay));
// Retry from a user gesture when the browser blocks autoplay.
function retryVideoFromGesture(event) {
  if (event.target.closest && event.target.closest('#video-toggle')) return;
  if (video.paused) syncVideo();
}
document.addEventListener('touchstart', retryVideoFromGesture, {passive: true});
document.addEventListener('touchend', retryVideoFromGesture, {passive: true});
document.addEventListener('click', retryVideoFromGesture);
syncVideo();

const layers = [...document.querySelectorAll('[data-parallax]')];
let scrollFrame = 0;
function paintLayers() {
  scrollFrame = 0;
  for (const layer of layers) {
    if (reduceMotion.matches || mobile.matches) { layer.style.transform = ''; continue; }
    const box = layer.parentElement.getBoundingClientRect();
    if (box.bottom < 0 || box.top > innerHeight) continue;
    const movement = Math.max(-160, Math.min(160, -box.top * Number(layer.dataset.parallax)));
    layer.style.transform = `translate3d(0,${movement}px,0)`;
  }
}
function queueLayers() { if (!scrollFrame) scrollFrame = requestAnimationFrame(paintLayers); }
addEventListener('scroll', queueLayers, {passive:true});
addEventListener('resize', queueLayers);
reduceMotion.addEventListener('change', () => { syncVideo(); queueLayers(); });
queueLayers();

const cursor = document.querySelector('.cursor');
const finePointer = matchMedia('(pointer: fine)');
let cx = 0, cy = 0, tx = 0, ty = 0, cursorFrame = 0;
function paintCursor() {
  cx += (tx - cx) * .12; cy += (ty - cy) * .12;
  cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
  if (Math.abs(tx-cx) + Math.abs(ty-cy) > .1) cursorFrame = requestAnimationFrame(paintCursor);
  else cursorFrame = 0;
}
document.addEventListener('pointermove', event => {
  if (!finePointer.matches || reduceMotion.matches || mobile.matches) return;
  tx = event.clientX; ty = event.clientY;
  if (!cursor.classList.contains('visible')) { cx = tx; cy = ty; }
  cursor.classList.add('visible');
  cursor.classList.toggle('active', Boolean(event.target.closest('a,button,summary')));
  if (!cursorFrame) cursorFrame = requestAnimationFrame(paintCursor);
}, {passive:true});
document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));

const form = document.querySelector('#care-form');
const result = document.querySelector('#form-result');
const service = document.querySelector('#service');
form.querySelector('button[type="submit"]').disabled = false;
document.querySelectorAll('[data-service]').forEach(card => card.addEventListener('click', () => {
  service.value = card.dataset.service;
  service.removeAttribute('aria-invalid');
  document.querySelector('#service-error').textContent = '';
  result.hidden = true;
}));
function setError(id, text) {
  const field = document.getElementById(id);
  document.getElementById(`${id}-error`).textContent = text;
  if (text) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
}
form.addEventListener('submit', event => {
  event.preventDefault();
  result.hidden = true;
  const name = document.querySelector('#name').value.trim();
  const phone = document.querySelector('#phone').value.trim();
  const digits = phone.replace(/\D/g, '');
  const errors = {
    name: name ? '' : 'Вкажіть, будь ласка, ваше ім’я.',
    phone: /^[+\d\s()−-]+$/.test(phone) && digits.length >= 10 && digits.length <= 15 ? '' : 'Вкажіть номер телефону: від 10 до 15 цифр.',
    service: service.value ? '' : 'Оберіть послугу зі списку.'
  };
  Object.entries(errors).forEach(([id, text]) => setError(id, text));
  const firstError = Object.keys(errors).find(id => errors[id]);
  if (firstError) { document.getElementById(firstError).focus(); return; }
  result.hidden = false;
  result.scrollIntoView({behavior:reduceMotion.matches ? 'instant' : 'smooth', block:'nearest'});
});
form.addEventListener('input', event => {
  result.hidden = true;
  if (event.target.getAttribute('aria-invalid') === 'true') setError(event.target.id, '');
});
document.querySelector('#year').textContent = new Date().getFullYear();
