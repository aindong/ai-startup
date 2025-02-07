import { DataSource } from 'typeorm';

export interface Seeder {
  run(dataSource: DataSource): Promise<void>;
}
