-- 005 · Lectura de buckets privados para moderadores (y dueños)
-- Para crear signed URLs de archivos privados (verification-docs y
-- payment-receipts), el usuario necesita permiso de SELECT sobre
-- storage.objects bajo RLS. El 003 sólo habilitó la SUBIDA (insert); acá
-- habilitamos la LECTURA para quien subió el archivo (owner) y para los
-- moderadores (vía public.is_moderator()). El panel de moderación los abre
-- siempre con signed URLs temporales, nunca con URL pública.

-- Comprobantes de pago
create policy "leer_comprobante" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-receipts'
    and (owner = auth.uid() or public.is_moderator())
  );

-- Documentos de verificación
create policy "leer_documento_verificacion" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verification-docs'
    and (owner = auth.uid() or public.is_moderator())
  );
