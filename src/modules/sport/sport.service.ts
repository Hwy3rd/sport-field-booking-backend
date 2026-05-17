import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SportQueryDto } from './dto/sport-query.dto';
import { filterQuery } from 'src/libs/helpers/filter-query.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Sport } from './entities/sport.entity';
import { SportDto } from './dto/sport.dto';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { Court } from '../court/entities/court.entity';
import { TimeSlot } from '../time-slot/entities/time-slot.entity';
import { COURT_STATUS } from 'src/libs/constants/court.constant';
import { TIME_SLOT_STATUS } from 'src/libs/constants/time-slot.constant';

@Injectable()
export class SportService {
  constructor(
    @InjectRepository(Sport)
    private readonly sportRepository: Repository<Sport>,
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
  ) {}

  async findAll(query: SportQueryDto) {
    const filterData = {
      current: query.current,
      limit: query.limit,
      filter: {
        ...(query.name ? { name: query.name } : {}),
        isDeleted: false,
      },
    };

    return await filterQuery(this.sportRepository, filterData, {
      regexFields: ['name'],
      omit: ['isDeleted'],
    });
  }

  async findOneActiveById(id: string) {
    return await this.sportRepository.findOne({
      where: { id, isDeleted: false },
      select: ['id'],
    });
  }

  async findOneById(id: string) {
    const sport = await this.sportRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!sport) throw new NotFoundException('Sport not found');
    return sport;
  }

  async create(sportDto: SportDto) {
    const existingSport = await this.sportRepository.findOne({
      where: { name: sportDto.name, isDeleted: false },
    });
    if (existingSport) {
      throw new BadRequestException('Sport already exists');
    }

    return await this.sportRepository.save(sportDto);
  }

  async update(id: string, sportDto: SportDto) {
    const matches = await this.sportRepository.find({
      where: [
        { id, isDeleted: false },
        { name: sportDto.name, isDeleted: false },
      ],
      select: ['id', 'name'],
    });

    const existingSport = matches.find((s) => s.id === id);
    if (!existingSport) throw new NotFoundException('Sport not found');

    const duplicateSport = matches.find(
      (s) => s.name === sportDto.name && s.id !== id,
    );
    if (duplicateSport)
      throw new BadRequestException('Sport name is already taken');

    Object.assign(existingSport, sportDto);
    return await this.sportRepository.save(existingSport);
  }

  async remove(id: string) {
    const existingSport = await this.sportRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!existingSport) {
      throw new NotFoundException('Sport not found');
    }
    existingSport.isDeleted = true;
    await this.sportRepository.save(existingSport);

    const courts = await this.courtRepository.find({
      where: { sportId: id, status: Not(COURT_STATUS.DELETED) },
      select: ['id'],
    });
    const courtIds = courts.map((c) => c.id);
    if (courtIds.length > 0) {
      await this.courtRepository.update(
        { id: In(courtIds) },
        { status: COURT_STATUS.DELETED },
      );
      await this.timeSlotRepository.update(
        { courtId: In(courtIds), status: TIME_SLOT_STATUS.AVAILABLE },
        { status: TIME_SLOT_STATUS.BLOCKED },
      );
    }

    return {
      id,
    };
  }

  async bulkDelete(ids: BulkDeleteDto) {
    const uniqueIds = [...new Set(ids.ids)];
    if (uniqueIds.length === 0)
      throw new BadRequestException('No sport ids provided');

    const result = await this.sportRepository.update(
      {
        id: In(uniqueIds),
        isDeleted: false,
      },
      { isDeleted: true },
    );

    const courts = await this.courtRepository.find({
      where: { sportId: In(uniqueIds), status: Not(COURT_STATUS.DELETED) },
      select: ['id'],
    });
    const courtIds = courts.map((c) => c.id);
    if (courtIds.length > 0) {
      await this.courtRepository.update(
        { id: In(courtIds) },
        { status: COURT_STATUS.DELETED },
      );
      await this.timeSlotRepository.update(
        { courtId: In(courtIds), status: TIME_SLOT_STATUS.AVAILABLE },
        { status: TIME_SLOT_STATUS.BLOCKED },
      );
    }

    return {
      ids: uniqueIds,
      deletedCount: result.affected ?? 0,
    };
  }
}
