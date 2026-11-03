import { describe, expect, it } from "vitest"
import {
  nextSession,
  reanchor,
  santuySchedule,
  sessionTimes,
  todayIn,
  type SantuySettings,
  type SantuyWeek,
} from "./santuy"

const settings: SantuySettings = {
  weekday: 5, // Friday
  startTime: "16:00:00",
  durationMin: 60,
  timezone: "Asia/Jakarta",
  anchorDate: "2026-11-06",
  anchorIndex: 0,
}
const queue = ["bagas", "habibi", "rizal"]

const who = (weeks: SantuyWeek[] = [], s = settings, q = queue) =>
  santuySchedule({
    settings: s,
    queue: q,
    weeks,
    from: "2026-11-02",
    to: "2027-01-01",
  }).map((x) => `${x.date} ${x.kind === "skip" ? "-" : x.profileId}`)

describe("santuySchedule", () => {
  it("starts at the anchor and loops the queue forever", () => {
    expect(who().slice(0, 5)).toEqual([
      "2026-11-06 bagas",
      "2026-11-13 habibi",
      "2026-11-20 rizal",
      "2026-11-27 bagas",
      "2026-12-04 habibi",
    ])
  })

  it("starts mid-queue from the anchor index", () => {
    expect(who([], { ...settings, anchorIndex: 2 })[0]).toBe("2026-11-06 rizal")
  })

  it("puts the first session on the first weekday on/after the anchor", () => {
    expect(who([], { ...settings, anchorDate: "2026-11-04" })[0]).toBe(
      "2026-11-06 bagas",
    )
  })

  it("times sessions in WIB", () => {
    const { start, end } = sessionTimes("2026-11-06", settings)
    expect(start.toISOString()).toBe("2026-11-06T09:00:00.000Z")
    expect(end.toISOString()).toBe("2026-11-06T10:00:00.000Z")
  })

  it("a skip week shifts nobody: the same person takes the next session", () => {
    expect(
      who([{ date: "2026-11-13", kind: "skip", profileId: null }]).slice(0, 4),
    ).toEqual([
      "2026-11-06 bagas",
      "2026-11-13 -",
      "2026-11-20 habibi",
      "2026-11-27 rizal",
    ])
  })

  it("an assign sets that week only; everyone else keeps their date", () => {
    expect(
      who([{ date: "2026-11-13", kind: "assign", profileId: "farah" }]).slice(
        0,
        4,
      ),
    ).toEqual([
      "2026-11-06 bagas",
      "2026-11-13 farah",
      "2026-11-20 rizal",
      "2026-11-27 bagas",
    ])
  })

  it("a moved week keeps its presenter and shifts nobody, on the new day", () => {
    const weeks: SantuyWeek[] = [
      {
        date: "2026-11-13",
        kind: "move",
        profileId: null,
        movedDate: "2026-11-12",
        movedTime: "15:00",
      },
    ]
    expect(who(weeks).slice(0, 3)).toEqual([
      "2026-11-06 bagas",
      "2026-11-13 habibi",
      "2026-11-20 rizal",
    ])
    const moved = santuySchedule({
      settings,
      queue,
      weeks,
      from: "2026-11-13",
      to: "2026-11-13",
    })[0]
    expect(moved.movedTo).toBe("2026-11-12")
    expect(moved.start.toISOString()).toBe("2026-11-12T08:00:00.000Z")
  })

  it("a moved week without a time keeps the usual start time", () => {
    const [moved] = santuySchedule({
      settings,
      queue,
      weeks: [
        {
          date: "2026-11-13",
          kind: "move",
          profileId: "rizal",
          movedDate: "2026-11-11",
        },
      ],
      from: "2026-11-13",
      to: "2026-11-13",
    })
    expect(moved.profileId).toBe("rizal")
    expect(moved.start.toISOString()).toBe("2026-11-11T09:00:00.000Z")
  })

  it("ignores exceptions on non-session days", () => {
    expect(
      who([{ date: "2026-11-12", kind: "skip", profileId: null }])[1],
    ).toBe("2026-11-13 habibi")
  })

  it("shows assigned weeks before the anchor as history", () => {
    const s = santuySchedule({
      settings,
      queue,
      weeks: [{ date: "2026-10-30", kind: "assign", profileId: "evan" }],
      from: "2026-10-02",
      to: "2026-11-06",
    })
    expect(s.map((x) => [x.date, x.profileId, x.history])).toEqual([
      ["2026-10-30", "evan", true],
      ["2026-11-06", "bagas", false],
    ])
  })

  it("has no regular sessions with an empty queue", () => {
    expect(who([], settings, [])).toEqual([])
  })
})

