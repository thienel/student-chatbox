from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..dependencies import verify_stream_token
from ..services.rag_service import stream_rag_response

router = APIRouter(prefix="/chat", tags=["chat"])


class StreamRequest(BaseModel):
    content: str
    subjectId: str
    lecturerId: str
    chatHistory: list[dict]
    topK: int = 5
    minScore: float = 0.4


@router.post("/stream")
async def chat_stream(
    body: StreamRequest,
    _token: dict = Depends(verify_stream_token),
) -> StreamingResponse:
    return StreamingResponse(
        stream_rag_response(
            query=body.content,
            subject_id=body.subjectId,
            lecturer_id=body.lecturerId,
            chat_history=body.chatHistory,
            top_k=body.topK,
            min_score=body.minScore,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
