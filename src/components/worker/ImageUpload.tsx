'use client'

import { useState, useRef } from 'react'
import { Upload, X, Camera, AlertCircle } from 'lucide-react'
import { compressImage, isValidImageType, isValidFileSize } from '../../lib/utils/imageCompression'

interface ImageUploadProps {
    label: string
    required?: boolean
    onUploadComplete: (url: string) => void
    folder: 'invoice' | 'customer'
}

export default function ImageUpload({ label, required = false, onUploadComplete, folder }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError('')
        setUploadProgress(0)

        // Validate file type
        if (!isValidImageType(file)) {
            setError('Please select a valid image (JPG, PNG, or WebP)')
            return
        }

        // Validate file size
        if (!isValidFileSize(file, 5)) {
            setError('File size must be less than 5MB')
            return
        }

        setIsUploading(true)

        // 0. Show local preview immediately
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)

        try {
            // 1. Compress image on client-side (Optional, but keeping for now if it works)
            let fileToUpload: Blob = file;
            try {
                fileToUpload = await compressImage(file)
            } catch (compressionError) {
                console.error('Compression failed, uploading original:', compressionError)
            }

            // 2. Prepare FormData
            const formData = new FormData()
            formData.append('file', fileToUpload, file.name)
            formData.append('folder', folder)

            // 3. Upload using XMLHttpRequest to track progress
            const xhr = new XMLHttpRequest()

            const promise = new Promise<string>((resolve, reject) => {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100)
                        setUploadProgress(percent)
                    }
                })

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText)
                            if (response.success && response.imageUrl) {
                                resolve(response.imageUrl)
                            } else {
                                reject(new Error(response.error || 'Upload failed'))
                            }
                        } catch (e) {
                            reject(new Error('Invalid server response'))
                        }
                    } else {
                        try {
                            const response = JSON.parse(xhr.responseText)
                            reject(new Error(response.error || `Upload failed with status ${xhr.status}`))
                        } catch (e) {
                            reject(new Error(`Upload failed with status ${xhr.status}`))
                        }
                    }
                })

                xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
                xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

                xhr.open('POST', '/api/upload')
                xhr.send(formData)
            })

            const imageUrl = await promise

            // 4. Update preview with server URL and notify parent
            URL.revokeObjectURL(objectUrl)
            setPreview(imageUrl)
            onUploadComplete(imageUrl)

        } catch (err: any) {
            console.error('Upload process error:', err)
            setError(err.message || 'Failed to upload image')
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemove = () => {
        setPreview(null)
        setError('')
        setUploadProgress(0)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        onUploadComplete('')
    }

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {!preview ? (
                <div>
                    <label
                        htmlFor={`file-${folder}`}
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 overflow-hidden relative"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10">
                            {isUploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
                                    <p className="text-sm text-gray-600 font-medium">Uploading... {uploadProgress}%</p>
                                </>
                            ) : (
                                <>
                                    <Camera className="w-12 h-12 text-gray-400 mb-3" />
                                    <p className="mb-2 text-sm text-gray-600">
                                        <span className="font-semibold">Tap to upload</span>
                                    </p>
                                    <p className="text-xs text-gray-500">JPG, PNG or WebP (max 5MB)</p>
                                </>
                            )}
                        </div>

                        {isUploading && (
                            <div
                                className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        )}

                        <input
                            ref={fileInputRef}
                            id={`file-${folder}`}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                            className="hidden"
                        />
                    </label>
                </div>
            ) : (
                <div className="relative group">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-transform hover:scale-110 shadow-lg"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    )
}
