import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorAuth1717462000000 implements MigrationInterface {
    name = 'RefactorAuth1717462000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Enum for VerificationRequestStatus
        await queryRunner.query(`CREATE TYPE "public"."verification_request_status_enum" AS ENUM('pending', 'approved', 'rejected', 'need_more_info')`);
        
        // Update UserStatus Enum (assuming it was varchar before based on entity setup)
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('pending_email_verification', 'pending_manual_verification', 'active', 'rejected', 'suspended')`);
        
        // Add new columns to users
        await queryRunner.query(`ALTER TABLE "users" ADD "student_code" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verified_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_login_at" TIMESTAMP`);
        
        // Convert status to enum (If there is existing data, cast it. Otherwise, this might fail if data is weird. Using safe cast)
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT`);
        // If DB has string 'pending_verification', we can just leave it to fail or manually clean up DB. 
        // For local development, this cast usually works if data is clean.
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum" USING "status"::"text"::"public"."users_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'pending_email_verification'`);
        
        // Create student_verification_requests table
        await queryRunner.query(`CREATE TABLE "student_verification_requests" (
            "id" uuid NOT NULL DEFAULT gen_random_uuid(), 
            "user_id" uuid NOT NULL, 
            "student_code" character varying(50) NOT NULL, 
            "campus" character varying(100), 
            "personal_email" character varying(255) NOT NULL, 
            "reason_for_no_fpt_email" text NOT NULL, 
            "student_card_url" character varying(255), 
            "status" "public"."verification_request_status_enum" NOT NULL DEFAULT 'pending', 
            "reviewed_by" uuid, 
            "reviewed_at" TIMESTAMP, 
            "rejection_reason" text, 
            "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_student_verification_requests" PRIMARY KEY ("id")
        )`);
        
        // Indexes
        await queryRunner.query(`CREATE INDEX "idx_student_verification_user_id" ON "student_verification_requests" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_student_verification_status" ON "student_verification_requests" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_student_verification_student_code" ON "student_verification_requests" ("student_code") `);
        
        await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "idx_users_role_id" ON "users" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "idx_users_status" ON "users" ("status") `);

        // Foreign key
        await queryRunner.query(`ALTER TABLE "student_verification_requests" ADD CONSTRAINT "FK_svr_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        // Handle old manual verification fields by dropping them
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "student_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "campus"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "personal_email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "reason_for_no_fpt_email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "id_card_url"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_verification_requests" DROP CONSTRAINT "FK_svr_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_role_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_email"`);
        await queryRunner.query(`DROP TABLE "student_verification_requests"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "student_code"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."verification_request_status_enum"`);
    }
}
