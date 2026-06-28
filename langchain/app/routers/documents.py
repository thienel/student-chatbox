import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import verify_internal_key
from ..services.document_processor import process_document
from ..services.qdrant_service import qdrant_service
from ..services.summary_service import summarize_document
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


class ProcessDocumentRequest(BaseModel):
    documentId: str
    filePath: str
    subjectId: str
    lecturerId: str


@router.post("/process", status_code=202)
async def process_document_endpoint(
    body: ProcessDocumentRequest,
    _: None = Depends(verify_internal_key),
) -> dict:
    asyncio.create_task(
        process_document(body.documentId, body.filePath, body.subjectId, body.lecturerId)
    )
    return {"accepted": True}


class SummarizeRequest(BaseModel):
    documentId: str


@router.post("/summarize")
async def summarize_document_endpoint(
    body: SummarizeRequest,
    _: None = Depends(verify_internal_key),
) -> dict:
    try:
        summary = await summarize_document(body.documentId)
        return {"summary": summary}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}", status_code=204)
async def delete_document_vectors(
    document_id: str,
    _: None = Depends(verify_internal_key),
) -> None:
    await asyncio.to_thread(qdrant_service.delete_by_document_id, document_id)
