// File: camera.js
// Directory: src/
// A gentle "camera" for the SVG abacus in the introduction: the board tilts in 3D, pans and zooms to the part
// being explained, then labelled callouts (with leader lines) fade in beside it. Everything is measured from the
// real drawing, so it works at any screen size and in right-to-left languages.

const union = (rects) => {
  const l = Math.min(...rects.map((r) => r.left)), t = Math.min(...rects.map((r) => r.top));
  const r = Math.max(...rects.map((x) => x.right)), b = Math.max(...rects.map((x) => x.bottom));
  return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t };
};

/**
 * Move the camera. cam = { focus?: [part names], fit?: 0-1 (how much of the view the focus fills), max?: max zoom,
 * s?: fixed zoom, rx?: tilt up/down (deg), ry?: turn left/right (deg) }.
 */
export function setCamera(board, cam = {}, { reduced = false } = {}) {
  const svg = board?.svg;
  if (!svg) return;
  const prev = svg.style.transform;
  svg.style.transition = "none";
  svg.style.transform = "none";
  const host = board.host.getBoundingClientRect(), me = svg.getBoundingClientRect();
  let s = (host.width < 420 && cam.sNarrow) || cam.s || 1, tx = 0, ty = 0;
  const parts = (cam.focus || []).map((n) => board.part(n)?.getBoundingClientRect()).filter(Boolean);
  if (parts.length) {
    const f = union(parts);
    const fit = cam.fit ?? 0.8;
    s = cam.s || Math.min(cam.max ?? 2.2, (host.width * fit) / Math.max(f.width, 1), (host.height * fit) / Math.max(f.height, 1));
    s = Math.max(s, 0.6);
    // bring the middle of the focus to the middle of the board (scale is about the svg's centre)
    tx = -s * (f.left + f.width / 2 - (me.left + me.width / 2));
    ty = -s * (f.top + f.height / 2 - (me.top + me.height / 2));
  }
  void svg.offsetWidth;
  svg.style.transform = prev;
  void svg.offsetWidth;
  const rx = reduced ? 0 : cam.rx ?? 0, ry = reduced ? 0 : cam.ry ?? 0;
  svg.classList.add("cam");
  svg.style.transition = reduced ? "none" : "transform 0.9s cubic-bezier(0.45, 0, 0.2, 1)";
  svg.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(3)}) rotateX(${rx}deg) rotateY(${ry}deg)`;
  void host;
}

export function clearCamera(board) {
  const svg = board?.svg;
  if (!svg) return;
  svg.style.transition = "transform 0.5s ease";
  svg.style.transform = "";
  svg.classList.remove("cam");
}

export function clearCallouts(stage) {
  stage?.querySelector(".lp-callouts")?.remove();
  stage?.classList.remove("has-callouts");
}

/**
 * Draw labels with leader lines. Each label = { part: "bar", side: "l"|"r"|"t"|"b", text, at?: [fx, fy] }
 * where `at` is where on the part the line ends (fractions of its box; default is the middle, or the edge
 * facing the label for big parts).
 */
export function showCallouts(stage, board, labels) {
  clearCallouts(stage);
  if (!stage || !board || !labels?.length) return;
  const box = stage.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "lp-callouts";
  layer.setAttribute("aria-hidden", "true");
  const svgNS = "http://www.w3.org/2000/svg";
  const lines = document.createElementNS(svgNS, "svg");
  lines.setAttribute("class", "lp-lines");
  layer.append(lines);
  stage.append(layer);
  stage.classList.add("has-callouts");

  const items = [];
  for (const l of labels) {
    const el = board.part(l.part);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    const at = l.at || (l.side === "l" ? [0, 0.5] : l.side === "r" ? [1, 0.5] : l.side === "t" ? [0.5, 0] : [0.5, 1]);
    const ax = r.left - box.left + r.width * at[0], ay = r.top - box.top + r.height * at[1];
    const tag = document.createElement("div");
    tag.className = `lp-callout side-${l.side}${l.tone ? ` ${l.tone}` : ""}`;
    tag.textContent = l.text;
    layer.append(tag);
    items.push({ l, tag, ax, ay });
  }

  const pad = 8, gap = 6;
  // place each label, then nudge labels on the same side apart
  for (const side of ["l", "r", "t", "b"]) {
    const row = items.filter((i) => i.l.side === side);
    for (const i of row) {
      const w = i.tag.offsetWidth, h = i.tag.offsetHeight;
      i.w = w;
      i.h = h;
      if (side === "l") { i.x = pad; i.y = i.ay - h / 2; }
      else if (side === "r") { i.x = box.width - pad - w; i.y = i.ay - h / 2; }
      else if (side === "t") { i.x = i.ax - w / 2; i.y = Math.max(pad, i.ay - 44 - h); }
      else { i.x = i.ax - w / 2; i.y = Math.min(box.height - 56 - h, i.ay + 40); }
    }
    if (side === "l" || side === "r") {
      row.sort((a, b) => a.y - b.y);
      for (let k = 0; k < row.length; k++) {
        row[k].y = Math.max(row[k].y, k ? row[k - 1].y + row[k - 1].h + gap : pad);
      }
    } else {
      row.sort((a, b) => a.x - b.x);
      for (let k = 0; k < row.length; k++) {
        row[k].x = Math.max(row[k].x, k ? row[k - 1].x + row[k - 1].w + gap : pad);
      }
    }
    // keep inside the stage, pushing back from the far edge so labels never overlap
    const horizontal = side === "t" || side === "b";
    for (let k = row.length - 1; k >= 0; k--) {
      const i = row[k], next = row[k + 1];
      if (horizontal) i.x = Math.min(Math.max(pad, i.x), next ? next.x - gap - i.w : box.width - pad - i.w);
      else i.y = Math.min(Math.max(pad, i.y), next ? next.y - gap - i.h : box.height - pad - i.h);
      if (horizontal) i.y = Math.min(Math.max(pad, i.y), box.height - pad - i.h);
      else i.x = Math.min(Math.max(pad, i.x), box.width - pad - i.w);
    }
  }

  lines.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  items.forEach((i, k) => {
    i.tag.style.left = `${i.x}px`;
    i.tag.style.top = `${i.y}px`;
    i.tag.style.animationDelay = `${k * 70}ms`;
    // the line leaves the label from the edge that faces the part
    const sx = i.l.side === "l" ? i.x + i.w : i.l.side === "r" ? i.x : i.x + i.w / 2;
    const sy = i.l.side === "t" ? i.y + i.h : i.l.side === "b" ? i.y : i.y + i.h / 2;
    const line = document.createElementNS(svgNS, "path");
    line.setAttribute("d", `M${sx.toFixed(1)} ${sy.toFixed(1)} L${i.ax.toFixed(1)} ${i.ay.toFixed(1)}`);
    line.setAttribute("class", "lp-line");
    line.style.animationDelay = `${k * 70}ms`;
    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", i.ax.toFixed(1));
    dot.setAttribute("cy", i.ay.toFixed(1));
    dot.setAttribute("r", "4");
    dot.setAttribute("class", "lp-line-dot");
    dot.style.animationDelay = `${k * 70}ms`;
    lines.append(line, dot);
  });
}
