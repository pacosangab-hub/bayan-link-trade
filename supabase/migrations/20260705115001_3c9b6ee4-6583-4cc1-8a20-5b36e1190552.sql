
-- product-images: public read, authenticated write
CREATE POLICY "product-images public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "product-images auth write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND owner = auth.uid());
CREATE POLICY "product-images owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND owner = auth.uid());
CREATE POLICY "product-images owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND owner = auth.uid());

-- Private buckets: only owner can read/write their files
CREATE POLICY "private buckets owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('business-documents','offer-attachments','chat-attachments','proof-of-delivery','verification-documents')
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "private buckets auth write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('business-documents','offer-attachments','chat-attachments','proof-of-delivery','verification-documents')
    AND owner = auth.uid());
CREATE POLICY "private buckets owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('business-documents','offer-attachments','chat-attachments','proof-of-delivery','verification-documents')
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')));
