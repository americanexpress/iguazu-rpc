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

import { clearProcedureResult } from '../../src';
import { updateProcedureCache } from '../../src/duck';
import { getProcedureCache } from '../../src/duck/selectors';
import config from '../../src/config';

jest.mock('../../src/duck', () => ({
  updateProcedureCache: jest.fn().mockReturnValue('CLEAR_SPECIFIC_PROCEDURE_CACHE'),
}));

jest.mock('../../src/config', () => ({
  getProcedure: jest.fn(),
}));

jest.mock('../../src/duck/selectors', () => ({
  getProcedureCache: jest.fn(),
}));

const oldCache = {
  e1pd1d10: { date: '07/26/1970' },
  c3c1l1n: { date: '07/26/1985' },
};
const updatedCache = { e1pd1d10: { date: '07/26/1970' } };

const stateAccessor = jest.fn().mockReturnValue(oldCache);
getProcedureCache.mockReturnValue(stateAccessor);

const mockedConfig = {
  buildUpdatedCache: jest.fn().mockReturnValue(updatedCache),
};

config.getProcedure.mockReturnValue(mockedConfig);

describe('clearProcedureResult', () => {
  it('returns a thunk function', () => {
    expect(clearProcedureResult({})).toEqual(expect.any(Function));
  });

  it('thunk updates pertinent cache with undefined', () => {
    const state = {};
    const getState = jest.fn().mockReturnValue(state);
    const dispatch = jest.fn((actionName) => `dispatching ${actionName}`);
    const procedureName = 'some-procedure';

    const args = { accountToken: 'BR4M0NT0N045A', date: '07/26/2019' };

    const thunk = clearProcedureResult({ procedureName, args });
    expect(thunk(dispatch, getState)).toEqual('dispatching CLEAR_SPECIFIC_PROCEDURE_CACHE');

    // getting current cache
    expect(getProcedureCache).toHaveBeenCalledTimes(1);
    expect(getProcedureCache).toHaveBeenCalledWith({ procedureName });

    expect(stateAccessor).toHaveBeenCalledTimes(1);
    expect(stateAccessor).toHaveBeenCalledWith(getState);

    // building updated cache
    expect(mockedConfig.buildUpdatedCache).toHaveBeenCalledTimes(1);
    expect(mockedConfig.buildUpdatedCache)
      .toHaveBeenCalledWith({
        cache: oldCache, args, result: undefined, error: undefined,
      });

    // updating procedure cache
    expect(updateProcedureCache).toHaveBeenCalledTimes(1);
    expect(updateProcedureCache).toHaveBeenCalledWith({ procedureName, updatedCache });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith('CLEAR_SPECIFIC_PROCEDURE_CACHE');
  });
});
