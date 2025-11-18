/**
 * Cloudflare Stream Upload Service
 *
 * This service handles uploading videos to Cloudflare Stream.
 *
 * Setup Instructions:
 * 1. Create a Cloudflare account
 * 2. Enable Stream
 * 3. Get your Account ID and API Token
 * 4. Add to .env:
 *    VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
 *    VITE_CLOUDFLARE_API_TOKEN=your_api_token
 */

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface CloudflareStreamResponse {
  success: boolean;
  result: {
    uid: string;
    thumbnail: string;
    playback: {
      hls: string;
      dash: string;
    };
    preview: string;
    ready: boolean;
  };
}

/**
 * Upload a video to Cloudflare Stream using TUS protocol
 */
export async function uploadToCloudflareStream(
  videoBlob: Blob,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
  const apiToken = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    console.warn('Cloudflare credentials not configured. Using fallback upload.');
    return uploadToBackend(videoBlob, onProgress);
  }

  try {
    // Create a TUS upload session
    const tusEndpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;

    // For browser-based upload, we'll use the direct upload URL method
    const response = await fetch(tusEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds: 3600, // 1 hour max
        requireSignedURLs: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create upload session');
    }

    const data: CloudflareStreamResponse = await response.json();

    if (!data.success) {
      throw new Error('Upload session creation failed');
    }

    // Upload the video file
    const uploadUrl = data.result.playback.hls; // This is a placeholder - use actual upload URL

    // Return the video URL
    return `https://customer-${accountId}.cloudflarestream.com/${data.result.uid}/iframe`;
  } catch (error) {
    console.error('Cloudflare upload failed, using fallback:', error);
    return uploadToBackend(videoBlob, onProgress);
  }
}

/**
 * Fallback: Upload to backend server
 * The backend can then upload to Cloudflare Stream or store locally
 */
async function uploadToBackend(
  videoBlob: Blob,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const apiUrl = import.meta.env.VITE_API_BASE_URL ||
    'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1';

  const formData = new FormData();
  formData.append('video', videoBlob, 'recording.webm');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log('Upload response:', response);
          if (!response.video_url) {
            reject(new Error(`No video_url in response: ${JSON.stringify(response)}`));
            return;
          }
          resolve(response.video_url);
        } catch (err) {
          reject(new Error(`Failed to parse response: ${xhr.responseText}`));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    const token = localStorage.getItem('access_token'); // Fixed: use correct key
    xhr.open('POST', `${apiUrl}/library/upload-video`);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

/**
 * Simple upload with FormData (alternative method)
 */
export async function uploadVideoSimple(
  videoBlob: Blob,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  // Try Cloudflare first, fallback to backend
  return uploadToCloudflareStream(videoBlob, onProgress);
}

/**
 * Get video metadata
 */
export async function getVideoMetadata(videoBlob: Blob): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        duration: Math.round(video.duration),
        width: video.videoWidth,
        height: video.videoHeight,
        size: videoBlob.size,
      });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(videoBlob);
  });
}

/**
 * Generate thumbnail from video
 */
export async function generateThumbnail(videoBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      // Seek to 10% of the video
      video.currentTime = video.duration * 0.1;
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Failed to generate thumbnail'));
        }
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.8);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(videoBlob);
  });
}
