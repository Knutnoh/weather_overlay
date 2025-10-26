
(()=> {
  console.log('[weather-overlay] Start');

  if (window.__weatherOverlay) return;
  window.__weatherOverlay = true;

  const path = window.location.pathname.toLowerCase();
  const isDashboard = path.includes('/lovelace') || path.includes('/dashboard');
  if (!isDashboard) return;

  let hassInstance = null;
  const waitForHass = setInterval(() => {
    if (window.hassConnection?.conn?.hass) {
      hassInstance = window.hassConnection.conn.hass;
      clearInterval(waitForHass);
      checkHAState();
    }
  }, 1000);

  async function checkHAState() {
    try {
      const states = await hassInstance.callWS({ type: 'get_states' });
      const entity = states.find(e => e.entity_id === 'input_boolean.dashboardanimation');
      if (!entity || entity.state !== 'on') {
        console.log('[weather-overlay] Deaktiviert über Home Assistant');
        return;
      }
      console.log('[weather-overlay] Aktiviert');
      initWeatherOverlay();
    } catch (e) {
      console.log('[weather-overlay] Kein Zugriff auf input_boolean.dashboardanimation, starte trotzdem');
      initWeatherOverlay();
    }
  }

  function initWeatherOverlay() {
    let c, ctx, w = innerWidth, h = innerHeight;
    const DPR = Math.min(devicePixelRatio || 1, 2);
    let state = 'sun', particles = [], lightning = [], santa = {}, time = 0;

    function initCanvas() {
      c = document.createElement('canvas');
      c.id = 'weatherOverlayCanvas';
      c.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;width:100%;height:100%';

      const container = document.querySelector('hui-view') || document.querySelector('.view') || document.querySelector('ha-panel-lovelace');
      if (container) {
        const style = window.getComputedStyle(container);
        if (style.position === 'static') container.style.position = 'relative';
        container.style.isolation = 'isolate';
        container.insertBefore(c, container.firstChild);
      } else {
        c.style.position = 'fixed';
        c.style.zIndex = '-1';
        document.body.appendChild(c);
      }

      ctx = c.getContext('2d');
      size();
    }

    function size() {
      if (!c) return;
      w = c.parentElement ? c.parentElement.offsetWidth : innerWidth;
      h = c.parentElement ? c.parentElement.offsetHeight : innerHeight;
      c.width = w * DPR;
      c.height = h * DPR;
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    addEventListener('resize', () => { size(); initParticles(); }, { passive: true });

    function isWinter() {
      const d = new Date(), m = d.getMonth(), day = d.getDate();
      return (m === 10 && day >= 15) || m === 11 || m === 0 || (m === 1 && day <= 15);
    }

    function isAutumn() {
      const m = new Date().getMonth();
      return m >= 8 && m <= 9; // September, Oktober
    }

    function isNight() {
      const hour = new Date().getHours();
      return hour < 6 || hour >= 20;
    }

    async function fetchWeather() {
      if (isWinter()) { state = 'snow'; initParticles(); return; }
      try {
        const r = await fetch('https://wttr.in/?format=j1');
        const d = await r.json();
        if (d.current_condition?.[0]) {
          const code = parseInt(d.current_condition[0].weatherCode);
          const night = isNight();

          if (code >= 200 && code <= 232) state = night ? 'thunderstorm-night' : 'thunderstorm';
          else if (code >= 300 && code <= 321) state = night ? 'drizzle-night' : 'drizzle';
          else if (code >= 500 && code <= 531) state = night ? 'rain-night' : 'rain';
          else if (code >= 600 && code <= 622) state = 'snow';
          else if (code >= 611 && code <= 616) state = 'sleet';
          else if (code >= 701 && code <= 781) state = night ? 'fog-night' : 'fog';
          else if (code === 800) state = night ? 'clear-night' : 'sun';
          else if (code === 801) state = night ? 'partly-cloudy-night' : 'partly-cloudy';
          else if (code >= 802 && code <= 804) state = night ? 'cloudy-night' : 'cloudy';
          else state = night ? 'clear-night' : 'sun';
          initParticles();
        }
      } catch {
        state = isNight() ? 'clear-night' : 'sun';
        initParticles();
      }
    }

    function initParticles() {
      particles = [];
      lightning = [];
      santa = {};

      if (isAutumn() && !isNight()) state = 'autumn';

      const now = new Date();
      const m = now.getMonth();
      const d = now.getDate();
      const christmas = (m === 11 && d >= 24 && d <= 26);

      switch (state) {
        case 'snow': case 'sleet': case 'rain': case 'thunderstorm':
        case 'drizzle': case 'fog': case 'cloudy': case 'partly-cloudy':
        case 'sun': case 'clear-night': case 'partly-cloudy-night':
        case 'cloudy-night': case 'fog-night': case 'rain-night':
        case 'thunderstorm-night': case 'drizzle-night':
          generateWeatherParticles(state);
          break;
        case 'autumn':
          generateAutumnParticles();
          break;
      }

      if (christmas) {
        santa = { x: -100, y: h - 60, step: 0, direction: 1 };
        generateWeatherParticles('snow');
      }
    }

    function generateWeatherParticles(state) {
      const base = Math.min((w * h) / 15000, 250);
      if (state.includes('snow')) {
        for (let i = 0; i < base; i++)
          particles.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2, vy: 0.5 + Math.random(), vx: (Math.random() - 0.5) * 0.5, type: 'snow' });
      } else if (state.includes('rain')) {
        for (let i = 0; i < base * 1.2; i++)
          particles.push({ x: Math.random() * w, y: Math.random() * h, len: 10 + Math.random() * 20, vy: 8 + Math.random() * 4, vx: -1 + Math.random() * 0.5, type: 'rain' });
      } else if (state.includes('clear-night')) {
        particles.push({ x: w - 120, y: 80, r: 35, type: 'moon' });
        for (let i = 0; i < 100; i++)
          particles.push({ x: Math.random() * w, y: Math.random() * (h * 0.6), r: 0.5 + Math.random() * 1.5, type: 'star', twinkle: Math.random() * Math.PI * 2, twinkleSpeed: 0.02 + Math.random() * 0.03 });
      } else if (state.includes('sun')) {
        particles.push({ x: w - 100, y: 100, r: 40, type: 'sun' });
      } else if (state.includes('fog')) {
        for (let i = 0; i < 5; i++)
          particles.push({ x: -100, y: 100 + i * 80, width: w + 200, height: 60 + Math.random() * 40, vx: 0.1 + Math.random() * 0.2, type: 'fog', opacity: 0.15 + Math.random() * 0.15 });
      } else if (state.includes('cloudy')) {
        for (let i = 0; i < 6; i++)
          particles.push({ x: Math.random() * w, y: 50 + Math.random() * 100, size: 60 + Math.random() * 40, vx: 0.2 + Math.random() * 0.3, type: 'cloud' });
      }
    }

    function generateAutumnParticles() {
      const count = Math.min((w * h) / 12000, 150);
      for (let i = 0; i < count; i++)
        particles.push({ x: Math.random() * w, y: Math.random() * h, size: 5 + Math.random() * 10, vy: 1 + Math.random() * 1.5, vx: (Math.random() - 0.5) * 1.2, rot: Math.random() * Math.PI * 2, color: randomLeafColor(), type: 'leaf' });
    }

    function randomLeafColor() {
      const colors = ['#d2691e', '#cd853f', '#deb887', '#b22222', '#ff8c00'];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function createLightning() {
      if (state.includes('thunderstorm') && Math.random() < 0.003) {
        const startX = Math.random() * w;
        const segments = [];
        let x = startX, y = 0;
        while (y < h) {
          const nextY = y + 20 + Math.random() * 40;
          const nextX = x + (Math.random() - 0.5) * 60;
          segments.push({ x1: x, y1: y, x2: nextX, y2: nextY });
          x = nextX;
          y = nextY;
        }
        lightning.push({ segments: segments, life: 15, opacity: 0.8 + Math.random() * 0.2 });
      }
    }

    function drawSanta() {
      if (!santa.x) return;
      santa.x += 2 * santa.direction;
      santa.step += 0.1;
      if (santa.x > w + 100) santa.x = -100;
      const legSwing = Math.sin(santa.step) * 5;
      const armSwing = Math.cos(santa.step) * 5;

      ctx.fillStyle = '#b22222';
      ctx.beginPath();
      ctx.ellipse(santa.x, santa.y - 30, 15, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffe0bd';
      ctx.beginPath();
      ctx.arc(santa.x, santa.y - 55, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.moveTo(santa.x - 10, santa.y - 60);
      ctx.lineTo(santa.x + 12, santa.y - 70);
      ctx.lineTo(santa.x - 10, santa.y - 50);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(santa.x + 12, santa.y - 70, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#8b0000';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(santa.x, santa.y - 40);
      ctx.lineTo(santa.x + 10, santa.y - 40 + armSwing);
      ctx.moveTo(santa.x, santa.y - 15);
      ctx.lineTo(santa.x + 8, santa.y - 5 + legSwing);
      ctx.stroke();
    }

    (function loop() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      createLightning();
      for (let bolt of lightning) {
        ctx.strokeStyle = `rgba(255,255,200,${bolt.opacity})`;
        ctx.lineWidth = 2 + Math.random() * 2;
        for (let seg of bolt.segments) {
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }
        bolt.life--;
      }
      lightning = lightning.filter(b => b.life > 0);

      for (const p of particles) {
        switch (p.type) {
          case 'snow':
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            p.y += p.vy;
            p.x += p.vx + Math.sin(p.y * 0.01) * 0.3;
            if (p.y > h + 5) { p.y = -5; p.x = Math.random() * w; }
            break;
          case 'rain':
            ctx.strokeStyle = 'rgba(174,194,224,0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 2, p.y + p.len);
            ctx.stroke();
            p.y += p.vy;
            p.x += p.vx;
            if (p.y > h) { p.y = -10; p.x = Math.random() * w; }
            break;
          case 'leaf':
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            p.y += p.vy;
            p.x += p.vx + Math.sin(time + p.y * 0.01) * 0.5;
            p.rot += 0.02;
            if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
            break;
          case 'moon':
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, 'rgba(240,240,255,0.9)');
            g.addColorStop(1, 'rgba(200,200,230,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'star':
            p.twinkle += p.twinkleSpeed;
            const b = 0.5 + Math.sin(p.twinkle) * 0.5;
            ctx.fillStyle = `rgba(255,255,255,${b})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'sun':
            const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g2.addColorStop(0, 'rgba(255,255,150,0.9)');
            g2.addColorStop(1, 'rgba(255,200,80,0)');
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'cloud':
            ctx.fillStyle = 'rgba(200,200,220,0.6)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.arc(p.x + p.size * 0.4, p.y, p.size * 0.4, 0, Math.PI * 2);
            ctx.arc(p.x - p.size * 0.4, p.y, p.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.vx;
            if (p.x > w + p.size) p.x = -p.size;
            break;
          case 'fog':
            p.x += p.vx;
            if (p.x > w + 100) p.x = -200;
            const g3 = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
            g3.addColorStop(0, 'rgba(200,200,220,0)');
            g3.addColorStop(0.5, `rgba(200,200,220,${p.opacity})`);
            g3.addColorStop(1, 'rgba(200,200,220,0)');
            ctx.fillStyle = g3;
            ctx.fillRect(p.x, p.y, p.width, p.height);
            break;
        }
      }

      drawSanta();
      requestAnimationFrame(loop);
    })();

    setTimeout(() => {
      initCanvas();
      initParticles();
      fetchWeather();
    }, 200);

    setInterval(fetchWeather, 600000);
  }
})();
