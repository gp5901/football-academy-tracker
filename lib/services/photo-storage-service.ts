import { ValidationError, ServiceError } from "../errors/custom-errors"

interface PhotoStorageConfig {
  maxSizeBytes: number
}

export interface PhotoStorageInterface {
  uploadAsync(photoBuffer: Buffer): Promise<string>
}

export class PhotoStorageService implements PhotoStorageInterface {
  constructor(private config: PhotoStorageConfig) {}

  async uploadAsync(photoBuffer: Buffer): Promise<string> {
    // Validate image size
    if (photoBuffer.length > this.config.maxSizeBytes) {
      throw new ValidationError(`Photo size exceeds maximum allowed (${this.config.maxSizeBytes / 1024 / 1024}MB)`)
    }

    try {
      // In production, this would upload to cloud storage (S3, Cloudinary, etc.)
      // For now, simulate upload with base64 encoding
      const base64Data = photoBuffer.toString("base64")
      const photoKey = this.generatePhotoKey()

      // Simulate async upload delay
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Return mock URL
      return `https://storage.example.com/photos/${photoKey}`
    } catch (error: any) {
      console.error("Photo upload failed:", error)
      throw new ServiceError("Failed to upload photo")
    }
  }

  private generatePhotoKey(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const random = Math.random().toString(36).substring(2, 15)
    return `session-photo-${timestamp}-${random}.jpg`
  }

  async retryWithBackoff<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries - 1) throw error

        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
    throw new Error("Max retries exceeded")
  }
}
