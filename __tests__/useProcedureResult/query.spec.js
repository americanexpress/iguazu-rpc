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

import { Map as ImmutableMap } from 'immutable';

import config from '../../src/config';
import proceduresReducer, {
  updateProcedureCache,
  startLoading,
  UPDATE_PROCEDURE_CACHE,
  CALL_STARTED,
  CALL_FINISHED,
  CALL_ERROR,
} from '../../src/duck';

import queryProcedureResult from '../../src/useProcedureResult/query';

jest.mock('../../src/config', () => {
  const realConfig = require.requireActual('../../src/config').default;
  return {
    ...realConfig,
    getProcedure: jest.fn(() => ({
      getResultFromCache: jest.fn(),
      call: jest.fn(),
      buildUpdatedCache: jest.fn(),
      // cacheModifier: jest.fn(),
      // modifyOtherCaches: jest.fn(),
    })),
  };
});

describe('queryProcedureResult', () => {
  it('is a function', () => expect(queryProcedureResult).toBeInstanceOf(Function));

  it('gets the procedure configuration from config', () => {
    const procedureName = 'sample-procedure';
    const args = { a: 13, b: 24 };
    config.getProcedure.mockClear();
    queryProcedureResult({ procedureName, args });
    expect(config.getProcedure).toHaveBeenCalledTimes(1);
    expect(config.getProcedure).toHaveBeenCalledWith(procedureName);
  });

  it('returns a function/thunk', () => {
    const procedureName = 'sample-procedure';
    const args = { a: 13, b: 24 };
    const thunk = queryProcedureResult({ procedureName, args });
    expect(thunk).toBeInstanceOf(Function);
  });

  describe('returning a cached result', () => {
    it('gives the args to the getResultFromCache method', () => {
      const procedureName = 'sample-procedure';
      const args = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: new ImmutableMap({
            myCoolKey: 'oh, hello',
          }),
        })),
      }));
      const getResultFromCache = jest.fn();
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache,
        call: jest.fn(),
        buildUpdatedCache: jest.fn(),
      }));
      queryProcedureResult({ procedureName, args })(dispatch, getState);
      expect(getResultFromCache).toHaveBeenCalledTimes(1);
      expect(getResultFromCache.mock.calls[0][0]).toHaveProperty('args', args);
    });

    it('gives the cache to the getResultFromCache method', () => {
      const procedureName = 'sample-procedure';
      const args = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const procedureCache = new ImmutableMap({ myCoolKey: 'oh, hello' });
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: procedureCache,
        })),
      }));
      const getResultFromCache = jest.fn();
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache,
        call: jest.fn(),
        buildUpdatedCache: jest.fn(),
      }));
      queryProcedureResult({ procedureName, args })(dispatch, getState);
      expect(getResultFromCache).toHaveBeenCalledTimes(1);
      expect(getResultFromCache.mock.calls[0][0]).toHaveProperty('cache', procedureCache);
    });

    it('provides a default cache of an empty immutable Map', () => {
      const procedureName = 'sample-procedure';
      const args = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      const getResultFromCache = jest.fn();
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache,
        call: jest.fn(),
        buildUpdatedCache: jest.fn(),
      }));
      queryProcedureResult({ procedureName, args })(dispatch, getState);
      expect(getResultFromCache).toHaveBeenCalledTimes(1);
      expect(getResultFromCache.mock.calls[0][0]).toHaveProperty('cache', expect.any(ImmutableMap));
    });

    it('returns the cached result from getResultFromCache when present', () => {
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: new ImmutableMap({
            myCoolKey: 'oh, hello',
          }),
        })),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(),
        buildUpdatedCache: jest.fn(),
      }));
      const iguazuData = queryProcedureResult(
        { procedureName, args: queryArgs }
      )(dispatch, getState);
      expect(iguazuData).toHaveProperty('data', 'oh, hello');
    });

    it('uses the data key for the returned cached result when it is not an error', () => {
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: new ImmutableMap({
            myCoolKey: 'oh, hello',
          }),
        })),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(),
        buildUpdatedCache: jest.fn(),
      }));
      const iguazuData = queryProcedureResult(
        { procedureName, args: queryArgs }
      )(dispatch, getState);
      expect(iguazuData).toHaveProperty('data', 'oh, hello');
      expect(iguazuData).toHaveProperty('error', null);
    });

    it('uses the error key for the returned cached result when it is an error', () => {
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const error = new Error('something failed here');
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: new ImmutableMap({ myCoolKey: error }),
        })),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(),
        buildUpdatedCache: jest.fn(),
      }));
      const iguazuData = queryProcedureResult(
        { procedureName, args: queryArgs }
      )(dispatch, getState);
      iguazuData.promise.catch(() => {
        // noop, we don't care if this resolves or rejects
      });
      expect(iguazuData).toHaveProperty('data', null);
      expect(iguazuData).toHaveProperty('error', error);
    });

    it('has status of complete', () => {
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: new ImmutableMap({ myCoolKey: 'oh, hello' }),
        })),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(),
        buildUpdatedCache: jest.fn(),
      }));
      const iguazuData = queryProcedureResult(
        { procedureName, args: queryArgs }
      )(dispatch, getState);
      expect(iguazuData).toHaveProperty('status', 'complete');
    });

    it('has a resolving Promise when the data is not an error', () => {
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: new ImmutableMap({ myCoolKey: 'oh, hello' }),
        })),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(),
        buildUpdatedCache: jest.fn(),
      }));
      const iguazuData = queryProcedureResult(
        { procedureName, args: queryArgs }
      )(dispatch, getState);
      expect(iguazuData).toHaveProperty('promise');
      return expect(iguazuData.promise).resolves.toEqual('oh, hello');
    });

    it('has a resolving Promise when the data contains an error state', () => {
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const error = new Error('something failed here too');
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: new ImmutableMap({ myCoolKey: error }),
        })),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(),
        buildUpdatedCache: jest.fn(),
      }));
      const iguazuData = queryProcedureResult(
        { procedureName, args: queryArgs }
      )(dispatch, getState);
      expect(iguazuData).toHaveProperty('promise');
      return expect(iguazuData.promise).resolves.toEqual(error);
    });
  });

  it('returns the data of an existing, in flight call', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const loadingPromise = Promise.resolve();
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, startLoading({
        procedureName,
        args: queryArgs,
        promise: loadingPromise,
      })),
    }));
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call: jest.fn(),
      buildUpdatedCache: jest.fn(),
    }));
    const iguazuData = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
    expect(iguazuData).toEqual({ promise: loadingPromise, status: 'loading' });
  });

  it('initiates the call when not already cached or in flight', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
    }));
    const call = jest.fn(() => Promise.resolve('👋'));
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call,
      buildUpdatedCache: jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result)),
    }));
    const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
    expect(call).toHaveBeenCalledTimes(1);
    return query.promise;
  });

  it('returns the cached value when forceFetch is false', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
        procedureName,
        updatedCache: new ImmutableMap({ myCoolKey: 'Cached Value' }),
        promise: Promise.resolve(),
      })),
    }));
    const call = jest.fn(() => Promise.resolve('Hello'));
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call,
      buildUpdatedCache: jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result)),
    }));
    const query = queryProcedureResult({
      procedureName,
      args: queryArgs,
      forceFetch: false,
    })(dispatch, getState);
    return expect(query.promise).resolves.toEqual('Cached Value');
  });

  it('initiates the call when forceFetch is true', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
        procedureName,
        updatedCache: new ImmutableMap({ myCoolKey: 'Cached Value' }),
        promise: Promise.resolve(),
      })),
    }));
    const call = jest.fn(() => Promise.resolve('Updated Value'));
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(() => 'Test'),
      call,
      buildUpdatedCache: jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result)),
    }));
    const query = queryProcedureResult({
      procedureName,
      args: queryArgs,
      forceFetch: true,
    })(dispatch, getState);
    expect(call).toHaveBeenCalledTimes(1);
    return query.promise;
  });

  it('gives the args to the call method', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
    }));
    const call = jest.fn(() => Promise.resolve('👋'));
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call,
      buildUpdatedCache: jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result)),
    }));
    const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
    expect(call).toHaveBeenCalledTimes(1);
    expect(call.mock.calls[0][0]).toHaveProperty('args', queryArgs);
    return query.promise;
  });

  it('gives getState to the call method', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
    }));
    const call = jest.fn(() => Promise.resolve('👋'));
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call,
      buildUpdatedCache: jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result)),
    }));
    const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
    expect(call).toHaveBeenCalledTimes(1);
    expect(call.mock.calls[0][0]).toHaveProperty('getState', getState);
    return query.promise;
  });

  it('throws an error if the call does not return a Promise', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
    }));
    const call = jest.fn(() => 'oh, hello');
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call,
      buildUpdatedCache: jest.fn(),
    }));
    const thunk = queryProcedureResult({ procedureName, args: queryArgs });
    expect(() => thunk(dispatch, getState)).toThrowErrorMatchingSnapshot();
  });

  it('throws an error if the call returns an object but not a Promise', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
    }));
    const call = jest.fn(() => ({}));
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call,
      buildUpdatedCache: jest.fn(),
    }));
    const thunk = queryProcedureResult({ procedureName, args: queryArgs });
    expect(() => thunk(dispatch, getState)).toThrowErrorMatchingSnapshot();
  });

  it('throws an error if the call returns null but not a Promise', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
    }));
    const call = jest.fn(() => null);
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call,
      buildUpdatedCache: jest.fn(),
    }));
    const thunk = queryProcedureResult({ procedureName, args: queryArgs });
    expect(() => thunk(dispatch, getState)).toThrowErrorMatchingSnapshot();
  });

  it('adds the start state of the call', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
    }));
    const promise = Promise.resolve('👋');
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call: jest.fn(() => promise),
      buildUpdatedCache: jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result)),
    }));
    const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toEqual({
      type: CALL_STARTED, procedureName, args: queryArgs, promise,
    });
    return query.promise;
  });

  describe('successful call', () => {
    it('builds the updated cache', () => {
      expect.assertions(3);
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      const buildUpdatedCache = jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.resolve('why hello!')),
        buildUpdatedCache,
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      expect(buildUpdatedCache).not.toHaveBeenCalled();
      return query.promise.then(() => {
        expect(buildUpdatedCache).toHaveBeenCalledTimes(1);
        expect(buildUpdatedCache.mock.calls[0][0]).toEqual({
          cache: expect.any(ImmutableMap),
          args: queryArgs,
          result: 'why hello!',
        });
      });
    });

    it('updates the cache in state', () => {
      expect.assertions(2);
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      const updatedCache = new ImmutableMap({ myCoolKey: 'not 42' });
      const buildUpdatedCache = jest.fn(() => updatedCache);
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.resolve('why hello!')),
        buildUpdatedCache,
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(dispatch).toHaveBeenCalled();
        expect(dispatch.mock.calls[1][0]).toEqual({
          type: UPDATE_PROCEDURE_CACHE,
          procedureName,
          updatedCache,
        });
      });
    });

    it('adds the finish state of the call', () => {
      expect.assertions(2);
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.resolve('why hello!')),
        buildUpdatedCache: jest.fn(({
          cache, args, result, error,
        }) => cache.set(args.id, error || result)),
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(dispatch).toHaveBeenCalled();
        expect(dispatch.mock.calls[2][0]).toEqual({
          type: CALL_FINISHED,
          procedureName,
          args: queryArgs,
        });
      });
    });

    it('promise resolves with the cached value', () => {
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      const updatedCache = new ImmutableMap({ myCoolKey: 'not 42' });
      const buildUpdatedCache = jest.fn(() => updatedCache);
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.resolve('why hello!')),
        buildUpdatedCache,
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      return expect(query.promise).resolves.toEqual('not 42');
    });

    it('promise resolves with the cached value from a non-Promise then-able', () => {
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      const buildUpdatedCache = jest.fn();
      const then = jest.fn(() => Promise.resolve((ImmutableMap({ myCoolKey: 'not 42' }))));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => ({ then })),
        buildUpdatedCache,
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      return expect(query.promise).resolves.toEqual(('not 42'));
    });

    it('promise rejects when getResultFromCache does not get the new value from the newly built cache', () => {
      expect.assertions(1);
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.resolve('why hello!')),
        // intentionally pass-through so that the result is not stored for later use
        buildUpdatedCache: jest.fn(({ cache }) => cache),
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      return expect(query.promise).rejects.toMatchSnapshot();
    });

    it('should buildUpdatedCache with the cache value only after the callPromise is fulfilled', () => {
      expect.assertions(2);
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const updatedCache = ImmutableMap({
        surfer: 'rosa',
      });
      const dispatch = jest.fn();
      const getState = jest.fn()
        .mockImplementationOnce(() => ({
          iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
        }))
        .mockImplementationOnce(() => ({
          iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
        }))
        .mockImplementationOnce(() => ({
          iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
            procedureName,
            updatedCache,
          })),
        }));
      const buildUpdatedCache = jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.resolve('why hello!')),
        buildUpdatedCache,
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(buildUpdatedCache).toHaveBeenCalledTimes(1);
        expect(buildUpdatedCache.mock.calls[0][0]).toEqual({
          cache: updatedCache,
          args: queryArgs,
          result: 'why hello!',
        });
      });
    });
  });

  describe('unsuccessful call', () => {
    it('builds the updated cache', () => {
      expect.assertions(3);
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      const buildUpdatedCache = jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.reject(new Error('oh dear'))),
        buildUpdatedCache,
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      expect(buildUpdatedCache).not.toHaveBeenCalled();
      return query.promise.then(() => {
        expect(buildUpdatedCache).toHaveBeenCalledTimes(1);
        expect(buildUpdatedCache.mock.calls[0][0]).toEqual({
          cache: expect.any(ImmutableMap),
          args: queryArgs,
          error: new Error('oh dear'),
        });
      });
    });

    it('updates the cache in state', async () => {
      expect.assertions(4);
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      const updatedCache = new ImmutableMap({ myCoolKey: new Error('had an error') });
      const buildUpdatedCache = jest.fn(() => updatedCache);
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.reject(new Error('oh dear'))),
        buildUpdatedCache,
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      expect(buildUpdatedCache).not.toHaveBeenCalled();
      await expect(query.promise).resolves.toEqual(new Error('had an error'));
      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[1][0]).toEqual({
        type: UPDATE_PROCEDURE_CACHE,
        procedureName,
        updatedCache,
      });
    });

    it('adds the finish state of the failed call', () => {
      expect.assertions(2);
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.reject(new Error('oh dear'))),
        buildUpdatedCache: jest.fn(({
          cache, args, result, error,
        }) => cache.set(args.id, error || result)),
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(dispatch).toHaveBeenCalled();
        expect(dispatch.mock.calls[2][0]).toEqual({
          type: CALL_ERROR,
          procedureName,
          args: queryArgs,
          error: new Error('oh dear'),
        });
      });
    });

    it('promise resolves with the cached error', () => {
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      const cachedResult = new Error('oh dear dear');
      const updatedCache = new ImmutableMap({ myCoolKey: cachedResult });
      const buildUpdatedCache = jest.fn(() => updatedCache);
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.reject(new Error('oh dear, call failure'))),
        buildUpdatedCache,
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      return expect(query.promise).resolves.toEqual(cachedResult);
    });

    it('promise rejects when getResultFromCache does not get the new value from the newly built cache', () => {
      expect.assertions(1);
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.reject(new Error('oh dear, call failure'))),
        // intentionally pass-through so that the result is not stored for later use
        buildUpdatedCache: jest.fn(({ cache }) => cache),
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      return expect(query.promise).rejects.toMatchSnapshot();
    });

    it('should buildUpdatedCache with the cache value only after the callPromise is rejected', () => {
      expect.assertions(2);
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const updatedCache = ImmutableMap({
        surfer: 'rosa',
      });
      const dispatch = jest.fn();
      const getState = jest.fn()
        .mockImplementationOnce(() => ({
          iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
        }))
        .mockImplementationOnce(() => ({
          iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
        }))
        .mockImplementationOnce(() => ({
          iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
            procedureName,
            updatedCache,
          })),
        }));
      const buildUpdatedCache = jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: jest.fn(() => Promise.reject(
          new Error('uh oh'))
        ),
        buildUpdatedCache,
      }));
      const query = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(buildUpdatedCache).toHaveBeenCalledTimes(1);
        expect(buildUpdatedCache.mock.calls[0][0]).toEqual({
          cache: updatedCache,
          args: queryArgs,
          error: new Error('uh oh'),
        });
      });
    });
  });

  it('returns an object with the promise', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
    }));
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call: jest.fn(() => Promise.resolve('why hello!')),
      buildUpdatedCache: jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result)),
    }));
    const iguazuData = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
    expect(iguazuData).toHaveProperty('promise', expect.any(Promise));
    return iguazuData.promise.catch(() => {
      // noop, we don't care if this resolves or rejects, just that it's present
    });
  });

  it('returns an object with the status of loading', () => {
    const procedureName = 'sample-procedure';
    const queryArgs = { id: 'myCoolKey' };
    const dispatch = jest.fn();
    const getState = jest.fn(() => ({
      iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
    }));
    config.getProcedure.mockImplementationOnce(() => ({
      getResultFromCache: jest.fn(({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      }),
      call: jest.fn(() => Promise.resolve('why hello!')),
      buildUpdatedCache: jest.fn(({
        cache, args, result, error,
      }) => cache.set(args.id, error || result)),
    }));
    const iguazuData = queryProcedureResult({ procedureName, args: queryArgs })(dispatch, getState);
    expect(iguazuData).toHaveProperty('status', 'loading');
    return iguazuData.promise;
  });

  describe('with fetchClient', () => {
    beforeEach(() => fetch.resetMocks());
    it('should use provided thunk fetchClient to build the call', () => {
      const fakeFetch = jest.fn(() => Promise.resolve());
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: ({ fetchClient }) => fetchClient(),
        buildUpdatedCache: jest.fn(({
          cache, args, result, error,
        }) => cache.set(args.id, error || result)),
      }));
      const thunk = queryProcedureResult({ procedureName, args: queryArgs });
      thunk(dispatch, getState, { fetchClient: fakeFetch });
      expect(fakeFetch).toHaveBeenCalledTimes(1);
      expect(fetch).not.toHaveBeenCalled();
    });
    it('should fallback to global fetch if a fetchClient is not set by thunk', () => {
      fetch.mockResponseOnce(
        JSON.stringify({ id: '123', name: 'joe' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
      const procedureName = 'sample-procedure';
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, { type: 'IRRELEVANT_ACTION' }),
      }));
      config.getProcedure.mockImplementationOnce(() => ({
        getResultFromCache: jest.fn(({ args, cache }) => {
          if (!cache.has(args.id)) {
            throw new Error('make the call');
          }
          return cache.get(args.id);
        }),
        call: ({ fetchClient }) => fetchClient(),
        buildUpdatedCache: jest.fn(({
          cache, args, result, error,
        }) => cache.set(args.id, error || result)),
      }));
      const thunk = queryProcedureResult({ procedureName, args: queryArgs });
      thunk(dispatch, getState);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('cross procedure cache modification', () => {
    it('sends the called procedure\'s cache to its modifyOtherCaches method', () => {
      // readShips and updateShips
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const updateShipsCache = new ImmutableMap({
        fifteen: 'shave and a haircut',
      });
      const initialState = proceduresReducer(undefined, updateProcedureCache({
        procedureName: 'updateShips',
        updatedCache: updateShipsCache,
      }));
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(initialState, updateProcedureCache({
          procedureName: 'readShips',
          updatedCache: new ImmutableMap({
            myCoolKey: { sizeOfFleet: 6, shipClass: 'Daedalus' },
          }),
        })),
      }));
      const updateShipsCallPromise = Promise.resolve('why hello!');
      const updateShipsModifyOtherCaches = jest.fn(({ args }) => ({
        readShips: (modifyCache) => modifyCache({ action: 'delete', id: args.id }),
      }));
      config.getProcedure.mockImplementation((procedureName) => {
        switch (procedureName) {
          case 'readShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(({ cache }) => cache),
              cacheModifier: ({ cache }) => ({ action = 'delete', id, value }) => {
                const buildEntry = (v) => v;
                switch (action) {
                  case 'delete':
                    return cache.delete(id);
                  case 'update':
                    return cache.set(id, buildEntry(value));
                  default:
                    return cache;
                }
              },
            };
          case 'updateShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(() => updateShipsCallPromise),
              buildUpdatedCache: ({ cache, args, result }) => cache.set(args.id, result),
              modifyOtherCaches: updateShipsModifyOtherCaches,
            };
          default:
            return {
              getResultFromCache: jest.fn(),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(),
            };
        }
      });
      const query = queryProcedureResult({ procedureName: 'updateShips', args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(updateShipsModifyOtherCaches).toHaveBeenCalledTimes(1);
        expect(updateShipsModifyOtherCaches.mock.calls[0][0]).toHaveProperty('cache', updateShipsCache);
      });
    });

    it('sends the called procedure\'s args to its modifyOtherCaches method', () => {
      // readShips and updateShips
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName: 'readShips',
          updatedCache: new ImmutableMap({
            myCoolKey: { sizeOfFleet: 6, shipClass: 'Daedalus' },
          }),
        })),
      }));
      const updateShipsModifyOtherCaches = jest.fn(({ args }) => ({
        readShips: (modifyCache) => modifyCache({ action: 'delete', id: args.id }),
      }));
      config.getProcedure.mockImplementation((procedureName) => {
        switch (procedureName) {
          case 'readShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(({ cache }) => cache),
              cacheModifier: ({ cache }) => ({ action = 'delete', id, value }) => {
                const buildEntry = (v) => v;
                switch (action) {
                  case 'delete':
                    return cache.delete(id);
                  case 'update':
                    return cache.set(id, buildEntry(value));
                  default:
                    return cache;
                }
              },
            };
          case 'updateShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(() => Promise.resolve('why hello!')),
              buildUpdatedCache: ({ cache, args, result }) => cache.set(args.id, result),
              modifyOtherCaches: updateShipsModifyOtherCaches,
            };
          default:
            return {
              getResultFromCache: jest.fn(),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(),
            };
        }
      });
      const query = queryProcedureResult({ procedureName: 'updateShips', args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(updateShipsModifyOtherCaches).toHaveBeenCalledTimes(1);
        expect(updateShipsModifyOtherCaches.mock.calls[0][0]).toHaveProperty('args', queryArgs);
      });
    });

    it('sends the called procedure\'s result to its modifyOtherCaches method', () => {
      // readShips and updateShips
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName: 'readShips',
          updatedCache: new ImmutableMap({
            myCoolKey: { sizeOfFleet: 6, shipClass: 'Daedalus' },
          }),
        })),
      }));
      const updateShipsModifyOtherCaches = jest.fn(({ args }) => ({
        readShips: (modifyCache) => modifyCache({ action: 'delete', id: args.id }),
      }));
      config.getProcedure.mockImplementation((procedureName) => {
        switch (procedureName) {
          case 'readShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(({ cache }) => cache),
              cacheModifier: ({ cache }) => ({ action = 'delete', id, value }) => {
                const buildEntry = (v) => v;
                switch (action) {
                  case 'delete':
                    return cache.delete(id);
                  case 'update':
                    return cache.set(id, buildEntry(value));
                  default:
                    return cache;
                }
              },
            };
          case 'updateShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(() => Promise.resolve('why hello!')),
              buildUpdatedCache: ({ cache, args, result }) => cache.set(args.id, result),
              modifyOtherCaches: updateShipsModifyOtherCaches,
            };
          default:
            return {
              getResultFromCache: jest.fn(),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(),
            };
        }
      });
      const query = queryProcedureResult({ procedureName: 'updateShips', args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(updateShipsModifyOtherCaches).toHaveBeenCalledTimes(1);
        expect(updateShipsModifyOtherCaches.mock.calls[0][0]).toHaveProperty('result', 'why hello!');
      });
    });

    it('sends the procedure\'s own cache to it\'s cacheModifier method', () => {
      // readShips and updateShips
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const readShipsCache = new ImmutableMap({
        myCoolKey: { sizeOfFleet: 6, shipClass: 'Daedalus' },
      });
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName: 'readShips',
          updatedCache: readShipsCache,
        })),
      }));
      const readShipsCacheModifier = jest.fn(({ cache }) => ({ action = 'delete', id, value }) => {
        const buildEntry = (v) => v;
        switch (action) {
          case 'delete':
            return cache.delete(id);
          case 'update':
            return cache.set(id, buildEntry(value));
          default:
            return cache;
        }
      });
      config.getProcedure.mockImplementation((procedureName) => {
        switch (procedureName) {
          case 'readShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(({ cache }) => cache),
              cacheModifier: readShipsCacheModifier,
            };
          case 'updateShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(() => Promise.resolve('why hello!')),
              buildUpdatedCache: ({ cache, args, result }) => cache.set(args.id, result),
              modifyOtherCaches: ({ args }) => ({
                readShips: (modifyCache) => modifyCache({ action: 'delete', id: args.id }),
              }),
            };
          default:
            return {
              getResultFromCache: jest.fn(),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(),
            };
        }
      });
      const query = queryProcedureResult({ procedureName: 'updateShips', args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(readShipsCacheModifier).toHaveBeenCalledTimes(1);
        expect(readShipsCacheModifier.mock.calls[0][0]).toHaveProperty('cache', readShipsCache);
      });
    });

    it('sends the arguments through to the wrapped modifyCache', () => {
      // readShips and updateShips
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const readShipsCache = new ImmutableMap({
        myCoolKey: { sizeOfFleet: 6, shipClass: 'Daedalus' },
      });
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName: 'readShips',
          updatedCache: readShipsCache,
        })),
      }));
      let seenArgs;
      const readShipsCacheModifier = jest.fn(({ cache }) => (...args) => {
        seenArgs = args;
        return cache;
      });
      config.getProcedure.mockImplementation((procedureName) => {
        switch (procedureName) {
          case 'readShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(({ cache }) => cache),
              cacheModifier: readShipsCacheModifier,
            };
          case 'updateShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(() => Promise.resolve('why hello!')),
              buildUpdatedCache: ({ cache, args, result }) => cache.set(args.id, result),
              modifyOtherCaches: ({ args }) => ({
                readShips: (modifyCache) => modifyCache({ action: 'delete', id: args.id }),
              }),
            };
          default:
            return {
              getResultFromCache: jest.fn(),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(),
            };
        }
      });
      const query = queryProcedureResult({ procedureName: 'updateShips', args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(readShipsCacheModifier).toHaveBeenCalledTimes(1);
        expect(seenArgs).toEqual([{ action: 'delete', id: queryArgs.id }]);
      });
    });

    it('reads the procedure caches to modify and calls their cacheModifier method', () => {
      // readShips and updateShips
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName: 'readShips',
          updatedCache: new ImmutableMap({
            myCoolKey: { sizeOfFleet: 6, shipClass: 'Daedalus' },
          }),
        })),
      }));
      const readShipsCacheModifier = jest.fn(({ cache }) => ({ action = 'delete', id, value }) => {
        const buildEntry = (v) => v;
        switch (action) {
          case 'delete':
            return cache.delete(id);
          case 'update':
            return cache.set(id, buildEntry(value));
          default:
            return cache;
        }
      });
      config.getProcedure.mockImplementation((procedureName) => {
        switch (procedureName) {
          case 'readShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(({ cache }) => cache),
              cacheModifier: readShipsCacheModifier,
            };
          case 'updateShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(() => Promise.resolve('why hello!')),
              buildUpdatedCache: ({ cache, args, result }) => cache.set(args.id, result),
              modifyOtherCaches: ({ args }) => ({
                readShips: (modifyCache) => modifyCache({ action: 'delete', id: args.id }),
              }),
            };
          default:
            return {
              getResultFromCache: jest.fn(),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(),
            };
        }
      });
      const query = queryProcedureResult({ procedureName: 'updateShips', args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(readShipsCacheModifier).toHaveBeenCalledTimes(1);
      });
    });

    it('sets the updated cache in the store', () => {
      // readShips and updateShips
      const queryArgs = { id: 'myCoolKey' };
      const dispatch = jest.fn();
      const getState = jest.fn(() => ({
        iguazuRPC: proceduresReducer(undefined, updateProcedureCache({
          procedureName: 'readShips',
          updatedCache: new ImmutableMap({
            myCoolKey: { sizeOfFleet: 6, shipClass: 'Daedalus' },
          }),
        })),
      }));
      const updatedCache = new ImmutableMap({ thirteen: { sizeOfFleet: 9, shipClass: 'Missouri' } });
      config.getProcedure.mockImplementation((procedureName) => {
        switch (procedureName) {
          case 'readShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(({ cache }) => cache),
              cacheModifier: jest.fn(() => () => updatedCache),
            };
          case 'updateShips':
            return {
              getResultFromCache: jest.fn(({ args, cache }) => {
                if (!cache.has(args.id)) {
                  throw new Error('make the call');
                }
                return cache.get(args.id);
              }),
              call: jest.fn(() => Promise.resolve('why hello!')),
              buildUpdatedCache: ({ cache, args, result }) => cache.set(args.id, result),
              modifyOtherCaches: ({ args }) => ({
                readShips: (modifyCache) => modifyCache({ action: 'delete', id: args.id }),
              }),
            };
          default:
            return {
              getResultFromCache: jest.fn(),
              call: jest.fn(),
              buildUpdatedCache: jest.fn(),
            };
        }
      });
      const query = queryProcedureResult({ procedureName: 'updateShips', args: queryArgs })(dispatch, getState);
      return query.promise.then(() => {
        expect(dispatch).toHaveBeenCalled();
        expect(dispatch.mock.calls[2][0]).toEqual({
          type: UPDATE_PROCEDURE_CACHE,
          procedureName: 'readShips',
          updatedCache,
        });
      });
    });
  });
});
