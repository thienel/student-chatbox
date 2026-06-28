import asyncio
import logging

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from .qdrant_service import qdrant_service
from ..config import settings

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a study assistant. Summarize the course document below into clear "
    "bullet points capturing the key concepts. Use at most 500 words. Respond in "
    "the same language as the document. Return only the bullet points."
)


async def summarize_document(document_id: str) -> str:
    chunks = await asyncio.to_thread(qdrant_service.get_chunks_by_document, document_id)
    text = "\n\n".join(c["text"] for c in chunks if c["text"])
    if not text.strip():
        raise ValueError("No indexed content found for this document")

    # Cap context to keep the request bounded.
    context = text[:24000]

    llm = ChatOpenAI(
        model=settings.openai_chat_model,
        api_key=settings.openai_api_key,
        **({"base_url": settings.openai_base_url} if settings.openai_base_url else {}),
        temperature=0.3,
    )
    response = await llm.ainvoke([
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=f"Document content:\n\n{context}"),
    ])
    return str(response.content).strip()
