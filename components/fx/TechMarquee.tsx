"use client";

import { useEffect, useRef } from "react";

// editá esta lista a gusto
const TECH = [
  "typescript", "javascript", "react", "next.js", "react native", "expo", "node.js", "tailwind css",
  "php", "symfony", "twig", "wordpress", "postgresql", "mysql", "git", "figma",
];

// mismos valores que el efecto del logo
const STRENGTH = 0.5;
const RGB_SPLIT = 1.3;
const DAMP = 0.9;
// velocidad de la ola: mas chico = mas lento
const WAVE_EASE = 0.035;

const BAND = 64; // alto visible del texto
const PAD = 70; // aire arriba para que la ola y el estirado tengan lugar
const FONT_SIZE = 72;
const FONT = `400 ${FONT_SIZE}px ui-sans-serif, system-ui, sans-serif`;
const GAP = 56;
const SPEED = 40; // px por segundo
const RADIUS = 140;
const LIFT = 30; // cuanto sube la palabra bajo el mouse
const TOUCH_SWAY = 9; // tactil: vaiven del mouse fantasma (mas chico = menos color)

const vs = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;
const fs = `precision mediump float;
varying vec2 vUv;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_mouse;
uniform vec2 u_vel;
uniform float u_radius;
uniform float u_time;
uniform float u_ink; // 1.0 en modo claro (texto oscuro)
void main(){
  vec2 px = vUv * u_res;
  float s = smoothstep(u_radius, 0.0, distance(px, u_mouse));
  float wob = sin(px.y*0.12 + u_time*6.0) * 0.06 * length(u_vel);
  vec2 off = (-u_vel * s * ${STRENGTH.toFixed(3)} + vec2(wob, -wob) * s) / u_res;
  vec2 sp  = (-u_vel * s * ${RGB_SPLIT.toFixed(3)}) / u_res;
  vec4 r = texture2D(u_tex, vUv + off - sp);
  vec4 g = texture2D(u_tex, vUv + off);
  vec4 b = texture2D(u_tex, vUv + off + sp);
  float a = max(max(r.a, g.a), b.a);
  vec3 add = vec3(r.r, g.g, b.b);
  vec3 ink = vec3(r.a - r.r, g.a - g.g, b.a - b.b);
  gl_FragColor = vec4(mix(add, vec3(a) - ink, u_ink), a);
}`;

