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
import hashWithoutPrototypes from '../../src/utils/hashWithoutPrototypes';
import proceduresReducer, {
  UPDATE_PROCEDURE_CACHE,
  CALL_STARTED,
  CALL_FINISHED,
  CALL_ERROR,

  updateProcedureCache,
  startLoading,
  finishLoading,
  finishLoadingWithError,
} from '../../src/duck';

describe('duck', () => {
  describe('proceduresReducer', () => {
    it('is a function', () => expect(proceduresReducer).toBeInstanceOf(Function));
    it('builds and returns an inital state', () => {
      const action = { type: '@@irrelevant' };
      const newState = proceduresReducer(undefined, action);
      expect(newState).toBeDefined();
      expect(newState).toMatchSnapshot();
    });

    describe('UPDATE_PROCEDURE_CACHE', () => {
      const type = UPDATE_PROCEDURE_CACHE;
      const procedureName = 'sample-procedure';

      it('adds the cache to the procedureCaches map', () => {
        const updatedCache = { a: 23, b: 45 };
        const action = { type, procedureName, updatedCache };
        const newState = proceduresReducer(undefined, action);
        expect(newState.hasIn(['procedureCaches', procedureName])).toBe(true);
        expect(newState.getIn(['procedureCaches', procedureName])).toBe(updatedCache);
      });

      it('replaces the cache in the procedureCaches map', () => {
        const updatedCache = { a: 23, b: 45 };
        const action = { type, procedureName, updatedCache };
        const oldState = new ImmutableMap({
          procedureCaches: new ImmutableMap({
            [procedureName]: { a: 98, c: 76 },
          }),
        });
        const newState = proceduresReducer(oldState, action);
        expect(newState.hasIn(['procedureCaches', procedureName])).toBe(true);
        expect(newState.getIn(['procedureCaches', procedureName])).toBe(updatedCache);
      });
    });

    describe('CALL_STARTED', () => {
      const type = CALL_STARTED;
      const procedureName = 'sample-procedure';
      const args = { id: 'ego' };
      const argsHash = hashWithoutPrototypes(args);

      it('adds the call to the state', () => {
        const promise = Promise.resolve();
        const action = {
          type, procedureName, args, promise,
        };
        const newState = proceduresReducer(undefined, action);
        expect(newState.has('pendingCalls', procedureName)).toBe(true);
        expect(ImmutableMap.isMap(newState.getIn(['pendingCalls', procedureName]))).toBe(true);
        expect(newState.hasIn(['pendingCalls', procedureName, argsHash])).toBe(true);
        expect(newState.getIn(['pendingCalls', procedureName, argsHash])).toEqual(new ImmutableMap({ promise, status: 'loading' }));
      });
    });

    describe('CALL_FINISHED', () => {
      const type = CALL_FINISHED;
      const procedureName = 'sample-procedure';
      const args = { id: 'ego' };
      const argsHash = hashWithoutPrototypes(args);

      it('removes the call from the state', () => {
        const action = { type, procedureName, args };
        const oldState = new ImmutableMap({
          pendingCalls: new ImmutableMap({
            [procedureName]: new ImmutableMap({
              [argsHash]: { promise: Promise.resolve(), status: 'loading' },
            }),
          }),
        });
        const newState = proceduresReducer(oldState, action);
        expect(newState.has('pendingCalls', procedureName)).toBe(true);
        expect(ImmutableMap.isMap(newState.getIn(['pendingCalls', procedureName]))).toBe(true);
        expect(newState.hasIn(['pendingCalls', procedureName, argsHash])).toBe(false);
      });
    });

    describe('CALL_ERROR', () => {
      const type = CALL_ERROR;
      const procedureName = 'sample-procedure';
      const args = { id: 'ego' };
      const argsHash = hashWithoutPrototypes(args);

      it('removes the call from the state', () => {
        const action = { type, procedureName, args };
        const oldState = new ImmutableMap({
          pendingCalls: new ImmutableMap({
            [procedureName]: new ImmutableMap({
              [argsHash]: { promise: Promise.resolve(), status: 'loading' },
            }),
          }),
        });
        const newState = proceduresReducer(oldState, action);
        expect(newState.has('pendingCalls', procedureName)).toBe(true);
        expect(ImmutableMap.isMap(newState.getIn(['pendingCalls', procedureName]))).toBe(true);
        expect(newState.hasIn(['pendingCalls', procedureName, argsHash])).toBe(false);
      });
    });
  });

  describe('actions', () => {
    describe('updateProcedureCache', () => {
      it('should be a function', () => expect(updateProcedureCache).toBeInstanceOf(Function));

      it('should return an action with the UPDATE_PROCEDURE_CACHE type', () => {
        expect(updateProcedureCache({})).toHaveProperty('type', UPDATE_PROCEDURE_CACHE);
      });

      it('should add the procedure name to the action', () => {
        const procedureName = 'sample-procedure';
        expect(
          updateProcedureCache({ procedureName })
        ).toHaveProperty('procedureName', procedureName);
      });

      it('should add the updated cache to the action', () => {
        const updatedCache = { a: 13, b: 24 };
        expect(
          updateProcedureCache({ updatedCache })
        ).toHaveProperty('updatedCache', updatedCache);
      });
    });

    describe('startLoading', () => {
      it('should be a function', () => expect(startLoading).toBeInstanceOf(Function));

      it('should return an action with the CALL_STARTED type', () => {
        expect(startLoading({})).toHaveProperty('type', CALL_STARTED);
      });

      it('should add the procedure name to the action', () => {
        const procedureName = 'sample-procedure';
        expect(
          startLoading({ procedureName })
        ).toHaveProperty('procedureName', procedureName);
      });

      it('should add the args to the action', () => {
        const args = { a: 13, b: 24 };
        expect(
          startLoading({ args })
        ).toHaveProperty('args', args);
      });

      it('should add the promise to the action', () => {
        const promise = Promise.resolve();
        expect(
          startLoading({ promise })
        ).toHaveProperty('promise', promise);
      });
    });

    describe('finishLoading', () => {
      it('should be a function', () => expect(finishLoading).toBeInstanceOf(Function));

      it('should return an action with the CALL_FINISHED type', () => {
        expect(finishLoading({})).toHaveProperty('type', CALL_FINISHED);
      });

      it('should add the procedure name to the action', () => {
        const procedureName = 'sample-procedure';
        expect(
          finishLoading({ procedureName })
        ).toHaveProperty('procedureName', procedureName);
      });

      it('should add the args to the action', () => {
        const args = { a: 13, b: 24 };
        expect(
          finishLoading({ args })
        ).toHaveProperty('args', args);
      });
    });

    describe('finishLoadingWithError', () => {
      it('should be a function', () => expect(finishLoadingWithError).toBeInstanceOf(Function));

      it('should return an action with the CALL_ERROR type', () => {
        expect(finishLoadingWithError({})).toHaveProperty('type', CALL_ERROR);
      });

      it('should add the procedure name to the action', () => {
        const procedureName = 'sample-procedure';
        expect(
          finishLoadingWithError({ procedureName })
        ).toHaveProperty('procedureName', procedureName);
      });

      it('should add the args to the action', () => {
        const args = { a: 13, b: 24 };
        expect(
          finishLoadingWithError({ args })
        ).toHaveProperty('args', args);
      });

      it('should add the error to the action', () => {
        const error = new Error('sample error');
        expect(
          finishLoadingWithError({ error })
        ).toHaveProperty('error', error);
      });
    });
  });
});
