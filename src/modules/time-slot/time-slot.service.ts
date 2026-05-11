import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { TimeSlot } from './entities/time-slot.entity';
import { TimeSlotTemplate } from './entities/time-slot-template.entity';
import { CreateManualSlotDto } from '../court/dto/create-manual-slot.dto';
import { In, Repository } from 'typeorm';
import { TIME_SLOT_STATUS } from 'src/libs/constants/time-slot.constant';
import { filterQuery } from 'src/libs/helpers/filter-query.helper';
import { TimeSlotQueryDto } from './dto/time-slot-query.dto';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { CourtService } from '../court/court.service';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import type { TimeSlotStatus } from 'src/libs/constants/time-slot.constant';

@Injectable()
export class TimeSlotService {
  constructor(
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
    @InjectRepository(TimeSlotTemplate)
    private readonly templateRepository: Repository<TimeSlotTemplate>,
    @Inject(forwardRef(() => CourtService))
    private readonly courtService: CourtService,
  ) {}

  async create(authUser: AuthUser, createTimeSlotDto: CreateTimeSlotDto) {
    await this.courtService.findOneManageableByUser(
      authUser,
      createTimeSlotDto.courtId,
    );

    const timeSlot = this.timeSlotRepository.create({
      ...createTimeSlotDto,
      status: createTimeSlotDto.status ?? TIME_SLOT_STATUS.AVAILABLE,
    });
    return await this.timeSlotRepository.save(timeSlot);
  }

