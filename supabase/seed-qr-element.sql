-- Seed QR code element ke cert_settings (jalankan sekali di Supabase SQL editor)
-- Posisi: kanan bawah (1600, 1200) ukuran 150x150 — aman untuk template 2000x1414

UPDATE cert_settings
SET settings = jsonb_set(
  settings,
  '{image_elements,qrcode}',
  '{
    "label": "QR Verifikasi",
    "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "x": 1600,
    "y": 1200,
    "width": 150,
    "height": 150,
    "opacity": 1
  }'::jsonb
)
WHERE id = (SELECT id FROM cert_settings LIMIT 1);

-- Verify
SELECT settings->'image_elements'->'qrcode' FROM cert_settings;
