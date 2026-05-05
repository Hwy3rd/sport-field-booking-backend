import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { In, Not, Repository } from 'typeorm';
import { Court } from './entities/court.entity';
import { COURT_STATUS } from 'src/libs/constants/court.constant';
import { filterQuery } from 'src/libs/helpers/filter-query.helper';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { VenueService } from '../venue/venue.service';
import { SportService } from '../sport/sport.service';
import { CourtQueryDto } from './dto/court-query.dto';
import { TimeSlotService } from '../time-slot/time-slot.service';
import { TimeSlot } from '../time-slot/entities/time-slot.entity';
import { TimeSlotTemplate } from '../time-slot/entities/time-slot-template.entity';
import {
  TIME_SLOT_STATUS,
  type TimeSlotStatus,
} from 'src/libs/constants/time-slot.constant';

@Injectable()
export class CourtService {
  constructor(
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    @Inject(forwardRef(() => VenueService))
    private readonly venueService: VenueService,
    private readonly sportService: SportService,
    @Inject(forwardRef(() => TimeSlotService))
    private readonly timeSlotService: TimeSlotService,
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
    @InjectRepository(TimeSlotTemplate)
    private readonly timeSlotTemplateRepository: Repository<TimeSlotTemplate>,
  ) {}

  async create(createCourtDto: CreateCourtDto) {
    const venue = await this.venueService.findOneActiveById(
      createCourtDto.venueId,
    );
    if (!venue) throw new NotFoundException('Venue not found');

    const sport = await this.sportService.findOneActiveById(
      createCourtDto.sportId,
    );
    if (!sport) throw new NotFoundException('Sport not found');

    const existingCourt = await this.courtRepository.findOne({
      where: {
        venueId: createCourtDto.venueId,
        name: createCourtDto.name,
        status: Not(COURT_STATUS.DELETED),
      },
    });
    if (existingCourt) {
      throw new BadRequestException(
        'Court name is already taken in this venue',
      );
    }

    const { timeSlotConfig, ...courtData } = createCourtDto;

    const newCourt = this.courtRepository.create({
      ...courtData,
      status: COURT_STATUS.ACTIVE,
    });

    const savedCourt = await this.courtRepository.save(newCourt);
    await this.applyTimeSlotConfig(savedCourt.id, venue.operatingHours, timeSlotConfig);
    return savedCourt;
  }

  async findAllByFilter(query: CourtQueryDto) {
    const safeQuery = {
      current: query.current,
      limit: query.limit,
      filter: {
        name: query.name,
        sportId: query.sportId,
        venueId: query.venueId,
        pricePerHour: [query.minPrice ?? null, query.maxPrice ?? null],
      },
    };

    const result = await filterQuery(this.courtRepository, safeQuery, {
      regexFields: ['name'],
      rangeFields: ['pricePerHour'],
      customHandlers: {
        status: (qb, value, alias) => {
          qb.andWhere(`${alias}.status != :excludedStatus`, {
            excludedStatus: COURT_STATUS.DELETED,
          });
        },
      },
    });

    const items = result.items ?? [];
    if (items.length === 0) return result;

    const courtsWithRelations = await this.courtRepository.find({
      where: { id: In(items.map((item) => item.id)) },
      relations: { venue: true, sport: true },
    });
    const relationMap = new Map(courtsWithRelations.map((item) => [item.id, item]));

    return {
      ...result,
      items: items.map((item) => {
        const related = relationMap.get(item.id);
        if (!related) return item;
        return {
          ...item,
          venue: related.venue,
          sport: related.sport,
        };
      }),
    };
  }

