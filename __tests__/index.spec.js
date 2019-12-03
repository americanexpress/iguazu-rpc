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

import proceduresReducer from '../src/duck';
import { configureIguazuRPC } from '../src/config';
import setProcedures from '../src/setProcedures';
import queryProcedureResult from '../src/useProcedureResult/query';

import * as index from '../src';

describe('index', () => {
  it('exports the redux reducer as proceduresReducer', () => expect(index.proceduresReducer).toBe(proceduresReducer));
  it('exports configureIguazuRPC', () => expect(index.configureIguazuRPC).toBe(configureIguazuRPC));
  it('exports setProcedures', () => expect(index.setProcedures).toBe(setProcedures));
  it('exports queryProcedureResult', () => expect(index.queryProcedureResult).toBe(queryProcedureResult));
});
