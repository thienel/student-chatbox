import { SetMetadata } from '@nestjs/common';

export const AI_FEATURE_KEY = 'ai_feature';
export const AiFeature = (feature: string) => SetMetadata(AI_FEATURE_KEY, feature);
