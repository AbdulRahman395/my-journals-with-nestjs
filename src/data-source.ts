import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { OTP } from './users/entities/otp.entity';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false, // For self-signed certificates
  },
  extra: {
    ssl: {
      sslmode: 'require', // Required for Neon
    },
  },
  entities: [User, OTP],
  synchronize: !isProduction,
  logging: true,
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
};

const AppDataSource = new DataSource(dataSourceOptions);

// For TypeORM CLI migrations
export default AppDataSource;