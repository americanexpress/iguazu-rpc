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

import config from './config';

function validateRequiredFunction(procedureName, parameterName, parameterValue) {
  if (!parameterValue || typeof parameterValue !== 'function') {
    throw new Error(`required param "${parameterName}" of ${procedureName} must be a function (was ${typeof parameterValue})`);
  }
}

function validateOptionalFunction(procedureName, parameterName, parameterValue) {
  if (parameterValue && typeof parameterValue !== 'function') {
    throw new Error(`param "${parameterName}" of ${procedureName} must be a function (was ${typeof parameterValue})`);
  }
}

function setProcedureConfig(name, procedureConfiguration) {
  if (!procedureConfiguration || typeof procedureConfiguration !== 'object') {
    throw new Error(`procedure ${name} configuration must be an object (was ${typeof opts})`);
  }

  const {
    getResultFromCache,
    call,
    buildUpdatedCache,
    cacheModifier,
    modifyOtherCaches,
  } = procedureConfiguration;

  validateRequiredFunction(name, 'getResultFromCache', getResultFromCache);
  validateRequiredFunction(name, 'call', call);
  validateRequiredFunction(name, 'buildUpdatedCache', buildUpdatedCache);

  validateOptionalFunction(name, 'cacheModifier', cacheModifier);
  validateOptionalFunction(name, 'modifyOtherCaches', modifyOtherCaches);

  config.setProcedure(name, {
    getResultFromCache,
    call,
    buildUpdatedCache,
    cacheModifier,
    modifyOtherCaches,
  });
}

export default function setProcedures(procedureConfigs) {
  const procedureConfigList = Object.entries(procedureConfigs);

  if (procedureConfigList.length <= 0) {
    throw new Error('setProcedures object should have at least one procedure defined');
  }

  procedureConfigList.forEach(([name, configuration]) => setProcedureConfig(name, configuration));
}
