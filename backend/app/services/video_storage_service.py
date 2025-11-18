"""
Video Storage Service
Handles video upload, storage, and streaming using multiple backends:
1. Azure Blob Storage (Primary) - for direct video storage
2. Cloudflare Stream (Alternative) - for optimized video streaming
3. External URLs (YouTube, Vimeo, etc.) - for linked content
"""

import os
import io
import requests
from typing import Dict, Optional, BinaryIO
import logging
from datetime import datetime, timedelta
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Try to import Azure SDK
try:
    from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False
    logger.warning("azure-storage-blob not installed. Azure Blob Storage will not be available.")


class VideoStorageService:
    """
    Service for managing video storage using multiple backends

    Storage Backends:

    1. Azure Blob Storage (Primary):
       - $0.0184/GB/month for standard storage
       - $0.087/GB egress (first 10TB)
       - Good for large video files
       - Supports video streaming with CDN
       - Already integrated with Azure ecosystem

    2. Cloudflare Stream (Alternative):
       - $1/1000 minutes stored
       - $1/1000 minutes delivered
       - Optimized for video streaming
       - Automatic thumbnails and encoding
       - Global CDN

    3. External URLs (YouTube, Vimeo, etc.):
       - Free hosting
       - No storage costs
       - Good for public educational content
    """

    def __init__(self):
        # Azure Blob Storage
        self.azure_connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        self.azure_container_name = os.getenv("AZURE_STORAGE_CONTAINER", "videos")
        self.azure_cdn_endpoint = os.getenv("AZURE_CDN_ENDPOINT")

        if AZURE_AVAILABLE and self.azure_connection_string:
            try:
                self.blob_service_client = BlobServiceClient.from_connection_string(
                    self.azure_connection_string
                )
                logger.info("Azure Blob Storage initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Azure Blob Storage: {str(e)}")
                self.blob_service_client = None
        else:
            self.blob_service_client = None
            if not AZURE_AVAILABLE:
                logger.warning("Azure SDK not available - install azure-storage-blob")
            else:
                logger.warning("Azure Blob Storage credentials not configured")

        # Cloudflare Stream
        self.account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        self.api_token = os.getenv("CLOUDFLARE_STREAM_API_TOKEN")
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/stream"

        if not self.account_id or not self.api_token:
            logger.warning("Cloudflare Stream credentials not configured")

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Cloudflare API requests"""
        return {
            "Authorization": f"Bearer {self.api_token}",
        }

    def is_external_url(self, url: str) -> bool:
        """
        Check if URL is from an external video hosting service

        Args:
            url: The URL to check

        Returns:
            True if URL is from YouTube, Vimeo, etc.
        """
        external_domains = [
            "youtube.com",
            "youtu.be",
            "vimeo.com",
            "dailymotion.com",
            "wistia.com",
            "loom.com",
            "streamable.com"
        ]

        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            return any(ext_domain in domain for ext_domain in external_domains)
        except Exception:
            return False

    def upload_video(
        self,
        video_file: BinaryIO,
        filename: str,
        user_id: str,
        title: Optional[str] = None,
        content_type: str = "video/mp4"
    ) -> Optional[Dict]:
        """
        Upload video to the best available storage backend

        Priority order:
        1. Azure Blob Storage (if configured)
        2. Cloudflare Stream (if configured)
        3. Error (no backend available)

        Args:
            video_file: File object or binary stream
            filename: Original filename
            user_id: User ID for organizing uploads
            title: Optional video title
            content_type: MIME type of the video

        Returns:
            Dictionary with video_url, storage_backend, and other metadata
        """
        # Try Azure Blob Storage first (primary)
        if self.blob_service_client:
            try:
                result = self._upload_to_azure(
                    video_file=video_file,
                    filename=filename,
                    user_id=user_id,
                    content_type=content_type
                )
                if result:
                    logger.info(f"Successfully uploaded to Azure Blob Storage: {filename}")
                    return result
            except Exception as e:
                logger.error(f"Azure upload failed, trying Cloudflare: {str(e)}")

        # Fallback to Cloudflare Stream
        if self.account_id and self.api_token:
            try:
                # For Cloudflare, we need to use create_upload_url and let frontend upload
                # Or upload from a temporary URL
                logger.warning("Direct file upload to Cloudflare not implemented yet. Use create_upload_url instead.")
                return None
            except Exception as e:
                logger.error(f"Cloudflare upload failed: {str(e)}")

        # No backend available
        logger.error("No video storage backend available")
        return None

    def _upload_to_azure(
        self,
        video_file: BinaryIO,
        filename: str,
        user_id: str,
        content_type: str = "video/mp4"
    ) -> Optional[Dict]:
        """
        Upload video to Azure Blob Storage

        Args:
            video_file: File object or binary stream
            filename: Original filename
            user_id: User ID for organizing uploads
            content_type: MIME type of the video

        Returns:
            Dictionary with video details
        """
        try:
            # Create container if it doesn't exist
            container_client = self.blob_service_client.get_container_client(
                self.azure_container_name
            )

            # Create container if needed (with public read access for videos)
            try:
                container_client.create_container(public_access="blob")
                logger.info(f"Created container: {self.azure_container_name}")
            except Exception:
                # Container already exists
                pass

            # Generate unique blob name
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            file_extension = filename.split('.')[-1] if '.' in filename else 'mp4'
            blob_name = f"users/{user_id}/{timestamp}_{filename}"

            # Upload the blob
            blob_client = container_client.get_blob_client(blob_name)

            # Read file content
            video_content = video_file.read()

            # Upload with content type
            blob_client.upload_blob(
                video_content,
                content_settings={
                    "content_type": content_type,
                    "cache_control": "public, max-age=31536000"  # Cache for 1 year
                },
                overwrite=True
            )

            # Get the blob URL
            if self.azure_cdn_endpoint:
                # Use CDN endpoint if configured
                video_url = f"{self.azure_cdn_endpoint}/{self.azure_container_name}/{blob_name}"
            else:
                # Use blob storage URL directly
                video_url = blob_client.url

            logger.info(f"Uploaded to Azure Blob Storage: {blob_name}")

            return {
                "video_url": video_url,
                "storage_backend": "azure_blob",
                "blob_name": blob_name,
                "container": self.azure_container_name,
                "size_bytes": len(video_content),
                "uploaded_at": datetime.utcnow().isoformat(),
                "content_type": content_type
            }

        except Exception as e:
            logger.error(f"Error uploading to Azure Blob Storage: {str(e)}")
            raise

    def validate_external_url(self, url: str) -> Dict[str, any]:
        """
        Validate and extract information from external video URLs

        Args:
            url: The external video URL

        Returns:
            Dictionary with validation result and metadata
        """
        if not self.is_external_url(url):
            return {
                "valid": False,
                "error": "URL is not from a supported external service"
            }

        # Basic URL validation
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return {
                    "valid": False,
                    "error": "Invalid URL format"
                }
        except Exception as e:
            return {
                "valid": False,
                "error": f"URL parsing error: {str(e)}"
            }

        # Detect platform
        platform = "unknown"
        if "youtube.com" in url or "youtu.be" in url:
            platform = "youtube"
        elif "vimeo.com" in url:
            platform = "vimeo"
        elif "dailymotion.com" in url:
            platform = "dailymotion"
        elif "loom.com" in url:
            platform = "loom"

        return {
            "valid": True,
            "platform": platform,
            "url": url,
            "storage_backend": "external_url",
            "embedded_supported": platform in ["youtube", "vimeo", "loom"]
        }

    def create_upload_url(
        self,
        max_duration_seconds: int = 7200,  # 2 hours default
        require_signed_urls: bool = True
    ) -> Optional[Dict]:
        """
        Create a one-time upload URL for direct video upload

        Args:
            max_duration_seconds: Maximum allowed video duration
            require_signed_urls: Require signed URLs for playback (more secure)

        Returns:
            Dictionary with uploadURL and video UID
        """
        if not self.account_id or not self.api_token:
            logger.error("Cannot create upload URL: Cloudflare credentials not configured")
            return None

        payload = {
            "maxDurationSeconds": max_duration_seconds,
            "requireSignedURLs": require_signed_urls,
            "allowedOrigins": ["*"],  # Configure based on your domain
        }

        try:
            response = requests.post(
                self.base_url,
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            if data.get("success"):
                result = data.get("result", {})
                logger.info(f"Created upload URL for video: {result.get('uid')}")
                return {
                    "upload_url": result.get("uploadURL"),
                    "video_id": result.get("uid"),
                    "created_at": datetime.utcnow().isoformat()
                }
            else:
                logger.error(f"Failed to create upload URL: {data.get('errors')}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating upload URL: {str(e)}")
            return None

    def upload_from_url(
        self,
        video_url: str,
        title: str,
        description: str = "",
        require_signed_urls: bool = True
    ) -> Optional[Dict]:
        """
        Upload video from a URL (e.g., from temporary storage)

        Args:
            video_url: URL of the video to upload
            title: Video title
            description: Video description
            require_signed_urls: Require signed URLs for playback

        Returns:
            Dictionary with video details
        """
        if not self.account_id or not self.api_token:
            logger.error("Cannot upload video: Cloudflare credentials not configured")
            return None

        payload = {
            "url": video_url,
            "meta": {
                "name": title,
                "description": description
            },
            "requireSignedURLs": require_signed_urls
        }

        try:
            response = requests.post(
                self.base_url,
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            if data.get("success"):
                result = data.get("result", {})
                logger.info(f"Uploaded video from URL: {result.get('uid')}")
                return self._format_video_response(result)
            else:
                logger.error(f"Failed to upload from URL: {data.get('errors')}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Error uploading from URL: {str(e)}")
            return None

    def get_video_details(self, video_id: str) -> Optional[Dict]:
        """
        Get details about a video

        Args:
            video_id: Cloudflare Stream video UID

        Returns:
            Dictionary with video details
        """
        if not self.account_id or not self.api_token:
            return None

        try:
            response = requests.get(
                f"{self.base_url}/{video_id}",
                headers=self._get_headers()
            )
            response.raise_for_status()

            data = response.json()
            if data.get("success"):
                return self._format_video_response(data.get("result", {}))
            else:
                logger.error(f"Failed to get video details: {data.get('errors')}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting video details: {str(e)}")
            return None

    def create_signed_url(
        self,
        video_id: str,
        expiration_hours: int = 24
    ) -> Optional[str]:
        """
        Create a signed URL for video playback (for private videos)

        Args:
            video_id: Cloudflare Stream video UID
            expiration_hours: Hours until the signed URL expires

        Returns:
            Signed URL string
        """
        if not self.account_id or not self.api_token:
            return None

        # Get signing key first (you need to create this in Cloudflare dashboard)
        signing_key_id = os.getenv("CLOUDFLARE_STREAM_SIGNING_KEY_ID")
        signing_key_pem = os.getenv("CLOUDFLARE_STREAM_SIGNING_KEY_PEM")

        if not signing_key_id or not signing_key_pem:
            logger.warning("Signing keys not configured. Using direct URL instead.")
            # Return direct URL for non-signed videos
            return f"https://customer-{self.account_id}.cloudflarestream.com/{video_id}/manifest/video.m3u8"

        # Create signed URL with JWT
        import jwt as pyjwt
        from datetime import datetime, timedelta

        expiration = datetime.utcnow() + timedelta(hours=expiration_hours)

        payload = {
            "sub": video_id,
            "kid": signing_key_id,
            "exp": int(expiration.timestamp()),
            "accessRules": [
                {
                    "type": "ip.geoip.country",
                    "action": "allow",
                    "country": ["*"]  # Allow all countries or specify ["IN", "US"]
                }
            ]
        }

        try:
            token = pyjwt.encode(
                payload,
                signing_key_pem,
                algorithm="RS256",
                headers={"kid": signing_key_id}
            )

            return f"https://customer-{self.account_id}.cloudflarestream.com/{token}/manifest/video.m3u8"

        except Exception as e:
            logger.error(f"Error creating signed URL: {str(e)}")
            return None

    def update_video_metadata(
        self,
        video_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None
    ) -> bool:
        """
        Update video metadata

        Args:
            video_id: Cloudflare Stream video UID
            title: New title
            description: New description

        Returns:
            True if successful, False otherwise
        """
        if not self.account_id or not self.api_token:
            return False

        payload = {"meta": {}}
        if title:
            payload["meta"]["name"] = title
        if description:
            payload["meta"]["description"] = description

        try:
            response = requests.post(
                f"{self.base_url}/{video_id}",
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            return data.get("success", False)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error updating video metadata: {str(e)}")
            return False

    def delete_video(self, video_id: str) -> bool:
        """
        Delete a video from Cloudflare Stream

        Args:
            video_id: Cloudflare Stream video UID

        Returns:
            True if successful, False otherwise
        """
        if not self.account_id or not self.api_token:
            return False

        try:
            response = requests.delete(
                f"{self.base_url}/{video_id}",
                headers=self._get_headers()
            )
            response.raise_for_status()

            data = response.json()
            if data.get("success"):
                logger.info(f"Deleted video: {video_id}")
                return True
            else:
                logger.error(f"Failed to delete video: {data.get('errors')}")
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"Error deleting video: {str(e)}")
            return False

    def get_video_analytics(
        self,
        video_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Optional[Dict]:
        """
        Get analytics for a video

        Args:
            video_id: Cloudflare Stream video UID
            start_date: Start date for analytics
            end_date: End date for analytics

        Returns:
            Dictionary with analytics data
        """
        if not self.account_id or not self.api_token:
            return None

        params = {}
        if start_date:
            params["since"] = start_date.isoformat()
        if end_date:
            params["until"] = end_date.isoformat()

        try:
            response = requests.get(
                f"{self.base_url}/{video_id}/analytics/views",
                headers=self._get_headers(),
                params=params
            )
            response.raise_for_status()

            data = response.json()
            if data.get("success"):
                return data.get("result", {})
            else:
                logger.error(f"Failed to get analytics: {data.get('errors')}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting video analytics: {str(e)}")
            return None

    def _format_video_response(self, video_data: Dict) -> Dict:
        """Format Cloudflare Stream response to standard format"""
        return {
            "video_id": video_data.get("uid"),
            "status": video_data.get("status", {}).get("state"),  # ready, queued, inprogress, error
            "duration": video_data.get("duration"),  # seconds
            "thumbnail_url": video_data.get("thumbnail"),
            "playback_url": f"https://customer-{self.account_id}.cloudflarestream.com/{video_data.get('uid')}/manifest/video.m3u8",
            "iframe_url": f"https://customer-{self.account_id}.cloudflarestream.com/{video_data.get('uid')}/iframe",
            "preview_url": video_data.get("preview"),
            "ready_to_stream": video_data.get("readyToStream", False),
            "size_bytes": video_data.get("size"),
            "uploaded_at": video_data.get("uploaded"),
            "modified_at": video_data.get("modified"),
            "meta": video_data.get("meta", {}),
        }


# Singleton instance
video_storage_service = VideoStorageService()
