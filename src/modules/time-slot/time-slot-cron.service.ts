import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TimeSlot } from './entities/time-slot.entity';
import { TimeSlotTemplate } from './entities/time-slot-template.entity';
import { TimeSlotService } from './time-slot.service';
import { Court } from '../court/entities/court.entity';
import { TIME_SLOT_STATUS } from 'src/libs/constants/time-slot.constant';
import { COURT_STATUS } from 'src/libs/constants/court.constant';

@Injectable()
export class TimeSlotCronService {
  private readonly logger = new Logger(TimeSlotCronService.name);

  constructor(
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    private readonly timeSlotService: TimeSlotService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async unlockExpiredTimeSlots() {
    this.logger.debug('Running unlockExpiredTimeSlots cron...');
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() - 15); // 15 minutes

    const result = await this.timeSlotRepository
      .createQueryBuilder()
      .update(TimeSlot)
      .set({
        status: TIME_SLOT_STATUS.AVAILABLE,
        lockedAt: null,
      })
      .where('"status" = :blockedStatus', { blockedStatus: TIME_SLOT_STATUS.BLOCKED })
      .andWhere('"locked_at" < :expirationTime', { expirationTime })
      .andWhere(
        `"court_id" IN (
          SELECT "id"
          FROM "courts"
          WHERE "status" != :courtDeletedStatus
        )`,
        { courtDeletedStatus: COURT_STATUS.DELETED },
      )
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Unlocked ${result.affected} expired time slots`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateFutureTimeSlots() {
    this.logger.log('Running generateFutureTimeSlots cron...');
    const courts = await this.courtRepository.find({
      where: { status: COURT_STATUS.ACTIVE },
    });

    for (const court of courts) {
      if (!court.templateNames || court.templateNames.length === 0) continue;

      try {
        await this.timeSlotService.bulkGenerateForCourt(
          court.id,
          court.venueId,
          court.templateNames,
        );
      } catch (error) {
        this.logger.error(
          `Error generating time slots for court ${court.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    this.logger.log('Finished generating future time slots');
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTimeSlots() {
    this.logger.log('Running cleanupExpiredTimeSlots cron...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];

    const result = await this.timeSlotRepository
      .createQueryBuilder()
      .delete()
      .from(TimeSlot)
      .where('"date" < :dateLimit', { dateLimit })
      .andWhere('"status" != :bookedStatus', { bookedStatus: TIME_SLOT_STATUS.BOOKED })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(
        `Successfully physically deleted ${result.affected} expired unbooked time slots older than 30 days`,
      );
    }
  }
}
