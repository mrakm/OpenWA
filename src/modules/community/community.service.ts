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

  /**
   * An EMPTY description is defaulted to the name. Measured live on Baileys 7.0.0-rc14: with an empty
   * `<description><body>` WhatsApp answers the create IQ without a `<group>` node, Baileys resolves
   * null, and nothing is created — the same account creates fine the moment the body has text.
   */
  async createCommunity(sessionId: string, name: string, description?: string) {
    const body = description?.trim() ? description : name;
    return this.getEngine(sessionId).createCommunity(name, body);
  }
}
