import asyncio
import json
import logging
from typing import Optional, Literal
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from .qdrant_service import qdrant_service
from ..config import settings

logger = logging.getLogger(__name__)

Difficulty = Literal["easy", "medium", "hard"]

_DIFFICULTY_LABELS = {
    "easy": "easy (basic knowledge, recall)",
    "medium": "medium (understanding and application)",
    "hard": "hard (analysis, evaluation, reasoning)",
}


async def generate_exam(
    subject_id: str,
    class_id: str,
    question_count: int = 10,
    difficulty: Difficulty = "medium",
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
            query_vector, class_id, min(20, question_count * 2), 0.3, document_ids,
        )
    else:
        chunks = await asyncio.to_thread(
            qdrant_service.get_random_chunks, class_id, 20, document_ids
        )

    if not chunks:
        return []

    context = "\n\n---\n\n".join(c["text"] for c in chunks if c["text"])
    diff_label = _DIFFICULTY_LABELS.get(difficulty, "medium")
    topic_hint = f' on the topic "{topic}"' if topic else ""

    system_prompt = (
        f"You are an exam creator. Generate exactly {question_count} multiple-choice questions "
        f"at {diff_label} difficulty{topic_hint}, based only on the document content below.\n"
        f"Each question has exactly 4 options A/B/C/D, with only 1 correct answer.\n"
        f"Return a JSON array:\n"
        f'[{{"content": "question text", '
        f'"options": [{{"key": "A", "text": "..."}}, {{"key": "B", "text": "..."}}, '
        f'{{"key": "C", "text": "..."}}, {{"key": "D", "text": "..."}}], '
        f'"correct_answer": "A", "explanation": "brief explanation"}}]\n'
        f"Return ONLY the JSON, no other text."
    )

    llm = ChatOpenAI(
        model=settings.openai_exam_model,
        api_key=settings.openai_api_key,
        **({"base_url": settings.openai_base_url} if settings.openai_base_url else {}),
        temperature=0.5,
    )

    response = await llm.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Document content:\n\n{context}"),
    ])

    raw = str(response.content).strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw

    questions: list[dict] = json.loads(raw)
    return questions[:question_count]
