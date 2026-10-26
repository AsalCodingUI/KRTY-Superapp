-- Example task for the Milxa project board: a real-looking card with a
-- description, subtasks (some done) and a short comment thread with
-- @mentions, so the task dialog can be previewed with proper content.
-- Run AFTER project_tasks_board.sql. Safe to re-run (fixed ids, upserts).
-- The seeded mentions would notify real people, so those notifications are
-- removed again at the end.

DO $$
DECLARE
  v_project constant uuid := '7b583164-9349-4cb9-afe8-ef62d217eb90'; -- Milxa
  v_rizal   constant uuid := '4526a930-fb6d-41d4-8180-d1e8cf080b4d'; -- Rizal Dwi Artanto
  v_rezah   constant uuid := 'b571b420-33e2-4945-b267-4c87a64af65c'; -- Rezah Aurellia
  v_task    constant uuid := 'a1f0c0de-0000-4000-8000-000000000001';
BEGIN
  INSERT INTO public.project_tasks
    (id, project_id, title, description, status, assignee_id, due_date, created_by, created_at)
  VALUES (
    v_task, v_project,
    'Finalisasi logo & brand kit Milxa',
    E'Finalisasi logo terpilih (arah konsep B) dan siapkan brand kit untuk diserahkan ke klien.\n\n'
    'Scope:\n'
    '• Logo utama, versi horizontal, dan ikon (app icon & favicon)\n'
    '• Varian warna: full color, mono hitam, mono putih\n'
    '• Format: SVG, PNG (1x/2x/3x), PDF untuk cetak\n\n'
    'Feedback klien terakhir: hijau dibuat sedikit lebih hangat, jarak huruf "MILXA" dilonggarkan.\n'
    'Referensi: folder Library → Logo / Final.',
    'review', v_rizal, (now() AT TIME ZONE 'Asia/Jakarta')::date + 2, v_rezah,
    now() - interval '3 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description,
    status = EXCLUDED.status, assignee_id = EXCLUDED.assignee_id,
    due_date = EXCLUDED.due_date;

  INSERT INTO public.project_tasks
    (id, project_id, parent_id, title, status, assignee_id, created_by, created_at)
  VALUES
    ('a1f0c0de-0000-4000-8000-000000000011', v_project, v_task, 'Revisi warna hijau sesuai feedback klien', 'done', v_rizal, v_rezah, now() - interval '3 days'),
    ('a1f0c0de-0000-4000-8000-000000000012', v_project, v_task, 'Longgarkan letter-spacing wordmark', 'done', v_rizal, v_rezah, now() - interval '3 days' + interval '1 minute'),
    ('a1f0c0de-0000-4000-8000-000000000013', v_project, v_task, 'Export SVG, PNG 1x/2x/3x, dan PDF', 'done', v_rizal, v_rezah, now() - interval '3 days' + interval '2 minutes'),
    ('a1f0c0de-0000-4000-8000-000000000014', v_project, v_task, 'Buat app icon & favicon', 'todo', v_rizal, v_rezah, now() - interval '3 days' + interval '3 minutes'),
    ('a1f0c0de-0000-4000-8000-000000000015', v_project, v_task, 'Susun halaman brand kit (PDF)', 'todo', v_rezah, v_rezah, now() - interval '3 days' + interval '4 minutes')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.project_task_comments (id, task_id, author_id, body, mentions, created_at)
  VALUES
    ('a1f0c0de-0000-4000-8000-000000000101', v_task, v_rezah,
     E'@Rizal Dwi Artanto feedback dari klien udah masuk: hijaunya minta sedikit lebih hangat, dan jarak huruf di wordmark dilonggarin. Sisanya mereka udah oke 👍',
     ARRAY[v_rizal], now() - interval '2 days 5 hours'),
    ('a1f0c0de-0000-4000-8000-000000000102', v_task, v_rizal,
     E'Siap. Aku coba geser ke #3FA66B, kontrasnya di atas putih masih aman (AA). Letter-spacing aku naikin +20. Preview udah aku upload ke Library → Logo / Final.',
     ARRAY[]::uuid[], now() - interval '2 days 2 hours'),
    ('a1f0c0de-0000-4000-8000-000000000103', v_task, v_rezah,
     E'Udah aku cek, jauh lebih enak. Export semua format juga udah lengkap. Tinggal app icon sama favicon ya, @Rizal Dwi Artanto, terus aku rapihin halaman brand kit-nya.',
     ARRAY[v_rizal], now() - interval '20 hours'),
    ('a1f0c0de-0000-4000-8000-000000000104', v_task, v_rizal,
     E'Oke, app icon aku kerjain hari ini. Status aku taruh di Review dulu biar @Rezah Aurellia bisa cek versi final sebelum dikirim ke klien.',
     ARRAY[v_rezah], now() - interval '3 hours')
  ON CONFLICT (id) DO NOTHING;

  -- Seed data only: don't ping real people about it.
  DELETE FROM public.notifications
  WHERE type = 'mention' AND link LIKE '%' || v_task::text || '%';
END $$;
