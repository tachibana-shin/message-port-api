# message-port-api

A simple package that allows you to simplify the use of [MessagePort API](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) more easily (Worker, IFrame...)

> This is a very simple package. it cannot transfer complex data such as `function` or `class`. if you want to use `API` containing complex data use [workercom](https://npmjs.org/package/workercom)

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
import { useReceive } from "message-port-api"

const receive = useReceive(self)

const controllers = receive({
  sum(a: number, b: number) {
    return a + b
  }
})

export type Controller = typeof controller
```

index.ts

```ts
import Worker from "./worker?worker"
import type { Controller } from "./worker"
import { useSend } from "message-port-api"

const worker = new Worker()

const send = useSend(worker)

console.log(await send<Controller>("sum", [1, 2])) // 3
```

### IFrame

iframe

```ts
import { useReceive } from "message-port-api"

const receive = useReceive(window, parent)

receive(
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
import { useSend } from "message-port-api"

const send = useSend(window, () => iframe.contentWindow)

await send("changeBg", ["red"])
```

## API

### useReceive

This function will be located on the `host` side to handle the requested tasks

```ts
function useReceive(
  sender: Sender, // contains `postMessage` function to send return results
  receiver: Receiver // contains 2 functions `addEventListener` and `removeEventListener` to listen to and cancel the `message` event
): receive

function receive(
  controllers: Record<string, Function>, // processing functions
  targetOptions?: string | WindowPostMessageOptions // option 2 propagates to `postMessage`
): Controller
```

> If you want to cancel the call `receive.cancel()'. This is useful when you use `receive` in components
```ts
import { useReceive } from "message-port-api"

const receive = useReceive(self)

receive({ sum })

receive.cancel() // cancel receive call
```


### useSend

This function will be on the `client` side to send processing requests and return a Promise containing processed results from `receive` function

```ts
function useSend(
  sender: Sender, // contains `postMessage` function to send processing request
  receiver: Receiver // contains 2 functions `addEventLister` and `removeEventListener` to listen to and cancel the event `message` containing the results processed through the `receive` function,
  timeout: boolean | number = 30000 // the interval that waits for data to return if the timeout throws a `TIMEOUT` error. Default is 30_0000
): send

function send<Controllers>(
  name: keyof Controllers, // function name for handling
  arguments: Arguments<Controllers[name]>, // processing function call parameter
  targetOptions?: string | WindowPostMessageOptions // option 2 propagates to `postMessage`
): Promise<ReturnType<Controllers[name]>> // prompt containing processed results
```
