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

export const UPDATE_PROCEDURE_CACHE = '@@iguazu-rpc/UPDATE_PROCEDURE_CACHE';
export const CALL_STARTED = '@@iguazu-rpc/CALL_STARTED';
export const CALL_FINISHED = '@@iguazu-rpc/CALL_FINISHED';
export const CALL_ERROR = '@@iguazu-rpc/CALL_ERROR';

function buildInitialState() {
  return new ImmutableMap({
    /*
    procedureCaches: {
      [procedureName]: <any>
    },
    */
    procedureCaches: new ImmutableMap(),
    /*
    pendingCalls: {
      [procedureName]: {
        [argsHash]: { promise, status, data, error }
      }
    }
    */
    pendingCalls: new ImmutableMap(),
  });
}

function proceduresReducer(state = buildInitialState(), action) {
  switch (action.type) {
    case UPDATE_PROCEDURE_CACHE: {
      const { procedureName, updatedCache } = action;
      return state.setIn(['procedureCaches', procedureName], updatedCache);
    }
    case CALL_STARTED: {
      const { procedureName, args, promise } = action;
      const argsHash = hashWithoutPrototypes(args);
      return state.setIn(['pendingCalls', procedureName, argsHash], new ImmutableMap({ promise, status: 'loading' }));
    }
    case CALL_FINISHED: {
      const { procedureName, args } = action;
      const argsHash = hashWithoutPrototypes(args);
      return state.deleteIn(['pendingCalls', procedureName, argsHash]);
    }
    case CALL_ERROR: {
      const { procedureName, args } = action;
      const argsHash = hashWithoutPrototypes(args);
      return state.deleteIn(['pendingCalls', procedureName, argsHash]);
    }
    default:
      return state;
  }
}

export default proceduresReducer;

export function updateProcedureCache({ procedureName, updatedCache }) {
  return {
    type: UPDATE_PROCEDURE_CACHE,
    procedureName,
    updatedCache,
  };
}

export function startLoading({ procedureName, args, promise }) {
  return {
    type: CALL_STARTED,
    procedureName,
    args,
    promise,
  };
}

export function finishLoading({ procedureName, args }) {
  return {
    type: CALL_FINISHED,
    procedureName,
    args,
  };
}

export function finishLoadingWithError({ procedureName, args, error }) {
  return {
    type: CALL_ERROR,
    procedureName,
    args,
    error,
  };
}
