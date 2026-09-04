-- ===========================
-- REPORTS: el cliente puede agregar información a un reporte abierto
-- (Batch 2 - chat interno v1). El admin responde con provider_response;
-- el dueño del reporte agrega info con client_reply + client_replied_at.
-- ===========================
alter table public.reports add column if not exists client_reply text;
alter table public.reports add column if not exists client_replied_at timestamptz;
