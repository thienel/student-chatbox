from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from ..dependencies import verify_internal_key
from ..services.exam_service import generate_exam

router = APIRouter(prefix="/exams", tags=["exams"])


class GenerateExamRequest(BaseModel):
    subject_id: str
    lecturer_id: str
    question_count: int = Field(default=10, ge=1, le=50)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    topic: Optional[str] = None
    document_ids: Optional[list[str]] = None


class QuestionOption(BaseModel):
    key: str
    text: str


class QuestionItem(BaseModel):
    content: str
    options: list[QuestionOption]
    correct_answer: str
    explanation: Optional[str] = None


class GenerateExamResponse(BaseModel):
    questions: list[QuestionItem]


@router.post("/generate", response_model=GenerateExamResponse)
async def generate_exam_endpoint(
    body: GenerateExamRequest,
    _: None = Depends(verify_internal_key),
) -> GenerateExamResponse:
    try:
        questions = await generate_exam(
            subject_id=body.subject_id,
            lecturer_id=body.lecturer_id,
            question_count=body.question_count,
            difficulty=body.difficulty,
            topic=body.topic,
            document_ids=body.document_ids,
        )
        return GenerateExamResponse(
            questions=[
                QuestionItem(
                    content=q["content"],
                    options=[QuestionOption(key=o["key"], text=o["text"]) for o in q["options"]],
                    correct_answer=q["correct_answer"],
                    explanation=q.get("explanation"),
                )
                for q in questions
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
