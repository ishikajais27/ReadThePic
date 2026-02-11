'use client'
import React from 'react'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Upload, X } from 'lucide-react'

type TaskType = 'text' | 'formula' | 'table'

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [extractedText, setExtractedText] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [taskType, setTaskType] = useState<TaskType>('text')
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [processingTime, setProcessingTime] = useState<number>(0)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, GIF, WebP)')
      return
    }
    setSelectedFile(file)
    setExtractedText('')
    setError('')
    setSuccess(false)
    setProcessingTime(0)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleExtract = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setLoading(true)
    setError('')
    setExtractedText('')
    setSuccess(false)
    const startTime = Date.now()

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('task_type', taskType)

      const response = await fetch('http://localhost:8000/api/extract-text', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to extract text')
      }

      const data = await response.json()
      setExtractedText(data.extracted_text)
      setSuccess(true)
      setProcessingTime((Date.now() - startTime) / 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreview('')
    setExtractedText('')
    setError('')
    setSuccess(false)
    setProcessingTime(0)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError('Failed to copy text')
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([extractedText], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `extracted-text-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                OCR Converter
              </h1>
              <p className="text-sm text-gray-500">Image to Text Extraction</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && extractedText && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-700">Text extracted successfully!</p>
                {processingTime > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Processing time: {processingTime.toFixed(2)}s
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 md:p-8">
              {/* Task Type Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Extraction Type
                </label>
                <div className="flex flex-wrap gap-3">
                  {(['text', 'formula', 'table'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTaskType(type)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                        taskType === type
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-8">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 rounded-lg p-3">
                          <svg
                            className="h-6 w-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleClear}
                        disabled={loading}
                        className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <p className="text-lg font-semibold text-gray-900 mb-2">
                        Drag and drop your image here
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        or click to browse from your computer
                      </p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files &&
                            handleFileSelect(e.target.files[0])
                          }
                          disabled={loading}
                          className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer">
                          Browse Files
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Preview */}
              {preview && (
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Image Preview
                  </label>
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden max-h-96 flex items-center justify-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Extract Button */}
              {selectedFile && (
                <div className="mb-6">
                  <button
                    onClick={handleExtract}
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing... (This may take 30-60 seconds)
                      </>
                    ) : (
                      'Extract Text'
                    )}
                  </button>
                </div>
              )}

              {/* Extracted Text */}
              {extractedText && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Extracted Text
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
                      {extractedText}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCopy}
                      className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                    >
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Download as TXT
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
