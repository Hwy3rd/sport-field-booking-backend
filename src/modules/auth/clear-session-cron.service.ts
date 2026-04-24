import { Injectable, Logger } from '@nestjs/common';
import { Session } from './entities/session.entity';
import { Brackets, LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ClearSessionCronService {
  constructor(
    @InjectRepository(Session) private sessionRepository: Repository<Session>,
  ) {}

  private readonly logger = new Logger(ClearSessionCronService.name);

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'clear-session',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async clearExpiredSessions() {
    this.logger.log('Clearing expired sessions...');

    const now = new Date();
    const revokedRetentionDays = 7; // 7 days
    const revokedCutoff = new Date(
      now.getTime() - revokedRetentionDays * 24 * 60 * 60 * 1000,
    );

    //Delete sessions that are expired or revoked more than 7 days ago
    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .from(Session)
      .where('expires_at < :now', { now })
      .orWhere(
        new Brackets((qb) => {
          qb.where('revoked_at IS NOT NULL').andWhere(
            'revoked_at < :revokedCutoff',
            { revokedCutoff },
          );
        }),
      )
      .execute();

    this.logger.log(`Cleared ${result.affected ?? 0} sessions.`);
  }
}
