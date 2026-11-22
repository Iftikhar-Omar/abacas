import { motionAllowed, surfaces } from './studio.js';
import { abs } from './engine.js';
import { ACESFilmicToneMapping, Box3, BoxGeometry, CapsuleGeometry, Color, CylinderGeometry, DirectionalLight, Group, HemisphereLight, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Raycaster, SRGBColorSpace, Scene, SphereGeometry, TorusGeometry, Vector2, Vector3, WebGLRenderer } from 'three';

export const clamp2 = (n, a, b) => Math.max(a, Math.min(b, n));
export const ThreeModel = class {
  constructor(el, { onTap, prefs: prefs2 }) {
    this.el = el;
    this.prefs = prefs2;
    this.onTap = onTap;
    this.items = [];
    this.pick = [];
    this.tweens = [];
    this.frame = 0;
    this.alive = true;
    this.visible = true;
    this.lastFrame = 0;
    this.view = { x: 0, y: 0, zoom: 1, pan: 0 };
    this.currentPan = 0;
    this.currentZoom = 1;
    this.pointer = { x: 0, y: 0 };
    this.aim = { x: 0, y: 0 };
    this.abort = new AbortController();
    const signal = this.abort.signal;
    const canvas = document.createElement("canvas");
    let context;
    try {
      context = canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
        powerPreference: "low-power"
      });
    } catch {
    }
    if (!context) throw Error("No WebGL2");
    this.renderer = new WebGLRenderer({
      canvas,
      context,
      alpha: true,
      antialias: true
    });
    this.renderer.setClearColor(0, 0);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    canvas.className = "scene-canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.append(canvas);
    this.scene = new Scene();
    this.root = new Group();
    this.scene.add(this.root);
    this.labelLayer = document.createElement("div");
    this.labelLayer.className = "model-rod-labels";
    el.append(this.labelLayer);
    this.camera = new PerspectiveCamera(38, 1, 0.1, 200);
    this.camera.position.set(0, 0, 25);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new HemisphereLight(16777215, 7635091, 2.1));
    const key = new DirectionalLight(16777215, 3);
    key.position.set(-5, 7, 12);
    this.scene.add(key);
    const edge = new DirectionalLight(11322623, 1.2);
    edge.position.set(7, -2, 6);
    this.scene.add(edge);
    this.ray = new Raycaster();
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        this.alive = false;
        cancelAnimationFrame(this.frame);
        el.dispatchEvent(new CustomEvent("model-fallback", { bubbles: true }));
      },
      { signal }
    );
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== 0 || this.down) return;
        this.down = {
          x: e.clientX,
          y: e.clientY,
          id: e.pointerId,
          view: { ...this.view }
        };
        this.down.control = this.pickControl(
          e.clientX,
          e.clientY,
          e.pointerType === "touch"
        );
        canvas.setPointerCapture?.(e.pointerId);
      },
      { signal }
    );
    canvas.addEventListener(
      "pointermove",
      (e) => {
        const r = canvas.getBoundingClientRect();
        this.aim = {
          x: clamp2((e.clientX - r.left) / r.width * 2 - 1, -1, 1),
          y: clamp2((e.clientY - r.top) / r.height * 2 - 1, -1, 1)
        };
        if (this.down && e.pointerId === this.down.id && !this.down.control && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 14) {
          if (e.shiftKey) {
            this.pan((e.clientX - this.down.x) * 4e-3);
            this.down.x = e.clientX;
          }
          this.view.y = clamp2(
            this.down.view.y + (e.clientX - this.down.x) * 15e-4,
            -0.13,
            0.13
          );
          this.view.x = clamp2(
            this.down.view.x + (e.clientY - this.down.y) * 1e-3,
            -0.09,
            0.09
          );
        }
        this.request();
      },
      { signal }
    );
    canvas.addEventListener(
      "pointerleave",
      () => {
        this.aim = { x: 0, y: 0 };
        this.request();
      },
      { signal }
    );
    canvas.addEventListener(
      "pointercancel",
      () => {
        this.down = null;
      },
      { signal }
    );
    canvas.addEventListener(
      "pointerup",
      (e) => {
        const d = this.down;
        this.down = null;
        if (!d || e.pointerId !== d.id || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 14)
          return;
        this.onTap(
          d.control || this.pickControl(e.clientX, e.clientY, e.pointerType === "touch")
        );
        e.preventDefault();
      },
      { signal }
    );
    canvas.addEventListener("click", (e) => e.stopPropagation(), { signal });
    canvas.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey) return;
        e.preventDefault();
        this.zoom(e.deltaY < 0 ? 1.04 : 0.96);
      },
      { signal, passive: false }
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          cancelAnimationFrame(this.frame);
          this.frame = 0;
        } else this.request();
      },
      { signal }
    );
    this.resizeObserver = globalThis.ResizeObserver ? new ResizeObserver(() => this.resize()) : null;
    this.resizeObserver?.observe(el);
    globalThis.addEventListener?.("resize", () => this.resize(), { signal });
    this.intersection = globalThis.IntersectionObserver ? new IntersectionObserver((entries) => {
      this.visible = entries[0].isIntersecting;
      if (this.visible) this.request();
      else {
        cancelAnimationFrame(this.frame);
        this.frame = 0;
      }
    }) : null;
    this.intersection?.observe(el);
    this.resize();
  }
  pickControl(x, y, touch = false) {
    const r = this.renderer.domElement.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    this.scene.updateMatrixWorld(true);
    this.camera.updateMatrixWorld(true);
    this.ray.setFromCamera(
      new Vector2(
        (x - r.left) / r.width * 2 - 1,
        -(y - r.top) / r.height * 2 + 1
      ),
      this.camera
    );
    let obj = this.ray.intersectObjects(this.pick, true)[0]?.object;
    while (obj && !obj.userData.control) obj = obj.parent;
    if (obj) return obj.userData.control;
    let best = Infinity, result = null;
    const padding = touch ? 12 : 8;
    for (const item of this.items) {
      const box = new Box3().setFromObject(item.obj);
      let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
      for (const xx of [box.min.x, box.max.x])
        for (const yy of [box.min.y, box.max.y])
          for (const zz of [box.min.z, box.max.z]) {
            const p = new Vector3(xx, yy, zz).project(this.camera), px = (p.x + 1) * r.width / 2 + r.left, py = (-p.y + 1) * r.height / 2 + r.top;
            left = Math.min(left, px);
            right = Math.max(right, px);
            top = Math.min(top, py);
            bottom = Math.max(bottom, py);
          }
      const dx = Math.max(left - x, 0, x - right), dy = Math.max(top - y, 0, y - bottom), distance = Math.hypot(dx, dy);
      if (distance <= padding && distance < best) {
        best = distance;
        result = item.obj.userData.control;
      }
    }
    return result;
  }
  material(color, metalness = 0, roughness = 0.45) {
    return new MeshStandardMaterial({ color, metalness, roughness });
  }
  box(w, h, d, material, x = 0, y = 0, z = 0) {
    const mesh = new Mesh(new BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    this.root.add(mesh);
    return mesh;
  }
  disposeGeometry() {
    this.root.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) m.dispose();
      }
    });
    this.root.clear();
    this.labelLayer?.replaceChildren();
    this.labels = [];
    this.highlight = null;
    this.dot = null;
    this.items = [];
    this.pick = [];
    this.tweens = [];
  }
  build(mode, rods) {
    this.disposeGeometry();
    this.mode = mode;
    this.rods = rods;
    const p = this.prefs(), s = surfaces[p.surface] || surfaces.classic;
    const frame = this.material(s.frame, 0.1, 0.45), metal = this.material(s.metal, 0.65, 0.3);
    this.spacing = rods <= 5 ? 1.5 : 1.15;
    this.width = mode === "hands" ? 12 : Math.max(4, (rods - 1) * this.spacing + 1.6);
    this.height = mode === "hands" ? 7.2 : 7.6;
    if (mode === "abacus") {
      const w = this.width;
      this.box(w, 0.26, 0.52, frame, 0, 3.03);
      this.box(w, 0.26, 0.52, frame, 0, -3.03);
      this.box(0.25, 6.3, 0.52, frame, -w / 2);
      this.box(0.25, 6.3, 0.52, frame, w / 2);
      this.box(w, 0.18, 0.4, frame, 0, 0.94, 0.08);
      for (let c = rods - 1; c >= 0; c--) {
        const x = ((rods - 1) / 2 - c) * this.spacing;
        const rod = new Mesh(
          new CylinderGeometry(0.025, 0.025, 5.8, 8),
          metal
        );
        rod.position.set(x, 0, 0);
        if (this.labelLayer) {
          const label = document.createElement("div");
          label.className = "model-rod-label";
          label.innerHTML = "<b>0</b><small></small>";
          this.labelLayer.append(label);
          this.labels.push({ el: label, col: c, x });
        }
        this.root.add(rod);
        for (let i = 0; i < 5; i++) {
          const mat = this.material(s.rest, 0.07, 0.33), bead = new Mesh(
            new TorusGeometry(0.31, 0.15, 12, 28).rotateX(Math.PI / 2),
            mat
          );
          bead.scale.set(1, 1, 1);
          bead.position.set(x, i === 0 ? 2.36 : -0.4 - (i - 1) * 0.62, 0.18);
          bead.userData.control = { col: c, index: i };
          this.root.add(bead);
          this.pick.push(bead);
          this.items.push({ col: c, index: i, obj: bead, mat, type: "bead" });
        }
      }
      this.highlight = new Mesh(
        new PlaneGeometry(this.spacing * 0.8, 5.7),
        new MeshBasicMaterial({
          color: p.customColor,
          transparent: true,
          opacity: 0.09,
          depthWrite: false
        })
      );
      this.highlight.position.z = -0.12;
      this.highlight.visible = false;
      this.root.add(this.highlight);
      const dot = new Mesh(
        new SphereGeometry(0.055, 8, 6),
        this.material(16762218, 0.2, 0.3)
      );
      dot.position.set(0.44, 0.94, 0.33);
      this.dot = dot;
      this.root.add(dot);
      if (p.surface === "wood")
        for (let i = 0; i < 4; i++)
          this.box(
            w,
            0.012,
            0.012,
            this.material(10185028),
            0,
            2.98 + i * 0.035,
            0.27
          );
    } else {
      for (let c = 1; c >= 0; c--) {
        const side = c === 1 ? 1 : -1, base = c === 1 ? -3 : 3;
        const palm = new Mesh(
          new SphereGeometry(1, 24, 14),
          this.material(s.skin, 0, 0.6)
        );
        palm.scale.set(1.35, 1.2, 0.42);
        palm.position.set(base, -1.15, 0);
        this.root.add(palm);
        const wrist = new Mesh(
          new CapsuleGeometry(0.7, 0.55, 5, 14),
          this.material(s.skin, 0, 0.65)
        );
        wrist.position.set(base, -2.3, -0.05);
        this.root.add(wrist);
        for (let i = 1; i <= 4; i++) {
          const x = base + side * (0.83 - (i - 1) * 0.55), length = [0.91, 1.1, 1, 0.76][i - 1], root2 = new Group();
          root2.position.set(x, -0.3, 0.16);
          root2.userData.control = { col: c, index: i };
          this.root.add(root2);
          const joints2 = [root2];
          let parent2 = root2;
          const mat2 = this.material(s.skin, 0, 0.55);
          for (let j = 0; j < 3; j++) {
            const seg = length * (j === 0 ? 0.78 : 0.57), mesh = new Mesh(
              new CapsuleGeometry(0.2, seg - 0.35, 4, 12),
              mat2
            );
            mesh.position.y = seg / 2;
            parent2.add(mesh);
            const joint = new Mesh(
              new SphereGeometry(0.198, 12, 8),
              mat2
            );
            parent2.add(joint);
            if (j < 2) {
              const next = new Group();
              next.position.y = seg;
              parent2.add(next);
              joints2.push(next);
              parent2 = next;
            }
          }
          this.pick.push(root2);
          this.items.push({
            col: c,
            index: i,
            obj: root2,
            joints: joints2,
            mat: mat2,
            type: "finger"
          });
        }
        const root = new Group();
        root.position.set(base + side * 1.17, -1.25, 0.17);
        root.rotation.z = -side * 0.65;
        root.userData.control = { col: c, index: 0 };
        this.root.add(root);
        const mat = this.material(s.skin, 0, 0.55), joints = [root];
        let parent = root;
        for (let j = 0; j < 2; j++) {
          const seg = 0.77;
          const mesh = new Mesh(
            new CapsuleGeometry(0.25, 0.3, 4, 12),
            mat
          );
          mesh.position.y = seg / 2;
          parent.add(mesh);
          if (!j) {
            const next = new Group();
            next.position.y = seg;
            parent.add(next);
            joints.push(next);
            parent = next;
          }
        }
        this.pick.push(root);
        this.items.push({
          col: c,
          index: 0,
          obj: root,
          joints,
          mat,
          type: "finger"
        });
      }
    }
    this.resize();
    this.request();
  }
  update(states, duration = 0, scale = 0) {
    const p = this.prefs(), s = surfaces[p.surface] || surfaces.classic, accent = new Color(p.customColor);
    const now = performance.now();
    this.tickTweens(now);
    this.tweens = [];
    let movedIndex = 0;
    for (const item of this.items) {
      const state2 = states.find(
        (v) => v.col === item.col && v.index === item.index
      ) || { active: false, moved: false };
      item.active = state2.active;
      item.moved = state2.moved;
      if (item.type === "bead") {
        const end = item.index === 0 ? state2.active ? 1.2 : 2.36 : state2.active ? 0.67 - (item.index - 1) * 0.62 : -0.4 - (item.index - 1) * 0.62;
        this.tweens.push({
          obj: item.obj.position,
          key: "y",
          start: item.obj.position.y,
          end,
          at: now + (duration && state2.moved ? movedIndex++ * 140 : 0),
          duration
        });
        item.mat.color.set(state2.active ? accent : s.rest);
      } else {
        item.joints.forEach(
          (j, k) => this.tweens.push({
            obj: j.rotation,
            key: "x",
            start: j.rotation.x,
            end: (p.fingerPose === "extendedCounts" ? !state2.active : state2.active) ? k === 0 ? 1.02 : 1.37 : 0,
            at: now,
            duration
          })
        );
        item.mat.color.set(s.skin);
      }
      item.mat.emissive.set(state2.moved ? 16758124 : 0);
      item.mat.emissiveIntensity = state2.moved ? 0.25 : 0;
    }
    if (this.dot)
      this.dot.position.x = ((this.rods - 1) / 2 - scale) * this.spacing + this.spacing * 0.42;
    this.scale = scale;
    for (const label of this.labels || []) {
      const digit = states.filter((s2) => s2.col === label.col && s2.active).reduce((n, s2) => n + (s2.index === 0 ? 5 : 1), 0);
      label.el.querySelector("b").textContent = String(digit);
      const exponent = label.col - scale;
      label.el.querySelector("small").textContent = exponent >= 0 ? "1" + "0".repeat(exponent) : "0." + "0".repeat(-exponent - 1) + "1";
    }
    this.busyUntil = now + duration + Math.max(0, movedIndex - 1) * 140;
    this.request();
  }
  tickTweens(now) {
    let moving = false;
    for (const t of this.tweens) {
      const x = t.duration ? clamp2((now - t.at) / t.duration, 0, 1) : 1;
      const ease = x * x * (3 - 2 * x);
      t.obj[t.key] = t.start + (t.end - t.start) * ease;
      if (x < 1) moving = true;
    }
    return moving;
  }
  suspend(value) {
    this.suspended = value;
    if (value) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    } else this.request();
  }
  request() {
    if (!this.alive || !this.visible || this.suspended || document.hidden || this.frame)
      return;
    this.frame = requestAnimationFrame((t) => this.render(t));
  }
  render(now) {
    this.frame = 0;
    if (!this.alive || !this.visible || this.suspended || document.hidden)
      return;
    const p = this.prefs(), ambient = motionAllowed(p) && !p.lowPower;
    const moving = this.tickTweens(now);
    this.pointer.x += (this.aim.x - this.pointer.x) * 0.045;
    this.pointer.y += (this.aim.y - this.pointer.y) * 0.045;
    const drift = ambient && !moving ? Math.sin(now / 8500) * 0.012 : 0;
    this.root.rotation.x = -0.055 + this.view.x + (ambient ? this.pointer.y * 0.018 : 0) + drift * 0.5;
    this.root.rotation.y = this.view.y + (ambient ? this.pointer.x * 0.024 : 0) + drift;
    const smooth = motionAllowed(p) ? 0.1 : 1;
    this.currentPan += (this.view.pan - this.currentPan) * smooth;
    this.currentZoom += (this.view.zoom - this.currentZoom) * smooth;
    this.root.position.x = this.currentPan;
    this.camera.zoom = this.currentZoom * (ambient && !moving ? 1 + Math.sin(now / 12e3) * 3e-3 : 1);
    this.camera.updateProjectionMatrix();
    this.root.updateMatrixWorld(true);
    this.camera.updateMatrixWorld(true);
    for (const label of this.labels || []) {
      const point = new Vector3(label.x, 3.44, 0.15).applyMatrix4(this.root.matrixWorld).project(this.camera);
      label.el.style.left = `${(point.x * 0.5 + 0.5) * this.el.clientWidth}px`;
      label.el.style.top = `${(-point.y * 0.5 + 0.5) * this.el.clientHeight}px`;
      label.el.hidden = Math.abs(point.x) > 1.02 || Math.abs(point.y) > 1.02;
    }
    if (!this.lastFrame || now - this.lastFrame >= 1e3 / (p.lowPower ? 24 : 30) || !moving && !ambient) {
      this.renderer.render(this.scene, this.camera);
      this.lastFrame = now;
    }
    if (moving || ambient || Math.abs(this.currentPan - this.view.pan) > 2e-3 || Math.abs(this.currentZoom - this.view.zoom) > 2e-3 || Math.abs(this.pointer.x - this.aim.x) > 2e-3 || Math.abs(this.pointer.y - this.aim.y) > 2e-3)
      this.request();
  }
  resize() {
    if (!this.alive) return;
    const w = this.el.clientWidth || 500, h = this.el.clientHeight || 300;
    const maxPixels = this.prefs().lowPower ? 35e4 : 1e6, ratio = Math.min(
      globalThis.devicePixelRatio || 1,
      1.75,
      Math.sqrt(maxPixels / (w * h))
    );
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);
    const aspect2 = w / h;
    const v = Math.max(this.height || 7.6, ((this.width || 5) + 0.4) / aspect2);
    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = aspect2;
      const distance = v * 1.12 / (2 * Math.tan(MathUtils.degToRad(this.camera.fov / 2)));
      this.camera.position.set(0, 1.1, distance);
      this.camera.lookAt(0, 0, 0);
    } else {
      this.camera.left = -v * aspect2 / 2;
      this.camera.right = v * aspect2 / 2;
      this.camera.top = v / 2;
      this.camera.bottom = -v / 2;
    }
    this.camera.updateProjectionMatrix();
    this.request();
  }
  focusColumn(col) {
    if (this.mode !== "abacus") return;
    if (this.highlight) {
      this.highlight.visible = col >= 0;
      this.highlight.position.x = ((this.rods - 1) / 2 - Math.max(0, col)) * this.spacing;
    }
    for (const label of this.labels || [])
      label.el.classList.toggle("focused", label.col === col);
    const x = col >= 0 ? ((this.rods - 1) / 2 - col) * this.spacing : 0;
    this.view.pan = clamp2(-x * 0.035, -0.18, 0.18);
    this.request();
  }
  zoom(factor) {
    this.view.zoom = clamp2(this.view.zoom * factor, 0.65, 2.2);
    this.request();
  }
  pan(delta) {
    const bound = Math.max(0.8, (this.width - 6) / 2);
    this.view.pan = clamp2(this.view.pan + delta, -bound, bound);
    this.request();
  }
  resetView() {
    this.view = { x: 0, y: 0, zoom: 1, pan: 0 };
    this.aim = { x: 0, y: 0 };
    this.request();
  }
  finish() {
    this.tickTweens(Infinity);
    this.tweens = [];
    this.request();
  }
  dispose() {
    this.alive = false;
    cancelAnimationFrame(this.frame);
    this.abort.abort();
    this.resizeObserver?.disconnect();
    this.intersection?.disconnect();
    this.disposeGeometry();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labelLayer?.remove();
  }
};
