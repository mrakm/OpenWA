import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { GROUP_DESCRIPTION_MAX_LENGTH, GROUP_NAME_MAX_LENGTH } from '../../group/dto/group.dto';

/**
 * A community is created EMPTY: Baileys' communityCreate takes no participants. Add them with
 * POST /sessions/:sessionId/groups/:communityId/participants — a community id is a group id on the
 * wire, so the group participant, metadata and invite-code routes all accept it.
 */
export class CreateCommunityDto {
  @ApiProperty({ description: 'Community name', maxLength: GROUP_NAME_MAX_LENGTH, example: 'Neighbourhood' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(GROUP_NAME_MAX_LENGTH)
  name!: string;

  @ApiPropertyOptional({
    description: 'Community description, shown on the community page',
    maxLength: GROUP_DESCRIPTION_MAX_LENGTH,
    example: 'Street news and alerts',
  })
  @IsOptional()
  @IsString()
  @MaxLength(GROUP_DESCRIPTION_MAX_LENGTH)
  description?: string;
}
