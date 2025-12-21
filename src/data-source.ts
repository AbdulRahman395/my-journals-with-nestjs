import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { OTP } from './users/entities/otp.entity';
import { Journal } from './journals/entities/journal.entity';
import { JournalMedia } from './journals/entities/journal-media.entity';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ...(process.env.DB_SSL === 'true' ? {
    ssl: {
      rejectUnauthorized: false, // For self-signed certificates
    },
    extra: {
      ssl: {
        sslmode: 'require',
      },
    },
  } : {
    extra: {
      ssl: false,
    },
  }),
  entities: [User, OTP, Journal, JournalMedia],
  synchronize: !isProduction,
  logging: true,
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
};

const AppDataSource = new DataSource(dataSourceOptions);

// For TypeORM CLI migrations
export default AppDataSource;