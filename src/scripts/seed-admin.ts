import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { USER_ROLE, USER_STATUS } from 'src/libs/constants/user.constant';

const configService = new ConfigService();

const appDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: Number(configService.get<string>('DB_PORT') ?? 5432),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: [User],
});

export async function seedAdminIfMissing(userRepository: Repository<User>) {
  const adminEmail = configService.get<string>('ADMIN_EMAIL') ?? 'admin@example.com';
  const adminUsername = configService.get<string>('ADMIN_USERNAME') ?? 'admin';
  const adminPassword =
    configService.get<string>('ADMIN_PASSWORD') ?? 'admin123456';
  const adminFullName =
    configService.get<string>('ADMIN_FULL_NAME') ?? 'System Admin';
  const adminPhone = configService.get<string>('ADMIN_PHONE') || '0901234567';

  const existingAdmin = await userRepository.findOne({
    where: { role: USER_ROLE.ADMIN },
  });

  if (existingAdmin) {
    console.log('⚠️ Admin account already exists. Skip seeding.');
    return;
  }

  const adminUser = userRepository.create({
    email: adminEmail,
    username: adminUsername,
    password: adminPassword,
    fullName: adminFullName,
    phone: adminPhone,
    role: USER_ROLE.ADMIN,
    status: USER_STATUS.ACTIVE,
  });

  try {
    await userRepository.save(adminUser);
  } catch (error) {
    if (
      error instanceof QueryFailedError &&
      (error as { driverError?: { code?: string } }).driverError?.code ===
        '23505'
    ) {
      console.log('⚠️ Admin account already exists. Skip seeding.');
      return;
    }
    throw error;
  }

  console.log(`Created admin account: ${adminEmail}`);
}

async function runStandaloneSeed() {
  await appDataSource.initialize();
  const userRepository = appDataSource.getRepository(User);
  await seedAdminIfMissing(userRepository);
}

const isStandaloneSeedExecution =
  process.argv[1]?.includes('seed-admin.ts') ||
  process.argv[1]?.includes('seed-admin.js');

if (isStandaloneSeedExecution) {
  runStandaloneSeed()
    .catch((error) => {
      console.error('Failed to seed admin account', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (appDataSource.isInitialized) {
        await appDataSource.destroy();
      }
    });
}
