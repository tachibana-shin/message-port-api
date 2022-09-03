/* eslint-disable @typescript-eslint/no-explicit-any */
import mitt from "mitt"
import { beforeEach, describe, expect, test } from "vitest"

import type { Receiver, Sender } from "."
import { useReceive, useSend } from "."

const events1 = mitt<{
  message: any
}>()
const events2 = mitt<{
  message: any
}>()
const receiver1: Receiver = {
  postMessage: (data: any) => {
    events1.emit("message", { data })
  }
}
const sender1: Sender = {
  addEventListener(_name: "message", handler: (...args: any[]) => void) {
    events2.on("message", handler)
  },
  removeEventListener(_name: "message", handler: (...args: any[]) => void) {
    events2.off("message", handler)
  }
}
const receiver2: Receiver = {
  postMessage: (data: any) => {
    events2.emit("message", { data })
  }
}
const sender2: Sender = {
  addEventListener(_name: "message", handler: (...args: any[]) => void) {
    events1.on("message", handler)
  },
  removeEventListener(_name: "message", handler: (...args: any[]) => void) {
    events1.off("message", handler)
  }
}

describe("normal", () => {
  const receive = useReceive(sender1, receiver1)
  const send = useSend(sender2, receiver2, 3000)

  beforeEach(() => {
    events1.all.clear()
    events2.all.clear()
  })

  test("normal", async () => {
    const controller = receive({
      sum(a: number, b: number) {
        return a + b
      }
    })
    expect(await send<typeof controller>("sum", [1, 2])).toEqual(3)
  })
  test("error", async () => {
    const controller = receive({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sum(_a: number, _b: number) {
        // eslint-disable-next-line functional/no-throw-statement
        throw new Error("error")
      }
    })
    await expect(send<typeof controller>("sum", [1, 2])).rejects.toThrow(
      "error"
    )
  })
  test("not found", async () => {
    receive({
      sum(a: number, b: number) {
        return a + b
      }
    })
    await expect(send("sum2", [1, 2])).rejects.toEqual("NOT_FOUND_ERR")
  })
  test("promise", async () => {
    const controller = receive({
      async sum(a: number, b: number) {
        return a + b
      }
    })
    expect(await send<typeof controller>("sum", [1, 2])).toEqual(3)
  })

  test("cancel", async () => {
    const controller = receive({
      sum(a: number, b: number) {
        return a + b
      }
    })
    receive.cancel()

    await expect(send<typeof controller>("sum", [1, 2])).rejects.toEqual(
      "TIME_OUT"
    )
  })
})
