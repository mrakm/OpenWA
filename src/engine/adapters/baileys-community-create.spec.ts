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
const warn = jest.fn();
function groups(sock: Record<string, jest.Mock>): BaileysGroups {
  const host = {
    ensureReady: () => undefined,
    getSocket: () => sock as unknown as WASocket,
    logger: { warn, debug: jest.fn(), info: jest.fn(), error: jest.fn() },
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

/** The two sub-groups WhatsApp makes with a community: the announcement group (community subject) and General. */
const LINKED = {
  communityJid: META.id,
  isCommunity: true,
  linkedGroups: [
    { id: '120363000000000001@g.us', subject: 'Neighbourhood', creation: 1, owner: undefined, size: 1 },
    { id: '120363000000000002@g.us', subject: 'General', creation: 1, owner: undefined, size: 1 },
  ],
};
const metaFor = (id: string, flags: Record<string, boolean> = {}) => ({
  id,
  subject: id.endsWith('1@g.us') ? 'Neighbourhood' : 'General',
  participants: [],
  ...flags,
});

describe('createCommunity', () => {
  beforeEach(() => warn.mockClear());

  it('passes the name and description to communityCreate and maps the result with its announcement group', async () => {
    const communityCreate = jest.fn().mockResolvedValue(META);
    const communityFetchLinkedGroups = jest.fn().mockResolvedValue(LINKED);
    // WhatsApp flags the announcement group with default_sub_group → Baileys isCommunityAnnounce.
    const groupMetadata = jest.fn((id: string) =>
      Promise.resolve(metaFor(id, { isCommunityAnnounce: id.endsWith('1@g.us') })),
    );
    const g = groups({ communityCreate, communityFetchLinkedGroups, groupMetadata });
    await expect(g.createCommunity('Neighbourhood', 'Street news')).resolves.toEqual({
      id: '120363999999999999@g.us',
      name: 'Neighbourhood',
      participantsCount: 1,
      isAdmin: true,
      linkedParentJID: null,
      announcementGroupId: '120363000000000001@g.us',
    });
    expect(communityCreate).toHaveBeenCalledWith('Neighbourhood', 'Street news');
    expect(communityFetchLinkedGroups).toHaveBeenCalledWith('120363999999999999@g.us');
  });

  it('falls back to the sub-group carrying the community subject when no flag is reported', async () => {
    const communityCreate = jest.fn().mockResolvedValue(META);
    const communityFetchLinkedGroups = jest.fn().mockResolvedValue(LINKED);
    const groupMetadata = jest.fn((id: string) => Promise.resolve(metaFor(id)));
    await expect(
      groups({ communityCreate, communityFetchLinkedGroups, groupMetadata }).createCommunity('Neighbourhood', 'x'),
    ).resolves.toMatchObject({ announcementGroupId: '120363000000000001@g.us' });
  });

  it('still reports the community when the announcement group cannot be resolved, and says so', async () => {
    const communityCreate = jest.fn().mockResolvedValue(META);
    const communityFetchLinkedGroups = jest.fn().mockRejectedValue(new Error('socket closed'));
    const result = await groups({ communityCreate, communityFetchLinkedGroups }).createCommunity('Neighbourhood', 'x');
    expect(result.id).toBe('120363999999999999@g.us');
    expect(result.announcementGroupId).toBeUndefined();
    expect(warn).toHaveBeenCalled();
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
