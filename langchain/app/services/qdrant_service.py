from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
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

    def search_similar(
        self, vector: list[float], subject_id: str, top_k: int, min_score: float
    ) -> list[dict]:
        results = self._client.search(
            self._collection,
            query_vector=vector,
            limit=top_k,
            score_threshold=min_score,
            query_filter=Filter(
                must=[FieldCondition(key="subject_id", match=MatchValue(value=subject_id))]
            ),
            with_payload=True,
        )
        return [{"id": str(r.id), "score": r.score, "payload": r.payload} for r in results]

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
