import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://educhat:educhat_dev@localhost:5440/educhat',
  entities: ['src/infrastructure/database/typeorm/orm-entities/**/*.ts'],
  migrations: ['src/infrastructure/database/typeorm/migrations/**/*.ts'],
  synchronize: false,
});
