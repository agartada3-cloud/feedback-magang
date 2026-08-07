// components/settings/CanvasPreview.tsx — preview & drag-and-drop live SVG canvas editor

"use client";

import * as React from "react";
import type { ElementSetting, ImageElementSetting, Template } from "@/lib/cert-types";
import { FONT_KEYS } from "@/lib/constants";
import { Move, Type, Minus, Plus, Palette, Image as ImageIcon, Trash2 } from "lucide-react";

const FONT_CSS: Record<string, string> = {
  "glacial-bold": "GlacialIndifference-Bold",
  "opensauce-bold": "OpenSauceSans-Bold",
  "opensauce-regular": "OpenSauceSans-Regular",
};

export const AVAILABLE_TOKENS = [
  { tag: "<nama>", label: "Nama Peserta" },
  { tag: "<program>", label: "Nama Program" },
  { tag: "<bagian>", label: "Bagian Magang" },
  { tag: "<sub_bagian>", label: "Sub Bagian" },
  { tag: "<tgl_awal>", label: "Periode Mulai" },
  { tag: "<tgl_akhir>", label: "Periode Akhir" },
  { tag: "<tgl_taken>", label: "Tanggal Lumajang" },
];

const TOKEN_SAMPLES: Record<string, string> = {
  "<nama>": "AHMAD FAUZI",
  "<program>": "Program Magang MBKM",
  "<bagian>": "Quality Assurance",
  "<sub_bagian>": "Sub QA & Konten",
  "<tgl_awal>": "5 Januari 2026",
  "<tgl_akhir>": "31 Maret 2026",
  "<tgl_taken>": "31 Maret 2026",
};

export function resolvePreviewTokens(templateStr: string): string {
  let res = templateStr;
  Object.entries(TOKEN_SAMPLES).forEach(([token, val]) => {
    res = res.replaceAll(token, val);
  });
  return res;
}