describe("reanchor", () => {
  const today = "2026-11-18" // Wednesday; next session Fri 11-20 (rizal)

  it("reorder keeps the upcoming presenter, then follows the new order", () => {
    const nextQueue = ["rizal", "bagas", "habibi"]
    const r = reanchor({ settings, queue, weeks: [], nextQueue, today })
    expect(r.anchorDate).toBe("2026-11-20")
    expect(r.anchorIndex).toBe(0)
    const next = { ...settings, anchorDate: r.anchorDate, anchorIndex: 0 }
    expect(
      who([], next, nextQueue)
        .filter((x) => x >= "2026-11-20")
        .slice(0, 4),
    ).toEqual([
      "2026-11-20 rizal",
      "2026-11-27 bagas",
      "2026-12-04 habibi",
      "2026-12-11 rizal",
    ])
  })

  it("freezes past sessions so history keeps its presenters", () => {
    const r = reanchor({
      settings,
      queue,
      weeks: [],
      nextQueue: queue,
      today,
    })
    expect(r.freeze).toEqual([
      { date: "2026-11-06", profileId: "bagas" },
      { date: "2026-11-13", profileId: "habibi" },
    ])
  })

  it("removal: if the upcoming person left, the next one after them goes", () => {
    const nextQueue = ["bagas", "habibi"] // rizal left
    const r = reanchor({ settings, queue, weeks: [], nextQueue, today })
    expect(r.anchorDate).toBe("2026-11-20")
    expect(nextQueue[r.anchorIndex]).toBe("bagas")
  })

  it("removal of someone else keeps the upcoming presenter", () => {
    const nextQueue = ["habibi", "rizal"] // bagas left
    const r = reanchor({ settings, queue, weeks: [], nextQueue, today })
    expect(nextQueue[r.anchorIndex]).toBe("rizal")
    const next = { ...settings, ...r }
    const weeks = r.freeze.map((f) => ({ ...f, kind: "assign" as const }))
    // History unchanged, future without bagas.
    expect(who(weeks, next, nextQueue).slice(0, 5)).toEqual([
      "2026-11-06 bagas",
      "2026-11-13 habibi",
      "2026-11-20 rizal",
      "2026-11-27 habibi",
      "2026-12-04 rizal",
    ])
  })

  it("adding someone keeps the upcoming presenter", () => {
    const nextQueue = ["bagas", "farah", "habibi", "rizal"]
    const r = reanchor({ settings, queue, weeks: [], nextQueue, today })
    expect(nextQueue[r.anchorIndex]).toBe("rizal")
  })

  it("anchors on the rotation's person when that week is assigned", () => {
    const weeks: SantuyWeek[] = [
      { date: "2026-11-20", kind: "assign", profileId: "farah" },
    ]
    const r = reanchor({ settings, queue, weeks, nextQueue: queue, today })
    expect(queue[r.anchorIndex]).toBe("rizal")
    const next = { ...settings, ...r }
    const all = [
      ...weeks,
      ...r.freeze.map((f) => ({ ...f, kind: "assign" as const })),
    ]
    expect(who(all, next).slice(2, 4)).toEqual([
      "2026-11-20 farah",
      "2026-11-27 bagas",
    ])
  })

  it("skips a libur week when finding the upcoming session", () => {
    const weeks: SantuyWeek[] = [
      { date: "2026-11-20", kind: "skip", profileId: null },
    ]
    const r = reanchor({ settings, queue, weeks, nextQueue: queue, today })
    expect(r.anchorDate).toBe("2026-11-27")
    expect(queue[r.anchorIndex]).toBe("rizal")
  })

  it("moving the weekday keeps the upcoming person on the new day", () => {
    const r = reanchor({
      settings,
      queue,
      weeks: [],
      nextQueue: queue,
      nextWeekday: 6,
      today,
    })
    expect(r.anchorDate).toBe("2026-11-21")
    expect(queue[r.anchorIndex]).toBe("rizal")
  })

  it("an anchor still in the future stays put", () => {
    const r = reanchor({
      settings,
      queue,
      weeks: [],
      nextQueue: queue,
      today: "2026-11-03",
    })
    expect(r).toEqual({ anchorDate: "2026-11-06", anchorIndex: 0, freeze: [] })
  })
})

describe("helpers", () => {
  it("todayIn uses the zone, not the machine", () => {
    expect(todayIn("Asia/Jakarta", new Date("2026-11-04T18:30:00Z"))).toBe(
      "2026-11-05",
    )
  })

  it("nextSession finds the first session on/after today", () => {
    expect(
      nextSession({ settings, queue, weeks: [] }, "2026-11-07")?.date,
    ).toBe("2026-11-13")
  })
})
