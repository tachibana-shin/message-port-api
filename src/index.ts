/* eslint-disable @typescript-eslint/no-explicit-any */
interface Sender {
  addEventListener: (
    name: "message",
    handler: (event: MessageEvent<unknown>) => void
  ) => void
  removeEventListener: (
    name: "message",
    handler: (event: MessageEvent<unknown>) => void
  ) => void
}
interface Receiver {
  postMessage: (
    data: any,
    // eslint-disable-next-line no-undef
    targetOrigin?: string | WindowPostMessageOptions
  ) => void
}
interface IRequest {
  id: string
  name: string
  // eslint-disable-next-line functional/functional-parameters
  arguments: unknown[]
}
interface IResponseResult {
  id: string
  name: string
  result: unknown
}
interface IResponseError {
  id: string
  name: string
  error: string
}

function isRequest(data: any): data is IRequest {
  return data && "id" in data && "arguments" in data
}
function isResponseResult(data: any): data is IResponseResult {
  return data && "id" in data && "result" in data
}
function isResponseError(data: any): data is IResponseError {
  return data && "id" in data && "error" in data
}

export type { Sender, Receiver, IRequest, IResponseResult, IResponseError }

function useValue<T>(
  value: T
): T extends (...args: any[]) => any ? ReturnType<T> : T {
  return typeof value === "function" ? value() : value
}

interface Receive {
  <Controllers extends Record<string, (...args: any[]) => any>>(
    controllers: Controllers,
    targetOrigin?: string
  ): Controllers
  <Controllers extends Record<string, (...args: any[]) => any>>(
    controllers: Controllers,
    // eslint-disable-next-line no-undef
    optionsTargetOrigin?: WindowPostMessageOptions
  ): Controllers
}
function useReceive(sender: Sender & Receiver, receiver?: Receiver): Receive
// eslint-disable-next-line no-redeclare
function useReceive(sender: Sender, receiver: Receiver): Receive
// eslint-disable-next-line no-redeclare
function useReceive(sender: Sender, receiver?: Receiver): Receive {
  if (!receiver && "postMessage" in sender)
    receiver = sender as unknown as Receiver

  // is @server
  function receive<Controllers extends Record<string, (...args: any[]) => any>>(
    controllers: Controllers,
    targetOrigin?: string
  ): Controllers
  // eslint-disable-next-line no-redeclare
  function receive<Controllers extends Record<string, (...args: any[]) => any>>(
    controllers: Controllers,
    // eslint-disable-next-line no-undef
    optionsTargetOrigin?: WindowPostMessageOptions
  ): Controllers
  // eslint-disable-next-line no-redeclare
  function receive<Controllers extends Record<string, (...args: any[]) => any>>(
    controllers: Controllers,
    // eslint-disable-next-line no-undef
    targetOrigin?: string | WindowPostMessageOptions
  ): Controllers {
    useValue(sender).addEventListener("message", async ({ data }) => {
      if (isRequest(data)) {
        // && data.name === names

        if (data.name in controllers) {
          const controller = controllers[data.name]
          try {
            const responseResult: IResponseResult = {
              id: data.id,
              name: data.name,
              result: await controller(...data.arguments)
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            useValue(receiver!).postMessage(responseResult, targetOrigin)
          } catch (err) {
            const responseError: IResponseError = {
              id: data.id,
              name: data.name,
              error: err + ""
            }

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            useValue(receiver!).postMessage(responseError, targetOrigin)
          }
        } else {
          const responseError: IResponseError = {
            id: data.id,
            name: data.name,
            error: "NOT_FOUND_ERR"
          }

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          useValue(receiver!).postMessage(responseError, targetOrigin)
        }
      }
    })

    return controllers
  }

  return receive
}

interface Send {
  <
    Controllers extends Record<string, (...args: any[]) => any>,
    Name extends keyof Controllers = keyof Controllers
  >(
    name: Name,
    args: Controllers[Name] extends (...args: infer A) => any ? A : unknown[],

    targetOrigin?: string
  ): Promise<Awaited<ReturnType<Controllers[Name]>>>
  <
    Controllers extends Record<string, (...args: any[]) => any>,
    Name extends keyof Controllers = keyof Controllers
  >(
    name: Name,
    args: Controllers[Name] extends (...args: infer A) => any ? A : unknown[],

    // eslint-disable-next-line no-undef
    postMessageOptions?: WindowPostMessageOptions
  ): Promise<Awaited<ReturnType<Controllers[Name]>>>
}

function useSend(sender: Sender & Receiver, receiver?: Receiver): Send
// eslint-disable-next-line no-redeclare
function useSend(sender: Sender, receiver: Receiver): Send
// eslint-disable-next-line no-redeclare
function useSend(sender: Sender, receiver?: Receiver): Send {
  if (!receiver && "postMessage" in sender)
    receiver = sender as unknown as Receiver

  // is @client
  function send<
    Controllers extends Record<string, (...args: any[]) => any>,
    Name extends keyof Controllers = keyof Controllers
  >(
    name: Name,
    args: Controllers[Name] extends (...args: infer A) => any ? A : unknown[],

    targetOrigin?: string
  ): Promise<Awaited<ReturnType<Controllers[Name]>>>
  // eslint-disable-next-line no-redeclare
  function send<
    Controllers extends Record<string, (...args: any[]) => any>,
    Name extends keyof Controllers = keyof Controllers
  >(
    name: Name,
    args: Controllers[Name] extends (...args: infer A) => any ? A : unknown[],

    // eslint-disable-next-line no-undef
    postMessageOptions?: WindowPostMessageOptions
  ): Promise<Awaited<ReturnType<Controllers[Name]>>>
  // eslint-disable-next-line no-redeclare
  function send<
    Controllers extends Record<string, (...args: any[]) => any>,
    Name extends keyof Controllers = keyof Controllers
  >(
    name: Name,
    args: Controllers[Name] extends (...args: infer A) => any ? A : unknown[],

    // eslint-disable-next-line no-undef
    targetOrigin?: string | WindowPostMessageOptions
  ): Promise<Awaited<ReturnType<Controllers[Name]>>> {
    const id = Math.random().toString(34).slice(2)

    return new Promise<Awaited<ReturnType<Controllers[Name]>>>(
      (resolve, reject) => {
        const request: IRequest = {
          id,
          name: name as string,
          arguments: args
        }
        useValue(sender).addEventListener("message", handler)
        function handler({ data }: MessageEvent<unknown>) {
          if (isResponseResult(data) && data.id === id && data.name === name) {
            // this result
            resolve(data.result as ReturnType<Controllers[Name]>)

            useValue(sender).removeEventListener("message", handler)
            return
          }
          if (isResponseError(data) && data.id === id && data.name === name) {
            reject(data.error)

            useValue(sender).removeEventListener("message", handler)
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        useValue(receiver!).postMessage(request, targetOrigin)
      }
    )
  }

  return send
}

export { useReceive, useSend }
