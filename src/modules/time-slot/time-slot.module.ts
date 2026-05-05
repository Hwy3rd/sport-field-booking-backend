import { forwardRef, Module } from '@nestjs/common';
import { TimeSlotService } from './time-slot.service';
import { TimeSlotController } from './time-slot.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeSlot } from './entities/time-slot.entity';
import { TimeSlotTemplate } from './entities/time-slot-template.entity';
import { CourtModule } from '../court/court.module';
import { TimeSlotTemplateController } from './time-slot-template.controller';
import { TimeSlotTemplateService } from './time-slot-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeSlot, TimeSlotTemplate]),
    forwardRef(() => CourtModule),
  ],
  controllers: [TimeSlotController, TimeSlotTemplateController],
  providers: [TimeSlotService, TimeSlotTemplateService],
  exports: [TimeSlotService, TimeSlotTemplateService],
})
export class TimeSlotModule {}
