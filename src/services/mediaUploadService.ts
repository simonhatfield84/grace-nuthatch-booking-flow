import { supabase } from "@/integrations/supabase/client";

interface ImageVariant {
  w: number;
  h: number;
  path: string;
}

async function resizeImage(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const aspectRatio = img.height / img.width;
      const width = Math.min(maxWidth, img.width);
      const height = Math.round(width * aspectRatio);

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/webp',
        0.85
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadMediaWithVariants(
  venueId: string,
  type: 'hero' | 'about',
  file: File,
  sortOrder: number = 0
): Promise<void> {
  const bucket = type === 'hero' ? 'brand-hero' : 'brand-about';
  const timestamp = Date.now();
  const baseName = `${venueId}/${timestamp}`;

  // Upload original (or resized to 1600 if larger)
  const originalBlob = file.size > 3 * 1024 * 1024 
    ? await resizeImage(file, 1600)
    : file;

  const originalPath = `${baseName}-original.webp`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(originalPath, originalBlob, {
      contentType: 'image/webp',
      upsert: true
    });

  if (uploadError) throw uploadError;

  // Get original dimensions
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = URL.createObjectURL(originalBlob);
  });

  const originalWidth = img.width;
  const originalHeight = img.height;

  // Generate variants
  const variantWidths = [1200, 800, 400].filter(w => w < originalWidth);
  const variants: ImageVariant[] = [];

  for (const width of variantWidths) {
    const variantBlob = await resizeImage(file, width);
    const variantPath = `${baseName}-${width}w.webp`;

    const { error: variantError } = await supabase.storage
      .from(bucket)
      .upload(variantPath, variantBlob, {
        contentType: 'image/webp',
        upsert: true
      });

    if (variantError) throw variantError;

    const aspectRatio = originalHeight / originalWidth;
    variants.push({
      w: width,
      h: Math.round(width * aspectRatio),
      path: variantPath
    });
  }

  // Insert into venue_media
  // @ts-ignore - Types will be regenerated after migration
  const { error: dbError } = await supabase
    .from('venue_media')
    .insert({
      venue_id: venueId,
      type,
      path: originalPath,
      width: originalWidth,
      height: originalHeight,
      variants,
      sort_order: sortOrder
    });

  if (dbError) throw dbError;
}

export async function uploadLogo(
  venueId: string,
  file: File,
  variant: 'light' | 'dark'
): Promise<string> {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `${venueId}/${timestamp}-${variant}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('brand-logos')
    .upload(path, file, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('brand-logos').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteMedia(mediaId: string): Promise<void> {
  // Get media record first to delete from storage
  // @ts-ignore - Types will be regenerated after migration
  const { data: media, error: fetchError } = await supabase
    .from('venue_media')
    .select('path, variants, type')
    .eq('id', mediaId)
    .single();

  if (fetchError) throw fetchError;

  const bucket = (media as any).type === 'hero' ? 'brand-hero' : 'brand-about';

  // Delete all files from storage
  const filesToDelete = [(media as any).path];
  if ((media as any).variants) {
    filesToDelete.push(...(media as any).variants.map((v: ImageVariant) => v.path));
  }

  const { error: storageError } = await supabase.storage
    .from(bucket)
    .remove(filesToDelete);

  if (storageError) console.error('Storage deletion error:', storageError);

  // Delete from database
  // @ts-ignore - Types will be regenerated after migration
  const { error: dbError } = await supabase
    .from('venue_media')
    .delete()
    .eq('id', mediaId);

  if (dbError) throw dbError;
}

export async function reorderMedia(
  mediaId: string,
  newSortOrder: number
): Promise<void> {
  // @ts-ignore - Types will be regenerated after migration
  const { error } = await supabase
    .from('venue_media')
    .update({ sort_order: newSortOrder })
    .eq('id', mediaId);

  if (error) throw error;
}
