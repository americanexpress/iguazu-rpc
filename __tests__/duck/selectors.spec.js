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
} from '../../src/duck';

import {
  getStateBranch,
  getProcedureCache,
  getStateOfExistingCall,
  getProcedureResult,
} from '../../src/duck/selectors';

describe('duck', () => {
  describe('selectors', () => {
    describe('getStateBranch', () => {
      const stateBranch = new ImmutableMap();
      const state = new ImmutableMap({
        a: new ImmutableMap({
          b: stateBranch,
        }),
      });

      it('is a function', () => expect(getStateBranch).toBeInstanceOf(Function));
      it('selects the state branch from a state value', () => {
        config.getToState = jest.fn((rootState) => rootState.getIn(['a', 'b']));
        expect(getStateBranch(state)).toBe(stateBranch);
      });

      it('selects the state branch from a getState function', () => {
        config.getToState = jest.fn((rootState) => rootState.getIn(['a', 'b']));
        const getState = jest.fn(() => state);
        expect(getStateBranch(getState)).toBe(stateBranch);
      });
    });

    describe('getProcedureCache', () => {
      it('is a function', () => expect(getProcedureCache).toBeInstanceOf(Function));

      it('gets the stored cache of the procedure', () => {
        const procedureName = 'sample-procedure';
        const storedProcedureCache = new ImmutableMap({ a: 45, b: 67 });
        const originalState = proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: storedProcedureCache,
        }));
        config.getToState = (s) => s;

        const fetchedProcedureCache = getProcedureCache({ procedureName })(originalState);
        expect(fetchedProcedureCache).toBe(storedProcedureCache);
      });

      it('separates caches by procedure name', () => {
        const procedureNameA = 'procedure-a';
        const procedureNameB = 'procedure-b';
        const storedProcedureCacheOfA = new ImmutableMap({ a: 45, b: 67 });
        const storedProcedureCacheOfB = new ImmutableMap({ a: 89, d: 12 });
        const initialState = proceduresReducer(undefined, updateProcedureCache({
          procedureName: procedureNameA,
          updatedCache: storedProcedureCacheOfA,
        }));
        const originalState = proceduresReducer(initialState, updateProcedureCache({
          procedureName: procedureNameB,
          updatedCache: storedProcedureCacheOfB,
        }));

        config.getToState = (s) => s;

        const fetchedProcedureCacheForA = getProcedureCache(
          { procedureName: procedureNameA }
        )(originalState);
        expect(fetchedProcedureCacheForA).toBe(storedProcedureCacheOfA);

        const fetchedProcedureCacheForB = getProcedureCache(
          { procedureName: procedureNameB }
        )(originalState);
        expect(fetchedProcedureCacheForB).toBe(storedProcedureCacheOfB);
      });
    });

    describe('getStateOfExistingCall', () => {
      it('gets the stored state of a procedure call', () => {
        const procedureName = 'sample-procedure';
        const args = { id: 'ego' };
        const loadingPromise = Promise.resolve();
        const storedCallState = new ImmutableMap({
          promise: loadingPromise,
          status: 'loading',
        });
        const originalState = proceduresReducer(undefined, startLoading({
          procedureName,
          args,
          promise: loadingPromise,
        }));
        config.getToState = (s) => s;

        const fetchedCallState = getStateOfExistingCall({ procedureName, args })(originalState);
        expect(fetchedCallState).toEqual(storedCallState);
      });

      it('separates the states by args', () => {
        const procedureName = 'procedure-a';
        const argsA = { id: 'ego' };
        const argsB = { id: 'superego' };
        const loadingPromiseA = Promise.resolve();
        const loadingPromiseB = Promise.resolve();
        const storedCallStateOfArgsA = new ImmutableMap({
          promise: loadingPromiseA,
          status: 'loading',
        });
        const storedCallStateOfArgsB = new ImmutableMap({
          promise: loadingPromiseB,
          status: 'loading',
        });
        const initialState = proceduresReducer(undefined, startLoading({
          procedureName,
          args: argsA,
          promise: loadingPromiseA,
        }));

        const originalState = proceduresReducer(initialState, startLoading({
          procedureName,
          args: argsB,
          promise: loadingPromiseB,
        }));

        config.getToState = (s) => s;

        const fetchedProcedureCacheForArgsA = getStateOfExistingCall(
          { procedureName, args: argsA }
        )(originalState);
        expect(fetchedProcedureCacheForArgsA).toEqual(storedCallStateOfArgsA);

        const fetchedProcedureCacheForArgsB = getStateOfExistingCall(
          { procedureName, args: argsB }
        )(originalState);
        expect(fetchedProcedureCacheForArgsB).toEqual(storedCallStateOfArgsB);
      });
    });

    describe('getProcedureResult', () => {
      it('is a function', () => {
        expect(getProcedureResult).toBeInstanceOf(Function);
      });

      it('gets value from cached procedure', () => {
        const procedureName = 'sample-procedure';
        const storedProcedureCache = new ImmutableMap({ a: 45, b: 67 });
        const getResultFromCache = jest.fn(({ cache }) => cache);
        config.getToState = (s) => s;
        config.getProcedure = () => ({ getResultFromCache });

        const originalState = proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: storedProcedureCache,
        }));

        const fetchedProcedureCache = getProcedureResult({ procedureName })(originalState);
        expect(fetchedProcedureCache).toBe(storedProcedureCache);
        expect(getResultFromCache).toHaveBeenCalled();
      });

      it('handles thrown error in getResultFromCache', () => {
        const procedureName = 'sample-procedure';
        const storedProcedureCache = new ImmutableMap({ a: 45, b: 67 });
        const getResultFromCache = jest.fn(() => { throw new Error('make the call'); });
        config.getToState = (s) => s;
        config.getProcedure = () => ({ getResultFromCache });

        const originalState = proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: storedProcedureCache,
        }));

        const fetchedProcedureCache = getProcedureResult({ procedureName })(originalState);
        expect(fetchedProcedureCache).toBe(undefined);
      });

      it('returns stored error', () => {
        const procedureName = 'sample-procedure';
        const procedureError = new Error('test');
        const storedProcedureCache = new ImmutableMap({ a: procedureError });
        const getResultFromCache = jest.fn(({ cache }) => cache);
        config.getToState = (s) => s;
        config.getProcedure = () => ({ getResultFromCache });

        const originalState = proceduresReducer(undefined, updateProcedureCache({
          procedureName,
          updatedCache: storedProcedureCache,
        }));

        const fetchedProcedureCache = getProcedureResult({ procedureName })(originalState);
        expect(fetchedProcedureCache.get('a')).toBe(procedureError);
      });
    });
  });
});
