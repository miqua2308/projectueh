import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SPRITES } from '../client/src/pet/sprites.js';
import { getSpriteSrc, getPetStage } from '../client/src/pet/petController.js';

const ACTIONS = { idle: 4, happy: 4, eat: 4, sad: 2, evolve: 3 };

describe('Bộ sprite linh vật', () => {
  it('đủ mọi khung cho 5 stage theo quy ước tên', () => {
    for (let stage = 1; stage <= 5; stage++) {
      const prefix = stage === 1 ? '' : `s${stage}_`;
      for (const [action, count] of Object.entries(ACTIONS)) {
        for (let n = 1; n <= count; n++) {
          const key = `${prefix}${action}_${n}`;
          assert.ok(SPRITES[key]?.startsWith('data:image/png;base64,'), `thiếu khung ${key}`);
        }
      }
    }
  });

  it('mỗi khung pet là PNG 32x32', () => {
    for (const [key, uri] of Object.entries(SPRITES)) {
      if (key.startsWith('coin_')) continue;
      const buf = Buffer.from(uri.split(',')[1], 'base64');
      assert.equal(buf.readUInt32BE(16), 32, `${key} width`);
      assert.equal(buf.readUInt32BE(20), 32, `${key} height`);
    }
  });

  it('khung thiếu fallback về idle_1 của stage hiện tại', () => {
    assert.equal(getSpriteSrc(3, 'dance', 9), SPRITES.s3_idle_1);
    assert.equal(getSpriteSrc(1, 'sad', 7), SPRITES.idle_1);
    assert.equal(getSpriteSrc(4, 'eat', 2), SPRITES.s4_eat_2);
  });

  it('xác định stage theo XP', () => {
    assert.equal(getPetStage(0).level, 1);
    assert.equal(getPetStage(450).level, 2);
    assert.equal(getPetStage(2400).level, 5);
  });
});
