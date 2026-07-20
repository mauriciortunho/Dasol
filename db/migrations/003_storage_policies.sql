-- 003 · Políticas de Storage para subir imágenes
-- Storage tiene su propia RLS sobre storage.objects. Los buckets nuevos no
-- traen políticas, así que un usuario autenticado no puede subir hasta
-- definirlas. Buckets ya creados desde el panel:
--   campaign-images (público), verification-docs y payment-receipts (privados).
-- Acá sólo habilitamos la SUBIDA (insert) para usuarios autenticados. La
-- lectura de los privados (panel de moderación) se resolverá en ese paso con
-- URLs firmadas / políticas de select para dueño y moderadores.

-- Portada y QR de campañas (bucket público)
create policy "subir_portada_qr" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'campaign-images');

-- Comprobantes de pago (bucket privado)
create policy "subir_comprobante" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-receipts');

-- Documentos de verificación (bucket privado)
create policy "subir_documento_verificacion" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verification-docs');
