import random
from qdrant_client import QdrantClient
from typing import Optional
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    MatchAny,
    FilterSelector,
)

from ..config import settings


class QdrantService:
    def __init__(self) -> None:
        self._client = QdrantClient(url=settings.qdrant_url)
        self._collection = settings.qdrant_collection

    def ensure_collection(self, vector_size: int = 1536) -> None:
        names = [c.name for c in self._client.get_collections().collections]
        if self._collection in names:
            info = self._client.get_collection(self._collection)
            current_size = info.config.params.vectors.size  # type: ignore[union-attr]
            if current_size != vector_size:
                self._client.delete_collection(self._collection)
                self._create(vector_size)
        else:
            self._create(vector_size)

    def _create(self, vector_size: int) -> None:
        self._client.create_collection(
            self._collection,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )

    def upsert_points(self, points: list[dict], batch_size: int = 100) -> None:
        for i in range(0, len(points), batch_size):
            batch = points[i : i + batch_size]
            self._client.upsert(
                self._collection,
                points=[PointStruct(id=p["id"], vector=p["vector"], payload=p["payload"]) for p in batch],
                wait=True,
            )

    def _scope_filter(
        self, lecturer_id: str, subject_id: str, document_ids: Optional[list[str]] = None
    ) -> Filter:
        # Content is isolated per lecturer+subject knowledge base; optionally
        # narrow to specific documents.
        must = [
            FieldCondition(key="lecturer_id", match=MatchValue(value=lecturer_id)),
            FieldCondition(key="subject_id", match=MatchValue(value=subject_id)),
        ]
        if document_ids:
            must.append(FieldCondition(key="document_id", match=MatchAny(any=document_ids)))
        return Filter(must=must)

    def search_similar(
        self,
        vector: list[float],
        lecturer_id: str,
        subject_id: str,
        top_k: int,
        min_score: float,
        document_ids: Optional[list[str]] = None,
    ) -> list[dict]:
        results = self._client.search(
            collection_name=self._collection,
            query_vector=vector,
            limit=top_k,
            score_threshold=min_score if min_score > 0.0 else None,
            query_filter=self._scope_filter(lecturer_id, subject_id, document_ids),
            with_payload=True,
        )
        return [
            {
                "id": str(r.id),
                "score": r.score,
                "text": (r.payload or {}).get("text", ""),
                "payload": r.payload,
            }
            for r in results
        ]

    def get_random_chunks(
        self,
        lecturer_id: str,
        subject_id: str,
        limit: int = 20,
        document_ids: Optional[list[str]] = None,
    ) -> list[dict]:
        results, _ = self._client.scroll(
            self._collection,
            scroll_filter=self._scope_filter(lecturer_id, subject_id, document_ids),
            limit=200,
            with_payload=True,
            with_vectors=False,
        )
        sample = random.sample(results, min(limit, len(results)))
        return [
            {"id": str(p.id), "text": (p.payload or {}).get("text", ""), "payload": p.payload}
            for p in sample
        ]

    def get_chunks_by_document(self, document_id: str, limit: int = 100) -> list[dict]:
        results, _ = self._client.scroll(
            self._collection,
            scroll_filter=Filter(
                must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            ),
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )
        chunks = [
            {
                "chunk_index": (p.payload or {}).get("chunk_index", 0),
                "text": (p.payload or {}).get("text", ""),
            }
            for p in results
        ]
        chunks.sort(key=lambda c: c["chunk_index"])
        return chunks

    def delete_by_document_id(self, document_id: str) -> None:
        self._client.delete(
            self._collection,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
                )
            ),
        )


qdrant_service = QdrantService()
