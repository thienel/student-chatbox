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
    card_count: int = 10,
    topic: Optional[str] = None,
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
            query_vector, subject_id, min(20, card_count * 2), 0.3,
        )
    else:
        chunks = await asyncio.to_thread(qdrant_service.get_random_chunks, subject_id, 20)

    if not chunks:
        return []

    context = "\n\n---\n\n".join(c["text"] for c in chunks if c["text"])
    topic_hint = f' về chủ đề "{topic}"' if topic else ""

    system_prompt = (
        f"Bạn là trợ lý học tập. Hãy tạo đúng {card_count} flashcards{topic_hint} "
        f"dựa trên nội dung tài liệu học bên dưới.\n"
        f"Trả về JSON array với format: "
        f'[{{"front": "câu hỏi/khái niệm", "back": "giải thích ngắn gọn"}}]\n'
        f"Chỉ trả về JSON, không có text nào khác."
    )

    llm = ChatOpenAI(
        model=settings.openai_flashcard_model,
        api_key=settings.openai_api_key,
        **({"base_url": settings.openai_base_url} if settings.openai_base_url else {}),
        temperature=0.7,
    )

    response = await llm.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Nội dung tài liệu:\n\n{context}"),
    ])

    raw = str(response.content).strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw

    cards: list[dict] = json.loads(raw)
    return cards[:card_count]
