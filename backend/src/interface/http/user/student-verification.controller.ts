import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateStudentVerificationRequestDto } from '../../../application/user/dtos/create-student-verification-request.dto';
import { StudentVerificationService } from '../../../application/user/services/student-verification.service';
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller('student-verification')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiTags('Student Verification')
export class StudentVerificationController {
  constructor(
    private readonly verificationService: StudentVerificationService,
  ) {}

  @Post('request')
    @ApiOperation({ summary: 'Create request' })
  async createRequest(@Body() dto: CreateStudentVerificationRequestDto) {
    return this.verificationService.createManualVerificationRequest(dto);
  }
}
