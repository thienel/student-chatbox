import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailDomainService {
  private allowedDomains: string[];

  constructor(private configService: ConfigService) {
    const domainsStr = this.configService.get<string>('ALLOWED_STUDENT_EMAIL_DOMAINS', '@fpt.edu.vn,@student.fpt.edu.vn,@fu.edu.vn');
    this.allowedDomains = domainsStr
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter((d) => d.length > 0);
  }

  normalizeEmail(email: string): string {
    if (!email) return '';
    return email.trim().toLowerCase();
  }

  isAllowedStudentEmail(email: string): boolean {
    const normalized = this.normalizeEmail(email);
    if (!normalized) return false;
    return this.allowedDomains.some((domain) => normalized.endsWith(domain));
  }

  isPersonalEmail(email: string): boolean {
    return !this.isAllowedStudentEmail(email);
  }
}
