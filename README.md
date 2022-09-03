# message-port-api

a repository npm package

[https://tachibana-shin.github.io/message-port-api](https://tachibana-shin.github.io/message-port-api)

[![Build](https://github.com/tachibana-shin/message-port-api/actions/workflows/test.yml/badge.svg)](https://github.com/tachibana-shin/message-port-api/actions/workflows/test.yml)
[![NPM](https://badge.fury.io/js/message-port-api.svg)](http://badge.fury.io/js/message-port-api)
[![Size](https://img.shields.io/bundlephobia/minzip/message-port-api/latest)](https://npmjs.org/package/message-port-api)
[![Languages](https://img.shields.io/github/languages/top/tachibana-shin/message-port-api)](https://npmjs.org/package/message-port-api)
[![License](https://img.shields.io/npm/l/message-port-api)](https://npmjs.org/package/message-port-api)
[![Star](https://img.shields.io/github/stars/tachibana-shin/message-port-api)](https://github.com/tachibana-shin/message-port-api/stargazers)
[![Download](https://img.shields.io/npm/dm/message-port-api)](https://npmjs.org/package/message-port-api)

## Installation

NPM / Yarn / Pnpm

```bash
pnpm add message-port-api
```

## Usage

### Worker

worker.ts

```ts
import { receive } from "message-port-api"

const controllers = receive(
  {
    receiver: self,
    sender: self
  },
  {
    sum(a: number, b: number) {
      return a + b
    }
  }
)

export type Controller = typeof controller
```

index.ts

```ts
import Worker from "./worker?worker"
import type { Controller } from "./worker"

const worker = new Worker()

console.log(
  await sender<Controller>(
    {
      receiver: worker,
      sender: worker
    },
    "sum",
    [1, 2]
  )
) // 3
```

### IFrame

iframe

```ts
import { receive } from "message-port-api"

receive(
  {
    receiver: parent,
    sender: window
  },
  {
    changeBg(color: string) {
      document.body.style.backgroundColor = color
    }
  },
  {
    targetOrigin: "*"
  }
)
```

main.ts

```ts
import { send } from "message-port-api"

await send(
  {
    get receiver() {
      return iframe.contentWindow
    },
    sender: window
  },
  "changeBg",
  ["red"]
)
```

````

## API

### receive

This function will be located on the `host` side to handle the requested tasks

```ts
function receive(
  config: {
    receiver: Receiver // contains `postMessage` function to send return results
    sender: Sender // contains 2 functions `addEventListener` and `removeEventListener` to listen to and cancel the `message` event
  },
  controllers: Record<string, Function>, // processing functions
  targetOptions?: string | WindowPostMessageOptions // option 2 propagates to `postMessage`
): Controller
````

### sender

This function will be on the `client` side to send processing requests and return a Promise containing processed results from `receive` function

```ts
function sender<Controllers>(
  config: {
    receiver: Receiver // contains `postMessage` function to send processing request
    sender: Sender // contains 2 functions `addEventLister` and `removeEventListener` to listen to and cancel the event `message` containing the results processed through the `receive` function
  },
  name: keyof Controllers, // function name for handling
  arguments: Arguments<Controllers[name]>, // processing function call parameter
  targetOptions?: string | WindowPostMessageOptions // option 2 propagates to `postMessage`
): Promise<ReturnType<Controllers[name]>> // prompt containing processed results
```
