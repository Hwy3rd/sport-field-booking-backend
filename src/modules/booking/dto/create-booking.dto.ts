import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    description: 'List of time slot ids to book',
    type: [String],
    example: [
      '44ec4f15-62ba-4c0a-a9e0-f2dd5c6688b5',
      'd8fb4022-a6f4-4a96-a4fb-a57f4da5dd7b',
    ],
  })
  @Type(() => String)
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  timeSlotIds!: string[];
}