  async bulkGenerateForCourt(
    courtId: string,
    venueId: string,
    templateNames?: string[],
    manualTimeSlots?: CreateManualSlotDto[],
  ) {
    if (manualTimeSlots && manualTimeSlots.length > 0) {
      for (const slot of manualTimeSlots) {
        const overlap = await this.timeSlotRepository
          .createQueryBuilder('ts')
          .where('ts.court_id = :courtId', { courtId })
          .andWhere('ts.date = :date', { date: slot.date })
          .andWhere('ts.start_time < :endTime', { endTime: slot.endTime })
          .andWhere('ts.end_time > :startTime', { startTime: slot.startTime })
          .getOne();

        if (overlap) {
          throw new BadRequestException(
            `Manual time slot on ${slot.date} from ${slot.startTime} to ${slot.endTime} overlaps with an existing slot.`,
          );
        }

        const newSlot = this.timeSlotRepository.create({
          courtId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          price: slot.price,
          status: TIME_SLOT_STATUS.AVAILABLE,
          templateId: null,
        });
        await this.timeSlotRepository.save(newSlot);
      }
    }

    if (templateNames && templateNames.length > 0) {
      const templates = await this.templateRepository.find({
        where: {
          venueId,
          name: In(templateNames),
          isActive: true,
        },
      });

      if (templates.length > 0) {
        const daysInAdvance = 14;
        const today = new Date();
        const slotsToInsert: TimeSlot[] = [];

        for (let i = 0; i < daysInAdvance; i++) {
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + i);
          const isoDate = targetDate.toISOString().split('T')[0];
          const weekday = (((targetDate.getDay() + 6) % 7) + 1);

          const dayTemplates = templates.filter(
            (t) => t.weekday === weekday && (t.courtId === null || t.courtId === courtId),
          );

          const uniqueTemplates: TimeSlotTemplate[] = [];
          for (const t of dayTemplates) {
            const isOverride = t.courtId !== null;
            const hasOverride = dayTemplates.some(
              (dt) => dt.courtId === courtId && dt.startTime === t.startTime && dt.endTime === t.endTime,
            );
            if (isOverride || !hasOverride) {
              uniqueTemplates.push(t);
            }
          }

          for (const template of uniqueTemplates) {
            const overlap = await this.timeSlotRepository
              .createQueryBuilder('ts')
              .where('ts.court_id = :courtId', { courtId })
              .andWhere('ts.date = :date', { date: isoDate })
              .andWhere('ts.start_time < :endTime', { endTime: template.endTime })
              .andWhere('ts.end_time > :startTime', { startTime: template.startTime })
              .getOne();

            if (!overlap) {
              slotsToInsert.push(
                this.timeSlotRepository.create({
                  courtId,
                  templateId: template.id,
                  date: isoDate,
                  startTime: template.startTime,
                  endTime: template.endTime,
                  price: template.price,
                  status: TIME_SLOT_STATUS.AVAILABLE,
                }),
              );
            }
          }
        }

        if (slotsToInsert.length > 0) {
          await this.timeSlotRepository.save(slotsToInsert, { chunk: 100 });
        }
      }
    }
  }

  async findAll(query: TimeSlotQueryDto) {
    const filterData = {
      current: query.current,
      limit: query.limit,
      filter: {
        courtId: query.courtId,
        templateId: query.templateId,
        date: query.date,
        status: query.status,
      },
    };

    return await filterQuery(this.timeSlotRepository, filterData, {
      sort: { field: 'date', order: 'ASC' },
    });
  }

  async findOne(id: string) {
    const timeSlot = await this.timeSlotRepository.findOne({ where: { id } });
    if (!timeSlot) throw new NotFoundException('Time slot not found');
    return timeSlot;
  }

  async findByIds(ids: string[]) {
    return await this.timeSlotRepository.find({
      where: { id: In(ids) },
      select: ['id', 'courtId', 'date', 'startTime', 'endTime', 'price', 'status'],
    });
  }

  async updateStatusByIds(ids: string[], status: TimeSlotStatus) {
    if (ids.length === 0) return;
    await this.timeSlotRepository.update({ id: In(ids) }, { status });
  }

  async blockAvailableByCourtIds(courtIds: string[]) {
    if (courtIds.length === 0) return;
    await this.timeSlotRepository.update(
      { courtId: In(courtIds), status: TIME_SLOT_STATUS.AVAILABLE },
      { status: TIME_SLOT_STATUS.BLOCKED },
    );
  }

  async blockAvailableByVenueIds(venueIds: string[]) {
    if (venueIds.length === 0) return;
    await this.timeSlotRepository
      .createQueryBuilder()
      .update(TimeSlot)
      .set({ status: TIME_SLOT_STATUS.BLOCKED })
      .where('"status" = :availableStatus', {
        availableStatus: TIME_SLOT_STATUS.AVAILABLE,
      })
      .andWhere(
        `"court_id" IN (
          SELECT "id"
          FROM "courts"
          WHERE "venue_id" IN (:...venueIds)
        )`,
      )
      .setParameter('venueIds', venueIds)
      .execute();
  }

  async update(
    authUser: AuthUser,
    id: string,
    updateTimeSlotDto: UpdateTimeSlotDto,
  ) {
    const existingTimeSlot = await this.timeSlotRepository.findOne({
      where: { id },
    });
    if (!existingTimeSlot) throw new NotFoundException('Time slot not found');

    if (existingTimeSlot.courtId !== updateTimeSlotDto.courtId) {
      throw new ForbiddenException('You cannot change this time slot court');
    }

    await this.courtService.findOneManageableByUser(
      authUser,
      updateTimeSlotDto.courtId,
    );

    Object.assign(existingTimeSlot, updateTimeSlotDto);
    return await this.timeSlotRepository.save(existingTimeSlot);
  }

  async remove(authUser: AuthUser, id: string) {
    const existingTimeSlot = await this.timeSlotRepository.findOne({
      where: { id },
    });
    if (!existingTimeSlot) throw new NotFoundException('Time slot not found');

    await this.courtService.findOneManageableByUser(
      authUser,
      existingTimeSlot.courtId,
    );

    await this.timeSlotRepository.remove(existingTimeSlot);
    return { id };
  }

  async bulkDelete(authUser: AuthUser, ids: BulkDeleteDto) {
    const uniqueIds = [...new Set(ids.ids)];
    if (uniqueIds.length === 0)
      throw new BadRequestException('No time slot ids provided');

    const existingTimeSlots = await this.timeSlotRepository.find({
      where: { id: In(uniqueIds) },
      select: ['id', 'courtId'],
    });
    const courtIds = [
      ...new Set(existingTimeSlots.map((item) => item.courtId)),
    ];
    for (const courtId of courtIds) {
      await this.courtService.findOneManageableByUser(authUser, courtId);
    }

    const result = await this.timeSlotRepository.delete({
      id: In(uniqueIds),
    });

    return {
      ids: uniqueIds,
      deletedCount: result.affected ?? 0,
    };
  }

  async lock(id: string) {
    const timeSlot = await this.timeSlotRepository.findOne({ where: { id } });
    if (!timeSlot) throw new NotFoundException('Time slot not found');
    if (timeSlot.status !== TIME_SLOT_STATUS.AVAILABLE) {
      throw new BadRequestException('Time slot is not available');
    }
    timeSlot.status = TIME_SLOT_STATUS.BLOCKED;
    timeSlot.lockedAt = new Date();
    return await this.timeSlotRepository.save(timeSlot);
  }

  async unlock(id: string) {
    const timeSlot = await this.timeSlotRepository.findOne({ where: { id } });
    if (!timeSlot) throw new NotFoundException('Time slot not found');
    if (timeSlot.status !== TIME_SLOT_STATUS.BLOCKED) {
      return timeSlot;
    }
    timeSlot.status = TIME_SLOT_STATUS.AVAILABLE;
    timeSlot.lockedAt = null;
    return await this.timeSlotRepository.save(timeSlot);
  }
}
