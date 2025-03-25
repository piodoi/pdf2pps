import { useState } from 'react'
import { FileUp, Download, FileText, Loader2 } from 'lucide-react'
import './App.css'

import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { Progress } from './components/ui/progress'
import { Separator } from './components/ui/separator'

// API URL from environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [presentationId, setPresentationId] = useState<string | null>(null)
  const [slides, setSlides] = useState<any[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', file)

      // Upload the file
      const uploadResponse = await fetch(`${API_URL}/upload-pdf/`, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      const uploadData = await uploadResponse.json()
      const fileId = uploadData.filename

      // Process the PDF
      setUploading(false)
      setProcessing(true)

      const processResponse = await fetch(`${API_URL}/process-pdf/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: fileId }),
      })

      if (!processResponse.ok) {
        throw new Error(`Processing failed: ${processResponse.statusText}`)
      }

      const processData = await processResponse.json()
      setPresentationId(processData.filename)
      setSlides(processData.slides)
      setProcessing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setUploading(false)
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (presentationId) {
      window.open(`${API_URL}/download/${presentationId}`, '_blank')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">PDF to Presentation Converter</h1>
        <p className="text-gray-500">Upload a PDF and get a presentation with the key points</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>Select a PDF file to convert to a presentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <FileText size={48} className="text-gray-400 mb-4" />
              <input
                type="file"
                id="pdf-upload"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FileUp className="mr-2" size={16} />
                Select PDF
              </label>
              {file && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading || processing}
              className="w-full"
            >
              {(uploading || processing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Convert to Presentation'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Presentation Preview</CardTitle>
            <CardDescription>View and download your presentation</CardDescription>
          </CardHeader>
          <CardContent>
            {(uploading || processing) && (
              <div className="space-y-4 py-8">
                <Progress value={uploading ? 30 : 70} />
                <p className="text-center text-sm text-gray-500">
                  {uploading ? 'Uploading PDF...' : 'Processing with AI...'}
                </p>
              </div>
            )}

            {!uploading && !processing && slides.length > 0 && (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {slides.map((slide, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <h3 className="font-medium">{slide.title}</h3>
                    <Separator className="my-2" />
                    <ul className="list-disc pl-5 space-y-1">
                      {slide.content.map((point: string, i: number) => (
                        <li key={i} className="text-sm">{point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {!uploading && !processing && slides.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <FileText size={48} className="mb-4 opacity-50" />
                <p>Upload a PDF to see the presentation preview</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleDownload}
              disabled={!presentationId}
              variant={presentationId ? "default" : "outline"}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Presentation
            </Button>
          </CardFooter>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>PDF to Presentation Converter - Powered by Llama 2</p>
      </footer>
    </div>
  )
}

export default App
