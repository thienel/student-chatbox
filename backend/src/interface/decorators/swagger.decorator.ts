import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

export function ApiStandardResponse(options?: {
  unauthorized?: string;
  forbidden?: string;
  badRequest?: string;
}) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: options?.unauthorized || 'Unauthorized access' }),
    ApiForbiddenResponse({ description: options?.forbidden || 'Forbidden access' }),
    ApiBadRequestResponse({ description: options?.badRequest || 'Bad request parameters' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );
}
