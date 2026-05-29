import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    document_id: string;
    subject_id: string;
    chunk_index: number;
    text: string;
    original_name: string;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  payload: {
    document_id: string;
    subject_id: string;
    chunk_index: number;
    text: string;
    original_name: string;
  };
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;
  private readonly collection: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('QDRANT_URL', 'http://localhost:6333');
    this.client = new QdrantClient({ url });
    this.collection = this.config.get<string>('QDRANT_COLLECTION', 'documents');
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureCollection();
    } catch (error) {
      this.logger.warn(`Could not initialize Qdrant collection: ${error}`);
    }
  }

  async ensureCollection(vectorSize = 1536): Promise<void> {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c) => c.name === this.collection);

    if (exists) {
      const info = await this.client.getCollection(this.collection);
      const currentSize = (info.config?.params?.vectors as any)?.size as number | undefined;
      if (currentSize !== undefined && currentSize !== vectorSize) {
        this.logger.warn(
          `Collection "${this.collection}" has vector size ${currentSize} but model produces ${vectorSize} — recreating`,
        );
        await this.client.deleteCollection(this.collection);
        await this.client.createCollection(this.collection, {
          vectors: { size: vectorSize, distance: 'Cosine' },
        });
        this.logger.log(`Recreated Qdrant collection with size ${vectorSize}`);
      }
      return;
    }

    await this.client.createCollection(this.collection, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    });
    this.logger.log(`Created Qdrant collection: ${this.collection} (size=${vectorSize})`);
  }

  async upsertPoints(points: QdrantPoint[], batchSize = 100): Promise<void> {
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      try {
        await this.client.upsert(this.collection, {
          wait: true,
          points: batch.map((p) => ({
            id: p.id,
            vector: p.vector,
            payload: p.payload,
          })),
        });
      } catch (err: any) {
        this.logger.error(
          `Qdrant upsert failed (batch ${i}–${i + batch.length}, vectorDim=${batch[0]?.vector?.length}): ${err?.message}`,
          JSON.stringify(err?.body ?? err?.response ?? ''),
        );
        throw err;
      }
      if (points.length > batchSize) {
        this.logger.log(`Upserted ${Math.min(i + batchSize, points.length)}/${points.length} points`);
      }
    }
  }

  async searchSimilar(
    vector: number[],
    subjectId: string,
    topK: number,
    minScore: number,
  ): Promise<SearchResult[]> {
    const results = await this.client.search(this.collection, {
      vector,
      limit: topK,
      score_threshold: minScore,
      filter: {
        must: [{ key: 'subject_id', match: { value: subjectId } }],
      },
      with_payload: true,
    });

    return results.map((r) => ({
      id: String(r.id),
      score: r.score,
      payload: r.payload as SearchResult['payload'],
    }));
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.client.delete(this.collection, {
      filter: {
        must: [{ key: 'document_id', match: { value: documentId } }],
      },
    });
  }
}
