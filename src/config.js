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

const procedures = new Map();

function setProcedure(name, config) {
  if (!name || typeof name !== 'string') {
    throw new Error(`name must be a string (was ${name ? typeof name : 'falsey'})`);
  }

  if (procedures.has(name)) {
    // eslint-disable-next-line no-console
    console.warn(`overriding existing config for procedure ${name}`);
  }

  procedures.set(name, config);
}

function getProcedure(name) {
  if (!procedures.has(name)) {
    throw new Error(`${name} is not a configured procedure`);
  }

  return procedures.get(name);
}

const config = {
  getToState: (state) => state.iguazuRPC,
  setProcedure,
  getProcedure,
};

export function configureIguazuRPC(customConfig) {
  Object.assign(config, customConfig, { setProcedure, getProcedure });
}

export default config;
