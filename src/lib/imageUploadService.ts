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
    console.warn('Supabase not configured, skipping upload');
    return null;
  }

  try {
    // Convert data URL to blob
    let blob: Blob;
    if (imageData.startsWith('data:')) {
      const response = await fetch(imageData);
      blob = await response.blob();
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
    }

    // Upload to Supabase Storage (public bucket)
    // Note: Make sure 'images' bucket exists in Supabase Storage
    const fileExt = fileName.split('.').pop() || 'jpg';
    const filePath = `try-on/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (error) {
      // Handle bucket not found gracefully
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        console.warn('Supabase Storage bucket "images" not found. Please create it in Supabase Dashboard > Storage.');
      } else if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        console.warn('Supabase Storage RLS policy blocking upload. Please configure bucket policies in Supabase Dashboard > Storage > images > Policies.');
      } else {
        console.error('Supabase upload error:', error);
      }
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    return null;
  }
}

/**
 * Convert base64/data URL to a URL that can be used by Replicate
 * Priority: Public URL > Supabase Storage > Data URL
 */
export async function prepareImageForReplicate(imageData: string, fileName = 'image.jpg'): Promise<string> {
  // If it's already a full URL, return as-is
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return imageData;
  }

  // If it's a relative path, make it absolute
  if (imageData.startsWith('/')) {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://your-app.vercel.app';
    return `${baseUrl}${imageData}`;
  }

  // Try uploading to Supabase Storage first (better for Replicate)
  const supabaseUrl = await uploadToSupabaseStorage(imageData, fileName);
  if (supabaseUrl) {
    console.log('Image uploaded to Supabase Storage:', supabaseUrl);
    return supabaseUrl;
  }

  // Fallback to data URL (Replicate accepts these but they can be large)
  if (imageData.startsWith('data:')) {
    console.warn('Using data URL (large size). Consider setting up Supabase Storage for better performance.');
    return imageData;
  }

  // If it's base64 without data: prefix, add it
  if (imageData.length > 100 && !imageData.includes(' ')) {
    console.warn('Using base64 data URL. Consider setting up Supabase Storage for better performance.');
    return `data:image/jpeg;base64,${imageData}`;
  }

  // Return as-is if we can't determine format
  return imageData;
}

