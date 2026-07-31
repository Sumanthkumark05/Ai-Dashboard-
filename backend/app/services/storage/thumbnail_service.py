from typing import Optional


class ThumbnailService:
    """
    Thumbnail generation architecture stub for image documents and avatar previews.
    Future modules will attach Pillow/Wand image resizing pipeline here.
    """

    @staticmethod
    async def generate_thumbnail(
        file_bytes: bytes, mime_type: str, width: int = 150, height: int = 150
    ) -> Optional[bytes]:
        """
        Architecture stub for generating image thumbnail previews.
        Returns resized bytes when image processing pipeline is activated.
        """
        if not mime_type.startswith("image/"):
            return None

        # Return original bytes or None for non-image types
        return None
