import { Injectable } from '@nestjs/common';
import { BADGE_CATALOGUE } from '../../../domain/badge/badge-catalogue';

@Injectable()
export class ListBadgesUseCase {
  execute() {
    return BADGE_CATALOGUE.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      iconKey: b.iconKey,
    }));
  }
}
