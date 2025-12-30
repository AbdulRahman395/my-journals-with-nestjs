import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

type UploadOptions = Omit<UploadApiOptions, 'resource_type'> & {
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
};

type File = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Missing Cloudinary configuration. Please check your environment variables.');
    }
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  private getResourceType(mimetype: string): 'image' | 'video' | 'raw' {
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('image/')) return 'image';
    return 'raw';
  }

  private validateFileSize(file: File): void {
    if (file.buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(`File size exceeds the maximum limit of 50MB`);
    }
  }

  async uploadFile(
    file: File,
    options: UploadOptions = {},
  ): Promise<UploadApiResponse> {
    this.validateFileSize(file);
    
    const resourceType = options.resource_type || this.getResourceType(file.mimetype);
    
    return new Promise((resolve, reject) => {
      const uploadOptions: UploadApiOptions = {
        resource_type: resourceType,
        ...options,
        // Add video-specific options
        ...(resourceType === 'video' ? {
          chunk_size: 20 * 1024 * 1024, // 20MB chunks for large video uploads
          eager: [
            { width: 400, crop: 'scale' },
            { width: 800, crop: 'scale' }
          ],
          eager_async: true,
          eager_notification_url: 'https://your-webhook-url.com/notify',
          resource_type: 'video',
        } : {}),
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Upload failed: No result from Cloudinary'));
          }
          resolve(result);
        },
      );

      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      
      bufferStream.pipe(uploadStream);
    });
  }

  async uploadFileFromUrl(
    url: string,
    options: UploadOptions = {},
  ): Promise<UploadApiResponse> {
    try {
      const result = await cloudinary.uploader.upload(url, {
        resource_type: 'auto',
        ...options,
      } as UploadApiOptions);
      return result;
    } catch (error) {
      console.error('Cloudinary upload from URL error:', error);
      throw error;
    }
  }

  async deleteFile(
    publicId: string, 
    options: { resource_type?: 'image' | 'video' | 'raw' } = {}
  ): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: options.resource_type || 'image',
        invalidate: true,
      });
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      gravity?: string;
      quality?: string | number;
      fetchFormat?: string;
      resourceType?: 'image' | 'video' | 'raw';
    } = {},
  ): string {
    return cloudinary.url(publicId, {
      width: options.width,
      height: options.height,
      crop: options.crop as any,
      gravity: options.gravity as any,
      quality: options.quality || 'auto',
      fetch_format: options.fetchFormat || 'auto',
      secure: true,
      resource_type: options.resourceType || 'image',
    });
  }

  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {},
  ): Promise<UploadApiResponse[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }
}
