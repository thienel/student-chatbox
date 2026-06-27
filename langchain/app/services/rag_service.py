import asyncio
import json
import logging
from collections.abc import AsyncIterator

from langchain_openai import OpenAIEmbeddings
from openai import AsyncOpenAI

from ..config import settings
from .qdrant_service import qdrant_service

logger = logging.getLogger(__name__)


def _get_embeddings() -> OpenAIEmbeddings:
    kwargs: dict = {
        "openai_api_key": settings.openai_api_key,
        "model": settings.openai_embedding_model,
        "chunk_size": 100,
    }
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url
    return OpenAIEmbeddings(**kwargs)


def _get_openai_client() -> AsyncOpenAI:
    kwargs: dict = {"api_key": settings.openai_api_key}
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url
    return AsyncOpenAI(**kwargs)


async def stream_rag_response(
    query: str,
    subject_id: str,
    lecturer_id: str,
    chat_history: list[dict],
    top_k: int,
    min_score: float,
) -> AsyncIterator[str]:
    embeddings = _get_embeddings()
    query_vector: list[float] = await asyncio.to_thread(embeddings.embed_query, query)

    logger.info(
        "[RAG] Searching lecturer_id=%s subject_id=%s top_k=%d min_score=%.2f",
        lecturer_id, subject_id, top_k, min_score,
    )
    all_results = await asyncio.to_thread(
        qdrant_service.search_similar, query_vector, lecturer_id, subject_id, top_k, 0.0
    )
    logger.info(
        "[RAG] Qdrant returned %d results: %s",
        len(all_results),
        [(r["id"][:8], round(r["score"], 4)) for r in all_results],
    )
    results = [r for r in all_results if r["score"] >= min_score]
    logger.info("[RAG] After score filter (>= %.2f): %d results", min_score, len(results))

    context = "\n\n---\n\n".join(
        f"[Source {i + 1}: {r['payload']['original_name']}]\n{r['payload']['text']}"
        for i, r in enumerate(results)
    )

    if context:
        system_content = (
            "You are EduChat, an academic assistant for a university course. "
            "You have access to course documents provided below.\n"
            "IMPORTANT RULES:\n"
            "- Answer ONLY using information from the provided context. Do NOT use your own training knowledge.\n"
            "- Always mention the source document name when answering.\n"
            "- If the user asks who you are, say: \"I am EduChat, your academic assistant powered by your course documents.\"\n"
            "- Never say you are trained on internet data or that you are a general AI.\n\n"
            f"Context from course documents:\n{context}"
        )
    else:
        system_content = (
            "You are EduChat, an academic assistant for a university course.\n"
            "No relevant documents were found for this query.\n"
            "Say: \"No information found in the course documents. "
            "Please try a different question or upload more documents.\"\n"
            "Do NOT answer from general knowledge."
        )

    messages: list[dict] = [{"role": "system", "content": system_content}]
    for msg in chat_history[-10:]:
        if msg.get("role") in ("user", "assistant"):
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": query})

    sources = [
        {
            "documentId": r["payload"]["document_id"],
            "originalName": r["payload"]["original_name"],
            "excerpt": r["payload"]["text"][:200],
            "score": r["score"],
        }
        for r in results
    ]

    # Yield start event with sources so frontend knows what's coming
    yield f"data: {json.dumps({'type': 'start', 'sources': sources})}\n\n"

    client = _get_openai_client()
    stream = await client.chat.completions.create(
        model=settings.openai_chat_model,
        messages=messages,  # type: ignore[arg-type]
        stream=True,
    )

    async for chunk in stream:
        content = chunk.choices[0].delta.content if chunk.choices else None
        if content:
            yield f"data: {json.dumps({'type': 'chunk', 'content': content})}\n\n"

    yield f"data: {json.dumps({'type': 'done', 'sources': sources})}\n\n"
    yield "data: [DONE]\n\n"
