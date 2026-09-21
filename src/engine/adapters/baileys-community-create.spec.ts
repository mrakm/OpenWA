import { Boom } from '@hapi/boom';
import type { WASocket } from '@whiskeysockets/baileys';
import { BaileysGroups, BaileysGroupsHost } from './baileys-groups';
import { EngineTransportError } from '../../common/errors/engine-transport.error';
import { EngineRefusedError } from '../../common/errors/engine-refused.error';

/**
 * Baileys' communityCreate differs from groupCreate in two ways this delegate must respect: it
 * takes no participants, and it resolves `null` instead of throwing when its own parse fails
 * (Socket/communities.js parseGroupResult swallows the error). A null must never read as success.
 */
function groups(sock: Record<string, jest.Mock>): BaileysGroups {
  const host = {
    ensureReady: () => undefined,
    getSocket: () => sock as unknown as WASocket,
    logger: { warn: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() },
    toNeutralJid: (j: string) => j,
    toEngineJid: (j: string) => j,
    normalizedSelfJid: () => '628177@s.whatsapp.net',
    addLidMappings: jest.fn(),
  } as unknown as BaileysGroupsHost;
  return new BaileysGroups(host, 500);
}

const META = {
  id: '120363999999999999@g.us',
  subject: 'Neighbourhood',
  participants: [{ id: '628177@s.whatsapp.net', admin: 'superadmin' }],
};

describe('createCommunity', () => {
  it('passes the name and description to communityCreate and maps the result', async () => {
    const communityCreate = jest.fn().mockResolvedValue(META);
    const g = groups({ communityCreate });
    await expect(g.createCommunity('Neighbourhood', 'Street news')).resolves.toEqual({
      id: '120363999999999999@g.us',
      name: 'Neighbourhood',
      participantsCount: 1,
      isAdmin: true,
      linkedParentJID: null,
    });
    expect(communityCreate).toHaveBeenCalledWith('Neighbourhood', 'Street news');
  });

  it('reports a null result as a transport failure, never as success', async () => {
    const communityCreate = jest.fn().mockResolvedValue(null);
    await expect(groups({ communityCreate }).createCommunity('N', '')).rejects.toBeInstanceOf(EngineTransportError);
  });

  it('maps a WA refusal to a refusal instead of a bare 500', async () => {
    const communityCreate = jest.fn().mockRejectedValue(new Boom('not-authorized', { data: 403 }));
    await expect(groups({ communityCreate }).createCommunity('N', '')).rejects.toBeInstanceOf(EngineRefusedError);
  });

  it('lets an unanswered query propagate untouched — deliberately NOT a 503, like createGroup', async () => {
    const err = new Boom('Invalid group metadata response: missing <group> node', { data: undefined });
    const communityCreate = jest.fn().mockRejectedValue(err);
    await expect(groups({ communityCreate }).createCommunity('N', '')).rejects.toBe(err);
  });
});
