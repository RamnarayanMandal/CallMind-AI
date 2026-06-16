import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryProvider {
  private readonly logger = new Logger(CloudinaryProvider.name);
  private readonly isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.isConfigured = true;
      this.logger.log('Cloudinary configured successfully');
    } else {
      this.isConfigured = false;
      this.logger.warn('Cloudinary credentials missing — recording upload disabled');
    }
  }

  /**
   * Upload an audio buffer to Cloudinary.
   * @param buffer  Raw audio data (WAV / MP3)
   * @param publicId  Unique asset ID (e.g. callUuid)
   * @param folder  Cloudinary folder (default: callmind/recordings)
   * @returns Secure CDN URL of the uploaded file
   */
  async uploadAudio(
    buffer: Buffer,
    publicId: string,
    folder = 'callmind/recordings',
  ): Promise<string> {
    if (!this.isConfigured) {
      this.logger.warn(`[CLOUDINARY_SKIP] Not configured — skipping upload for ${publicId}`);
      return '';
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video', // Cloudinary uses "video" for audio files
          folder,
          public_id: publicId,
          format: 'mp3',
          tags: ['callmind', 'recording'],
        },
        (error, result) => {
          if (error) {
            this.logger.error(`[CLOUDINARY_ERROR] Upload failed for ${publicId}: ${error.message}`);
            return reject(error);
          }
          this.logger.log(`[CLOUDINARY_OK] Uploaded ${publicId} → ${result.secure_url}`);
          resolve(result.secure_url);
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  /**
   * Delete a recording from Cloudinary
   */
  async deleteAudio(publicId: string): Promise<void> {
    if (!this.isConfigured) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      this.logger.log(`[CLOUDINARY_DELETE] Deleted ${publicId}`);
    } catch (err) {
      this.logger.warn(`[CLOUDINARY_DELETE_WARN] ${err.message}`);
    }
  }
}
