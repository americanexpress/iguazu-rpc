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
import hashWithoutPrototypes from '../utils/hashWithoutPrototypes';
import config from '../config';

export function getStateBranch(stateOrGetState) {
  if (typeof stateOrGetState === 'function') {
    return config.getToState(stateOrGetState());
  }
  return config.getToState(stateOrGetState);
}

export function getProcedureCache({ procedureName }) {
  return (getState) => getStateBranch(getState).getIn(['procedureCaches', procedureName], new ImmutableMap());
}

export function getStateOfExistingCall({ procedureName, args }) {
  const argsHash = hashWithoutPrototypes(args);
  return (getState) => getStateBranch(getState).getIn(['pendingCalls', procedureName, argsHash]);
}

export function getProcedureResult({ procedureName, args }) {
  const { getResultFromCache } = config.getProcedure(procedureName);
  return (state) => {
    const cache = getProcedureCache({ procedureName })(state);
    try {
      return getResultFromCache({ cache, args });
    } catch (err) {
      return undefined;
    }
  };
}
