import imageCompression from 'browser-image-compression'

export interface CompressImageOptions {
    maxSizeMB?: number
    maxWidthOrHeight?: number
    useWebWorker?: boolean
    fileType?: string
}

/**
 * Compresses an image file to WebP format
 * @param file - The image file to compress
 * @returns Compressed image blob
 */
export async function compressImage(file: File): Promise<Blob> {
    const options: CompressImageOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp',
    }

    try {
        const compressedFile = await imageCompression(file, options)
        return compressedFile
    } catch (error) {
        console.error('Error compressing image:', error)
        throw new Error('Failed to compress image')
    }
}

/**
 * Validates if the file is an acceptable image format
 * @param file - File to validate
 * @returns true if valid, false otherwise
 */
export function isValidImageType(file: File): boolean {
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    return acceptedTypes.includes(file.type)
}

/**
 * Validates file size (before compression)
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB
 * @returns true if valid, false otherwise
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
    const fileSizeInMB = file.size / (1024 * 1024)
    return fileSizeInMB <= maxSizeMB
}
