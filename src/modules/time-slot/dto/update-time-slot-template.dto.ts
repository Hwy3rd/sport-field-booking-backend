import { PartialType } from '@nestjs/swagger';
import { CreateTimeSlotTemplateDto } from './create-time-slot-template.dto';

export class UpdateTimeSlotTemplateDto extends PartialType(
  CreateTimeSlotTemplateDto,
) {}
