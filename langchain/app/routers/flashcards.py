from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from ..dependencies import verify_internal_key
from ..services.flashcard_service import generate_flashcards

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


class GenerateFlashcardsRequest(BaseModel):
    subject_id: str
    card_count: int = Field(default=10, ge=1, le=50)
    topic: Optional[str] = None


class FlashcardItem(BaseModel):
    front: str
    back: str


class GenerateFlashcardsResponse(BaseModel):
    cards: list[FlashcardItem]


@router.post("/generate", response_model=GenerateFlashcardsResponse)
async def generate_flashcards_endpoint(
    body: GenerateFlashcardsRequest,
    _: None = Depends(verify_internal_key),
) -> GenerateFlashcardsResponse:
    try:
        cards = await generate_flashcards(
            subject_id=body.subject_id,
            card_count=body.card_count,
            topic=body.topic,
        )
        return GenerateFlashcardsResponse(
            cards=[FlashcardItem(front=c["front"], back=c["back"]) for c in cards]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
