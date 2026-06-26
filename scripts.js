/* ══════════════════════════════════════════
   1. HERO PARALLAX — blur + fade al hacer scroll
══════════════════════════════════════════ */
(function initHeroParallax() {
  if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const inner = document.getElementById('hero-inner');
  if (!inner) return;

  globalThis.addEventListener('scroll', function () {
    const y        = globalThis.scrollY;
    const progress = Math.min(y / 500, 1);
    inner.style.opacity   = (1 - progress * 0.9).toFixed(3);
    inner.style.filter    = 'blur(' + (progress * 7).toFixed(1) + 'px)';
    inner.style.transform = 'translateY(' + (y * 0.12).toFixed(1) + 'px)';
  }, { passive: true });
})();

/* ══════════════════════════════════════════
   2. REVEAL OBSERVER — fade-up al entrar en viewport
══════════════════════════════════════════ */
(function initAnims() {
  var els = document.querySelectorAll('[data-anim]');
  if (!els.length) return;

  var noMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!noMotion) {
    els.forEach(function (el) { el.classList.add('is-waiting'); });
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-waiting');
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  els.forEach(function (el) { obs.observe(el); });
})();

      /* ══════════════════════════════════════════
         3. TYPEWRITER — título del hero
         Lee el texto del nodo, lo borra y lo
         escribe carácter a carácter.
      ══════════════════════════════════════════ */
      (function initTypewriter() {
        const textNode  = document.getElementById('typewriter-text');
        const cursor    = document.getElementById('typewriter-cursor');
      
        if (!textNode || !cursor) return;
      
        // Captura el HTML original (preserva el <br/>)
        const fullHTML = textNode.innerHTML.trim();
      
        // Convierte el HTML en una lista de "tokens":
        // cada token es un carácter normal o la cadena '<br/>'
        function parseTokens(html) {
          const tokens = [];
          let i = 0;
          while (i < html.length) {
            if (html[i] === '<') {
              const close = html.indexOf('>', i);
              tokens.push(html.slice(i, close + 1)); // ej: '<br/>'
              i = close + 1;
            } else {
              tokens.push(html[i]);
              i++;
            }
          }
          return tokens;
        }
      
        const tokens  = parseTokens(fullHTML);
        const DELAY   = 400;   // ms antes de empezar (espera al render)
        const SPEED   = 38;    // ms por carácter (más bajo = más rápido)
      
        // Vacía el contenido visible mientras escribe
        textNode.innerHTML = '';
      
        let index = 0;
      
        function type() {
          if (index < tokens.length) {
            textNode.innerHTML += tokens[index];
            index++;
            setTimeout(type, SPEED);
          } else {
            // Termina: quita el parpadeo del cursor
            cursor.classList.add('is-done');
          }
        }
      
        setTimeout(type, DELAY);
      })();

      /* ══════════════════════════════════════════
   4. CONTADORES ANIMADOS — requestAnimationFrame
   Se activan una sola vez al entrar al viewport.
══════════════════════════════════════════ */
(function initCounters() {

  // Formatea el número final según el tipo de contador
  function formatValue(value, format, isFinished) {
    const rounded = Math.round(value);

    if (format === 'year') {
      return rounded.toString();
    }

    if (format === 'plus') {
      // El "+" solo aparece al terminar para que no se vea raro subiendo
      const prefix = isFinished ? '+' : '';
      return prefix + rounded.toLocaleString('es-PE');
    }

    return rounded.toLocaleString('es-PE');
  }

  // Easing: empieza rápido, desacelera al final
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCounter(el) {
    const from     = parseFloat(el.dataset.from)     || 0;
    const to       = parseFloat(el.dataset.to)       || 0;
    const duration = parseFloat(el.dataset.duration) || 1500;
    const format   = el.dataset.format               || 'default';

    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;

      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);   // 0 → 1
      const eased    = easeOutQuart(progress);
      const current  = from + (to - from) * eased;
      const finished = progress === 1;

      el.textContent = formatValue(current, format, finished);

      if (!finished) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // IntersectionObserver: dispara cada contador una sola vez
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target); // solo la primera vez
        }
      });
    },
    {
      threshold: 0.5, // el elemento debe estar 50% visible para arrancar
    }
  );

  document.querySelectorAll('[data-counter]').forEach((el) => {
    counterObserver.observe(el);
  });

})();

