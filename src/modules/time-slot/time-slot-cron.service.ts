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
    expirationTime.setMinutes(expirationTime.getMinutes() - 10); // 10 minutes

    const result = await this.timeSlotRepository.update(
      {
        status: TIME_SLOT_STATUS.BLOCKED,
        lockedAt: LessThan(expirationTime),
      },
      {
        status: TIME_SLOT_STATUS.AVAILABLE,
        lockedAt: null,
      },
    );

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
}
