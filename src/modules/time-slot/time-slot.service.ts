import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { TimeSlot } from './entities/time-slot.entity';
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
}
