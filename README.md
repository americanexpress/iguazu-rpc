<h1>
  <center>
    <br />
    <img src="./iguazu-rpc.png" alt="iguazu-rpc - Iguazu" width="50%" />
    <br /><br />
  </center>
</h1>

[![npm version](https://badge.fury.io/js/iguazu-rpc.svg)](https://badge.fury.io/js/iguazu-rpc)
[![Build Status](https://travis-ci.org/americanexpress/iguazu-rpc.svg?branch=master)](https://travis-ci.org/americanexpress/iguazu-rpc)

> Iguazu RPC is a plugin for the [Iguazu](https://github.com/americanexpress/iguazu)
> ecosystem that allows for configurable async calls and caching strategies.
> We use "RPC" loosely as you may use any form of communication strategy
> available in the browser to talk to a server API (e.g. REST, GraphQL, or
> even an unstructured endpoint returning JSON or XML).

## 👩‍💻 Hiring 👨‍💻

Want to get paid for your contributions to `iguazu-rpc`?
> Send your resume to oneamex.careers@aexp.com

## 📖 Table of Contents

* [Features](#-features)
* [Usage](#-usage)
* [API](#-api)
* [Available Scripts](#-available-scripts)
* [Contributing](#-contributing)

## ✨ Features

* Plugs into [Iguazu](https://github.com/americanexpress/iguazu)
* Bring your own async request strategy to talk to any API 
  * (e.g. REST, GraphQL, or even an unstructured endpoint returning JSON or XML)
* Customizable Caching Strategies per request
* Seamless integration in Redux

### How it works

We can create a configuration object with a key for the request name and a value that contains lifecycle hooks for creating a request and specifying a caching strategy.

```js
import { setProcedures } from 'iguazu-rpc';

setProcedures({
  readBlogPosts: {
    getResultFromCache: ({ args, cache }) => { /* ... */ },
    call: ({ fetchClient, getState, args }) => fetchClient('url').then((r) => r.text()),
    buildUpdatedCache: ({ cache, args, result }) => { /* ... */ },
  },
});
```

### See it in action

We may then use a Redux action creator inside `mapDispatchToProps` to dispatch `readBlogPosts`.

```js
import { queryProcedureResult } from 'iguazu-rpc';
import { connect } from 'react-redux';
// ...
const mapDispatchToProps = (dispatch) => ({
  readBlogPosts: (args) => dispatch(queryProcedureResult({ procedureName: 'readBlogPosts', args })),
});
// ...
connect(null, mapDispatchToProps)(SomeComponent);
// See Iguazu library for details on receiving data using connectAsync
```

## 🤹‍ Usage

### Installation

```bash
npm install --save iguazu-rpc
```

### Setup

Set up the reducer in your store:

```javascript
import { proceduresReducer } from 'iguazu-rpc';
import { combineReducers, createStore } from 'redux';

const reducer = combineReducers({
  procedures: proceduresReducer,
  // other reducers
});

const store = createStore(reducer);
```

Configure `iguazu-rpc` with a selector to the `proceduresReducer`.

```javascript
import { configureIguazuRPC } from 'iguazu-rpc';

configureIguazuRPC({
  getToState: (state) => state.procedures,
});
```

Configure your procedure calls (allows you to register procedure calls and configure caching behavior):

```javascript
import { setProcedures } from 'iguazu-rpc';

setProcedures({
  // procedure names with lifecycle methods
  readData: {
    getResultFromCache: ({ args, cache }) => {
      if (!cache.has(args.id)) {
        throw new Error('make the call');
      }
      return cache.get(args.id);
    },
    // Call method that supplies a fetchClient, getState, and args to use for making server calls
    // This method returns a Promise
    call: ({ fetchClient, getState, args }) => fetchClient('url').then((r) => r.text()),
    buildUpdatedCache: ({ cache, args, result }) => cache.set(args.id, result),
    // allows other procedures to invalidate/edit this procedure's cache while not relinquishing
    // management: iguazu-rpc wraps the returned function so the other procedures don't ever handle
    // this procedure's modified cache
    cacheModifier: ({ cache }) => ({ action = 'delete', id, value }) => {
      switch (action) {
        case 'delete':
          return cache.delete(id);
        case 'update':
          return cache.set(id, buildEntry(value));
        default:
          return cache;
      }
    },
  },
  updateData: {
    getResultFromCache: () => { throw new Error('Always go to the server'); },
    call: ({ getState, args }) => result,
    buildUpdatedCache: ({ cache, args, result }) => cache,
    modifyOtherCaches: ({ cache /* own cache */, args, result }) => ({
      // modifyCache is a wrapped form of the other procedure's `cacheModifier` result
      readData: (modifyCache) => modifyCache({ action: 'delete', id: args.id }),
    }),
  },
});
```

### Advanced Setup

You may also supply a custom `fetch` client to iguazu-rpc using Redux Thunk.
(See [Thunk withExtraArgument
docs](https://github.com/reduxjs/redux-thunk#injecting-a-custom-argument))

```javascript
import { combineReducers, createStore } from 'redux';
import { proceduresReducer, setProcedures } from 'iguazu-rpc';
import thunk from 'redux-thunk';

configureIguazuRPC({
  getToState: (state) => state.procedures,
});

setProcedures({
  // Set your procedures as specified above
});

const reducer = combineReducers({
  procedures: proceduresReducer,
  // other reducers
});

/* Contrived custom fetch client */
const customFetchClient = (...args) => fetch(...args);

const store = createStore(
  combineReducers({
    resources: resourcesReducer,
  }),
  applyMiddleware(thunk.withExtraArgument({
    fetchClient: customFetchClient,
  }))
);
```

### Dispatching Procedures

With the configuration set you can now make calls in your module and expect
conformance to the [Iguazu pattern](https://github.com/americanexpress/iguazu):

```javascript
/* MyContainer.jsx */
import React from 'react';
import { connectAsync } from 'iguazu';
import { queryProcedureResult } from 'iguazu-rpc';

function MyContainer({ isLoading, loadedWithErrors, myData }) {
  if (isLoading()) {
    return <div>Loading...</div>;
  }

  if (loadedWithErrors()) {
    return <div>Oh no! Something went wrong</div>;
  }

  return (
    <div>
myData =
      {myData}
    </div>
  );
}

function loadDataAsProps({ store, ownProps }) {
  const { dispatch } = store;
  const procedureName = 'readData';
  const args = { id: '123' };
  return {
    myData: () => dispatch(queryProcedureResult({ procedureName, args })),
    // To force fetch the data
    // Note: forceFetch shouldn't be hardcoded to true
    // in loadDataAsProps as this will result in a loop of fetches
    forceFetchMyData: () => dispatch(queryProcedureResult({
      procedureName,
      args,
      forceFetch: true,
    })),
  };
}
```

## 🎛️ API

### Detailed procedure configuration
Procedure configurations allow the use of the following keys:

#### getResultFromCache (required)
A function with signature `({ args, cache })` that returns the cached data or throws if there is no data in the cache. If the procedure should not ever cache its results then always throwing is acceptable.

This function is used internally when a query of the procedure result is made in order to decide whether a remote call is needed.

Example:

```javascript
configureIguazuRPC({
  procedures: {
    readData: {
      getResultFromCache: ({ args, cache }) => {
        if (!cache.has(args.id)) {
          throw new Error('make the call');
        }
        return cache.get(args.id);
      },
    },
    // ...
  },
  // ...
});
```

#### call (required)

A function with signature `({ fetchClient, getState, args })` that returns a
Promise.

**Note** It is recommended to use `fetchClient` argument for running fetch calls
rather than using global `fetch`. 

This approach allows for the client and the server to specify different `fetch`
implementations. For example, the server needs to support cookies inside a
server-side `fetch` versus the client-side which works with cookies by default.
Also, enforcing timeouts for `fetch` requests is needed to keep requests
performant.

Example:
```javascript
configureIguazuRPC({
  procedures: {
    readData: {
      // Note we use the fetchClient argument rather than global fetch
      call: ({ fetchClient, getState, args }) => fetchClient(
        `${process.env.HOST_URL}/readData`,
        { credentials: 'include' }
      ).then((response) => response.json()),
    },
    // ...
  },
  // ...
});
```

#### buildUpdatedCache (optional)
A function with signature `({ cache, args, result })` that returns the new cache.

This function is called internally after a call to the procedure is made. The returned value will be set as the new cache for the procedure.

Example:
```javascript
configureIguazuRPC({
  procedures: {
    readData: {
      buildUpdatedCache: ({ cache, args, result }) => cache.set(args.id, result),
    },
    // ...
  },
  // ...
});
```

#### cacheModifier (optional)
Sometimes procedures can change the validity of the data that other procedures might have cached. To this end, `cacheModifier` is a way for a procedure to still retain control over its own cache while allowing other procedures to modify it.

The value for `cacheModifier` is a function of signature `({ cache })` that should return another function.
The signature of the wrapped function is defined by the procedure, but should return the updated cache. The returned function is wrapped such that other procedures can call it but never see the resulting cache.

Example:
```javascript
configureIguazuRPC({
  procedures: {
    readData: {
      cacheModifier: ({ cache }) => ({ action = 'delete', id, value }) => {
        switch (action) {
          case 'delete':
            return cache.delete(id);
          case 'update':
            return cache.set(id, buildEntry(result));
          default:
            return cache;
        }
      },
      // ...
    },
    // ...
  },
  // ...
});
```

#### modifyOtherCaches (optional)
Sometimes procedures can change the validity of the data that other procedures might have cached. To this end, `modifyOtherCaches` is a way to signal to `iguazu-rpc` what procedure caches should be edited and how.

`modifyOtherCaches` is a function with signature `({ cache, args, result })` that should return an object of other configured procedure names as keys, and a function accepting their wrapped `cacheModifier` function as a value.

```javascript
configureIguazuRPC({
  procedures: {
    updateData: {
      modifyOtherCaches: ({ cache /* own cache */, args, result }) => ({
        // modifyCache is a wrapped form of the other procedure's `cacheModifier` result
        readData: (modifyCache) => modifyCache({ action: 'delete', id: args.id }),
      }),
      // ...
    },
    // ...
  },
  // ...
});
```

## Clearing the data after you are done.
### clearProcedureResult({ procedureName, args })
Usually you can clear your entire store when a user session ends but sometimes residual data can be a concern for long running sessions.
In these cases the `clearProcedureResult` action can be used to selectively clean up the residual data when is no longer needed.

This function uses a procedure's `buildUpdatedCache` method to update a key's result and error values to `undefined`.
To have the key removed from the cache, `buildUpdatedCache` can be implemented as in the following example:
 ```js
 configureIguazuRPC({
   procedures: {
     readData: {
       buildUpdatedCache: ({ cache, args, result }) => (
         typeof result === 'undefined' && typeof error === 'undefined'
           ? cache.remove(hash(args))
           : cache.set(hash(args), error || result)
       ),
     },
     // ...
   },
   // ...
});
 ```
 
### Selectors

#### getProcedureResult

Retrieve the result of a procedure without making a request.

```js
const procedureResult = getProcedureResult({ procedureName, args })(state);
```

## 📜 Available Scripts

**`npm run lint`**

Verifies that your code matches the American Express code style defined in
[`eslint-config-amex`](https://github.com/americanexpress/eslint-config-amex).

**`npm run build`**

Runs `babel` to compile `src` files to transpiled JavaScript into `lib` using
[`babel-preset-amex`](https://github.com/americanexpress/babel-preset-amex).

**`npm test`**

Runs unit tests **and** verifies the format of all commit messages on the current branch.

**`npm posttest`**

Runs linting on the current branch.

## 🎣 Git Hooks

These commands will be automatically run during normal git operations like committing code.

**`pre-commit`**

This hook runs `npm test` before allowing a commit to be checked in.

**`commit-msg`**

This hook verifies that your commit message matches the One Amex conventions. See the **commit
message** section in the [contribution guidelines](./CONTRIBUTING.md).

## 🏆 Contributing

We welcome Your interest in the American Express Open Source Community on Github.
Any Contributor to any Open Source Project managed by the American Express Open
Source Community must accept and sign an Agreement indicating agreement to the
terms below. Except for the rights granted in this Agreement to American Express
and to recipients of software distributed by American Express, You reserve all
right, title, and interest, if any, in and to Your Contributions. Please [fill
out the Agreement](https://cla-assistant.io/americanexpress/iguazu-rpc).

Please feel free to open pull requests and see [CONTRIBUTING.md](./CONTRIBUTING.md) for commit formatting details.

## 🗝️ License

Any contributions made under this project will be governed by the [Apache License
2.0](https://https://github.com/americanexpress/iguazu-rpc/blob/master/LICENSE.txt).

## 🗣️ Code of Conduct

This project adheres to the [American Express Community Guidelines](./CODE_OF_CONDUCT.md).
By participating, you are expected to honor these guidelines.
