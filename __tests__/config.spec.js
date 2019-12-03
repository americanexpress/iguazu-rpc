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

import config, { configureIguazuRPC } from '../src/config';

describe('config', () => {
  const originalGetToState = config.getToState;

  function resetConfig() {
    config.getToState = originalGetToState;
  }

  it('looks for iguazuRPC as the default getToState redux state branch', () => {
    expect(config).toHaveProperty('getToState', expect.any(Function));
    const stateBranch = {};
    const state = { iguazuRPC: stateBranch };
    expect(config.getToState(state)).toBe(stateBranch);
  });

  describe('setProcedure', () => {
    it('throws when not provided with a name to reference the procedure configuration', () => {
      expect(() => config.setProcedure(null)).toThrowErrorMatchingSnapshot();
      expect(() => config.setProcedure(6)).toThrowErrorMatchingSnapshot();
    });

    it('warns when provided with an existing name', () => {
      jest.spyOn(console, 'warn').mockImplementationOnce(() => {});
      config.setProcedure('warns-when-provided-with-an-existing-name');
      // eslint-disable-next-line no-console
      expect(console.warn).not.toHaveBeenCalled();
      config.setProcedure('warns-when-provided-with-an-existing-name');
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line no-console
      expect(console.warn.mock.calls[0]).toMatchSnapshot();
    });
  });

  describe('getProcedure', () => {
    it('throws when provided with an name that does not exist', () => {
      expect(() => config.getProcedure('throws-when-provided-with-an-name-that-does-not-exist')).toThrowErrorMatchingSnapshot();
    });
  });

  test('setProcedure makes an procedure configuration available to getProcedure by the name', () => {
    const opts = { anOption: 'a value' };
    config.setProcedure('setProcedure-makes-an-procedure-configuration-available-to-getProcedure-by-the-name', opts);
    expect(config.getProcedure('setProcedure-makes-an-procedure-configuration-available-to-getProcedure-by-the-name')).toBe(opts);
  });

  describe('configureIguazuRPC', () => {
    beforeEach(resetConfig);

    it('changes getToState', () => {
      const getToState = jest.fn();
      configureIguazuRPC({ getToState });
      expect(config.getToState).toBe(getToState);
    });

    it('cannot change setProcedure', () => {
      const setProcedure = jest.fn();
      configureIguazuRPC({ setProcedure });
      expect(config.setProcedure).not.toBe(setProcedure);
    });

    it('cannot change getProcedure', () => {
      const getProcedure = jest.fn();
      configureIguazuRPC({ getProcedure });
      expect(config.getProcedure).not.toBe(getProcedure);
    });
  });
});
