import { MigrationInterface, QueryRunner } from 'typeorm';

export class SecurityHardening1720000000000 implements MigrationInterface {
  name = 'SecurityHardening1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "otp_tokens" ADD COLUMN IF NOT EXISTS "failed_attempts" integer NOT NULL DEFAULT 0',
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flashcard_session_lapses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "flashcard_id" uuid NOT NULL,
        "lapse_count" integer NOT NULL DEFAULT 0,
        CONSTRAINT "UQ_flashcard_session_lapse" UNIQUE ("session_id", "flashcard_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "flashcard_session_lapses"');
    await queryRunner.query('ALTER TABLE "otp_tokens" DROP COLUMN IF EXISTS "failed_attempts"');
  }
}
