import { BadRequestException } from '@nestjs/common';
import { CommunityService } from './community.service';
import { EngineRegistry } from '../../engine/engine-registry.service';
import { IWhatsAppEngine } from '../../engine/interfaces/whatsapp-engine.interface';

describe('CommunityService', () => {
  const makeService = (engine?: Partial<IWhatsAppEngine>) => {
    const engines = new EngineRegistry();
    if (engine) engines.set('s1', engine as IWhatsAppEngine);
    return new CommunityService(engines);
  };

  it('answers 400 when the session is not started', async () => {
    await expect(makeService().createCommunity('s1', 'N', '')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('delegates to the engine and returns what it says, defaulting the description to empty', async () => {
    const createCommunity = jest.fn().mockResolvedValue({ id: '1203@g.us', name: 'N' });
    await expect(makeService({ createCommunity }).createCommunity('s1', 'N')).resolves.toEqual({
      id: '1203@g.us',
      name: 'N',
    });
    expect(createCommunity).toHaveBeenCalledWith('N', '');
  });
});
