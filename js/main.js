/* =================================================================
   HUMMUS VILLAGE — V2 main.js
   Three.js r128 + GSAP 3.12 + Vanilla
   ================================================================= */
(function () {
  'use strict';

  const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HAS_GSAP = () => typeof gsap !== 'undefined';
  const HAS_ST   = () => typeof ScrollTrigger !== 'undefined';
  const HAS_THREE = () => typeof THREE !== 'undefined';

  function setupGsap() {
    if (!HAS_GSAP() || !HAS_ST()) return;
    gsap.registerPlugin(ScrollTrigger);
    if (PREFERS_REDUCED) gsap.config({ nullTargetWarn: false });
    ScrollTrigger.defaults({ start: 'top 82%', toggleActions: 'play none none none' });
  }

  const COLORS = {
    cream:   0xFAF6EE,
    pale:    0xF2EBD9,
    gold:    0xD4A017,
    coral:   0xE85C3A,
    olive:   0x6B7C3A,
    brown:   0x2C1A0E,
    tanMuted:0xE8DCC8,
    leafGreen:0x7B8C45,
  };

  /* ---------- Toon gradient map ---------- */
  let GRADIENT_MAP = null;
  function getGradientMap() {
    if (!HAS_THREE()) return null;
    if (GRADIENT_MAP) return GRADIENT_MAP;
    const c = document.createElement('canvas');
    c.width = 4; c.height = 1;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 4, 0);
    g.addColorStop(0, '#444');
    g.addColorStop(0.4, '#8a8a8a');
    g.addColorStop(0.7, '#cfcfcf');
    g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 1);
    GRADIENT_MAP = new THREE.CanvasTexture(c);
    GRADIENT_MAP.minFilter = THREE.NearestFilter;
    GRADIENT_MAP.magFilter = THREE.NearestFilter;
    return GRADIENT_MAP;
  }

  function toonMat(color) {
    return new THREE.MeshToonMaterial({ color: color, gradientMap: getGradientMap() });
  }

  /* ---------- Three.js scene manager ---------- */
  const scenes = [];
  let mouseNX = 0, mouseNY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseNX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseNY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function createScene(canvas, opts) {
    if (!HAS_THREE() || !canvas) return null;
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || 400;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(opts.fov || 35, w / h, 0.1, 100);
    camera.position.set(0, 0, opts.cameraZ || 5);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);

    // Lights
    const amb = new THREE.AmbientLight(0xfff5e0, 0.6);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xffd580, 1.0);
    key.position.set(3, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xE85C3A, 0.3);
    fill.position.set(-4, 1, 2);
    scene.add(fill);

    const group = new THREE.Group();
    scene.add(group);

    const sceneObj = {
      canvas, renderer, scene, camera, group,
      visible: false,
      build: opts.build,
      tick: opts.tick,
      time: 0,
      reactive: opts.reactive !== false, // mouse parallax on by default
      onResize: opts.onResize,
    };
    if (opts.build) opts.build(sceneObj);

    // Resize handling
    function resize() {
      const ww = canvas.clientWidth || canvas.parentElement.clientWidth || 400;
      const hh = canvas.clientHeight || canvas.parentElement.clientHeight || 400;
      renderer.setSize(ww, hh, false);
      camera.aspect = ww / hh;
      camera.updateProjectionMatrix();
      if (sceneObj.onResize) sceneObj.onResize(sceneObj);
    }
    sceneObj.resize = resize;
    window.addEventListener('resize', resize, { passive: true });

    // Visibility tracking
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { sceneObj.visible = e.isIntersecting; });
      }, { threshold: 0.05 });
      io.observe(canvas);
    } else {
      sceneObj.visible = true;
    }

    scenes.push(sceneObj);
    return sceneObj;
  }

  function tickAll() {
    requestAnimationFrame(tickAll);
    for (const s of scenes) {
      if (!s.visible) continue;
      s.time += 0.016;
      if (s.tick) s.tick(s);
      // Generic mouse parallax
      if (s.reactive && !PREFERS_REDUCED) {
        s.group.rotation.y += (mouseNX * 0.18 - s.group.rotation.y) * 0.05;
        s.group.rotation.x += (-mouseNY * 0.12 - s.group.rotation.x) * 0.05;
      }
      s.renderer.render(s.scene, s.camera);
    }
  }

  /* ---------- Hero hummus bowl scene ---------- */
  function buildHeroBowl(s) {
    const g = s.group;
    // Tilt camera down to look into the bowl
    s.camera.position.set(0, 1.6, 4.2);
    s.camera.lookAt(0, 0, 0);

    // Bowl body — bottom half of a sphere, dome-side down so opening faces up
    const bowlGeo = new THREE.SphereGeometry(1.4, 48, 32, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
    const bowl = new THREE.Mesh(bowlGeo, toonMat(COLORS.coral));
    bowl.position.y = -0.05;
    g.add(bowl);

    // Bowl rim — torus at the top opening
    const rimGeo = new THREE.TorusGeometry(1.4, 0.07, 16, 80);
    const rim = new THREE.Mesh(rimGeo, toonMat(COLORS.coral));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.05;
    g.add(rim);

    // Hummus surface — slightly bumpy circle, visible inside the bowl
    const hummusGeo = new THREE.CircleGeometry(1.32, 64);
    const pos = hummusGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const r = Math.sqrt(x*x + y*y);
      if (r > 0.05) {
        pos.setZ(i, Math.sin(x * 5) * 0.04 + Math.cos(y * 4) * 0.03);
      }
    }
    pos.needsUpdate = true;
    hummusGeo.computeVertexNormals();
    const hummus = new THREE.Mesh(hummusGeo, toonMat(COLORS.cream));
    hummus.rotation.x = -Math.PI / 2;
    hummus.position.y = -0.08;
    g.add(hummus);

    // Inner well — slightly darker hummus
    const wellGeo = new THREE.CircleGeometry(0.55, 32);
    const well = new THREE.Mesh(wellGeo, toonMat(0xEDD89B));
    well.rotation.x = -Math.PI / 2;
    well.position.y = -0.06;
    g.add(well);

    // Olive oil torus arc — hovering on the hummus surface
    const oilGeo = new THREE.TorusGeometry(0.42, 0.045, 8, 32, Math.PI * 1.4);
    const oil = new THREE.Mesh(oilGeo, toonMat(COLORS.gold));
    oil.rotation.x = -Math.PI / 2;
    oil.position.y = -0.04;
    g.add(oil);

    // Three chickpeas with orbital paths above bowl
    const chickpeas = [];
    for (let i = 0; i < 3; i++) {
      const cGeo = new THREE.SphereGeometry(0.13, 16, 12);
      cGeo.scale(1, 0.85, 1);
      const c = new THREE.Mesh(cGeo, toonMat(COLORS.tanMuted));
      g.add(c);
      chickpeas.push({
        mesh: c,
        radius: 1.6 + i * 0.15,
        speed: 0.4 + i * 0.15,
        phase: i * 2.1,
        tilt: i * 0.4,
      });
    }
    s._chickpeas = chickpeas;

    // Floating leaves
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(0.15, 0.05, 0.28, 0.18, 0.32, 0.42);
    leafShape.bezierCurveTo(0.18, 0.35, 0.05, 0.22, 0, 0);
    const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.04, bevelEnabled: false, steps: 1 });
    leafGeo.center();
    const leafMat = toonMat(COLORS.leafGreen);
    const leaves = [];
    const leafPositions = [
      [0.7, 0.45, 0.5], [-0.5, 0.55, 0.6], [0.2, 0.5, 0.9]
    ];
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.scale.setScalar(1.2);
      leaf.position.set(leafPositions[i][0], leafPositions[i][1], leafPositions[i][2]);
      leaf.rotation.z = Math.random() * Math.PI;
      leaf.rotation.x = -0.3;
      g.add(leaf);
      leaves.push({ mesh: leaf, baseY: leaf.position.y, phase: i * 1.7 });
    }
    s._leaves = leaves;

    g.scale.setScalar(0.95);

    s.tick = (s) => {
      const t = s.time;
      // Slow rotation around vertical axis
      g.rotation.y = Math.sin(t * 0.15) * 0.08;
      // Chickpeas orbit
      for (let i = 0; i < s._chickpeas.length; i++) {
        const cp = s._chickpeas[i];
        const a = t * cp.speed + cp.phase;
        cp.mesh.position.x = Math.cos(a) * cp.radius * 0.6;
        cp.mesh.position.z = Math.sin(a) * cp.radius * 0.6 * Math.cos(cp.tilt);
        cp.mesh.position.y = 0.3 + Math.sin(a * 1.3) * 0.25;
      }
      // Leaves bob
      for (let i = 0; i < s._leaves.length; i++) {
        const lf = s._leaves[i];
        lf.mesh.position.y = lf.baseY + Math.sin(t * 1.2 + lf.phase) * 0.08;
        lf.mesh.rotation.z += 0.003;
      }
    };
  }

  /* ---------- Menu hero — three floating ingredients ---------- */
  function buildMenuHero(s) {
    const g = s.group;
    // Chickpea cluster
    for (let i = 0; i < 5; i++) {
      const sg = new THREE.SphereGeometry(0.22, 16, 12);
      sg.scale(1, 0.85, 1);
      const m = new THREE.Mesh(sg, toonMat(COLORS.tanMuted));
      const a = (i / 5) * Math.PI * 2;
      m.position.set(Math.cos(a) * 0.4 - 1.4, Math.sin(a) * 0.4, 0);
      g.add(m);
    }
    // Olive
    const oliveGeo = new THREE.SphereGeometry(0.38, 24, 16);
    oliveGeo.scale(0.7, 1, 0.7);
    const olive = new THREE.Mesh(oliveGeo, toonMat(0x4A4030));
    olive.position.set(0.3, 0.1, 0);
    g.add(olive);
    s._olive = olive;

    // Leaf
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(0.25, 0.1, 0.5, 0.35, 0.6, 0.85);
    leafShape.bezierCurveTo(0.32, 0.7, 0.1, 0.4, 0, 0);
    const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.06, bevelEnabled: false });
    leafGeo.center();
    const leaf = new THREE.Mesh(leafGeo, toonMat(COLORS.olive));
    leaf.position.set(1.5, 0.4, 0);
    leaf.scale.setScalar(1.3);
    leaf.rotation.z = -0.3;
    g.add(leaf);
    s._leaf = leaf;

    s.tick = (s) => {
      const t = s.time;
      g.rotation.y = Math.sin(t * 0.3) * 0.3;
      if (s._olive) s._olive.rotation.y += 0.01;
      if (s._leaf) {
        s._leaf.rotation.z = -0.3 + Math.sin(t * 0.8) * 0.15;
        s._leaf.position.y = 0.4 + Math.sin(t * 1.2) * 0.1;
      }
    };
  }

  /* ---------- Mini plate (menu page sticky col) ---------- */
  function buildMiniPlate(s) {
    const g = s.group;
    const plateGeo = new THREE.CylinderGeometry(1.1, 1.05, 0.18, 48);
    const plate = new THREE.Mesh(plateGeo, toonMat(COLORS.cream));
    g.add(plate);
    const rimGeo = new THREE.TorusGeometry(1.1, 0.04, 12, 60);
    const rim = new THREE.Mesh(rimGeo, toonMat(COLORS.coral));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.09;
    g.add(rim);

    // oil arc
    const oilGeo = new THREE.TorusGeometry(0.38, 0.04, 8, 32, Math.PI * 1.3);
    const oil = new THREE.Mesh(oilGeo, toonMat(COLORS.gold));
    oil.rotation.x = -Math.PI / 2;
    oil.position.y = 0.12;
    g.add(oil);

    g.rotation.x = -0.6;
    s.tick = (s) => { g.rotation.y += 0.005; };
  }

  /* ---------- Baklava stack (dessert section accent) ---------- */
  function buildBaklavaStack(s) {
    const g = s.group;
    const layers = [COLORS.gold, COLORS.cream, COLORS.gold, COLORS.cream, COLORS.gold];
    layers.forEach((color, i) => {
      const geo = new THREE.CylinderGeometry(0.85, 0.85, 0.18, 6);
      const m = new THREE.Mesh(geo, toonMat(color));
      m.position.y = i * 0.2 - 0.4;
      m.rotation.y = (i * Math.PI / 6) + 0.1;
      g.add(m);
    });
    g.rotation.x = -0.4;
    g.scale.setScalar(0.85);
    s.tick = (s) => { g.rotation.y += 0.008; };
  }

  /* ---------- About hero — olive branch ---------- */
  function buildOliveBranch(s) {
    const g = s.group;
    // Curved branch via TubeGeometry
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2, -0.8, 0),
      new THREE.Vector3(-1, -0.2, 0.3),
      new THREE.Vector3(0.2, 0.4, 0),
      new THREE.Vector3(1.4, 0.2, -0.2),
      new THREE.Vector3(2.2, -0.4, 0),
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.045, 8);
    const branch = new THREE.Mesh(tubeGeo, toonMat(0x7a5638));
    g.add(branch);

    // Leaves along the curve
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(0.18, 0.08, 0.34, 0.28, 0.42, 0.6);
    leafShape.bezierCurveTo(0.22, 0.5, 0.06, 0.28, 0, 0);
    const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.04, bevelEnabled: false });
    leafGeo.center();
    const leafMat = toonMat(COLORS.olive);

    const leaves = [];
    const positions = [0.05, 0.18, 0.3, 0.42, 0.55, 0.68, 0.82, 0.94];
    positions.forEach((u, i) => {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const p = curve.getPointAt(u);
      leaf.position.copy(p);
      leaf.position.y += 0.05;
      leaf.scale.setScalar(0.5 + Math.random() * 0.2);
      leaf.rotation.z = (i % 2 === 0 ? -1 : 1) * (Math.PI / 4 + Math.random() * 0.4);
      leaf.rotation.x = -0.4;
      g.add(leaf);
      leaves.push({ mesh: leaf, baseY: leaf.position.y, phase: i * 0.7, baseRot: leaf.rotation.z });
    });
    s._leaves = leaves;

    // Olives along curve
    const olivePoses = [0.15, 0.4, 0.6, 0.8];
    olivePoses.forEach((u, i) => {
      const og = new THREE.SphereGeometry(0.1, 12, 10);
      og.scale(0.7, 1, 0.7);
      const om = new THREE.Mesh(og, toonMat(0x4A4030));
      const p = curve.getPointAt(u);
      om.position.copy(p);
      om.position.y -= 0.1;
      g.add(om);
    });

    g.scale.setScalar(0.95);
    s.tick = (s) => {
      const t = s.time;
      for (let i = 0; i < s._leaves.length; i++) {
        const lf = s._leaves[i];
        lf.mesh.position.y = lf.baseY + Math.sin(t * 1.0 + lf.phase) * 0.05;
        lf.mesh.rotation.z = lf.baseRot + Math.sin(t * 0.7 + lf.phase) * 0.08;
      }
    };
  }

  /* ---------- Catering hero — stacked plates ---------- */
  function buildPlateStack(s) {
    const g = s.group;
    const plates = [];
    for (let i = 0; i < 3; i++) {
      const pGeo = new THREE.CylinderGeometry(1.1 - i * 0.05, 1.05 - i * 0.05, 0.16, 40);
      const p = new THREE.Mesh(pGeo, toonMat(COLORS.coral));
      p.position.y = i * 0.22 - 0.3;
      g.add(p);
      // top surface (cream)
      const topGeo = new THREE.CircleGeometry(1.0 - i * 0.05, 40);
      const top = new THREE.Mesh(topGeo, toonMat(COLORS.cream));
      top.rotation.x = -Math.PI / 2;
      top.position.y = i * 0.22 - 0.3 + 0.081;
      g.add(top);

      plates.push({ mesh: p, top: top, baseY: i * 0.22 - 0.3, phase: i * 0.8, exploded: false });
    }
    s._plates = plates;
    g.rotation.x = -0.3;

    // Click/hover to "explode" stack
    let exploded = false;
    s.canvas.addEventListener('mouseenter', () => { exploded = true; });
    s.canvas.addEventListener('mouseleave', () => { exploded = false; });

    s.tick = (s) => {
      const t = s.time;
      g.rotation.y += 0.005;
      for (let i = 0; i < s._plates.length; i++) {
        const pl = s._plates[i];
        const targetY = exploded
          ? pl.baseY + (i - 1) * 0.5 + Math.sin(t * 1.5 + pl.phase) * 0.05
          : pl.baseY + Math.sin(t * 0.8 + pl.phase) * 0.04;
        const targetX = exploded ? (i - 1) * 0.6 : 0;
        pl.mesh.position.y += (targetY - pl.mesh.position.y) * 0.08;
        pl.mesh.position.x += (targetX - pl.mesh.position.x) * 0.08;
        pl.top.position.y = pl.mesh.position.y + 0.081;
        pl.top.position.x = pl.mesh.position.x;
      }
    };
  }

  /* ---------- Contact hero — olive sprig ---------- */
  function buildContactSprig(s) {
    const g = s.group;
    // small curved branch
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.4, -0.4, 0),
      new THREE.Vector3(-0.4, 0.0, 0.2),
      new THREE.Vector3(0.6, 0.3, 0),
      new THREE.Vector3(1.4, -0.1, 0),
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.04, 8);
    g.add(new THREE.Mesh(tubeGeo, toonMat(0x7a5638)));

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(0.16, 0.08, 0.3, 0.28, 0.38, 0.55);
    leafShape.bezierCurveTo(0.2, 0.45, 0.05, 0.26, 0, 0);
    const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.04, bevelEnabled: false });
    leafGeo.center();
    const leafMat = toonMat(COLORS.olive);

    const leafPos = [0.1, 0.25, 0.4, 0.55, 0.75, 0.9];
    s._leaves = [];
    leafPos.forEach((u, i) => {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const p = curve.getPointAt(u);
      leaf.position.copy(p);
      leaf.position.y += 0.04;
      leaf.scale.setScalar(0.5);
      leaf.rotation.z = (i % 2 === 0 ? -1 : 1) * (Math.PI / 4);
      leaf.rotation.x = -0.4;
      g.add(leaf);
      s._leaves.push({ mesh: leaf, baseRot: leaf.rotation.z, phase: i * 0.6 });
    });

    // 2 olives
    [0.3, 0.65].forEach((u, i) => {
      const og = new THREE.SphereGeometry(0.09, 12, 10);
      og.scale(0.7, 1, 0.7);
      const om = new THREE.Mesh(og, toonMat(COLORS.gold));
      const p = curve.getPointAt(u);
      om.position.copy(p);
      om.position.y -= 0.08;
      g.add(om);
    });

    s.tick = (s) => {
      const t = s.time;
      g.rotation.y = Math.sin(t * 0.3) * 0.2;
      for (let i = 0; i < s._leaves.length; i++) {
        s._leaves[i].mesh.rotation.z = s._leaves[i].baseRot + Math.sin(t * 0.8 + s._leaves[i].phase) * 0.1;
      }
    };
  }

  /* ---------- Init Three.js ---------- */
  function initThree() {
    if (!HAS_THREE()) return;

    document.querySelectorAll('[data-three]').forEach(canvas => {
      const kind = canvas.dataset.three;
      const opts = { fov: 35, cameraZ: 5 };
      switch (kind) {
        case 'hero-bowl':       opts.build = buildHeroBowl; opts.cameraZ = 5; break;
        case 'menu-hero':       opts.build = buildMenuHero; opts.cameraZ = 6; break;
        case 'mini-plate':      opts.build = buildMiniPlate; opts.cameraZ = 4; opts.fov = 40; opts.reactive = false; break;
        case 'baklava':         opts.build = buildBaklavaStack; opts.cameraZ = 4; opts.fov = 35; opts.reactive = false; break;
        case 'olive-branch':    opts.build = buildOliveBranch; opts.cameraZ = 5.5; break;
        case 'plate-stack':     opts.build = buildPlateStack; opts.cameraZ = 5; break;
        case 'contact-sprig':   opts.build = buildContactSprig; opts.cameraZ = 4.5; break;
        default: return;
      }
      createScene(canvas, opts);
    });

    if (scenes.length) tickAll();
  }

  /* ---------- Page transition overlay ---------- */
  function initPageTransitions() {
    if (PREFERS_REDUCED || !HAS_GSAP()) return;
    const overlay = document.querySelector('.page-overlay');
    if (!overlay) return;

    // Reveal animation on load (slide overlay out to right)
    gsap.set(overlay, { scaleX: 1, transformOrigin: 'right center' });
    gsap.to(overlay, {
      scaleX: 0,
      duration: 0.45,
      ease: 'power2.out',
      delay: 0.05,
    });

    // Intercept internal links
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      // Only internal .html same-origin links
      if (!/^[^/].*\.html(\?.*)?(#.*)?$|^\/.+\.html$/.test(href) && !/^[a-z]+\.html$/i.test(href)) return;
      // Skip same-page link (current pathname)
      const path = href.split('/').pop().split('?')[0].split('#')[0];
      const current = (window.location.pathname.split('/').pop() || 'index.html');
      if (path === current) return;
      // Skip new-tab links
      if (a.target === '_blank') return;
      e.preventDefault();
      gsap.set(overlay, { transformOrigin: 'left center' });
      gsap.to(overlay, {
        scaleX: 1,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => { window.location.href = href; },
      });
    });
  }

  /* ---------- Nav scroll behavior ---------- */
  function initNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    let ticking = false;
    function update() {
      if (window.scrollY > 60) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- Mobile menu w/ focus trap ---------- */
  function initMobileMenu() {
    const burger = document.querySelector('.nav__burger');
    const menu   = document.querySelector('.mobile-menu');
    if (!burger || !menu) return;

    let lastFocused = null;

    function getFocusable() {
      return menu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    }

    function open() {
      lastFocused = document.activeElement;
      menu.classList.add('is-open');
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      // Focus first link after transition
      setTimeout(() => {
        const list = getFocusable();
        if (list.length) list[0].focus();
      }, 350);
    }
    function close() {
      menu.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }
    function toggle() {
      menu.classList.contains('is-open') ? close() : open();
    }

    burger.addEventListener('click', toggle);

    // Close on link tap
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

    // Focus trap
    document.addEventListener('keydown', (e) => {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        const list = getFocusable();
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });
  }

  /* ---------- Active link detection ---------- */
  function initActiveLink() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link, .mobile-menu__link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- Logo intro animation ---------- */
  function initLogoIntro() {
    if (PREFERS_REDUCED || !HAS_GSAP()) return;
    const logo = document.querySelector('.nav__logo');
    if (!logo) return;
    gsap.from(logo, {
      x: -40, opacity: 0, duration: 0.7, ease: 'elastic.out(1, 0.7)', delay: 0.1,
    });
  }

  /* ---------- Hero entrance choreography ---------- */
  function splitHeroH1() {
    const h1 = document.querySelector('.hero__h1');
    if (!h1) return [];
    if (h1.dataset.split === 'true') return Array.from(h1.querySelectorAll('.char'));
    h1.dataset.split = 'true';

    function splitTextNode(node) {
      const text = node.textContent;
      const frag = document.createDocumentFragment();
      const result = [];
      const words = text.split(/(\s+)/);
      for (const word of words) {
        if (word.match(/^\s+$/)) {
          frag.appendChild(document.createTextNode(word));
        } else if (word.length > 0) {
          const wordSpan = document.createElement('span');
          wordSpan.style.display = 'inline-block';
          wordSpan.style.whiteSpace = 'nowrap';
          for (const ch of word) {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            wordSpan.appendChild(span);
            result.push(span);
          }
          frag.appendChild(wordSpan);
        }
      }
      node.parentNode.replaceChild(frag, node);
      return result;
    }

    const chars = [];
    function walk(el) {
      const kids = Array.from(el.childNodes);
      for (const k of kids) {
        if (k.nodeType === 3) {
          chars.push(...splitTextNode(k));
        } else if (k.nodeType === 1 && k.tagName !== 'BR' && k.tagName !== 'SVG') {
          walk(k);
        }
      }
    }
    walk(h1);
    return chars;
  }

  function initHero() {
    if (!HAS_GSAP()) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const chars = splitHeroH1();

    if (PREFERS_REDUCED) return;

    tl.from('.hero__eyebrow', { opacity: 0, y: 20, duration: 0.7, delay: 0.3 })
      .from(chars, { opacity: 0, y: 30, duration: 0.5, stagger: 0.025 }, '-=0.3')
      .from('.hero__sub', { opacity: 0, y: 20, duration: 0.7 }, '-=0.4')
      .from('.hero__ctas', { opacity: 0, y: 20, duration: 0.65 }, '-=0.4')
      .from('.hero__hours', { opacity: 0, y: 16, duration: 0.5 }, '-=0.4')
      .from('.hero__canvas-wrap', { opacity: 0, scale: 0.92, duration: 1.0, ease: 'power2.out' }, 0.3)
      .from('.hero__doodle', { opacity: 0, scale: 0.6, duration: 0.6, stagger: 0.15, ease: 'back.out(1.6)' }, 0.9);

    // Highlight underline draw-on
    const path = document.querySelector('.hero__highlight-line path');
    if (path && path.getTotalLength) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      tl.to(path, { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut' }, 1.0);
    }

    // Hero olive branch draw
    const branchPaths = document.querySelectorAll('.hero__olive-branch svg [data-draw]');
    branchPaths.forEach(p => {
      if (!p.getTotalLength) return;
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    if (branchPaths.length) {
      tl.to(branchPaths, { strokeDashoffset: 0, duration: 1.4, stagger: 0.05, ease: 'power2.inOut' }, 0.7);
    }
  }

  /* ---------- Scroll reveals ---------- */
  function initScrollReveals() {
    if (!HAS_GSAP() || !HAS_ST()) return;
    if (PREFERS_REDUCED) return;

    document.querySelectorAll('[data-reveal]').forEach(el => {
      gsap.from(el, {
        opacity: 0, y: 48, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    document.querySelectorAll('[data-reveal-children]').forEach(parent => {
      const kids = Array.from(parent.children);
      gsap.from(kids, {
        opacity: 0, y: 40, duration: 0.8, ease: 'power3.out', stagger: 0.14,
        scrollTrigger: { trigger: parent, start: 'top 80%' },
      });
    });
  }

  /* ---------- SVG draw-on-scroll ---------- */
  function initSvgDraw() {
    if (!HAS_GSAP() || !HAS_ST()) return;

    document.querySelectorAll('[data-draw-on-scroll]').forEach(container => {
      const paths = container.querySelectorAll('path, line, polyline, polygon, circle, ellipse');
      const lengths = [];
      paths.forEach(p => {
        if (!p.getTotalLength) { lengths.push(0); return; }
        try {
          const len = p.getTotalLength();
          if (len > 0) {
            p.style.strokeDasharray = len;
            p.style.strokeDashoffset = PREFERS_REDUCED ? 0 : len;
          }
          lengths.push(len);
        } catch (e) { lengths.push(0); }
      });

      if (PREFERS_REDUCED) return;

      ScrollTrigger.create({
        trigger: container,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(paths, {
            strokeDashoffset: 0,
            duration: 1.3,
            stagger: 0.05,
            ease: 'power2.inOut',
          });
        }
      });
    });
  }

  /* ---------- Stat counters ---------- */
  function initCounters() {
    if (!HAS_GSAP() || !HAS_ST()) return;
    document.querySelectorAll('[data-counter]').forEach(el => {
      const target = parseInt(el.dataset.counter, 10);
      if (isNaN(target)) return;
      if (PREFERS_REDUCED) { el.textContent = target; return; }
      const obj = { value: 0 };
      gsap.to(obj, {
        value: target,
        duration: 2.2,
        ease: 'power2.out',
        snap: { value: 1 },
        onUpdate: () => { el.textContent = Math.round(obj.value); },
        scrollTrigger: { trigger: el, start: 'top 82%', once: true }
      });
    });
  }

  /* ---------- Chef quote word stagger ---------- */
  function initQuoteWords() {
    if (!HAS_GSAP() || !HAS_ST() || PREFERS_REDUCED) return;
    document.querySelectorAll('[data-quote-words]').forEach(el => {
      // Wrap each word in a span
      const txt = el.textContent.trim();
      el.innerHTML = txt.split(/\s+/).map(w => `<span class="word">${w}</span>`).join(' ');
      const words = el.querySelectorAll('.word');
      gsap.from(words, {
        opacity: 0, y: 12, duration: 0.6, stagger: 0.045, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 80%' },
      });
    });
  }

  /* ---------- Menu preview interactive panel ---------- */
  function initMenuPreview() {
    const root = document.querySelector('.menu-preview');
    if (!root) return;
    const rows = root.querySelectorAll('.cat-row');
    const panel = root.querySelector('.menu-preview__panel');
    const illuses = root.querySelectorAll('.menu-preview__illus');

    function activate(idx) {
      rows.forEach((r, i) => r.classList.toggle('is-active', i === idx));
      illuses.forEach((il, i) => il.classList.toggle('is-active', i === idx));
      const bg = rows[idx].dataset.bg;
      if (bg && panel) panel.style.backgroundColor = bg;
    }

    rows.forEach((r, i) => {
      r.addEventListener('mouseenter', () => activate(i));
      r.addEventListener('focus', () => activate(i));
      r.addEventListener('click', () => activate(i));
    });
    if (rows.length) activate(0);
  }

  /* ---------- Wizard form ---------- */
  function initWizard() {
    const wizard = document.querySelector('.wizard');
    if (!wizard) return;

    const steps = wizard.querySelectorAll('.wizard__step');
    const stepNums = wizard.querySelectorAll('.wizard__step-num');
    const successPanel = wizard.querySelector('.wizard__success');
    let current = 0;

    function show(idx, dir) {
      // Animate out current
      const cur = steps[current];
      const nxt = steps[idx];
      if (HAS_GSAP() && !PREFERS_REDUCED && cur && nxt && cur !== nxt) {
        gsap.to(cur, {
          opacity: 0, x: dir > 0 ? -40 : 40, duration: 0.25, ease: 'power2.in',
          onComplete: () => {
            cur.classList.remove('is-current');
            nxt.classList.add('is-current');
            gsap.fromTo(nxt, { opacity: 0, x: dir > 0 ? 40 : -40 }, {
              opacity: 1, x: 0, duration: 0.35, ease: 'power3.out',
            });
          }
        });
      } else {
        if (cur) cur.classList.remove('is-current');
        nxt.classList.add('is-current');
      }
      current = idx;
      stepNums.forEach((n, i) => {
        n.classList.toggle('is-current', i === idx);
        n.classList.toggle('is-done', i < idx);
      });
    }

    // Validate current step
    function validateStep(idx) {
      const step = steps[idx];
      const required = step.querySelectorAll('[required]');
      let ok = true;
      required.forEach(el => {
        if (!el.checkValidity || !el.checkValidity()) {
          ok = false;
          el.reportValidity && el.reportValidity();
        }
      });
      // Handle radio tile groups (only check if any required radio is in this step)
      const radioRequired = step.querySelector('input[type="radio"][required]');
      if (radioRequired) {
        const name = radioRequired.name;
        const checked = step.querySelector(`input[type="radio"][name="${name}"]:checked`);
        if (!checked) { ok = false; alert('Please select an option to continue.'); }
      }
      return ok;
    }

    // Next / back
    wizard.querySelectorAll('[data-wizard-next]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!validateStep(current)) return;
        if (current < steps.length - 1) show(current + 1, 1);
      });
    });
    wizard.querySelectorAll('[data-wizard-back]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (current > 0) show(current - 1, -1);
      });
    });

    // Radio tile selection visual state
    wizard.querySelectorAll('.radio-tile').forEach(tile => {
      const input = tile.querySelector('input[type="radio"]');
      tile.addEventListener('click', () => {
        if (!input) return;
        input.checked = true;
        // Update tile state
        const name = input.name;
        wizard.querySelectorAll(`input[type="radio"][name="${name}"]`).forEach(r => {
          r.closest('.radio-tile').classList.toggle('is-selected', r.checked);
        });
        // Conditional fields
        wizard.querySelectorAll('[data-show-if]').forEach(field => {
          const cond = field.dataset.showIf; // e.g. "inquiry_type=catering"
          const [k, v] = cond.split('=');
          const checkedVal = (wizard.querySelector(`input[type="radio"][name="${k}"]:checked`) || {}).value;
          field.classList.toggle('is-visible', checkedVal === v);
        });
      });
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tile.click();
        }
      });
    });

    // Submit handler
    const form = wizard.querySelector('form') || wizard;
    const submitBtn = wizard.querySelector('[data-wizard-submit]');
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!validateStep(current)) return;
        // Collect all field data
        const data = {};
        wizard.querySelectorAll('input, textarea, select').forEach(el => {
          if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; return; }
          if (el.type === 'checkbox') { data[el.name] = el.checked; return; }
          if (el.name) data[el.name] = el.value;
        });
        // In real deployment this would POST to a backend or Formspree.
        // For now we simulate success:
        if (HAS_GSAP() && !PREFERS_REDUCED) {
          gsap.to(wizard.querySelector('.wizard__steps'), {
            opacity: 0, y: -20, duration: 0.3, ease: 'power2.in',
            onComplete: () => {
              wizard.querySelector('.wizard__steps').style.display = 'none';
              wizard.querySelector('.wizard__progress').style.display = 'none';
              successPanel.classList.add('is-visible');
              gsap.fromTo(successPanel, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
              const svg = successPanel.querySelector('svg');
              if (svg) {
                const pths = svg.querySelectorAll('path, circle');
                pths.forEach(p => {
                  if (!p.getTotalLength) return;
                  const l = p.getTotalLength();
                  p.style.strokeDasharray = l;
                  p.style.strokeDashoffset = l;
                });
                gsap.to(pths, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.04 });
              }
            }
          });
        } else {
          wizard.querySelector('.wizard__steps').style.display = 'none';
          wizard.querySelector('.wizard__progress').style.display = 'none';
          successPanel.classList.add('is-visible');
        }
        // expose for debug
        console.log('Hummus Village submission:', data);
      });
    }
  }

  /* ---------- Init on DOM ready ---------- */
  function init() {
    setupGsap(); // register ScrollTrigger plugin now that gsap is loaded
    initPageTransitions();
    initNav();
    initMobileMenu();
    initActiveLink();
    initLogoIntro();
    initHero();
    initThree();
    initScrollReveals();
    initSvgDraw();
    initCounters();
    initQuoteWords();
    initMenuPreview();
    initWizard();

    // Refresh ScrollTrigger after a tick to catch async content
    if (typeof ScrollTrigger !== 'undefined') {
      setTimeout(() => ScrollTrigger.refresh(), 200);
    }
  }

  // Wait for both THREE and GSAP (they're async); fallback after timeout
  function waitForLibs(callback) {
    const start = Date.now();
    function check() {
      const t = typeof THREE !== 'undefined';
      const g = typeof gsap !== 'undefined';
      const st = typeof ScrollTrigger !== 'undefined';
      if (t && g && st) { callback(); return; }
      if (Date.now() - start > 5000) { callback(); return; } // graceful fallback
      requestAnimationFrame(check);
    }
    check();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForLibs(init));
  } else {
    waitForLibs(init);
  }
})();
