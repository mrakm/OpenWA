import { Injectable } from '@nestjs/common';
import { EngineRegistry } from '../../engine/engine-registry.service';
import { IWhatsAppEngine } from '../../engine/interfaces/whatsapp-engine.interface';

/**
 * Owns engine access for community creation, like GroupService does for groups. Not paced: the
 * create carries no participants, so it puts the account in front of nobody; the adds that follow
 * go through GroupService.addParticipants and are paced there.
 */
@Injectable()
export class CommunityService {
  constructor(private readonly engines: EngineRegistry) {}

  private getEngine(sessionId: string): IWhatsAppEngine {
    // EngineRegistry.require()'s default is the 400 "Session is not started".
    return this.engines.require(sessionId);
  }

  async createCommunity(sessionId: string, name: string, description = '') {
    return this.getEngine(sessionId).createCommunity(name, description);
  }
}
