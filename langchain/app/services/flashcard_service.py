import asyncio
import json
import logging
from typing import Optional
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from .qdrant_service import qdrant_service
from ..config import settings

logger = logging.getLogger(__name__)


async def generate_flashcards(
    subject_id: str,
    class_id: str,
    card_count: int = 10,
    topic: Optional[str] = None,
    document_ids: Optional[list[str]] = None,
) -> list[dict]:
    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        api_key=settings.openai_api_key,
        **({"base_url": settings.openai_base_url} if settings.openai_base_url else {}),
    )

    if topic:
        query_vector: list[float] = await asyncio.to_thread(embeddings.embed_query, topic)
        chunks = await asyncio.to_thread(
            qdrant_service.search_similar,
            query_vector, class_id, min(20, card_count * 2), 0.3, document_ids,
        )
    else:
        chunks = await asyncio.to_thread(
            qdrant_service.get_random_chunks, class_id, 20, document_ids
        )

    if not chunks:
        return []

    context = "\n\n---\n\n".join(c["text"] for c in chunks if c["text"])
    topic_hint = f' on the topic "{topic}"' if topic else ""

    system_prompt = (
        f"You are a study assistant. Generate exactly {card_count} flashcards{topic_hint} "
        f"based on the course document content below.\n"
        f"Return a JSON array in this format: "
        f'[{{"front": "question or concept", "back": "brief explanation"}}]\n'
        f"Return ONLY the JSON, no other text."
    )

    llm = ChatOpenAI(
        model=settings.openai_flashcard_model,
        api_key=settings.openai_api_key,
        **({"base_url": settings.openai_base_url} if settings.openai_base_url else {}),
        temperature=0.7,
    )

    response = await llm.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Document content:\n\n{context}"),
    ])

    raw = str(response.content).strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw

    cards: list[dict] = json.loads(raw)
    return cards[:card_count]
