"use client";

import { useEffect, useRef, useState } from "react";

const PAD = 3; // el canvas mide 3x el logo para que el estirado tenga lugar
const RADIUS = 0.35; // radio de influencia del mouse (en uv)
const STRENGTH = 0.5; // cuanto se deforma la forma
const RGB_SPLIT = 1.3; // cuanto se estiran los colores
const DAMP = 0.9; // que tan rapido vuelve a la forma
const GHOST_EVERY = 4500; // ms entre "hovers fantasma" en mobile y desktop

const vs = `attribute vec2 p; varying vec2 vUv;
void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

const fs = `precision mediump float;
varying vec2 vUv;
uniform sampler2D u_tex;
uniform vec2 u_mouse;
uniform vec2 u_vel;
uniform float u_time;
uniform float u_split;
uniform float u_ink; // 1.0 en modo claro (logo oscuro)
void main(){
  float d = distance(vUv, u_mouse);
  float s = smoothstep(${RADIUS.toFixed(3)}, 0.0, d);
  float wob = sin(vUv.y*18.0 + u_time*6.0) * 0.0015 * length(u_vel) * 40.0;
  vec2 off = -u_vel * s * ${STRENGTH.toFixed(3)} + vec2(wob, -wob);
  vec2 sp = -u_vel * s * u_split;
  vec4 r = texture2D(u_tex, vUv + off - sp);
  vec4 g = texture2D(u_tex, vUv + off);
  vec4 b = texture2D(u_tex, vUv + off + sp);
  float a = max(max(r.a, g.a), b.a);
  // modo oscuro: separacion aditiva (logo blanco -> bordes rojo/verde/azul)
  vec3 add = vec3(r.r, g.g, b.b);
  // modo claro: separacion "de tinta" (logo negro -> bordes cian/magenta/amarillo)
  vec3 ink = vec3(r.a - r.r, g.a - g.g, b.a - b.b);
  vec3 sub = vec3(a) - ink;
  gl_FragColor = vec4(mix(add, sub, u_ink), a);
}`;

type Props = {
  src?: string;
  /** tamaño fijo en px; se ignora si fitParent es true */
  size?: number;
  /** toma el alto del elemento padre y el hover sobre el padre tambien activa el efecto */
  fitParent?: boolean;
  className?: string;
  /** logo para modo claro (se detecta solo con prefers-color-scheme) */
  lightSrc?: string;
  /** con fitParent: si el hover sobre el padre tambien activa el efecto (default true) */
  linkHover?: boolean;
  /** en mobile y desktop (sin hover) pasa un hover fantasma cada tanto */
  ghost?: boolean;
  /** ms de retraso del hover fantasma (para encadenarlo con otros) */
  ghostDelay?: number;
};

export function LogoFX({ src = "/logo.svg", size = 72, fitParent = false, className = "", lightSrc = "/logo-dark.svg", linkHover = true, ghost = false, ghostDelay = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLSpanElement>(null);
  const [light, setLight] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const on = () => setLight(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const parent = fitParent ? host.parentElement : null;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
    if (!gl) return;

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

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uMouse = U("u_mouse"), uVel = U("u_vel"), uTime = U("u_time");
    gl.uniform1f(U("u_split"), RGB_SPLIT);
    gl.uniform1f(U("u_ink"), light ? 1 : 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const tex = gl.createTexture();
    let target = { x: 0.5, y: 0.5 };
    let mouse = { x: 0.5, y: 0.5 };
    let last: { x: number; y: number } | null = null;
    const vel = { x: 0, y: 0 };
    let raf = 0;

    const draw = (t: number) => {
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform2f(uVel, vel.x, vel.y);
      gl.uniform1f(uTime, t / 1000);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const loop = (t: number) => {
      mouse.x += (target.x - mouse.x) * 0.15;
      mouse.y += (target.y - mouse.y) * 0.15;
      vel.x *= DAMP;
      vel.y *= DAMP;
      draw(t);
      raf = Math.abs(vel.x) + Math.abs(vel.y) > 1e-4 ? requestAnimationFrame(loop) : 0;
    };

    const img = new Image();
    const upload = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      if (!w) return; // oculto (ej. mobile)
      canvas.width = canvas.height = w;
      gl.viewport(0, 0, w, w);
      const c = document.createElement("canvas");
      c.width = c.height = w;
      const ctx = c.getContext("2d")!;
      const l = w / PAD;
      ctx.drawImage(img, (w - l) / 2, (w - l) / 2, l, l);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      draw(0);
    };
    img.onload = upload;
    img.src = light ? lightSrc : src;

    const uv = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
    };
    // hover sobre el texto: el movimiento se proyecta sobre el area del logo
    const puv = (e: MouseEvent) => {
      const r = parent!.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      return { x: 1 / PAD + nx / PAD, y: 1 - (1 / PAD + ny / PAD) };
    };
    const push = (p: { x: number; y: number }) => {
      if (last) {
        vel.x += (p.x - last.x) * 0.6;
        vel.y += (p.y - last.y) * 0.6;
      }
      const m = Math.hypot(vel.x, vel.y);
      if (m > 0.12) {
        vel.x *= 0.12 / m;
        vel.y *= 0.12 / m;
      }
      last = p;
      target = p;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onMove = (e: MouseEvent) => push(uv(e));
    const onEnter = (e: MouseEvent) => {
      last = uv(e);
      target = { ...last };
      mouse = { ...last };
    };
    const onParentMove = (e: MouseEvent) => {
      if (e.target instanceof Node && canvas.contains(e.target)) return;
      push(puv(e));
    };
    const onParentEnter = (e: MouseEvent) => {
      last = puv(e);
      target = { ...last };
      mouse = { ...last };
    };
    const onLeave = () => {
      last = null;
    };
    const fit = () => {
      if (!parent) return;
      const h = parent.offsetHeight;
      host.style.width = host.style.height = `${h}px`;
    };
    const onResize = () => {
      fit();
      if (img.complete && canvas.clientWidth) upload();
    };
    fit();
    const ro = parent ? new ResizeObserver(onResize) : null;
    const hoverParent = parent && linkHover ? parent : null;
    if (parent) ro!.observe(parent);
    if (hoverParent) {
      hoverParent.addEventListener("mousemove", onParentMove);
      hoverParent.addEventListener("mouseenter", onParentEnter);
      hoverParent.addEventListener("mouseleave", onLeave);
    }

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseenter", onEnter);
    canvas.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);

    // hover fantasma: mismo efecto, solo cambia como se activa
    let ghostRaf = 0, ghostEvery = 0;
    const ghostStart = ghost
      ? window.setTimeout(() => {
          const sweep = () => {
            if (canvas.matches(":hover")) return; // si hay mouse encima, manda el mouse
            const y0 = 0.42 + Math.random() * 0.16, dir = Math.random() < 0.5 ? 1 : -1;
            const t0 = performance.now(), dur = 700;
            last = null;
            const step = (t: number) => {
              if (canvas.matches(":hover")) return;
              const k = Math.min((t - t0) / dur, 1), e = k * k * (3 - 2 * k);
              const p = { x: 0.5 + dir * (-0.2 + 0.4 * e), y: y0 + Math.sin(e * Math.PI) * 0.04 };
              if (!last) { last = p; target = { ...p }; mouse = { ...p }; }
              push(p);
              if (k < 1) ghostRaf = requestAnimationFrame(step); else last = null;
            };
            ghostRaf = requestAnimationFrame(step);
          };
          sweep();
          ghostEvery = window.setInterval(sweep, GHOST_EVERY);
        }, 1200 + ghostDelay)
      : 0;

    return () => {
      clearTimeout(ghostStart);
      clearInterval(ghostEvery);
      cancelAnimationFrame(ghostRaf);
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseenter", onEnter);
      canvas.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      if (hoverParent) {
        hoverParent.removeEventListener("mousemove", onParentMove);
        hoverParent.removeEventListener("mouseenter", onParentEnter);
        hoverParent.removeEventListener("mouseleave", onLeave);
      }
    };
  }, [src, lightSrc, light, fitParent, linkHover, ghost, ghostDelay]);

  return (
    <span
      ref={hostRef}
      className={`block ${fitParent ? "" : "relative"} ${className}`}
      style={fitParent ? undefined : { width: size, height: size }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute cursor-pointer"
        style={{ left: "-100%", top: "-100%", width: "300%", height: "300%" }}
      />
    </span>
  );
}
