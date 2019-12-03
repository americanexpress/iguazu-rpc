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

import { updateProcedureCache } from '../duck';
import config from '../config';
import { getProcedureCache } from '../duck/selectors';

export default function clearProcedureResult({ procedureName, args }) {
  return function thunk(dispatch, getState) {
    const {
      buildUpdatedCache,
    } = config.getProcedure(procedureName);
    const cache = getProcedureCache({ procedureName })(getState);
    const updatedCache = buildUpdatedCache({
      cache, args, result: undefined, error: undefined,
    });

    return dispatch(updateProcedureCache({ procedureName, updatedCache }));
  };
}
