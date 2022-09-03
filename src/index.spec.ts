/* eslint-disable @typescript-eslint/no-explicit-any */
import mitt from "mitt"
import { describe, expect, test } from "vitest"

import type { Receiver, Sender } from "."
import { receive, send } from "."

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
  test("normal", async () => {
    events1.all.clear()
    events2.all.clear()

    const controller = receive(
      {
        receiver: receiver1,
        sender: sender1
      },
      {
        sum(a: number, b: number) {
          return a + b
        }
      }
    )
    expect<typeof controller>(
      await send(
        {
          receiver: receiver2,
          sender: sender2
        },
        "sum",
        [1, 2]
      )
    ).toEqual(3)
  })
  test("error", async () => {
    events1.all.clear()
    events2.all.clear()

    const controller = receive(
      {
        receiver: receiver1,
        sender: sender1
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sum(_a: number, _b: number) {
          // eslint-disable-next-line functional/no-throw-statement
          throw new Error("error")
        }
      }
    )
    await expect(
      send<typeof controller>(
        {
          receiver: receiver2,
          sender: sender2
        },
        "sum",
        [1, 2]
      )
    ).rejects.toThrow("error")
  })
  test("not found", async () => {
    receive(
      {
        receiver: receiver1,
        sender: sender1
      },
      {
        sum(a: number, b: number) {
          return a + b
        }
      }
    )
    await expect(
      send(
        {
          receiver: receiver2,
          sender: sender2
        },
        "sum2",
        [1, 2]
      )
    ).rejects.toEqual("NOT_FOUND_ERR")
  })
  test("promise", async () => {
    events1.all.clear()
    events2.all.clear()

    const controller = receive(
      {
        receiver: receiver1,
        sender: sender1
      },
      {
        async sum(a: number, b: number) {
          return a + b
        }
      }
    )
    expect<typeof controller>(
      await send(
        {
          receiver: receiver2,
          sender: sender2
        },
        "sum",
        [1, 2]
      )
    ).toEqual(3)
  })
})
