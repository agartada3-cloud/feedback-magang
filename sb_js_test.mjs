import { createClient } from '@supabase/supabase-js';
const url = 'https://eyjcqbjdfrktuniuoixb.supabase.co';
const pub = 'sb_publishable_5-5pjpqUpNSWPSRZQ15KBg_RYwXGcaq';
const anon = createClient(url, pub);
const { data, error } = await anon.from('submissions').insert({
  nama_lengkap: 'Test SupabaseJS Anon',
  no_wa: '081299988877', email: 'sbjs@test.id',
  universitas: 'Univ', jurusan: 'TI', jenis_program: 'Magang',
  periode_mulai: '2026-06-01', periode_akhir: '2026-08-31', bagian: 'Pengolahan',
  sub_bagian: 'Sub Pengolahan', nama_program_surat: 'Magang', rating: 'Baik',
  manfaat: 'Tes supabase-js anon insert setelah schema cache reload.'
}).select('*').single();
console.log('supabase-js anon insert:', error ? 'ERR: ' + JSON.stringify(error).slice(0, 200) : 'OK ref=' + data.ref);
