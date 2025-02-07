import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1738942691089 implements MigrationInterface {
    name = 'InitialSchema1738942691089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rooms_type_enum" AS ENUM('DEVELOPMENT', 'MARKETING', 'SALES', 'MEETING')`);
        await queryRunner.query(`CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "type" "public"."rooms_type_enum" NOT NULL, CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."agent_messages_type_enum" AS ENUM('CHAT', 'DECISION', 'TASK_UPDATE')`);
        await queryRunner.query(`CREATE TABLE "agent_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "content" text NOT NULL, "type" "public"."agent_messages_type_enum" NOT NULL DEFAULT 'CHAT', "agentId" uuid, "roomId" uuid, CONSTRAINT "PK_8c7cdeda30e81dba421925df4fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."agents_role_enum" AS ENUM('CEO', 'CTO', 'ENGINEER', 'MARKETER', 'SALES')`);
        await queryRunner.query(`CREATE TYPE "public"."agents_status_enum" AS ENUM('ACTIVE', 'BREAK', 'IDLE')`);
        await queryRunner.query(`CREATE TABLE "agents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "role" "public"."agents_role_enum" NOT NULL, "status" "public"."agents_status_enum" NOT NULL DEFAULT 'IDLE', "location" jsonb NOT NULL, CONSTRAINT "PK_9c653f28ae19c5884d5baf6a1d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."agent_tasks_status_enum" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')`);
        await queryRunner.query(`CREATE TYPE "public"."agent_tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')`);
        await queryRunner.query(`CREATE TABLE "agent_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "description" text NOT NULL, "status" "public"."agent_tasks_status_enum" NOT NULL DEFAULT 'TODO', "priority" "public"."agent_tasks_priority_enum" NOT NULL DEFAULT 'MEDIUM', "assignedToId" uuid, "createdById" uuid, CONSTRAINT "PK_0dd9472bb57b7ab7d0a5cd1f20b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "agent_messages" ADD CONSTRAINT "FK_c012cca4527e9984c623c8c3c3b" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agent_messages" ADD CONSTRAINT "FK_4ea2484455415d97aca3f052bf0" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agent_tasks" ADD CONSTRAINT "FK_873f98f11e1f515a272c4acb93c" FOREIGN KEY ("assignedToId") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agent_tasks" ADD CONSTRAINT "FK_88f1ee98cc352052f3207b05459" FOREIGN KEY ("createdById") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agent_tasks" DROP CONSTRAINT "FK_88f1ee98cc352052f3207b05459"`);
        await queryRunner.query(`ALTER TABLE "agent_tasks" DROP CONSTRAINT "FK_873f98f11e1f515a272c4acb93c"`);
        await queryRunner.query(`ALTER TABLE "agent_messages" DROP CONSTRAINT "FK_4ea2484455415d97aca3f052bf0"`);
        await queryRunner.query(`ALTER TABLE "agent_messages" DROP CONSTRAINT "FK_c012cca4527e9984c623c8c3c3b"`);
        await queryRunner.query(`DROP TABLE "agent_tasks"`);
        await queryRunner.query(`DROP TYPE "public"."agent_tasks_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."agent_tasks_status_enum"`);
        await queryRunner.query(`DROP TABLE "agents"`);
        await queryRunner.query(`DROP TYPE "public"."agents_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."agents_role_enum"`);
        await queryRunner.query(`DROP TABLE "agent_messages"`);
        await queryRunner.query(`DROP TYPE "public"."agent_messages_type_enum"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
        await queryRunner.query(`DROP TYPE "public"."rooms_type_enum"`);
    }

}
