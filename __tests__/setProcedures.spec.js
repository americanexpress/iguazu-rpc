/*
 * Copyright 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import config from '../src/config';

import setProcedures from '../src/setProcedures';

describe('setProcedures', () => {
  it('is a function', () => expect(setProcedures).toBeInstanceOf(Function));

  it('throws when not given any procedures', () => {
    expect(() => setProcedures({})).toThrowErrorMatchingSnapshot();
  });

  it('throws when not given an Object for the procedure configuration', () => {
    expect(
      () => setProcedures({ name: 'throws-when-not-given-an-object' })
    ).toThrowErrorMatchingSnapshot();
  });

  describe('getResultFromCache', () => {
    it('throws when not present', () => {
      expect(() => setProcedures({
        'getResultFromCache-throws-when-not-present': {
          // keep getResultFromCache out
          call: jest.fn(),
          buildUpdatedCache: jest.fn(),
        },
      })).toThrowErrorMatchingSnapshot();
    });

    it('throws when not a function', () => {
      expect(
        () => setProcedures({
          'getResultFromCache-throws-when-not-a-function': {
            getResultFromCache: true,
            call: jest.fn(),
            buildUpdatedCache: jest.fn(),
          },
        })
      ).toThrowErrorMatchingSnapshot();
    });

    it('is stored in the procedure config', () => {
      const name = 'getResultFromCache-is stored in the procedure config';
      const getResultFromCache = jest.fn();
      setProcedures({
        [name]: {
          getResultFromCache,
          call: jest.fn(),
          buildUpdatedCache: jest.fn(),
        },
      });
      expect(config.getProcedure(name)).toHaveProperty('getResultFromCache', getResultFromCache);
    });
  });

  describe('call', () => {
    it('throws when not present', () => {
      expect(() => setProcedures({
        'call-throws-when-not-present': {
          getResultFromCache: jest.fn(),
          // keep call out
          buildUpdatedCache: jest.fn(),
        },
      })).toThrowErrorMatchingSnapshot();
    });

    it('throws when not a function', () => {
      expect(() => setProcedures({
        'call-throws-when-not-a-function': {
          getResultFromCache: jest.fn(),
          call: true,
          buildUpdatedCache: jest.fn(),
        },
      })).toThrowErrorMatchingSnapshot();
    });

    it('is stored in the procedure config', () => {
      const name = 'call-is stored in the procedure config';
      const call = jest.fn();
      setProcedures({
        [name]: {
          getResultFromCache: jest.fn(),
          call,
          buildUpdatedCache: jest.fn(),
        },
      });
      expect(config.getProcedure(name)).toHaveProperty('call', call);
    });
  });

  describe('buildUpdatedCache', () => {
    it('throws when not present', () => {
      expect(() => setProcedures({
        'buildUpdatedCache-throws-when-not-present': {
          getResultFromCache: jest.fn(),
          call: jest.fn(),
          // keep buildUpdatedCache out
        },
      })).toThrowErrorMatchingSnapshot();
    });

    it('throws when not a function', () => {
      expect(() => setProcedures({
        'buildUpdatedCache-throws-when-not-a-function': {
          getResultFromCache: jest.fn(),
          call: jest.fn(),
          buildUpdatedCache: true,
        },
      })).toThrowErrorMatchingSnapshot();
    });

    it('is stored in the procedure config', () => {
      const name = 'buildUpdatedCache-is stored in the procedure config';
      const buildUpdatedCache = jest.fn();
      setProcedures({
        [name]: {
          getResultFromCache: jest.fn(),
          call: jest.fn(),
          buildUpdatedCache,
        },
      });
      expect(config.getProcedure(name)).toHaveProperty('buildUpdatedCache', buildUpdatedCache);
    });
  });

  describe('cacheModifier', () => {
    it('does not throw when not present', () => {
      expect(() => setProcedures({
        'cacheModifier-does-not-throw-when-not-present': {
          getResultFromCache: jest.fn(),
          call: jest.fn(),
          buildUpdatedCache: jest.fn(),
          // keep cacheModifier out
        },
      })).not.toThrowError();
    });

    it('throws when provided but is not a function', () => {
      expect(() => setProcedures({
        'cacheModifier-throws-when-provided-but-is-not-a-function': {
          getResultFromCache: jest.fn(),
          call: jest.fn(),
          buildUpdatedCache: jest.fn(),
          cacheModifier: true,
        },
      })).toThrowErrorMatchingSnapshot();
    });

    it('is stored in the procedure config', () => {
      const name = 'cacheModifier-is stored in the procedure config';
      const cacheModifier = jest.fn();
      setProcedures({
        [name]: {
          getResultFromCache: jest.fn(),
          call: jest.fn(),
          buildUpdatedCache: jest.fn(),
          cacheModifier,
          modifyOtherCaches: jest.fn(),
        },
      });
      expect(config.getProcedure(name)).toHaveProperty('cacheModifier', cacheModifier);
    });
  });

  describe('modifyOtherCaches', () => {
    it('does not throw when not present', () => {
      expect(() => setProcedures({
        'modifyOtherCaches-does-not-throw-when-not-present': {
          getResultFromCache: jest.fn(),
          call: jest.fn(),
          buildUpdatedCache: jest.fn(),
          // keep modifyOtherCaches out
        },
      })).not.toThrowError();
    });

    it('throws when provided but is not a function', () => {
      expect(() => setProcedures({
        'modifyOtherCaches-throws-when-provided-but-is-not-a-function': {
          getResultFromCache: jest.fn(),
          call: jest.fn(),
          buildUpdatedCache: jest.fn(),
          modifyOtherCaches: true,
        },
      })).toThrowErrorMatchingSnapshot();
    });

    it('is stored in the procedure config', () => {
      const name = 'modifyOtherCaches-is stored in the procedure config';
      const modifyOtherCaches = jest.fn();
      setProcedures({
        [name]: {
          getResultFromCache: jest.fn(),
          call: jest.fn(),
          buildUpdatedCache: jest.fn(),
          cacheModifier: jest.fn(),
          modifyOtherCaches,
        },
      });
      expect(config.getProcedure(name)).toHaveProperty('modifyOtherCaches', modifyOtherCaches);
    });
  });
});
