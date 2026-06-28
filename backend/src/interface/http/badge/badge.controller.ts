import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { ListBadgesUseCase } from '../../../application/badge/use-cases/list-badges.use-case';
import { GetUserBadgesUseCase } from '../../../application/badge/use-cases/get-user-badges.use-case';
import { GetMyBadgesUseCase } from '../../../application/badge/use-cases/get-my-badges.use-case';
import { User } from '../../../domain/user/entities/user.entity';

@Controller()
@UseGuards(JwtAuthGuard)
export class BadgeController {
  constructor(
    private readonly listBadgesUseCase: ListBadgesUseCase,
    private readonly getUserBadgesUseCase: GetUserBadgesUseCase,
    private readonly getMyBadgesUseCase: GetMyBadgesUseCase,
  ) {}

  @Get('badges')
  listCatalogue() {
    return this.listBadgesUseCase.execute();
  }

  @Get('me/badges')
  myBadges(@CurrentUser() user: User) {
    return this.getMyBadgesUseCase.execute(user);
  }

  @Get('users/:userId/badges')
  userBadges(@Param('userId') userId: string) {
    return this.getUserBadgesUseCase.execute(userId);
  }
}
