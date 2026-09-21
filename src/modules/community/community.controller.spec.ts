import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

describe('CommunityController', () => {
  it('POST returns the created community summary', async () => {
    const service = { createCommunity: jest.fn().mockResolvedValue({ id: '1203@g.us', name: 'N', isAdmin: true }) };
    const controller = new CommunityController(service as unknown as CommunityService);
    await expect(controller.create('s1', { name: 'N', description: 'D' })).resolves.toEqual({
      id: '1203@g.us',
      name: 'N',
      isAdmin: true,
    });
    expect(service.createCommunity).toHaveBeenCalledWith('s1', 'N', 'D');
  });
});
