import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCommunityDto } from './community.dto';

const check = async (body: Record<string, unknown>) => validate(plainToInstance(CreateCommunityDto, body));

describe('CreateCommunityDto', () => {
  it('accepts a name alone', async () => {
    expect(await check({ name: 'Neighbourhood' })).toEqual([]);
  });

  it('accepts a name with a description', async () => {
    expect(await check({ name: 'Neighbourhood', description: 'Street news' })).toEqual([]);
  });

  it('rejects an empty name and one over 100 characters', async () => {
    expect((await check({ name: '' })).length).toBeGreaterThan(0);
    expect((await check({ name: 'x'.repeat(101) })).length).toBeGreaterThan(0);
  });

  it('rejects a description over 1024 characters and a non-string description', async () => {
    expect((await check({ name: 'N', description: 'x'.repeat(1025) })).length).toBeGreaterThan(0);
    expect((await check({ name: 'N', description: 7 })).length).toBeGreaterThan(0);
  });
});
