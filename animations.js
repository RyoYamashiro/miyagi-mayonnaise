/* One-time entrance animations; content stays visible without JavaScript. */
(function () {
  'use strict';
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;

  var running = new Map();
  var seen = new WeakSet();
  var observer;

  function reveal(element, delay, photo) {
    if (motion.matches || seen.has(element)) return;
    seen.add(element);
    var frames = photo
      ? [{ opacity: 0.65, transform: 'scale(1.045)' }, { opacity: 1, transform: 'scale(1)' }]
      : [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }];
    var animation = element.animate(frames, {
      duration: photo ? 1400 : 850,
      delay: delay || 0,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'backwards'
    });
    running.set(element, animation);
    function cleanup() { running.delete(element); }
    animation.onfinish = cleanup;
    animation.oncancel = cleanup;
  }

  function start() {
    if (motion.matches) return;
    document.querySelectorAll('.hero-copy > *').forEach(function (element, index) {
      reveal(element, index * 85, false);
    });
    var heroPhoto = document.querySelector('.hero-visual > img:not(.hero-seal)');
    if (heroPhoto) reveal(heroPhoto, 0, true);

    observer = new IntersectionObserver(function (entries) {
      var order = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target, Math.min(order++ * 70, 210), false);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(
      '.highlights article, .farm-copy, .egg-story > div, .section-intro, ' +
      '.flavor-content, .flavor > .product-photo, .event > div:first-child, ' +
      '.event-photo, .contact-heading, .contact-form'
    ).forEach(function (element) {
      if (!seen.has(element)) observer.observe(element);
    });
  }

  // Keyboard focus always takes precedence over decorative movement.
  document.addEventListener('focusin', function (event) {
    running.forEach(function (animation, element) {
      if (element.contains(event.target)) animation.cancel();
    });
  });
  motion.addEventListener('change', function () {
    if (observer) observer.disconnect();
    running.forEach(function (animation) { animation.cancel(); });
    running.clear();
    if (!motion.matches) start();
  });
  start();
})();
