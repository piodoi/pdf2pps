from pydantic import BaseModel
from typing import List, Optional


class PresentationRequest(BaseModel):
    """Request model for presentation generation."""
    filename: str


class PresentationSlide(BaseModel):
    """Model for a single presentation slide."""
    title: str
    content: List[str]


class PresentationResponse(BaseModel):
    """Response model for presentation generation."""
    slides: List[PresentationSlide]
    filename: str
