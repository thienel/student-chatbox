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

  async ensureCollection(): Promise<void> {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c) => c.name === this.collection);
    if (!exists) {
      await this.client.createCollection(this.collection, {
        vectors: { size: 1536, distance: 'Cosine' },
      });
      this.logger.log(`Created Qdrant collection: ${this.collection}`);
    }
  }

  async upsertPoints(points: QdrantPoint[]): Promise<void> {
    await this.client.upsert(this.collection, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
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
