-- ============================================================
-- Sincronizar products.stock con el inventario real disponible
-- ============================================================
-- Contexto de seguridad / consistencia:
--   products.stock es el valor que la tienda muestra y que /buy valida
--   ("Stock insuficiente"), pero la fuente de verdad de cuentas listas para
--   entregar es la tabla inventory (filas con status = 'Disponible').
--   Antes de esta corrección, agregar/editar/eliminar cuentas de inventario
--   (incluida la importación STGLIAK) NO actualizaba products.stock: un
--   producto podía tener cuentas disponibles pero aparecer AGOTADO y/o
--   rechazar compras.
--
--   A partir de ahora la edge function distrito-api sincroniza products.stock
--   automáticamente tras cada alta/baja/edición de inventario. Este backfill
--   corrige los valores existentes para que coincidan con el inventario real.
-- ============================================================

update public.products p
set stock = (
  select count(*)::int
  from public.inventory i
  where i.product_id = p.id
    and i.status = 'Disponible'
);

-- Comentario de trazabilidad (idempotente y seguro de re-ejecutar)
comment on column public.products.stock is
  'Stock visible en tienda. Se mantiene sincronizado con inventory (status Disponible) via edge function distrito-api.';
