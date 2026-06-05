-- Add the Wasender numeric session id column (management API URLs).
-- Needed by the WhatsApp connect/QR flow. Idempotent — safe if already present.

alter table agents add column if not exists wasender_session_ref text;

-- Backfill the FasoStock agent's known session ref (already connected).
update agents
set wasender_session_ref = '89993'
where wasender_session_id = '729e2b638510546a77f97e82f1f52ca81fb9d694e68b59943077bf2670018858'
  and wasender_session_ref is null;
