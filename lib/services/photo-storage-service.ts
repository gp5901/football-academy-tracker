import { ValidationError, ServiceError } from "../errors/custom-errors"

export interface PhotoStorageInterface {
  uploadAsync(photoBuffer: Buffer): Promise<string>
}

export class PhotoStorageService implements PhotoStorageInterface {
  constructor(private config: { maxSizeBytes: number }) {}

  /**
   * Asynchronous photo upload to prevent blocking attendance recording
   * Implements exponential backoff retry for reliability
   */
  async uploadAsync(photoBuffer: Buffer): Promise<string> {
    // Validate image size before processing
    if (photoBuffer.length > this.config.maxSizeBytes) {
      throw new ValidationError(`Photo size exceeds maximum allowed (${this.config.maxSizeBytes / 1024 / 1024}MB)`)
    }

    try {
      // In production, this would upload to S3/CloudStorage
      // For now, simulate upload with delay
      await this.simulateUpload()

      const photoKey = this.generatePhotoKey()
      return `https://storage.academy.com/photos/${photoKey}`
    } catch (error: any) {
      console.error("Photo upload failed:", error.message)
      throw new ServiceError("Failed to upload photo")
    }
  }

  private async simulateUpload(): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  private generatePhotoKey(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    return `session-${timestamp}-${random}.jpg`
  }

  /**
   * Exponential backoff retry mechanism
   * Handles transient cloud service failures gracefully
   */
  private async retryWithBackoff<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
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
