import { Module } from '@nestjs/common';
import { LangchainRagService } from './langchain-rag.service';
import { DocumentProcessorService } from './document-processor.service';
import { QdrantModule } from '../database/qdrant/qdrant.module';
import { TypeOrmDatabaseModule } from '../database/typeorm/typeorm.module';

@Module({
  imports: [QdrantModule, TypeOrmDatabaseModule],
  providers: [LangchainRagService, DocumentProcessorService],
  exports: [LangchainRagService, DocumentProcessorService],
})
export class AiModule {}
