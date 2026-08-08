-- Fix QR code position: kiri bawah, rapih
-- Template 2000x1414, QR di (250, 1150) ukuran 120x120

UPDATE cert_settings
SET settings = jsonb_set(
  settings,
  '{image_elements,qrcode}',
  '{
    "label": "QR Verifikasi",
    "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "x": 250,
    "y": 1150,
    "width": 120,
    "height": 120,
    "opacity": 100
  }'::jsonb
)
WHERE id = (SELECT id FROM cert_settings LIMIT 1);

-- Verify
SELECT 
  settings->'image_elements'->'qrcode'->>'x' as x,
  settings->'image_elements'->'qrcode'->>'y' as y,
  settings->'image_elements'->'qrcode'->>'width' as width,
  settings->'image_elements'->'qrcode'->>'height' as height
FROM cert_settings;
