-- Reviewer note on leave requests (e.g. why a request was rejected), shown to
-- the employee and included in their status notification.
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS review_note text;

-- One notification per status change, in Indonesian, with the reviewer note.
CREATE OR REPLACE FUNCTION public.trg_leave_requests_notify_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  type_label text;
  status_label text;
  msg text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    type_label := CASE NEW.leave_type
      WHEN 'Annual Leave' THEN 'cuti tahunan'
      WHEN 'Sick Leave' THEN 'izin sakit'
      WHEN 'WFH' THEN 'WFH'
      WHEN 'Work From Home' THEN 'WFH'
      ELSE COALESCE(NEW.leave_type, 'cuti')
    END;
    status_label := CASE NEW.status::text
      WHEN 'approved' THEN 'disetujui'
      WHEN 'rejected' THEN 'ditolak'
      WHEN 'pending' THEN 'menunggu persetujuan'
      ELSE NEW.status::text
    END;

    msg := 'Pengajuan ' || type_label || ' kamu ' || status_label || '.';
    IF NEW.review_note IS NOT NULL AND length(trim(NEW.review_note)) > 0 THEN
      msg := msg || ' Catatan: ' || NEW.review_note;
    END IF;

    PERFORM public.create_notification(
      NEW.user_id,
      'Pengajuan ' || status_label,
      msg,
      'leave_status',
      '/leave'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- handle_leave_notification sent a second, near-identical notification for
-- every status change; trg_leave_requests_notify_update covers it.
DROP TRIGGER IF EXISTS on_leave_status_change ON public.leave_requests;
