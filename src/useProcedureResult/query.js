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

import config from '../config';

import {
  startLoading,
  finishLoading,
  finishLoadingWithError,
  updateProcedureCache,
} from '../duck';

import {
  getProcedureCache,
  getStateOfExistingCall,
} from '../duck/selectors';

function runOtherCacheModificationLifecycle(dispatch, getState, proceduresToVisit) {
  Object
    .entries(proceduresToVisit)
    .forEach(([procedureName, instructionsForCacheModifier]) => {
      const { cacheModifier } = config.getProcedure(procedureName);
      let cache = getProcedureCache({ procedureName })(getState);
      function wrappedCacheModifier(...args) {
        cache = cacheModifier({ cache })(...args);
      }
      instructionsForCacheModifier(wrappedCacheModifier);
      dispatch(updateProcedureCache({ procedureName, updatedCache: cache }));
    });
}

function getIguazuDataOfCachedResult(getResultFromCache, cache, args) {
  let cachedResult;
  let getResultFromCacheError = null;

  try {
    cachedResult = getResultFromCache({ cache, args });
  } catch (err) {
    getResultFromCacheError = err;
  }

  if (getResultFromCacheError) {
    return null;
  }

  const resultIsInstanceOfError = cachedResult instanceof Error;
  return {
    data: resultIsInstanceOfError ? null : cachedResult,
    error: resultIsInstanceOfError ? cachedResult : null,
    status: 'complete',
    promise: Promise.resolve(cachedResult),
  };
}

export default function queryProcedureResult({ procedureName, args, forceFetch = false }) {
  // lifecycle
  // getResultFromCache({ cache, args }) => result, or throws on cache misses
  // call(args) => result
  // buildUpdatedCache({ cache, args, result }) => updatedCache
  // cacheModifier({ cache }) => () => updatedCache
  // modifyOtherCaches({cache, args, result }) =>
  //   ({ otherProcedureA: (wrappedCacheModifier)=> wrappedCacheModifier() })

  const {
    getResultFromCache,
    call,
    buildUpdatedCache,
    modifyOtherCaches,
  } = config.getProcedure(procedureName);

  return (dispatch, getState, { fetchClient } = {}) => {
    if (!forceFetch) {
      const initialCache = getProcedureCache({ procedureName })(getState);
      const iguazuDataOfCachedResult = getIguazuDataOfCachedResult(
        getResultFromCache, initialCache, args
      );
      if (iguazuDataOfCachedResult) {
        return iguazuDataOfCachedResult;
      }

      const existingCall = getStateOfExistingCall({ procedureName, args })(getState);

      if (existingCall) {
        return existingCall.toJS();
      }
    }

    const callPromise = call({ fetchClient: fetchClient || fetch, getState, args });

    if (!(callPromise && typeof callPromise.then === 'function')) {
      const error = new Error(`call function for ${procedureName} must return a Promise`);
      dispatch(finishLoadingWithError({ procedureName, args, error }));
      throw error;
    }

    const promise = callPromise
      .then(
        (result) => {
          const cache = getProcedureCache({ procedureName })(getState);
          const updatedCache = buildUpdatedCache({ cache, args, result });
          dispatch(updateProcedureCache({ procedureName, updatedCache }));
          if (modifyOtherCaches) {
            runOtherCacheModificationLifecycle(
              dispatch,
              getState,
              modifyOtherCaches({ cache, args, result })
            );
          }
          dispatch(finishLoading({ procedureName, args }));
          return updatedCache;
        },
        (error) => {
          const cache = getProcedureCache({ procedureName })(getState);
          const updatedCache = buildUpdatedCache({ cache, args, error });
          dispatch(updateProcedureCache({ procedureName, updatedCache }));
          dispatch(finishLoadingWithError({ procedureName, args, error }));
          return updatedCache;
        }
      )
      .then((updatedCache) => {
        const iguazuDataOfNewlyCachedResult = getIguazuDataOfCachedResult(
          getResultFromCache, updatedCache, args
        );

        if (iguazuDataOfNewlyCachedResult) {
          return iguazuDataOfNewlyCachedResult.promise;
        }

        throw new Error(`${procedureName} did not cache the result/error from the call`);
      });

    dispatch(startLoading({ procedureName, args, promise }));

    return {
      promise,
      status: 'loading',
    };
  };
}
