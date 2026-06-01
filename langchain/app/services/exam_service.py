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
    "easy": "dễ (kiến thức cơ bản, nhận biết)",
    "medium": "trung bình (hiểu và áp dụng)",
    "hard": "khó (phân tích, đánh giá, suy luận)",
}


async def generate_exam(
    subject_id: str,
    question_count: int = 10,
    difficulty: Difficulty = "medium",
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
            query_vector, subject_id, min(20, question_count * 2), 0.3,
        )
    else:
        chunks = await asyncio.to_thread(qdrant_service.get_random_chunks, subject_id, 20)

    if not chunks:
        return []

    context = "\n\n---\n\n".join(c["text"] for c in chunks if c["text"])
    diff_label = _DIFFICULTY_LABELS.get(difficulty, "trung bình")
    topic_hint = f' về chủ đề "{topic}"' if topic else ""

    system_prompt = (
        f"Bạn là giảng viên ra đề. Hãy tạo đúng {question_count} câu hỏi trắc nghiệm "
        f"độ khó {diff_label}{topic_hint}, chỉ dựa trên nội dung tài liệu bên dưới.\n"
        f"Mỗi câu có đúng 4 lựa chọn A/B/C/D, chỉ 1 đáp án đúng.\n"
        f"Trả về JSON array:\n"
        f'[{{"content": "câu hỏi", '
        f'"options": [{{"key": "A", "text": "..."}}, {{"key": "B", "text": "..."}}, '
        f'{{"key": "C", "text": "..."}}, {{"key": "D", "text": "..."}}], '
        f'"correct_answer": "A", "explanation": "giải thích ngắn"}}]\n'
        f"Chỉ trả về JSON, không có text nào khác."
    )

    llm = ChatOpenAI(
        model=settings.openai_exam_model,
        api_key=settings.openai_api_key,
        **({"base_url": settings.openai_base_url} if settings.openai_base_url else {}),
        temperature=0.5,
    )

    response = await llm.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Nội dung tài liệu:\n\n{context}"),
    ])

    raw = str(response.content).strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw

    questions: list[dict] = json.loads(raw)
    return questions[:question_count]
