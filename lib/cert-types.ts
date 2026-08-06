// types/index.ts — Certificate Generator

export interface ElementSetting {
  /** center-x di kanvas base (default 2000x1414) */
  x: number;
  /** center-y */
  y: number;
  /** font size px */
  size: number;
  /** hex color */
  color: string;
  /** font key: "glacial-bold" | "opensauce-bold" | "opensauce-regular" | custom id */
  font: string;
  /** auto-shrink khusus nama */
  auto_shrink?: boolean;
  /** min size saat shrink, default 8 */
  min_size?: number;
}

export interface Segment {
  text: string;
  font: string;
}

export interface ElementDef {
  /** segmen teks dinamis memakai key VAR_* (bukan teks final) */
  segments: Segment[];
}

export interface Settings {
  id: string;
  template_id: string;
  /** Record<elementKey, ElementSetting> — keys: nama, program, bagian, periode, taken */
  elements: Record<string, ElementSetting>;
  upscale_default: number; // 1|2|3
  zoom_default: number; // persen
  updated_at: string;
}

export interface Template {
  id: string;
  nama: string;
  storage_path: string;
  width: number;
  height: number;
  is_default: boolean;
}

export interface CertInputRow {
  feedback_id: string;
  nama: string;
  program: string;
  bagian: string;
  sub_bagian: string | null;
  tgl_awal: string; // YYYY-MM-DD
  tgl_akhir: string;
  created_at: string;
}

export interface CertGenerated {
  id: string;
  feedback_id: string;
  template_id: string;
  scale: number;
  storage_path: string;
  status: "ok" | "error";
  error_msg: string | null;
  created_at: string;
}

export interface Preset {
  id: string;
  nama: string;
  template_id: string;
  elements: Record<string, ElementSetting>;
  created_at: string;
}
