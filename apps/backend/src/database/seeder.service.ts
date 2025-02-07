import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InitialSeeder } from './seeds/initial.seed';

@Injectable()
export class SeederService {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const seeders = [InitialSeeder];

    for (const seederClass of seeders) {
      const seeder = new seederClass();
      await seeder.run(this.dataSource);
    }
  }
}
