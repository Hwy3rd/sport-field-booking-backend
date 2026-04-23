import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { seedAdminIfMissing } from './seed-admin';

@Injectable()
export class SeedOnBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedOnBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const shouldSeedAdmin =
      this.configService.get<string>('ADMIN_SEED_ON_BOOT') !== 'false';
    if (!shouldSeedAdmin || !this.dataSource.isInitialized) {
      return;
    }

    await seedAdminIfMissing(this.dataSource.getRepository(User));
  }
}
