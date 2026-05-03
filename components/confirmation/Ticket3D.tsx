"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface Ticket3DProps {
  bookingId: number;
  guestName: string;
  eventName: string;
  venueName: string;
  venueLocation: string;
  eventDate: string;
  seats: string[];
  amount: number;
  paymentMethod: string;
  qrSeed?: string;
}

type Palette = {
  accent: string;
  accentSoft: string;
  accentDark: string;
  ink: string;
  paper: string;
  paperAlt: string;
  glow: string;
};

const PALETTES: Palette[] = [
  {
    accent: "#B65B3A",
    accentSoft: "#E7B08A",
    accentDark: "#2E221B",
    ink: "#3A261C",
    paper: "#FFF9F3",
    paperAlt: "#F5E3D4",
    glow: "rgba(182,91,58,0.28)",
  },
  {
    accent: "#9E4E31",
    accentSoft: "#E3A577",
    accentDark: "#251813",
    ink: "#392218",
    paper: "#FFF7EF",
    paperAlt: "#F2DDCC",
    glow: "rgba(158,78,49,0.26)",
  },
  {
    accent: "#C47D50",
    accentSoft: "#F0C39A",
    accentDark: "#2B2018",
    ink: "#40261A",
    paper: "#FFF8F0",
    paperAlt: "#F4E5D7",
    glow: "rgba(196,125,80,0.26)",
  },
  {
    accent: "#8C5A3C",
    accentSoft: "#D9A37D",
    accentDark: "#211814",
    ink: "#352118",
    paper: "#FFF8F2",
    paperAlt: "#F5E4D6",
    glow: "rgba(140,90,60,0.26)",
  },
];

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number, fontFamily: string, weight = "700") {
  let currentSize = fontSize;
  while (currentSize > 12) {
    ctx.font = `${weight} ${currentSize}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }
    currentSize -= 2;
  }
  return currentSize;
}

function drawQrPattern(
  ctx: CanvasRenderingContext2D,
  seed: string,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const cells = 29;
  const cellSize = size / cells;
  let state = hashString(seed) || 1;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };

  const isFinderSquare = (col: number, row: number) => {
    const squares = [
      { x: 0, y: 0 },
      { x: cells - 7, y: 0 },
      { x: 0, y: cells - 7 },
    ];

    return squares.some(({ x: sx, y: sy }) => col >= sx && col < sx + 7 && row >= sy && row < sy + 7);
  };

  ctx.save();
  ctx.fillStyle = "#FFFDF8";
  drawRoundedRect(ctx, x - 10, y - 10, size + 20, size + 20, 18);
  ctx.fill();

  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      const inFinder = isFinderSquare(col, row);
      const shouldDraw = inFinder ? true : next() > 0.54;
      if (!shouldDraw) continue;

      if (inFinder) {
        ctx.fillStyle = color;
        if (col < 7 && row < 7) {
          ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
        }
        if ((col >= 1 && col <= 5) && (row >= 1 && row <= 5)) {
          ctx.fillStyle = "#FFFDF8";
          ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
        }
        if ((col >= 2 && col <= 4) && (row >= 2 && row <= 4)) {
          ctx.fillStyle = color;
          ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
        }
        if (col >= cells - 7 && row < 7) {
          ctx.fillStyle = color;
          ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
        }
        if (col >= cells - 6 && col <= cells - 2 && row >= 1 && row <= 5) {
          ctx.fillStyle = "#FFFDF8";
          ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
        }
        if (col >= cells - 5 && col <= cells - 3 && row >= 2 && row <= 4) {
          ctx.fillStyle = color;
          ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
        }
        if (col < 7 && row >= cells - 7) {
          ctx.fillStyle = color;
          ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
        }
        if (col >= 1 && col <= 5 && row >= cells - 6 && row <= cells - 2) {
          ctx.fillStyle = "#FFFDF8";
          ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
        }
        if (col >= 2 && col <= 4 && row >= cells - 5 && row <= cells - 3) {
          ctx.fillStyle = color;
          ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
        }
        continue;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
    }
  }

  ctx.restore();
}

export default function Ticket3D({
  bookingId,
  guestName,
  eventName,
  venueName,
  venueLocation,
  eventDate,
  seats,
  amount,
  paymentMethod,
  qrSeed,
}: Ticket3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const palette = useMemo(() => PALETTES[hashString(`${guestName}-${bookingId}`) % PALETTES.length], [bookingId, guestName]);
  const initials = useMemo(
    () =>
      guestName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "T",
    [guestName],
  );
  const formattedDate = useMemo(() => {
    if (!eventDate) return "";
    const parsed = new Date(eventDate);
    return Number.isNaN(parsed.getTime()) ? eventDate : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }, [eventDate]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const width = 540;
    const height = 340;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7efe7, 6, 16);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.18, 4.25);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.appendChild(renderer.domElement);

    const ticketGroup = new THREE.Group();
    scene.add(ticketGroup);

    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 820;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, palette.paper);
    gradient.addColorStop(0.45, "#FFF6EC");
    gradient.addColorStop(1, "#F2DDCC");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // soft background lights
    const bgGlow1 = ctx.createRadialGradient(190, 170, 20, 190, 170, 320);
    bgGlow1.addColorStop(0, palette.glow);
    bgGlow1.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = bgGlow1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bgGlow2 = ctx.createRadialGradient(1140, 610, 25, 1140, 610, 360);
    bgGlow2.addColorStop(0, "rgba(46,34,27,0.16)");
    bgGlow2.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = bgGlow2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // base card
    ctx.shadowColor = "rgba(46,34,27,0.18)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = "#FFFDF9";
    drawRoundedRect(ctx, 56, 54, canvas.width - 112, canvas.height - 108, 42);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // top strip
    const stripGradient = ctx.createLinearGradient(56, 54, canvas.width - 56, 54);
    stripGradient.addColorStop(0, palette.accentDark);
    stripGradient.addColorStop(0.45, palette.accent);
    stripGradient.addColorStop(1, palette.accentSoft);
    ctx.fillStyle = stripGradient;
    drawRoundedRect(ctx, 56, 54, canvas.width - 112, 116, 42);
    ctx.fill();

    // accent bars
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(92, 80, 110, 8);
    ctx.fillRect(92, 98, 74, 8);

    // brand and status
    ctx.fillStyle = "#FFFDF8";
    ctx.font = "800 28px Syne, Inter, sans-serif";
    ctx.fillText("BOOKING_SYSTEM", 92, 128);
    ctx.font = "600 14px Inter, sans-serif";
    ctx.fillText("PERSONAL PASS", 1164, 92);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    drawRoundedRect(ctx, 1048, 70, 170, 34, 17);
    ctx.fill();
    ctx.fillStyle = "#FFFDF8";
    ctx.font = "700 13px Inter, sans-serif";
    ctx.fillText("VALIDATED", 1096, 92);

    // left side panel
    ctx.fillStyle = palette.accentDark;
    drawRoundedRect(ctx, 82, 196, 256, 420, 34);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(210, 324, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFDF8";
    ctx.beginPath();
    ctx.arc(210, 324, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(210, 324, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFDF8";
    ctx.font = "800 34px Syne, Inter, sans-serif";
    const initialsWidth = ctx.measureText(initials).width;
    ctx.fillText(initials, 210 - initialsWidth / 2, 336);

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "600 13px Inter, sans-serif";
    ctx.fillText(`Guest`, 112, 416);
    ctx.fillStyle = "#FFFDF8";
    ctx.font = "800 20px Syne, Inter, sans-serif";
    ctx.fillText(guestName, 112, 447);

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "600 13px Inter, sans-serif";
    ctx.fillText("Booking ID", 112, 487);
    ctx.fillStyle = "#FFFDF8";
    ctx.font = "700 18px JetBrains Mono, monospace";
    ctx.fillText(`BKG-${bookingId}`, 112, 516);

    drawQrPattern(ctx, qrSeed ?? `${bookingId}-${guestName}`, 118, 552, 162, "#FFFDF8");

    // perforation line
    ctx.strokeStyle = "rgba(46,34,27,0.16)";
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 10]);
    ctx.beginPath();
    ctx.moveTo(362, 210);
    ctx.lineTo(362, 582);
    ctx.stroke();
    ctx.setLineDash([]);

    // right panel
    ctx.fillStyle = palette.ink;
    ctx.font = "800 48px Syne, Inter, sans-serif";
    const maxTitle = fitText(ctx, eventName, 700, 48, "Syne, Inter, sans-serif");
    ctx.font = `800 ${maxTitle}px Syne, Inter, sans-serif`;
    ctx.fillText(eventName, 406, 240);

    ctx.fillStyle = palette.accent;
    ctx.font = "700 16px Inter, sans-serif";
    ctx.fillText(formattedDate, 406, 278);

    ctx.fillStyle = palette.ink;
    ctx.font = "600 17px Inter, sans-serif";
    ctx.fillText(venueName, 406, 322);

    ctx.fillStyle = "rgba(58,38,28,0.82)";
    ctx.font = "500 15px Inter, sans-serif";
    ctx.fillText(venueLocation, 406, 348);

    // metadata cards
    const metaTop = 384;
    const metaHeight = 86;
    const metaGap = 18;
    const metaWidth = 194;

    const cardLabels = ["Seats", "Payment", "Total"];
    const cardValues = [seats.join(", "), paymentMethod, `₹${amount.toLocaleString("en-IN")}`];

    cardLabels.forEach((label, index) => {
      const cardX = 406 + index * (metaWidth + metaGap);
      ctx.fillStyle = index === 2 ? palette.accent : "#FFFDF8";
      ctx.shadowColor = "rgba(46,34,27,0.08)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      drawRoundedRect(ctx, cardX, metaTop, metaWidth, metaHeight, 22);
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.fillStyle = index === 2 ? "#FFFDF8" : palette.accent;
      ctx.font = "700 12px Inter, sans-serif";
      ctx.fillText(label.toUpperCase(), cardX + 18, metaTop + 26);
      ctx.fillStyle = index === 2 ? "#FFFDF8" : palette.ink;
      ctx.font = "700 18px Inter, sans-serif";
      const value = cardValues[index];
      const max = index === 0 ? 170 : 140;
      const size = fitText(ctx, value, max, 18, "Inter, sans-serif", "700");
      ctx.font = `700 ${size}px Inter, sans-serif`;
      ctx.fillText(value, cardX + 18, metaTop + 56);
    });

    // bottom signature strip
    ctx.fillStyle = "rgba(46,34,27,0.05)";
    drawRoundedRect(ctx, 406, 510, 688, 102, 26);
    ctx.fill();

    ctx.fillStyle = palette.accentDark;
    ctx.font = "700 12px Inter, sans-serif";
    ctx.fillText("ENTRY NOTE", 430, 544);
    ctx.fillStyle = palette.ink;
    ctx.font = "600 14px Inter, sans-serif";
    ctx.fillText("Present this ticket at the gate. Arrive 20 minutes early for smooth entry.", 430, 572);

    // barcode lines
    const barX = 430;
    const barY = 610;
    const barWidths = [6, 2, 4, 3, 8, 2, 5, 3, 10, 2, 4, 2, 7, 3, 2, 6, 4, 2, 8, 3, 5, 2];
    ctx.fillStyle = palette.accentDark;
    let cursor = barX;
    barWidths.forEach((barWidth, index) => {
      if (index % 2 === 0) {
        ctx.fillRect(cursor, barY, barWidth, 48);
      }
      cursor += barWidth + 2;
    });

    ctx.fillStyle = palette.accent;
    ctx.font = "700 13px JetBrains Mono, monospace";
    ctx.fillText(`TICKET · ${bookingId} · ${hashString(qrSeed ?? `${bookingId}`) % 99999}`.toUpperCase(), 930, 656);

    const textureFront = new THREE.CanvasTexture(canvas);
    textureFront.colorSpace = THREE.SRGBColorSpace;
    textureFront.needsUpdate = true;

    const materialFront = new THREE.MeshStandardMaterial({
      map: textureFront,
      roughness: 0.8,
      metalness: 0.04,
    });
    const materialBack = new THREE.MeshStandardMaterial({ color: 0x2d221c, roughness: 0.96, metalness: 0.08 });
    const materialTop = new THREE.MeshStandardMaterial({ color: 0xd9b79a, roughness: 0.78, metalness: 0.03 });
    const materialBottom = new THREE.MeshStandardMaterial({ color: 0xc68a65, roughness: 0.78, metalness: 0.03 });
    const materialRight = new THREE.MeshStandardMaterial({ color: 0xe7c7aa, roughness: 0.76, metalness: 0.03 });
    const materialLeft = new THREE.MeshStandardMaterial({ color: 0x9f6a48, roughness: 0.82, metalness: 0.03 });

    const ticket = new THREE.Mesh(new THREE.BoxGeometry(4.35, 2.72, 0.16), [materialFront, materialBack, materialTop, materialBottom, materialRight, materialLeft]);
    ticket.castShadow = true;
    ticket.receiveShadow = true;
    ticket.rotation.x = -0.04;
    ticket.rotation.y = -0.42;
    ticket.position.y = 0.02;
    ticketGroup.add(ticket);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(7.3, 4.4),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.08 }),
    );
    shadowPlane.position.set(0, -1.18, -0.8);
    shadowPlane.rotation.x = -Math.PI / 2.5;
    scene.add(shadowPlane);

    const ambient = new THREE.AmbientLight(0xfff4ea, 1.2);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(2.2, 3.2, 4.5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(new THREE.Color(palette.accent), 0.95);
    fill.position.set(-3, 0.5, 2.8);
    scene.add(fill);

    const rim = new THREE.PointLight(new THREE.Color(palette.accentSoft), 10, 12, 2);
    rim.position.set(-2.4, 0.8, 3.2);
    scene.add(rim);

    const glow = new THREE.PointLight(new THREE.Color(palette.accent), 7, 14, 2);
    glow.position.set(2.6, -0.8, 3.6);
    scene.add(glow);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.target.set(0, 0.04, 0);

    let raf = 0;
    let time = 0;
    function animate() {
      time += 0.012;
      ticket.rotation.z = Math.sin(time * 0.3) * 0.014;
      ticket.position.y = 0.02 + Math.sin(time * 0.8) * 0.03;
      shadowPlane.material.opacity = 0.06 + Math.sin(time * 0.8) * 0.012;
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      textureFront.dispose();
      materialFront.dispose();
      materialBack.dispose();
      materialTop.dispose();
      materialBottom.dispose();
      materialRight.dispose();
      materialLeft.dispose();
      ticket.geometry.dispose();
      shadowPlane.geometry.dispose();
      (shadowPlane.material as THREE.Material).dispose();
      controls.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [amount, bookingId, eventDate, eventName, guestName, paymentMethod, palette.accent, palette.accentDark, palette.accentSoft, palette.ink, palette.paper, palette.paperAlt, qrSeed, seats, venueLocation, venueName]);

  return <div ref={mountRef} style={{ width: 540, height: 340 }} className="mx-auto" />;
}
