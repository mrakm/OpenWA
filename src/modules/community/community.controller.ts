import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/community.dto';
import { RequireRole } from '../auth/decorators/auth.decorators';
import { ApiKeyRole } from '../auth/entities/api-key.entity';
import { GroupSummaryDto } from '../group/dto/group-response.dto';
import { ENGINE_NOT_READY_409, ENGINE_REFUSED_403 } from '../../common/openapi/engine-status-responses';

@ApiTags('communities')
@Controller('sessions/:sessionId/communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({
    summary: 'Create a WhatsApp Community',
    description:
      'Creates the community and the announcement group WhatsApp pairs with it, with this account as ' +
      'its only member. A community id is a group id on the wire: add members, promote admins, read ' +
      'the roster and fetch the invite code with the `groups` routes, passing the community id as ' +
      '`groupId`. Baileys-only.',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiBody({ type: CreateCommunityDto })
  @ApiResponse({ status: 201, description: 'Community created', type: GroupSummaryDto })
  @ApiResponse({ status: 400, description: 'Session not started, or the body failed validation' })
  @ApiResponse({ status: 403, description: ENGINE_REFUSED_403 })
  @ApiResponse({ status: 409, description: ENGINE_NOT_READY_409 })
  @ApiResponse({
    status: 501,
    description:
      'Not supported by the active engine: whatsapp-web.js has no community API, so this route is Baileys-only.',
  })
  @ApiResponse({
    status: 503,
    description:
      'The engine returned no metadata for the community it may have created. Baileys swallows its own ' +
      "parse failure and answers null; check the account's community list before retrying, since a " +
      'retry can create a second community.',
  })
  async create(@Param('sessionId') sessionId: string, @Body() dto: CreateCommunityDto) {
    return this.communityService.createCommunity(sessionId, dto.name, dto.description);
  }
}