/* ══════════════════════════════════════════
   5. FORMULARIO — fetch() + Formspree
══════════════════════════════════════════ */
(function initForm() {
  const form       = document.getElementById('contact-form');
  const successBox = document.getElementById('form-success');
  const errorMsg   = document.getElementById('form-error');
  const submitBtn  = document.getElementById('submit-btn');

  if (!form) return;

  // Valida un campo y muestra/oculta su error
  function validateField(name, value) {
    const errorEl = form.querySelector(`[data-error="${name}"]`);
    const isEmpty = value.trim() === '';
    if (errorEl) errorEl.classList.toggle('hidden', !isEmpty);
    return !isEmpty;
  }

  // Valida todo el formulario antes de enviar
  function validateAll() {
    const fields = ['nombre', 'telefono', 'servicio'];
    return fields.every((name) => {
      const el = form.querySelector(`[name="${name}"]`);
      return el ? validateField(name, el.value) : false;
    });
  }

  // Validación en tiempo real al salir de cada campo
  ['nombre', 'telefono', 'servicio'].forEach((name) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el) {
      el.addEventListener('blur', () => validateField(name, el.value));
      el.addEventListener('input', () => validateField(name, el.value));
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Valida antes de enviar
    if (!validateAll()) return;

    // Estado: enviando
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Enviando...';
    errorMsg.classList.add('hidden');

    try {
      const response = await fetch('https://formspree.io/f/mqadojpp', {
        method:  'POST',
        headers: { 'Accept': 'application/json' },
        body:    new FormData(form),
      });

      if (response.ok) {
        // Éxito: oculta el form, muestra confirmación
        form.classList.add('hidden');
        successBox.classList.remove('hidden');
        successBox.classList.add('flex');
      } else {
        throw new Error('Server error');
      }

    } catch {
      // Error de red o servidor
      errorMsg.classList.remove('hidden');
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Reservar ahora';
    }
  });

})();

/* ══════════════════════════════════════════
   6. MENÚ HAMBURGUESA
══════════════════════════════════════════ */
(function initMobileMenu() {
  const toggle  = document.getElementById('menu-toggle');
  const menu    = document.getElementById('mobile-menu');
  const bars    = toggle.querySelectorAll('.menu-bar');

  if (!toggle || !menu) return;

  let isOpen = false;

  function openMenu() {
    isOpen = true;
    menu.classList.remove('translate-y-[-110%]');
    menu.classList.add('translate-y-0');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    document.body.style.overflow = 'hidden'; // evita scroll de fondo

    // Animación X con las 3 barras
    bars[0].style.transform = 'translateY(7.5px) rotate(45deg)';
    bars[1].style.opacity   = '0';
    bars[2].style.transform = 'translateY(-7.5px) rotate(-45deg)';
  }

  function closeMenu() {
    isOpen = false;
    menu.classList.add('translate-y-[-110%]');
    menu.classList.remove('translate-y-0');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    document.body.style.overflow = '';

    // Restaura las 3 barras
    bars[0].style.transform = '';
    bars[1].style.opacity   = '1';
    bars[2].style.transform = '';
  }

  // Toggle al hacer click en hamburguesa
  toggle.addEventListener('click', () => {
    isOpen ? closeMenu() : openMenu();
  });

  // Cierra al hacer click en cualquier enlace del menú
  menu.querySelectorAll('[data-menu-link]').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Cierra con la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });

})();