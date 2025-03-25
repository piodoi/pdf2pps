from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import tempfile
import shutil
from pathlib import Path
import uuid

from .pdf_processor import PDFProcessor
from .models import PresentationResponse, PresentationRequest

app = FastAPI(title="PDF2PPS API", description="Convert PDFs to presentations")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Create temp directory for file storage
TEMP_DIR = Path(tempfile.gettempdir()) / "pdf2pps"
TEMP_DIR.mkdir(exist_ok=True)

# Initialize PDF processor
pdf_processor = PDFProcessor(model_name="llama2")

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/upload-pdf/", response_model=PresentationRequest)
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF file for processing."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Save the uploaded file
    file_id = str(uuid.uuid4())
    file_location = TEMP_DIR / f"{file_id}.pdf"
    
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
    
    return PresentationRequest(filename=file_id)

@app.post("/process-pdf/", response_model=PresentationResponse)
async def process_pdf(request: PresentationRequest):
    """Process a PDF file and generate a presentation."""
    pdf_path = TEMP_DIR / f"{request.filename}.pdf"
    
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    try:
        # Process the PDF and generate presentation
        output_path = TEMP_DIR / f"{request.filename}.pptx"
        
        # Extract text from PDF
        text = pdf_processor.extract_text_from_pdf(str(pdf_path))
        
        # Extract key points using LLM
        slides = pdf_processor.extract_key_points(text)
        
        # Generate the presentation
        pdf_processor.generate_pptx(slides, str(output_path))
        
        return PresentationResponse(
            slides=slides,
            filename=request.filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.get("/download/{filename}")
async def download_presentation(filename: str):
    """Download the generated presentation."""
    file_path = TEMP_DIR / f"{filename}.pptx"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    return FileResponse(
        path=file_path, 
        filename=f"presentation.pptx",
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )

@app.on_event("startup")
async def startup_event():
    """Initialize the application."""
    # Ensure temp directory exists
    TEMP_DIR.mkdir(exist_ok=True)

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources."""
    # Clean up temp files
    if TEMP_DIR.exists():
        for file in TEMP_DIR.glob("*"):
            try:
                file.unlink()
            except:
                pass
