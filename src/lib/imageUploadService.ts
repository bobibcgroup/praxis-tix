import { supabase } from './supabase';

/**
 * Helper service to convert images to URLs that Replicate can access
 * Replicate models work best with publicly accessible URLs
 * We'll upload to Supabase Storage if available, otherwise use data URLs
 */

/**
 * Upload image to Supabase Storage and return public URL
 */
async function uploadToSupabaseStorage(imageData: string, fileName: string): Promise<string | null> {
  if (!supabase) {
    console.warn('[IMAGE] Supabase not configured, skipping upload');
    return null;
  }

  try {
    console.log(`[IMAGE] Converting image data to blob for ${fileName}...`);
    // Convert data URL to blob
    let blob: Blob;
    if (imageData.startsWith('data:')) {
      const response = await fetch(imageData);
      blob = await response.blob();
      console.log(`[IMAGE] Converted data URL to blob: ${blob.size} bytes, type: ${blob.type}`);
    } else {
      // Assume base64
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'image/jpeg' });
      console.log(`[IMAGE] Converted base64 to blob: ${blob.size} bytes`);
    }

    // Upload to Supabase Storage (public bucket)
    // Note: Make sure 'images' bucket exists in Supabase Storage
    const fileExt = fileName.split('.').pop() || 'jpg';
    const filePath = `try-on/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    console.log(`[IMAGE] Uploading to Supabase Storage: ${filePath}`);
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (error) {
      // Handle bucket not found gracefully
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        console.warn('[IMAGE] Supabase Storage bucket "images" not found. Please create it in Supabase Dashboard > Storage.');
      } else if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        console.warn('[IMAGE] Supabase Storage RLS policy blocking upload. Please configure bucket policies in Supabase Dashboard > Storage > images > Policies.');
      } else {
        console.error('[IMAGE] Supabase upload error:', error);
      }
      return null;
    }

    console.log(`[IMAGE] Upload successful, getting public URL...`);
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log(`[IMAGE] Public URL obtained: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[IMAGE] Error uploading to Supabase:', error);
    return null;
  }
}

/**
 * Convert base64/data URL to a URL that can be used by Replicate
 * Priority: Public URL > Supabase Storage > Data URL
 */
export async function prepareImageForReplicate(imageData: string, fileName = 'image.jpg'): Promise<string> {
  console.log(`[IMAGE] Preparing image for Replicate:`, {
    fileName,
    dataLength: imageData.length,
    isUrl: imageData.startsWith('http://') || imageData.startsWith('https://'),
    isDataUrl: imageData.startsWith('data:'),
    isRelativePath: imageData.startsWith('/'),
    preview: imageData.substring(0, 50)
  });

  // If it's already a full URL, return as-is
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    console.log(`[IMAGE] Already a URL, returning as-is`);
    return imageData;
  }

  // If it's a relative path, make it absolute
  if (imageData.startsWith('/')) {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://your-app.vercel.app';
    const fullUrl = `${baseUrl}${imageData}`;
    console.log(`[IMAGE] Converted relative path to absolute: ${fullUrl}`);
    return fullUrl;
  }

  // Try uploading to Supabase Storage first (better for Replicate)
  console.log(`[IMAGE] Attempting to upload to Supabase Storage...`);
  const supabaseUrl = await uploadToSupabaseStorage(imageData, fileName);
  if (supabaseUrl) {
    console.log(`[IMAGE] Successfully uploaded to Supabase Storage: ${supabaseUrl}`);
    return supabaseUrl;
  }

  // Fallback to data URL (Replicate accepts these but they can be large)
  if (imageData.startsWith('data:')) {
    console.warn(`[IMAGE] Using data URL (large size: ${imageData.length} bytes). Consider setting up Supabase Storage for better performance.`);
    return imageData;
  }

  // If it's base64 without data: prefix, add it
  if (imageData.length > 100 && !imageData.includes(' ')) {
    console.warn(`[IMAGE] Using base64 data URL (${imageData.length} bytes). Consider setting up Supabase Storage for better performance.`);
    return `data:image/jpeg;base64,${imageData}`;
  }

  // Return as-is if we can't determine format
  console.warn(`[IMAGE] Unknown format, returning as-is`);
  return imageData;
}

