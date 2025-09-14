/*
  Warnings:

  - You are about to drop the column `completed_at` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `error_message` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `records_inserted` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `records_processed` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `records_updated` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `school_id` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `source_system` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `started_at` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `sync_metadata` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `sync_type` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `table_name` on the `sync_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `app_settings` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `entity_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `firebase_uid` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_login` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `profile_picture` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `user_type` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendance_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `guardians` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schools` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `section_staff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_guardians` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sync_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `terms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_types` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `jobType` to the `sync_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('FANTASY', 'GENZ', 'MEME');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('GOOGLE', 'MICROSOFT', 'OUTLOOK', 'APPLE', 'CALDAV');

-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('GEMINI', 'OPENAI', 'CLAUDE', 'LLAMA');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'RESCHEDULED');

-- DropIndex
DROP INDEX "sync_jobs_school_id_idx";

-- DropIndex
DROP INDEX "sync_jobs_source_system_idx";

-- DropIndex
DROP INDEX "sync_jobs_table_name_idx";

-- DropIndex
DROP INDEX "users_email_idx";

-- DropIndex
DROP INDEX "users_entity_id_idx";

-- DropIndex
DROP INDEX "users_firebase_uid_idx";

-- DropIndex
DROP INDEX "users_firebase_uid_key";

-- DropIndex
DROP INDEX "users_is_active_idx";

-- DropIndex
DROP INDEX "users_user_type_idx";

-- AlterTable
ALTER TABLE "sync_jobs" DROP COLUMN "completed_at",
DROP COLUMN "created_at",
DROP COLUMN "error_message",
DROP COLUMN "records_inserted",
DROP COLUMN "records_processed",
DROP COLUMN "records_updated",
DROP COLUMN "school_id",
DROP COLUMN "source_system",
DROP COLUMN "started_at",
DROP COLUMN "sync_metadata",
DROP COLUMN "sync_type",
DROP COLUMN "table_name",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "eventsProcessed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "jobType" TEXT NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "app_settings",
DROP COLUMN "created_at",
DROP COLUMN "entity_id",
DROP COLUMN "firebase_uid",
DROP COLUMN "is_active",
DROP COLUMN "last_login",
DROP COLUMN "profile_picture",
DROP COLUMN "updated_at",
DROP COLUMN "user_type",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "aiApiKey" TEXT,
ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "aiProvider" "AIProvider" NOT NULL DEFAULT 'GEMINI',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "notificationMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "selectedTheme" "Theme" NOT NULL DEFAULT 'FANTASY',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- DropTable
DROP TABLE "attendance";

-- DropTable
DROP TABLE "attendance_codes";

-- DropTable
DROP TABLE "courses";

-- DropTable
DROP TABLE "enrollments";

-- DropTable
DROP TABLE "guardians";

-- DropTable
DROP TABLE "refresh_tokens";

-- DropTable
DROP TABLE "schools";

-- DropTable
DROP TABLE "section_staff";

-- DropTable
DROP TABLE "sections";

-- DropTable
DROP TABLE "staff";

-- DropTable
DROP TABLE "student_guardians";

-- DropTable
DROP TABLE "students";

-- DropTable
DROP TABLE "sync_configs";

-- DropTable
DROP TABLE "terms";

-- DropTable
DROP TABLE "user_types";

-- DropEnum
DROP TYPE "UserTypeEnum";

-- CreateTable
CREATE TABLE "notification_channels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "status" "IntegrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "providerCalendarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "meetingLink" TEXT,
    "attendeeCount" INTEGER,
    "status" "EventStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "dataHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storylines" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "theme" "Theme" NOT NULL,
    "storyText" TEXT NOT NULL,
    "plainText" TEXT NOT NULL,
    "emoji" TEXT,
    "aiProvider" "AIProvider",
    "tokensUsed" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storylines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "storylineId" TEXT,
    "channelId" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "messageText" TEXT NOT NULL,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_channels_userId_idx" ON "notification_channels"("userId");

-- CreateIndex
CREATE INDEX "notification_channels_type_idx" ON "notification_channels"("type");

-- CreateIndex
CREATE INDEX "notification_channels_isActive_idx" ON "notification_channels"("isActive");

-- CreateIndex
CREATE INDEX "calendar_integrations_userId_idx" ON "calendar_integrations"("userId");

-- CreateIndex
CREATE INDEX "calendar_integrations_status_idx" ON "calendar_integrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_integrations_userId_provider_key" ON "calendar_integrations"("userId", "provider");

-- CreateIndex
CREATE INDEX "calendars_userId_idx" ON "calendars"("userId");

-- CreateIndex
CREATE INDEX "calendars_integrationId_idx" ON "calendars"("integrationId");

-- CreateIndex
CREATE INDEX "calendars_isActive_idx" ON "calendars"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "calendars_integrationId_providerCalendarId_key" ON "calendars"("integrationId", "providerCalendarId");

-- CreateIndex
CREATE INDEX "events_userId_idx" ON "events"("userId");

-- CreateIndex
CREATE INDEX "events_calendarId_idx" ON "events"("calendarId");

-- CreateIndex
CREATE INDEX "events_startTime_idx" ON "events"("startTime");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "events_calendarId_providerEventId_key" ON "events"("calendarId", "providerEventId");

-- CreateIndex
CREATE INDEX "storylines_userId_idx" ON "storylines"("userId");

-- CreateIndex
CREATE INDEX "storylines_eventId_idx" ON "storylines"("eventId");

-- CreateIndex
CREATE INDEX "storylines_expiresAt_idx" ON "storylines"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "storylines_eventId_theme_key" ON "storylines"("eventId", "theme");

-- CreateIndex
CREATE INDEX "notification_logs_userId_idx" ON "notification_logs"("userId");

-- CreateIndex
CREATE INDEX "notification_logs_eventId_idx" ON "notification_logs"("eventId");

-- CreateIndex
CREATE INDEX "notification_logs_scheduledFor_idx" ON "notification_logs"("scheduledFor");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE INDEX "sync_jobs_userId_idx" ON "sync_jobs"("userId");

-- CreateIndex
CREATE INDEX "sync_jobs_startedAt_idx" ON "sync_jobs"("startedAt");