export function CanvasPreview({
  elements,
  imageElements = {},
  template,
  data,
  selectedKey,
  selectedImageType,
  onSelectElement,
  onChangeElement,
  onChangeImageElement,
  onChangeData,
  onDeleteImageElement,
}: {
  elements: Record<string, ElementSetting>;
  imageElements?: Record<string, ImageElementSetting>;
  template: Template | null;
  data: Record<string, string>;
  selectedKey?: string | null;
  selectedImageType?: boolean;
  onSelectElement?: (key: string | null, isImage?: boolean) => void;
  onChangeElement?: (key: string, updated: ElementSetting) => void;
  onChangeImageElement?: (key: string, updated: ImageElementSetting) => void;
  onChangeData?: (key: string, text: string) => void;
  onDeleteImageElement?: (key: string) => void;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const W = template?.width ?? 2000;
  const H = template?.height ?? 1414;
  const tplUrl = template ? `/api/sertifikat/templates/${template.id}/image` : null;

  // Drag state & threshold tracking
  const [zoom, setZoom] = React.useState(100);
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const pointerStartRef = React.useRef<{
    svgX: number;
    svgY: number;
    elX: number;
    elY: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Active alignment guidelines state
  const [guides, setGuides] = React.useState<{
    vLines: { x: number; label?: string }[];
    hLines: { y: number; label?: string }[];
  }>({ vLines: [], hLines: [] });

  // Convert browser mouse/touch event coordinates to SVG viewBox (W x H) coordinates
  function getSvgCoords(e: React.PointerEvent): { x: number; y: number } | null {
    if (!svgRef.current) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }

  function handlePointerDown(key: string, isImage: boolean, e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    onSelectElement?.(key, isImage);

    const coords = getSvgCoords(e);
    const item = isImage ? imageElements[key] : elements[key];
    if (coords && item) {
      setActiveKey(key);
      setIsDragging(false);
      pointerStartRef.current = {
        svgX: coords.x,
        svgY: coords.y,
        elX: item.x,
        elY: item.y,
        screenX: e.clientX,
        screenY: e.clientY,
      };
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!activeKey || !pointerStartRef.current) return;
    const start = pointerStartRef.current;

    // Check 3px drag threshold before engaging drag mode
    const distScreen = Math.hypot(e.clientX - start.screenX, e.clientY - start.screenY);
    if (!isDragging && distScreen > 3) {
      setIsDragging(true);
    }

    if (!isDragging && distScreen <= 3) return;

    const coords = getSvgCoords(e);
    if (!coords) return;

    const dx = coords.x - start.svgX;
    const dy = coords.y - start.svgY;

    let newX = Math.round(start.elX + dx);
    let newY = Math.round(start.elY + dy);

    // Magnetic Smart Guides & Snapping (Threshold = 15px)
    const SNAP_THRESHOLD = 15;
    const activeVLines: { x: number; label?: string }[] = [];
    const activeHLines: { y: number; label?: string }[] = [];

    // 1. Center X Alignment (W / 2 = 1000px)
    const centerX = Math.round(W / 2);
    if (Math.abs(newX - centerX) <= SNAP_THRESHOLD) {
      newX = centerX;
      activeVLines.push({ x: centerX, label: `Center X (${centerX})` });
    }

    // 2. Middle Y Alignment (H / 2 = 707px)
    const middleY = Math.round(H / 2);
    if (Math.abs(newY - middleY) <= SNAP_THRESHOLD) {
      newY = middleY;
      activeHLines.push({ y: middleY, label: `Middle Y (${middleY})` });
    }

    // Clamp inside canvas bounds
    newX = Math.max(0, Math.min(W, newX));
    newY = Math.max(0, Math.min(H, newY));

    setGuides({ vLines: activeVLines, hLines: activeHLines });

    if (selectedImageType && onChangeImageElement) {
      const currentImg = imageElements[activeKey];
      if (currentImg) {
        onChangeImageElement(activeKey, { ...currentImg, x: newX, y: newY });
      }
    } else if (onChangeElement) {
      const currentEl = elements[activeKey];
      if (currentEl) {
        onChangeElement(activeKey, { ...currentEl, x: newX, y: newY });
      }
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (activeKey) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveKey(null);
      setIsDragging(false);
      pointerStartRef.current = null;
      setGuides({ vLines: [], hLines: [] });
    }
  }

  const selectedEl = selectedKey ? elements[selectedKey] : null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Preview Canvas Editor
          </h3>
          <p className="text-xs text-zinc-500">
            Klik 1x untuk select/edit · Drag untuk geser (Magnetic Smart Guides aktif)
          </p>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 15))}
            className="flex h-7 w-7 items-center justify-center rounded bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-200"
            title="Zoom Out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min="50"
            max="200"
            step="5"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-20 cursor-pointer accent-indigo-600"
          />
          <span className="w-12 text-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(200, z + 15))}
            className="flex h-7 w-7 items-center justify-center rounded bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-200"
            title="Zoom In"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="relative overflow-auto max-h-[75vh] rounded-lg border border-zinc-200 bg-zinc-100 p-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div
          className="relative mx-auto transition-transform duration-100 ease-out select-none"
          style={{
            aspectRatio: `${W}/${H}`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            width: zoom > 100 ? `${zoom}%` : "100%",
          }}
          onClick={() => onSelectElement?.(null)}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-default shadow-lg"
          >
            <rect width="100%" height="100%" fill="#ffffff" />
            {tplUrl && <image href={tplUrl} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice" />}

            {/* Magnetic Smart Guidelines Overlay */}
            {guides.vLines.map((vl, i) => (
              <g key={`vl-${i}`}>
                <line
                  x1={vl.x}
                  y1="0"
                  x2={vl.x}
                  y2={H}
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeDasharray="8,6"
                  className="opacity-90"
                />
                {vl.label && (
                  <text x={vl.x + 8} y="30" fill="#0891b2" fontSize="22" fontWeight="bold">
                    {vl.label}
                  </text>
                )}
              </g>
            ))}

            {guides.hLines.map((hl, i) => (
              <g key={`hl-${i}`}>
                <line
                  x1="0"
                  y1={hl.y}
                  x2={W}
                  y2={hl.y}
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeDasharray="8,6"
                  className="opacity-90"
                />
                {hl.label && (
                  <text x="30" y={hl.y - 8} fill="#0891b2" fontSize="22" fontWeight="bold">
                    {hl.label}
                  </text>
                )}
              </g>
            ))}

            {/* Image Elements (TTD, Stempel, Logo, QR) */}
            {Object.entries(imageElements).map(([key, img]) => {
              const isSelected = selectedKey === key && selectedImageType;
              const imgX = img.x - img.width / 2;
              const imgY = img.y - img.height / 2;

              return (
                <g
                  key={key}
                  className="group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement?.(key, true);
                  }}
                >
                  {/* Visual Selection Bounding Box */}
                  {isSelected && (
                    <rect
                      x={imgX - 6}
                      y={imgY - 6}
                      width={img.width + 12}
                      height={img.height + 12}
                      fill="rgba(245, 158, 11, 0.08)"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeDasharray="8,6"
                      rx="8"
                      className="pointer-events-none"
                    />
                  )}

                  <image
                    href={img.url}
                    x={imgX}
                    y={imgY}
                    width={img.width}
                    height={img.height}
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      opacity: (img.opacity ?? 100) / 100,
                      cursor: isDragging && activeKey === key ? "grabbing" : "pointer",
                    }}
                    onPointerDown={(e) => handlePointerDown(key, true, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement?.(key, true);
                    }}
                    className="transition-opacity duration-150 hover:opacity-90"
                  />
                </g>
              );
            })}

            {/* Text Elements */}
            {Object.entries(elements).map(([key, el]) => {
              const rawText = data[key] ?? el.sample_text ?? key;
              const text = resolvePreviewTokens(rawText);
              const family = FONT_CSS[el.font] ?? el.font;
              const isSelected = selectedKey === key && !selectedImageType;

              // Approximating bounding box for selection indicator
              const approxWidth = Math.max(80, text.length * el.size * 0.52);
              const approxHeight = el.size * 1.2;
              const bboxX = el.x - approxWidth / 2;
              const bboxY = el.y - el.size * 0.85;

              return (
                <g
                  key={key}
                  className="group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement?.(key, false);
                  }}
                >
                  {/* Visual Selection Bounding Box */}
                  {isSelected && (
                    <rect
                      x={bboxX - 10}
                      y={bboxY - 6}
                      width={approxWidth + 20}
                      height={approxHeight + 12}
                      fill="rgba(99, 102, 241, 0.08)"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeDasharray="8,6"
                      rx="8"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Text Element */}
                  <text
                    x={el.x}
                    y={el.y}
                    textAnchor="middle"
                    fontSize={el.size}
                    fill={el.color}
                    fontFamily={family}
                    style={{
                      paintOrder: "stroke",
                      stroke: "#ffffff",
                      strokeWidth: Math.max(2, el.size * 0.04),
                      cursor: isDragging && activeKey === key ? "grabbing" : "pointer",
                    }}
                    onPointerDown={(e) => handlePointerDown(key, false, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement?.(key, false);
                    }}
                    className="transition-opacity duration-150 hover:opacity-90"
                  >
                    {text}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Floating Canvas Quick Controls Overlay for Image Elements */}
      {selectedKey && selectedImageType && imageElements[selectedKey] && onChangeImageElement && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-950 dark:text-amber-200">
            <ImageIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>{imageElements[selectedKey].label || selectedKey}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <span>X:</span>
            <input
              type="number"
              value={imageElements[selectedKey].x}
              onChange={(e) =>
                onChangeImageElement(selectedKey, {
                  ...imageElements[selectedKey],
                  x: Number(e.target.value),
                })
              }
              className="h-8 w-16 rounded border border-zinc-300 bg-white px-1.5 text-center text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <span>Y:</span>
            <input
              type="number"
              value={imageElements[selectedKey].y}
              onChange={(e) =>
                onChangeImageElement(selectedKey, {
                  ...imageElements[selectedKey],
                  y: Number(e.target.value),
                })
              }
              className="h-8 w-16 rounded border border-zinc-300 bg-white px-1.5 text-center text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Width / Height Resizing */}
          <div className="flex items-center gap-2 border-l border-amber-200 pl-3 dark:border-amber-800 text-xs">
            <span>W:</span>
            <input
              type="number"
              value={imageElements[selectedKey].width}
              onChange={(e) =>
                onChangeImageElement(selectedKey, {
                  ...imageElements[selectedKey],
                  width: Math.max(10, Number(e.target.value)),
                })
              }
              className="h-8 w-16 rounded border border-zinc-300 bg-white px-1 text-center text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <span>H:</span>
            <input
              type="number"
              value={imageElements[selectedKey].height}
              onChange={(e) =>
                onChangeImageElement(selectedKey, {
                  ...imageElements[selectedKey],
                  height: Math.max(10, Number(e.target.value)),
                })
              }
              className="h-8 w-16 rounded border border-zinc-300 bg-white px-1 text-center text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {onDeleteImageElement && (
            <button
              type="button"
              onClick={() => onDeleteImageElement(selectedKey)}
              className="ml-auto flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus Gambar
            </button>
          )}
        </div>
      )}

      {/* Floating Canvas Quick Controls Overlay */}
      {selectedKey && selectedEl && onChangeElement && (
        <div className="mt-3 space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
              <Move className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="capitalize">{selectedKey}</span>
            </div>

            {/* Sample Text Direct Input */}
            {onChangeData && (
              <div className="flex min-w-[220px] flex-1 items-center gap-1.5">
                <Type className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <input
                  type="text"
                  value={data[selectedKey] ?? selectedEl.sample_text ?? ""}
                  onChange={(e) => onChangeData(selectedKey, e.target.value)}
                  placeholder="Edit redaksi teks & token..."
                  className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            )}

            {/* Font Selector */}
            <select
              value={selectedEl.font}
              onChange={(e) => onChangeElement(selectedKey, { ...selectedEl, font: e.target.value })}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {Object.entries(FONT_KEYS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {key} ({meta.file})
                </option>
              ))}
            </select>

            {/* Position X / Y */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <span>X:</span>
              <input
                type="number"
                value={selectedEl.x}
                onChange={(e) => onChangeElement(selectedKey, { ...selectedEl, x: Number(e.target.value) })}
                className="h-8 w-16 rounded border border-zinc-300 bg-white px-1.5 text-center text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <span>Y:</span>
              <input
                type="number"
                value={selectedEl.y}
                onChange={(e) => onChangeElement(selectedKey, { ...selectedEl, y: Number(e.target.value) })}
                className="h-8 w-16 rounded border border-zinc-300 bg-white px-1.5 text-center text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-1 border-l border-indigo-200 pl-3 dark:border-indigo-800">
              <button
                type="button"
                onClick={() => onChangeElement(selectedKey, { ...selectedEl, size: Math.max(10, selectedEl.size - 2) })}
                className="flex h-8 w-8 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                title="Kecilkan ukuran"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                value={selectedEl.size}
                onChange={(e) => onChangeElement(selectedKey, { ...selectedEl, size: Number(e.target.value) })}
                className="h-8 w-14 rounded border border-zinc-300 bg-white px-1 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => onChangeElement(selectedKey, { ...selectedEl, size: selectedEl.size + 2 })}
                className="flex h-8 w-8 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                title="Besarkan ukuran"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Color Picker */}
            <div className="flex items-center gap-1.5 border-l border-indigo-200 pl-3 dark:border-indigo-800">
              <Palette className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <input
                type="color"
                value={selectedEl.color}
                onChange={(e) => onChangeElement(selectedKey, { ...selectedEl, color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border border-zinc-300 bg-transparent dark:border-zinc-700"
              />
            </div>
          </div>

          {/* Token Shortcut Palette Bar */}
          {onChangeData && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-indigo-200/60 pt-2 text-[11px] dark:border-indigo-900/40">
              <span className="font-semibold text-indigo-900 dark:text-indigo-300">Sisipkan Token:</span>
              {AVAILABLE_TOKENS.map((tk) => (
                <button
                  key={tk.tag}
                  type="button"
                  onClick={() => {
                    const currentVal = data[selectedKey] ?? selectedEl.sample_text ?? "";
                    onChangeData(selectedKey, `${currentVal} ${tk.tag}`.trim());
                  }}
                  className="rounded-md border border-indigo-300 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 dark:hover:bg-indigo-800"
                  title={`Klik untuk menyisipkan ${tk.label}`}
                >
                  {tk.tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-[11px] text-zinc-400">
        Preview 1:1 kanvas {W}×{H}. Geser teks dengan kursor mouse untuk mengatur tata letak secara visual.
      </p>
    </div>
  );
}
