import { IsBoolean, IsString } from 'class-validator';

export class ToggleLockDto {
  @IsString()
  pageId: string;

  @IsBoolean()
  isLocked: boolean;
}