export function TechMarquee({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
    if (!gl) return;
    const src = document.createElement("canvas");
    const ctx = src.getContext("2d")!;

    const sh = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("u_res"), uMouse = U("u_mouse"), uVel = U("u_vel"), uRadius = U("u_radius"), uTime = U("u_time"), uInk = U("u_ink");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const H = BAND + PAD;
    let W = 0, dpr = 1, cycle = 0;
    let widths: number[] = [];
    let charX: number[][] = [];

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio, 2);
      W = canvas.clientWidth;
      canvas.width = src.width = Math.round(W * dpr);
      canvas.height = src.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = FONT;
      if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${FONT_SIZE * -0.02}px`;
      widths = TECH.map((t) => ctx.measureText(t).width + GAP);
      charX = TECH.map((t) => [...t].map((_, j) => ctx.measureText(t.slice(0, j)).width));
      cycle = widths.reduce((a, b) => a + b, 0);
    };

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none)").matches;
    const lifts = new Map<number, number>();
    let x = 0, hL = 0, hR = 0, hover = false;
    let mouse = { x: -999, y: -999 }, target = { ...mouse };
    let last: { x: number; y: number } | null = null;
    const vel = { x: 0, y: 0 };

    const paint = () => {
      const fg = getComputedStyle(document.body).color;
      ctx.clearRect(0, 0, W, H);
      ctx.font = FONT;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = fg;
      const y = H + 14; // la base queda apenas por debajo del borde: se corta un poco pero se lee
      const base = Math.floor(x / cycle) * TECH.length;

      // bordes de la palabra bajo el mouse (la ola se mide desde ahi)
      hL = hR = target.x;
      if (hover) {
        let px = -(x % cycle), n = 0;
        while (px < W) {
          const kk = n % TECH.length, wd = widths[kk] - GAP / 2;
          if (target.x >= px && target.x < px + wd) { hL = px; hR = px + wd; break; }
          px += widths[kk]; n++;
        }
      }

      let cx = -(x % cycle), i = 0;
      while (cx < W) {
        const k = i % TECH.length;
        const over = hover && target.x >= cx && target.x < cx + widths[k] - GAP / 2;
        ctx.globalAlpha = 1; // color pleno, contrario al fondo
        [...TECH[k]].forEach((ch, j) => {
          // ola letra por letra: la palabra bajo el mouse sube entera; en las vecinas
          // sube mas la punta que da a la cresta y se apaga hacia la otra punta
          const id = (base + i) * 100 + j, px = cx + charX[k][j];
          let goal = 0;
          // tactil: ola continua letra por letra alrededor del punto fijo del centro
          if (touch) goal = 0; // tactil: sin ola, solo corre con un toque de color
          else if (over) goal = 1;
          else if (hover) {
            const d = px < hL ? hL - px : Math.max(0, px - hR);
            goal = 0.45 * Math.exp(-((d / 170) ** 2));
          }
          const prev = lifts.get(id) || 0;
          const l = prev + (goal - prev) * WAVE_EASE;
          if (l < 0.002 && goal === 0) lifts.delete(id); else lifts.set(id, l);
          ctx.fillText(ch, px, y - l * LIFT);
        });
        // separador
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx + widths[k] - GAP / 2, y - 26, 4, 0, Math.PI * 2);
        ctx.fill();
        cx += widths[k]; i++;
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0, prevT = performance.now();
    const frame = (t: number) => {
      const dt = Math.min((t - prevT) / 1000, 0.05);
      prevT = t;
      if (touch) ghostMove(t);
      if (!reduced) x += SPEED * (hover && !touch ? 0.35 : 1) * dt; // con el mouse encima baja la velocidad
      mouse.x += (target.x - mouse.x) * 0.15;
      mouse.y += (target.y - mouse.y) * 0.15;
      vel.x *= DAMP; vel.y *= DAMP;
      paint();
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x * dpr, mouse.y * dpr);
      gl.uniform2f(uVel, vel.x * dpr, vel.y * dpr);
      gl.uniform1f(uRadius, RADIUS * dpr);
      gl.uniform1f(uTime, t / 1000);
      gl.uniform1f(uInk, mq.matches ? 1 : 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    };

    const pos = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: r.height - (e.clientY - r.top) };
    };
    // el canvas no captura el mouse (no tapa clicks de la pagina): se escucha en window
    // y se considera hover solo sobre la franja de texto
    const inside = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return r.width > 0 && e.clientY >= r.bottom - (BAND + LIFT) && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right;
    };
    const onMove = (e: MouseEvent) => {
      const isIn = inside(e);
      if (isIn && !hover) return onEnter(e);
      if (!isIn) { if (hover) onLeave(); return; }
      const p = pos(e);
      if (last) { vel.x += (p.x - last.x) * 0.6; vel.y += (p.y - last.y) * 0.6; }
      const m = Math.hypot(vel.x, vel.y), cap = RADIUS * 0.45;
      if (m > cap) { vel.x *= cap / m; vel.y *= cap / m; }
      last = p; target = p;
    };
    const onEnter = (e: MouseEvent) => { hover = true; last = pos(e); target = { ...last }; mouse = { ...last }; };
    const onLeave = () => { hover = false; last = null; };

    // pantallas tactiles: no hay hover, asi que un "mouse fantasma" queda fijo en el
    // centro (con un vaiven minimo para que haya velocidad y aparezcan los colores)
    const ghostMove = (t: number) => {
      const s = t / 1000;
      const p = { x: W / 2 + Math.sin(s * 1.1) * TOUCH_SWAY, y: BAND / 2 + Math.sin(s * 1.9) * TOUCH_SWAY * 0.4 };
      if (!hover) { hover = true; last = p; target = { ...p }; mouse = { ...p }; }
      if (last) { vel.x += (p.x - last.x) * 0.6; vel.y += (p.y - last.y) * 0.6; }
      last = p; target = p;
    };

    layout();
    raf = requestAnimationFrame(frame);
    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", layout);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", layout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`tecnologías: ${TECH.join(", ")}`}
      role="img"
      className={`pointer-events-none relative block w-full md:fixed md:bottom-0 md:left-0 ${className}`}
      style={{ height: BAND + PAD }}
    />
  );
}