  async findOneActiveById(id: string) {
    return await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      select: ['id'],
    });
  }

  async findOneById(id: string) {
    const court = await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      relations: { venue: true, sport: true },
    });
    if (!court) throw new NotFoundException('Court not found');
    return court;
  }

  async findOneManageableByUser(authUser: AuthUser, id: string) {
    const court = await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      relations: { venue: true },
    });
    if (!court) throw new NotFoundException('Court not found');

    if (
      authUser.role === USER_ROLE.OWNER &&
      court.venue.ownerId !== authUser.id
    ) {
      throw new ForbiddenException(
        'You can only manage courts in your own venue',
      );
    }

    return court;
  }

  async update(authUser: AuthUser, id: string, updateCourtDto: UpdateCourtDto) {
    const existingCourt = await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      relations: { venue: true },
    });
    if (!existingCourt) throw new NotFoundException('Court not found');

    if (
      authUser.role === USER_ROLE.OWNER &&
      existingCourt.venue.ownerId !== authUser.id
    ) {
      throw new ForbiddenException(
        'You can only update courts in your own venue',
      );
    }

    if (
      updateCourtDto.venueId &&
      updateCourtDto.venueId !== existingCourt.venueId
    ) {
      const targetVenue = await this.venueService.findOneActiveById(
        updateCourtDto.venueId,
      );
      if (!targetVenue) throw new NotFoundException('Venue not found');

      if (
        authUser.role === USER_ROLE.OWNER &&
        targetVenue.ownerId !== authUser.id
      ) {
        throw new ForbiddenException(
          'Owner cannot move court to another owner',
        );
      }
    }

    const targetSportId = updateCourtDto.sportId;
    if (targetSportId) {
      const sport = await this.sportService.findOneActiveById(targetSportId);
      if (!sport) throw new NotFoundException('Sport not found');
    }

    const targetVenueId = updateCourtDto.venueId ?? existingCourt.venueId;
    const targetName = updateCourtDto.name ?? existingCourt.name;
    const duplicateCourt = await this.courtRepository.findOne({
      where: {
        venueId: targetVenueId,
        name: targetName,
        status: Not(COURT_STATUS.DELETED),
        id: Not(id),
      },
      select: ['id'],
    });
    if (duplicateCourt) {
      throw new BadRequestException(
        'Court name is already taken in this venue',
      );
    }

    const { timeSlotConfig, ...courtData } = updateCourtDto;
    Object.assign(existingCourt, courtData);
    const updatedCourt = await this.courtRepository.save(existingCourt);
    const venue = await this.venueService.findOneActiveById(updatedCourt.venueId);
    await this.applyTimeSlotConfig(
      updatedCourt.id,
      venue?.operatingHours,
      timeSlotConfig,
    );
    return updatedCourt;
  }

  async remove(id: string) {
    const existingCourt = await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      select: ['id', 'status'],
    });
    if (!existingCourt) throw new NotFoundException('Court not found');

    existingCourt.status = COURT_STATUS.DELETED;
    await this.courtRepository.save(existingCourt);
    await this.timeSlotService.blockAvailableByCourtIds([existingCourt.id]);
    return { id };
  }

  async bulkDelete(ids: BulkDeleteDto) {
    const uniqueIds = [...new Set(ids.ids)];
    if (uniqueIds.length === 0)
      throw new BadRequestException('No court ids provided');

    const result = await this.courtRepository.update(
      {
        id: In(uniqueIds),
        status: Not(COURT_STATUS.DELETED),
      },
      { status: COURT_STATUS.DELETED },
    );
    await this.timeSlotService.blockAvailableByCourtIds(uniqueIds);

    return {
      ids: uniqueIds,
      deletedCount: result.affected ?? 0,
    };
  }

  private normalizeTime(time: string): string {
    return time.length === 5 ? `${time}:00` : time;
  }

  private assertTimeInsideOperatingHours(
    startTime: string,
    endTime: string,
    operatingHours?: { startTime?: string; endTime?: string } | null,
  ) {
    if (!operatingHours?.startTime || !operatingHours?.endTime) return;
    const venueStart = this.normalizeTime(operatingHours.startTime);
    const venueEnd = this.normalizeTime(operatingHours.endTime);
    const slotStart = this.normalizeTime(startTime);
    const slotEnd = this.normalizeTime(endTime);

    if (slotStart < venueStart || slotEnd > venueEnd || slotStart >= slotEnd) {
      throw new BadRequestException(
        `Time slot ${startTime}-${endTime} is outside venue operating hours ${operatingHours.startTime}-${operatingHours.endTime}`,
      );
    }
  }

  private async ensureNoDuplicateSlot(
    courtId: string,
    date: string,
    startTime: string,
    endTime: string,
  ) {
    const existing = await this.timeSlotRepository.findOne({
      where: {
        courtId,
        date: new Date(date),
        startTime,
        endTime,
      },
      select: ['id'],
    });
    if (existing) {
      throw new BadRequestException(
        `Duplicate time slot for ${date} ${startTime}-${endTime}`,
      );
    }
  }

  private async applyTimeSlotConfig(
    courtId: string,
    operatingHours: { startTime?: string; endTime?: string } | null | undefined,
    config: CreateCourtDto['timeSlotConfig'] | UpdateCourtDto['timeSlotConfig'],
  ) {
    if (!config) return;

    if (config.manualSlots?.length) {
      for (const slot of config.manualSlots) {
        this.assertTimeInsideOperatingHours(
          slot.startTime,
          slot.endTime,
          operatingHours,
        );
        await this.ensureNoDuplicateSlot(
          courtId,
          slot.date,
          slot.startTime,
          slot.endTime,
        );
        await this.timeSlotRepository.save(
          this.timeSlotRepository.create({
            courtId,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            price: slot.price,
            status: slot.status ?? TIME_SLOT_STATUS.AVAILABLE,
          }),
        );
      }
    }

    if (config.templateGeneration) {
      const template = config.templateGeneration;
      this.assertTimeInsideOperatingHours(
        template.startTime,
        template.endTime,
        operatingHours,
      );

      if (template.createTemplate !== false) {
        await this.timeSlotTemplateRepository.save(
          this.timeSlotTemplateRepository.create({
            courtId,
            weekday: template.weekday,
            startTime: template.startTime,
            endTime: template.endTime,
            price: template.price,
            isActive: true,
          }),
        );
      }

      const start = new Date(`${template.startDate}T00:00:00`);
      const end = new Date(`${template.endDate}T00:00:00`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        throw new BadRequestException('Invalid template date range');
      }

      for (
        const date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const weekday = ((date.getDay() + 6) % 7) + 1;
        if (weekday !== template.weekday) continue;

        const isoDate = date.toISOString().split('T')[0];
        await this.ensureNoDuplicateSlot(
          courtId,
          isoDate,
          template.startTime,
          template.endTime,
        );

        await this.timeSlotRepository.save(
          this.timeSlotRepository.create({
            courtId,
            date: isoDate,
            startTime: template.startTime,
            endTime: template.endTime,
            price: template.price,
            status: TIME_SLOT_STATUS.AVAILABLE as TimeSlotStatus,
          }),
        );
      }
    }
  }
}
