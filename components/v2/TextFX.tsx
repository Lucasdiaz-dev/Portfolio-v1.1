"use client";

// Mismo efecto del logo (desplazamiento + separacion RGB) aplicado a texto.
// El texto real queda en el DOM (invisible pero seleccionable y clickeable)
// y se dibuja en un canvas WebGL encima.
import { useEffect, useRef, useState, type ReactNode } from "react";

const MARGIN = 48; // px de aire alrededor para que el estirado tenga lugar
const RADIUS = 80; // radio de influencia del mouse (px)
const STRENGTH = 0.5; // cuanto se deforma
const RGB_SPLIT = 1.3; // cuanto se separan los colores
const DAMP = 0.9; // que tan rapido vuelve
const MAX_VEL = 28; // px

const vs = `attribute vec2 p; varying vec2 vUv;
void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

const fs = `precision mediump float;
varying vec2 vUv;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_mouse; // uv
uniform vec2 u_vel;   // px
uniform float u_time;
uniform float u_ink;
void main(){
  vec2 px = vUv * u_res;
  float d = length(px - u_mouse * u_res);
  float s = smoothstep(${RADIUS.toFixed(1)}, 0.0, d);
  float wob = sin(px.y/12.0 + u_time*6.0) * 0.06 * length(u_vel);
  vec2 off = (-u_vel * s * ${STRENGTH.toFixed(3)} + vec2(wob, -wob) * s) / u_res;
  vec2 sp = (-u_vel * s * ${RGB_SPLIT.toFixed(3)}) / u_res;
  vec4 r = texture2D(u_tex, vUv + off - sp);
  vec4 g = texture2D(u_tex, vUv + off);
  vec4 b = texture2D(u_tex, vUv + off + sp);
  float a = max(max(r.a, g.a), b.a);
  vec3 add = vec3(r.r, g.g, b.b);
  vec3 ink = vec3(r.a - r.r, g.a - g.g, b.a - b.b);
  gl_FragColor = vec4(mix(add, vec3(a) - ink, u_ink), a);
}`;

type Props = {
  children: ReactNode;
  className?: string;
  /** el hover sobre el elemento padre (ej. toda la fila) tambien activa el efecto */
  hoverParent?: boolean;
};

export function TextFX({ children, className = "", hoverParent = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current, inner = innerRef.current, canvas = canvasRef.current;
    if (!wrap || !inner || !canvas) return;
    const hover = (hoverParent && wrap.parentElement) || wrap;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
    if (!gl) return;

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uMouse = U("u_mouse"), uVel = U("u_vel"), uTime = U("u_time"), uRes = U("u_res"), uInk = U("u_ink");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const tex = gl.createTexture();

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    let cssW = 0, cssH = 0;

    const draw = (t: number) => {
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform2f(uVel, vel.x, vel.y);
      gl.uniform1f(uTime, t / 1000);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // dibuja cada palabra del DOM en su posicion exacta
    const upload = () => {
      const ir = inner.getBoundingClientRect();
      if (!ir.width) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      cssW = ir.width + MARGIN * 2;
      cssH = ir.height + MARGIN * 2;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, cssW, cssH);
      gl.uniform1f(uInk, mq.matches ? 1 : 0);

      const c = document.createElement("canvas");
      c.width = canvas.width;
      c.height = canvas.height;
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.textBaseline = "alphabetic";
      const ox = MARGIN - ir.left, oy = MARGIN - ir.top;

      const walker = document.createTreeWalker(inner, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const text = n.textContent ?? "";
        const el = n.parentElement!;
        const cs = getComputedStyle(el);
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        ctx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
        ctx.fillStyle = cs.color;
        const underline = cs.textDecorationLine.includes("underline");
        const re = /\S+/gu;
        for (let m = re.exec(text); m; m = re.exec(text)) {
          range.setStart(n, m.index);
          range.setEnd(n, m.index + m[0].length);
          const rects = range.getClientRects();
          if (!rects.length) continue;
          const r = rects[0];
          const mt = ctx.measureText(m[0]);
          const asc = mt.fontBoundingBoxAscent, desc = mt.fontBoundingBoxDescent;
          const y = r.top + oy + (r.height - (asc + desc)) / 2 + asc;
          ctx.fillText(m[0], r.left + ox, y);
          if (underline) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillRect(r.left + ox, y + 4, r.width, 1);
            ctx.restore();
          }
        }
        // subrayado continuo entre palabras del link
        if (underline && /\s/.test(text)) {
          range.selectNodeContents(n);
          const rr = range.getClientRects();
          ctx.save();
          ctx.globalAlpha = 0.25;
          for (const r of Array.from(rr)) {
            const mt = ctx.measureText("x");
            const asc = mt.fontBoundingBoxAscent, desc = mt.fontBoundingBoxDescent;
            const y = r.top + oy + (r.height - (asc + desc)) / 2 + asc;
            ctx.clearRect(r.left + ox, y + 4, r.width, 1);
            ctx.fillRect(r.left + ox, y + 4, r.width, 1);
          }
          ctx.restore();
        }
      }

      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      draw(0);
      setReady(true);
    };

    let target = { x: 0.5, y: 0.5 };
    let mouse = { x: 0.5, y: 0.5 };
    let last: { x: number; y: number } | null = null; // px
    const vel = { x: 0, y: 0 };
    let raf = 0;
    const loop = (t: number) => {
      mouse.x += (target.x - mouse.x) * 0.15;
      mouse.y += (target.y - mouse.y) * 0.15;
      vel.x *= DAMP;
      vel.y *= DAMP;
      draw(t);
      raf = Math.abs(vel.x) + Math.abs(vel.y) > 0.02 ? requestAnimationFrame(loop) : 0;
    };
    const pos = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: r.height - (e.clientY - r.top) };
    };
    const onMove = (e: MouseEvent) => {
      const p = pos(e);
      if (last) {
        vel.x += (p.x - last.x) * 0.6;
        vel.y += (p.y - last.y) * 0.6;
      }
      const m = Math.hypot(vel.x, vel.y);
      if (m > MAX_VEL) {
        vel.x *= MAX_VEL / m;
        vel.y *= MAX_VEL / m;
      }
      last = p;
      target = { x: p.x / cssW, y: p.y / cssH };
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onEnter = (e: MouseEvent) => {
      last = pos(e);
      target = { x: last.x / cssW, y: last.y / cssH };
      mouse = { ...target };
    };
    const onLeave = () => (last = null);

    // al cambiar el tema los colores CSS se actualizan despues del evento:
    // redibujamos en los proximos frames (y una vez mas por las dudas)
    let t1 = 0, t2 = 0;
    const onScheme = () => {
      cancelAnimationFrame(t1);
      clearTimeout(t2);
      t1 = requestAnimationFrame(() => requestAnimationFrame(upload));
      t2 = window.setTimeout(upload, 250);
    };
    const ro = new ResizeObserver(() => upload());
    ro.observe(inner);
    document.fonts?.ready.then(upload);
    mq.addEventListener("change", onScheme);
    window.addEventListener("resize", upload);
    hover.addEventListener("mousemove", onMove);
    hover.addEventListener("mouseenter", onEnter);
    hover.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mq.removeEventListener("change", onScheme);
      cancelAnimationFrame(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", upload);
      hover.removeEventListener("mousemove", onMove);
      hover.removeEventListener("mouseenter", onEnter);
      hover.removeEventListener("mouseleave", onLeave);
    };
  }, [hoverParent]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div ref={innerRef} style={{ opacity: ready ? 0 : 1 }}>
        {children}
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ left: -MARGIN, top: -MARGIN }}
      />
    </div>
  );
}
