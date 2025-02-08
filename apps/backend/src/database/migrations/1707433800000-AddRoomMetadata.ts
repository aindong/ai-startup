import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoomMetadata1707433800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "room" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{"gridX": 0, "gridY": 0, "gridWidth": 1, "gridHeight": 1, "color": "#FFFFFF"}' NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "room" DROP COLUMN "metadata";
    `);
  }
}
