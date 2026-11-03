import { describe, expect, it } from "vitest"
import { clientOriginFor } from "./client-site"
import {
  clampText,
  firstMarkdownImage,
  markdownExcerpt,
  markdownHeadings,
} from "./og-text"

const BODY = `> [!NOTE]
> **Summary**

## **Blog Pipeline**

Hi [@Farah](mention://person) see [the deck](https://x.com/a) and https://y.com/b.

[Figma](https://www.figma.com/design/abc#embed=preview-wide)

![shot.png](https://s.example.com/storage/v1/object/public/report-images/a/b.png#size=wide)

\`\`\`
secret code
\`\`\`

## Next week 🚀

- [ ] 
`

describe("og-text", () => {
  it("makes a plain excerpt", () => {
    expect(markdownExcerpt(BODY)).toBe(
      "Summary Blog Pipeline Hi @Farah see the deck and Next week",
    )
  })
  it("lists section headings", () => {
    expect(markdownHeadings(BODY)).toEqual(["Blog Pipeline", "Next week"])
  })
  it("finds the first picture without its hint", () => {
    expect(firstMarkdownImage(BODY)).toBe(
      "https://s.example.com/storage/v1/object/public/report-images/a/b.png",
    )
  })
  it("clamps at a word", () => {
    expect(clampText("one two three four", 12)).toBe("one two…")
  })
})

describe("clientOriginFor", () => {
  it("maps hosts to the public client site", () => {
    expect(clientOriginFor("app.kretyastudio.com", "https")).toBe(
      "https://client.kretyastudio.com",
    )
    expect(clientOriginFor("client.kretyastudio.com", "https")).toBe(
      "https://client.kretyastudio.com",
    )
    expect(clientOriginFor("localhost:3000", null)).toBe(
      "http://localhost:3000",
    )
  })
})
