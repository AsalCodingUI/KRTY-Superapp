"use client"

import { Button } from "@/components/ui"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@/shared/ui/lucide-icons"
import React, { useEffect, useRef, useState } from "react"

// --- CONSTANTS & CONFIG ---
const BRAND_BLUE = "#1C35EC"
const A4_WIDTH = 1103.08
const A4_HEIGHT = 1561
const CONTENT_HEIGHT = 1353 // Content area (1393px) minus 40px safety margin from footer

// Estimated heights for content blocks (in pixels)
const HEIGHTS = {
  HEADER: 150, // InternalPageLabel
  SECTION_TITLE: 45, // Reduced from 50
  SUB_SECTION: 35, // Reduced from 40
  TABLE_HEADER: 28, // Reduced from 30
  TABLE_ROW: 22, // Reduced from 25
  NOTE_BOX: 55, // Reduced from 60
  SIGNATURES: 180, // Reduced from 200
  SPACING: 20,
}

// --- TYPES ---
interface ClientInfo {
  name: string
  company: string
  email: string
  address: string
  date: string
}

interface AgencyInfo {
  name: string
  email: string
  address: string
  repName: string
  repTitle: string
}

interface ScopeItem {
  no: string
  category: string
  flow: string
  desc: string
}

interface MilestoneItem {
  no: string
  category: string
  desc: string
  time: string
}

interface Milestones {
  m1: MilestoneItem[]
  m2: MilestoneItem[]
  m3: MilestoneItem[]
}

interface SLADocumentPreviewProps {
  clientInfo: ClientInfo
  agencyInfo: AgencyInfo
  scopeOfWork: ScopeItem[]
  milestones: Milestones
  className?: string
}

// --- HELPER COMPONENTS ---

const InternalPageHeader = () => (
  <div
    style={{
      alignSelf: "stretch",
      height: "10px",
      flexShrink: 0,
      background: BRAND_BLUE,
    }}
  ></div>
)

const InternalPageLabel = () => (
  <div
    style={{
      alignSelf: "stretch",
      height: "102px",
      flexShrink: 0,
      background: "white",
      overflow: "hidden",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "8px",
      display: "flex",
      paddingLeft: "60px",
      paddingRight: "60px",
    }}
  >
    <div
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "12px",
        display: "flex",
        width: "100%",
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          paddingLeft: "12px",
          paddingRight: "12px",
          paddingTop: "8px",
          paddingBottom: "8px",
          background: "rgba(21, 21, 21, 0.08)",
          borderRadius: "2px",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: "10px",
          display: "flex",
        }}
      >
        <div
          style={{
            color: "#151515",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
            fontWeight: "500",
            lineHeight: "14px",
            textTransform: "uppercase",
          }}
        >
          KRETYA STUDIO
        </div>
      </div>
      <div style={{ flex: 1 }}></div>
      <div
        style={{
          paddingLeft: "12px",
          paddingRight: "12px",
          paddingTop: "8px",
          paddingBottom: "8px",
          background: "rgba(21, 21, 21, 0.08)",
          borderRadius: "2px",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: "10px",
          display: "flex",
        }}
      >
        <div
          style={{
            color: "#151515",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
            fontWeight: "500",
            lineHeight: "14px",
            textTransform: "uppercase",
          }}
        >
          Service Level Agreement
        </div>
      </div>
    </div>
  </div>
)

const PageFooter = ({ pageNum }: { pageNum: number }) => (
  <div
    style={{
      alignSelf: "stretch",
      height: "56px",
      flexShrink: 0,
      background: "white",
      justifyContent: "flex-end",
      alignItems: "center",
      display: "flex",
      paddingLeft: "60px",
      paddingRight: "60px",
    }}
  >
    <div
      style={{
        color: "rgba(21, 21, 21, 0.50)",
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
        fontWeight: "500",
        lineHeight: "18px",
        letterSpacing: "0.12px",
      }}
    >
      {pageNum}
    </div>
  </div>
)

const NumberedSection = ({ num, title }: { num: string; title: string }) => (
  <div
    style={{
      alignSelf: "stretch",
      overflow: "hidden",
      borderRadius: "2px",
      borderBottom: "1px rgba(0, 0, 0, 0.10) solid",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      display: "flex",
      marginBottom: "12px",
    }}
  >
    <div
      style={{
        width: "50px",
        paddingLeft: "12px",
        paddingRight: "12px",
        paddingTop: "8px",
        paddingBottom: "8px",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "8px",
        display: "flex",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "#151515",
          fontSize: "16px",
          fontFamily: "Inter, sans-serif",
          fontWeight: "500",
          lineHeight: "24px",
        }}
      >
        {num}
      </div>
    </div>
    <div
      style={{
        flex: "1 1 0",
        paddingLeft: "12px",
        paddingRight: "12px",
        paddingTop: "8px",
        paddingBottom: "8px",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "8px",
        display: "flex",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "#151515",
          fontSize: "16px",
          fontFamily: "Inter, sans-serif",
          fontWeight: "500",
          lineHeight: "24px",
        }}
      >
        {title}
      </div>
    </div>
  </div>
)

const SubSection = ({ num, text }: { num: string; text: string }) => (
  <div
    style={{
      alignSelf: "stretch",
      paddingLeft: "50px",
      overflow: "hidden",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      display: "flex",
      marginBottom: "8px",
    }}
  >
    <div
      style={{
        width: "50px",
        alignSelf: "stretch",
        paddingLeft: "12px",
        paddingRight: "12px",
        paddingTop: "6px",
        paddingBottom: "6px",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        gap: "8px",
        display: "flex",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "black",
          fontSize: "16px",
          fontFamily: "Inter, sans-serif",
          fontWeight: "450",
          lineHeight: "24px",
        }}
      >
        {num}
      </div>
    </div>
    <div
      style={{
        flex: "1 1 0",
        alignSelf: "stretch",
        paddingLeft: "12px",
        paddingRight: "12px",
        paddingTop: "6px",
        paddingBottom: "6px",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "8px",
        display: "flex",
      }}
    >
      <div
        style={{
          flex: "1 1 0",
          color: "black",
          fontSize: "16px",
          fontFamily: "Inter, sans-serif",
          fontWeight: "450",
          lineHeight: "24px",
        }}
      >
        {text}
      </div>
    </div>
  </div>
)

type TableRowProps = {
  c1: string | number
  c2: string | number
  c3: string | number
  c4: string | number
  bg?: string
  c1Color?: string
  c2Color?: string
  c3Color?: string
  c4Color?: string
  fontWeight?: string
}

const TableRow = ({
  c1,
  c2,
  c3,
  c4,
  bg = "white",
  c1Color,
  c2Color,
  c3Color,
  c4Color,
  fontWeight = "450",
}: TableRowProps) => (
  <div
    style={{
      alignSelf: "stretch",
      background: bg,
      justifyContent: "flex-start",
      alignItems: "flex-start",
      display: "flex",
      flex: "0 1 auto",
    }}
  >
    <div
      style={{
        width: "50px",
        paddingLeft: "12px",
        paddingRight: "12px",
        paddingTop: "3px",
        paddingBottom: "3px",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "8px",
        display: "flex",
      }}
    >
      <div
        style={{
          flex: "1 1 0",
          textAlign: "center",
          color: c1Color || "#151515",
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
          fontWeight: fontWeight,
          lineHeight: "20.80px",
        }}
      >
        {c1}
      </div>
    </div>
    <div
      style={{
        width: "210px",
        paddingLeft: "12px",
        paddingRight: "12px",
        paddingTop: "3px",
        paddingBottom: "3px",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        gap: "8px",
        display: "flex",
        wordBreak: "break-word",
      }}
    >
      <div
        style={{
          flex: "1 1 0",
          color: c2Color || "#151515",
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
          fontWeight: fontWeight,
          lineHeight: "20.80px",
        }}
      >
        {c2}
      </div>
    </div>
    <div
      style={{
        flex: "1 1 0",
        paddingLeft: "12px",
        paddingRight: "12px",
        paddingTop: "3px",
        paddingBottom: "3px",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "8px",
        display: "flex",
      }}
    >
      <div
        style={{
          flex: "1 1 0",
          color: c3Color || "#151515",
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
          fontWeight: fontWeight,
          lineHeight: "20.80px",
        }}
      >
        {c3}
      </div>
    </div>
    <div
      style={{
        width: "269px",
        paddingLeft: "12px",
        paddingRight: "12px",
        paddingTop: "3px",
        paddingBottom: "3px",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "8px",
        display: "flex",
      }}
    >
      <div
        style={{
          flex: "1 1 0",
          color: c4Color || "#151515",
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
          fontWeight: fontWeight,
          lineHeight: "20.80px",
        }}
      >
        {c4}
      </div>
    </div>
  </div>
)

const CoverPageContainer = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{ width: `${A4_WIDTH}px`, height: `${A4_HEIGHT}px` }}
    className="relative mx-auto flex flex-col overflow-hidden bg-[#151515] text-white shadow-xl"
  >
    {children}
  </div>
)

const StandardPageContainer = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: `${A4_WIDTH}px`,
      height: `${A4_HEIGHT}px`,
      minHeight: `${A4_HEIGHT}px`,
      maxHeight: `${A4_HEIGHT}px`,
    }}
    className="shadow-sm-border relative mx-auto flex flex-col overflow-hidden rounded-sm bg-white text-black print:border-0 print:shadow-none"
  >
    {children}
  </div>
)

// --- MAIN COMPONENT ---

export const SLADocumentPreview = React.forwardRef<
  HTMLDivElement,
  SLADocumentPreviewProps
>(({ clientInfo, agencyInfo, scopeOfWork, milestones, className }, ref) => {
  const [pageNum, setPageNum] = useState(1)
  const [scale, setScale] = useState(1)
  const [pages, setPages] = useState<React.ReactNode[][]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // --- RESPONSIVE SCALING LOGIC ---
  useEffect(() => {
    const handleResize = () => {
      // Access containerRef directly from local ref, or forward if possible.
      // Since ref is forwarded and typing is tricky, we use a local ref for sizing
      // and attach it to the parent wrapper.
      // Actually, we can just use the forwarded ref if it's a function or object,
      // but safe bet is to use innerRef for logic.
      // We'll use a local ref for the logic wrapper.
      if (containerRef.current) {
        const margin = 40 // Padding around the document
        const targetWidth = A4_WIDTH
        const availableWidth = containerRef.current.offsetWidth - margin
        const newScale = Math.min(availableWidth / targetWidth, 1)
        setScale(newScale)
      }
    }

    handleResize()
    const observer = new ResizeObserver(handleResize)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      observer.disconnect()
    }
  }, [])

  // --- PAGINATION ENGINE ---
  useEffect(() => {
    // Helper function to estimate text height based on content
    const estimateTextHeight = (
      text: string,
      columnWidth: number,
      fontSize = 13,
      lineHeight = 20.8,
    ) => {
      if (!text) return lineHeight

      // Rough estimate: average character width is ~0.6 * fontSize
      const avgCharWidth = fontSize * 0.6
      const charsPerLine = Math.floor((columnWidth - 24) / avgCharWidth) // -24 for padding
      const numLines = Math.ceil(text.length / charsPerLine)

      return numLines * lineHeight + 6 // +6 for padding top/bottom
    }

    const generatePages = () => {
      const generatedPages: React.ReactNode[][] = []
      let currentPageContent: React.ReactNode[] = []
      let currentHeight = 0

      // Helper to add content to current page or start new one
      const addToPage = (component: React.ReactNode, height: number) => {
        if (currentHeight + height > CONTENT_HEIGHT) {
          generatedPages.push(currentPageContent)
          currentPageContent = [component]
          currentHeight = height
        } else {
          currentPageContent.push(component)
          currentHeight += height
        }
      }

      // 1. PAGE & FLOW DESIGN (SOW TABLE)
      currentPageContent.push(
        <div key="sow-header">
          <NumberedSection num="1." title="Page & Flow Design" />
          <TableRow
            c1="No"
            c2="Category"
            c3="Page Name/Flow"
            c4="Description"
            bg="rgba(0, 0, 0, 0.05)"
          />
        </div>,
      )
      currentHeight += HEIGHTS.SECTION_TITLE + HEIGHTS.TABLE_HEADER

      scopeOfWork.forEach((row, idx) => {
        // Calculate dynamic row height based on content
        const descHeight = estimateTextHeight(row.desc, 210) // Description column width
        const categoryHeight = estimateTextHeight(row.category, 210) // Category column width
        const flowHeight = estimateTextHeight(row.flow, 300) // Flow column (flexible)
        const rowHeight = Math.max(
          descHeight,
          categoryHeight,
          flowHeight,
          HEIGHTS.TABLE_ROW,
        )

        const rowComponent = (
          <TableRow
            key={`sow-${idx}`}
            c1={row.no}
            c2={row.category}
            c3={row.flow}
            c4={row.desc}
            bg={idx % 2 === 0 ? "white" : "#F9F9F9"}
          />
        )

        // Check if row fits using dynamic height
        if (currentHeight + rowHeight > CONTENT_HEIGHT) {
          // Push current page
          generatedPages.push(currentPageContent)
          // Start new page with Table Header
          currentPageContent = [
            <div key={`sow-header-cont-${idx}`}>
              <TableRow
                c1="No"
                c2="Category"
                c3="Page Name/Flow"
                c4="Description"
                bg="rgba(0, 0, 0, 0.05)"
              />
            </div>,
            rowComponent,
          ]
          currentHeight = HEIGHTS.TABLE_HEADER + rowHeight
        } else {
          currentPageContent.push(rowComponent)
          currentHeight += rowHeight
        }
      })

      // Add Note after table
      addToPage(
        <div
          key="sow-note"
          style={{
            alignSelf: "stretch",
            overflow: "hidden",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            display: "flex",
            marginTop: "10px",
          }}
        >
          <div
            style={{
              flex: "1 1 0",
              alignSelf: "stretch",
              paddingLeft: "12px",
              paddingRight: "12px",
              paddingTop: "6px",
              paddingBottom: "6px",
              background: "#FFEAEA",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: "8px",
              display: "flex",
            }}
          >
            <div
              style={{
                flex: "1 1 0",
                color: "#F00202",
                fontSize: "16px",
                fontFamily: "Inter, sans-serif",
                fontWeight: "450",
                lineHeight: "24px",
              }}
            >
              Note: This does not include negative cases
            </div>
          </div>
        </div>,
        HEIGHTS.NOTE_BOX,
      )

      // 2. INTRO & DEFINITIONS
      const introText =
        "Kretya Studio will provide creative design and UI/UX development services according to the brief provided by the client. The purpose of this SLA is to establish service standards, timelines, and responsibilities of both parties during the project."
      const introTextHeight = estimateTextHeight(introText, 900)
      addToPage(
        <div
          key="intro-section"
          style={{
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            display: "flex",
            marginTop: "8px",
          }}
        >
          <NumberedSection num="2." title="Introduction & Definitions" />
          <SubSection num="2.1" text={introText} />
        </div>,
        HEIGHTS.SECTION_TITLE + introTextHeight + 20,
      )

      // 3. SCOPE OF WORK TEXT
      const sow31 =
        "Kretya Studio will organize the project into several milestones to ensure measurable progress and directed approval from the client."
      const sow32 =
        "Any major changes after the milestone is approved will shift the project timeline. Kretya Studio will reschedule based on team availability and the urgency of the requested changes."
      const sow33 =
        "Kretya studio will prioritize the desktop features and finalize every desktop screens first before moving into the mobile responsive view. Once the desktop is finalized and move into mobile responsive, there are no further addition to the desktop."
      const sow34 =
        "If there are change requests outside the initial scope after the project has begun, those changes will be addressed in a new SLA."

      const sowTextHeight =
        estimateTextHeight(sow31, 900) +
        estimateTextHeight(sow32, 900) +
        estimateTextHeight(sow33, 900) +
        estimateTextHeight(sow34, 900)

      addToPage(
        <div
          key="sow-text-section"
          style={{
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            display: "flex",
            marginTop: "8px",
          }}
        >
          <NumberedSection num="3." title="Scope of Work (SOW)" />
          <SubSection num="3.1." text={sow31} />
          <SubSection num="3.2." text={sow32} />
          <SubSection num="3.3." text={sow33} />
          <SubSection num="3.4." text={sow34} />
        </div>,
        HEIGHTS.SECTION_TITLE + sowTextHeight + 40,
      )

      // 3.5 MILESTONES
      addToPage(
        <div key="milestones-header">
          <SubSection num="3.5." text="Milestones typically include:" />
        </div>,
        HEIGHTS.SUB_SECTION,
      )

      // Helper for Render Milestone
      const renderMilestoneTable = (
        mKey: string,
        title: string,
        items: MilestoneItem[],
      ) => {
        let tableContentHeight = HEIGHTS.TABLE_HEADER

        items.forEach((item) => {
          const descHeight = estimateTextHeight(item.desc, 300)
          const categoryHeight = estimateTextHeight(item.category, 210)
          const timeHeight = estimateTextHeight(item.time, 269)
          const rowHeight = Math.max(
            descHeight,
            categoryHeight,
            timeHeight,
            HEIGHTS.TABLE_ROW,
          )
          tableContentHeight += rowHeight
        })

        tableContentHeight += HEIGHTS.TABLE_ROW + 10
        const titleHeight = estimateTextHeight(title, 800)
        const titleSectionHeight = titleHeight + 50 + 30
        const tableHeight = titleSectionHeight + tableContentHeight

        const totalDays = items.reduce((sum, item) => {
          const days = parseInt(item.time) || 0
          return sum + days
        }, 0)

        const content = (
          <div
            key={`milestone-${mKey}`}
            style={{
              alignSelf: "stretch",
              paddingLeft: "100px",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              display: "flex",
            }}
          >
            <div
              style={{
                width: "50px",
                alignSelf: "stretch",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "6px",
                paddingBottom: "6px",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: "8px",
                display: "flex",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  color: "black",
                  fontSize: "16px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: "450",
                  lineHeight: "24px",
                }}
              >
                {mKey === "m1" ? "3.5.1." : mKey === "m2" ? "3.5.2." : "3.5.3."}
              </div>
            </div>
            <div
              style={{
                flex: "1 1 0",
                alignSelf: "stretch",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "6px",
                paddingBottom: "6px",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: "8px",
                display: "flex",
              }}
            >
              <div
                style={{
                  alignSelf: "stretch",
                  color: "black",
                  fontSize: "16px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: "500",
                  lineHeight: "24px",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  alignSelf: "stretch",
                  color: "black",
                  fontSize: "16px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: "500",
                  lineHeight: "24px",
                }}
              >
                Deliverables:
              </div>
              <div
                style={{
                  alignSelf: "stretch",
                  background: "white",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    alignSelf: "stretch",
                    background: "rgba(0, 0, 0, 0.05)",
                    overflow: "hidden",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: "50px",
                      padding: "3px 12px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        flex: "1",
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: "450",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      No
                    </div>
                  </div>
                  <div
                    style={{
                      width: "210px",
                      padding: "3px 12px",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        flex: "1",
                        fontSize: "13px",
                        fontWeight: "450",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Category
                    </div>
                  </div>
                  <div
                    style={{ flex: "1", padding: "3px 12px", display: "flex" }}
                  >
                    <div
                      style={{
                        flex: "1",
                        fontSize: "13px",
                        fontWeight: "450",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Deliverables
                    </div>
                  </div>
                  <div
                    style={{
                      width: "269px",
                      padding: "3px 12px",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        flex: "1",
                        fontSize: "13px",
                        fontWeight: "450",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Timeline Design
                    </div>
                  </div>
                </div>
                {items.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: "stretch",
                      background: i % 2 === 0 ? "white" : "#F9F9F9",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      display: "flex",
                      flex: "0 1 auto",
                    }}
                  >
                    <div
                      style={{
                        width: "50px",
                        padding: "3px 12px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          flex: "1",
                          textAlign: "center",
                          fontSize: "13px",
                        }}
                      >
                        {m.no}
                      </div>
                    </div>
                    <div
                      style={{
                        width: "210px",
                        padding: "3px 12px",
                        display: "flex",
                        wordBreak: "break-word",
                      }}
                    >
                      <div style={{ flex: "1", fontSize: "13px" }}>
                        {m.category}
                      </div>
                    </div>
                    <div
                      style={{
                        flex: "1",
                        padding: "3px 12px",
                        display: "flex",
                        wordBreak: "break-word",
                      }}
                    >
                      <div
                        style={{
                          flex: "1",
                          fontSize: "13px",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {m.desc}
                      </div>
                    </div>
                    <div
                      style={{
                        width: "269px",
                        padding: "3px 12px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: "1", fontSize: "13px" }}>
                        {m.time}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Total Timeline Footer */}
                <div
                  style={{
                    alignSelf: "stretch",
                    background: "#151515",
                    overflow: "hidden",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: "50px",
                      padding: "6px 12px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        flex: "1",
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    ></div>
                  </div>
                  <div
                    style={{
                      width: "210px",
                      padding: "6px 12px",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        flex: "1",
                        fontSize: "13px",
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: "500",
                      }}
                    >
                      Total Timeline
                    </div>
                  </div>
                  <div
                    style={{ flex: "1", padding: "6px 12px", display: "flex" }}
                  >
                    <div style={{ flex: "1", fontSize: "13px" }}></div>
                  </div>
                  <div
                    style={{
                      width: "269px",
                      padding: "6px 12px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        flex: "1",
                        fontSize: "13px",
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: "500",
                      }}
                    >
                      {totalDays} Days
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

        if (currentHeight + titleSectionHeight + 100 > CONTENT_HEIGHT) {
          const fillerHeight = CONTENT_HEIGHT - currentHeight + 1
          addToPage(<div style={{ height: fillerHeight }} />, fillerHeight)
        }

        addToPage(content, tableHeight)
      }

      if (milestones.m1?.length)
        renderMilestoneTable(
          "m1",
          "Milestone 1: Style Guide Development & Initial Wireframes",
          milestones.m1,
        )
      if (milestones.m2?.length)
        renderMilestoneTable(
          "m2",
          "Milestone 2: High-Fidelity (Hi-Fi) UI Design",
          milestones.m2,
        )
      if (milestones.m3?.length)
        renderMilestoneTable(
          "m3",
          "Milestone 3: Prototype Development & Final Adjustments",
          milestones.m3,
        )

      // 4. APPROVAL PROCESS
      addToPage(
        <div key="approval-section" style={{ marginTop: "8px" }}>
          <NumberedSection num="4." title="Approval Process" />
          <SubSection
            num="4.1."
            text="The client must provide feedback and approval within a maximum of 3 business days after the deliverables are received."
          />
          <SubSection
            num="4.2."
            text="If the client is late in providing approval for more than 7 business days, Kretya Studio reserves the right to adjust timeline."
          />
        </div>,
        HEIGHTS.SECTION_TITLE + HEIGHTS.SUB_SECTION * 2 + 20,
      )

      // 5. FEEDBACK
      addToPage(
        <div key="feedback-section" style={{ marginTop: "8px" }}>
          <NumberedSection num="5." title="Feedback Requirements" />
          <SubSection
            num="5.1."
            text="Client feedback must be specific and directed."
          />
          <SubSection
            num="5.2."
            text="Kretya Studio provides centralized feedback tools, such as Figma or Notion."
          />
        </div>,
        HEIGHTS.SECTION_TITLE + HEIGHTS.SUB_SECTION * 2 + 20,
      )

      // 6. REVISIONS
      addToPage(
        <div key="revisions-section" style={{ marginTop: "8px" }}>
          <NumberedSection num="6." title="Revisions" />
          <SubSection
            num="6.1."
            text="Kretya Studio provides a maximum of 2 revisions per milestone."
          />
          <SubSection
            num="6.2."
            text="Minor revisions are unlimited. Major revisions are limited to 2 times per milestone."
          />
        </div>,
        HEIGHTS.SECTION_TITLE + HEIGHTS.SUB_SECTION * 2 + 20,
      )

      // 7. STYLE GUIDE LOCK
      addToPage(
        <div key="style-section" style={{ marginTop: "8px" }}>
          <NumberedSection num="7." title="Style Guide Lock" />
          <SubSection
            num="7.1."
            text="The style guide must be approved at Milestone 1."
          />
        </div>,
        HEIGHTS.SECTION_TITLE + HEIGHTS.SUB_SECTION + 20,
      )

      // SIGNATURES
      addToPage(
        <div
          key="signatures"
          style={{
            alignSelf: "stretch",
            flex: "1 1 0",
            paddingLeft: "120px",
            paddingRight: "120px",
            paddingBottom: "56px",
            justifyContent: "space-between",
            alignItems: "flex-end",
            display: "flex",
            marginTop: "60px",
            minHeight: "150px",
          }}
        >
          <div
            style={{
              width: "280px",
              paddingTop: "12px",
              paddingBottom: "12px",
              borderTop: "1px rgba(0, 0, 0, 0.10) solid",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              display: "flex",
            }}
          >
            <div
              style={{
                alignSelf: "stretch",
                textAlign: "center",
                color: "#151515",
                fontSize: "16px",
                fontFamily: "Inter, sans-serif",
                fontWeight: "500",
                lineHeight: "25.60px",
              }}
            >
              {clientInfo.name}
            </div>
            <div
              style={{
                justifyContent: "flex-start",
                alignItems: "flex-start",
                display: "flex",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  color: "#151515",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: "500",
                  lineHeight: "22.40px",
                }}
              >
                {clientInfo.company || "Client Company"}
              </div>
            </div>
          </div>
          <div
            style={{
              width: "280px",
              paddingTop: "12px",
              paddingBottom: "12px",
              position: "relative",
              borderTop: "1px rgba(0, 0, 0, 0.10) solid",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              display: "flex",
            }}
          >
            {/* <img src="/Tanda tangan.png" alt="Signature" style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', width: '66px', height: 'auto' }} /> */}
            <div
              style={{
                alignSelf: "stretch",
                textAlign: "center",
                color: "#151515",
                fontSize: "16px",
                fontFamily: "Inter, sans-serif",
                fontWeight: "500",
                lineHeight: "25.60px",
              }}
            >
              {agencyInfo.repName}
            </div>
            <div
              style={{
                justifyContent: "flex-start",
                alignItems: "flex-start",
                display: "flex",
              }}
            >
              <div
                style={{
                  opacity: "0.80",
                  textAlign: "center",
                  color: "#151515",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: "450",
                  lineHeight: "22.40px",
                }}
              >
                {agencyInfo.repTitle}
              </div>
            </div>
          </div>
        </div>,
        HEIGHTS.SIGNATURES,
      )

      if (currentPageContent.length > 0) {
        generatedPages.push(currentPageContent)
      }

      setPages(generatedPages)
    }

    generatePages()
  }, [scopeOfWork, milestones, clientInfo, agencyInfo])

  // --- NAVIGATION HANDLERS ---
  const nextPage = () => {
    if (pageNum < pages.length + 1) setPageNum(pageNum + 1)
  }

  const prevPage = () => {
    if (pageNum > 1) setPageNum(pageNum - 1)
  }

  return (
    <div
      ref={containerRef}
      className={`flex w-full flex-col items-center px-2 antialiased ${className || ""}`}
    >
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: 1103.08px 1561px;
            margin: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print-all-pages {
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-page {
            display: flex !important;
            flex-direction: column !important;
            width: 1103.08px !important;
            height: 1561px !important;
            min-height: 1561px !important;
            max-height: 1561px !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            position: relative !important;
          }

          .print-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          /* Hide Next.js dev indicators */
          nextjs-portal {
            display: none !important;
          }
        }
      `}</style>

      {/* --- TOP NAVIGATION --- */}
      <div className="bg-surface/80 shadow-sm-border z-50 mb-4 flex items-center gap-4 rounded-full px-2 py-2 backdrop-blur-md print:hidden">
        <Button
          variant="ghost"
          onClick={prevPage}
          disabled={pageNum === 1}
          className="h-8 w-8 rounded-full p-0"
        >
          <RiArrowLeftSLine size={16} />
        </Button>

        <span className="text-tremor-content text-body-sm min-w-[60px] text-center tabular-nums">
          {pageNum} <span className="text-tremor-content-subtle">/</span>{" "}
          {pages.length + 1}
        </span>

        <Button
          variant="ghost"
          onClick={nextPage}
          disabled={pageNum === pages.length + 1}
          className="h-8 w-8 rounded-full p-0"
        >
          <RiArrowRightSLine size={16} />
        </Button>
      </div>

      {/* --- SCALABLE VIEWPORT --- */}
      <div
        ref={ref}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center top",
          height: `${A4_HEIGHT}px`,
          marginBottom: `-${(1 - scale) * A4_HEIGHT}px`,
        }}
        className="print-all-pages transition-transform duration-300 ease-out print:transform-none"
      >
        {/* --- PAGE 1 (COVER) --- */}
        <div
          className={`print-page ${pageNum === 1 ? "active" : ""}`}
          style={{ display: pageNum === 1 ? "flex" : "none" }}
        >
          <CoverPageContainer>
            {/* Top Section */}
            <div
              style={{
                alignSelf: "stretch",
                flex: "1 1 0",
                padding: "60px",
                background: "#151515",
                overflow: "hidden",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-start",
                display: "flex",
              }}
            >
              {/* Logo Container - Placeholder */}
              <div
                style={{
                  height: "40px",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div className="text-display-xxs text-white">
                  KRETYA STUDIO
                </div>
              </div>

              {/* Title & Desc */}
              <div
                style={{
                  alignSelf: "stretch",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  gap: "24px",
                  display: "flex",
                }}
              >
                <div style={{ alignSelf: "stretch" }}>
                  <span
                    style={{
                      color: "white",
                      fontSize: "90px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "500",
                      lineHeight: "99px",
                      wordWrap: "break-word",
                      display: "block",
                    }}
                  >
                    Service Level{" "}
                  </span>
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.50)",
                      fontSize: "90px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "500",
                      lineHeight: "99px",
                      wordWrap: "break-word",
                      display: "block",
                    }}
                  >
                    Agreement
                  </span>
                </div>
                <div
                  style={{
                    width: "591px",
                    color: "white",
                    fontSize: "20px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: "450",
                    lineHeight: "32px",
                    wordWrap: "break-word",
                  }}
                >
                  Kretya Studio is committed to managing projects through a
                  structured series of milestones, ensuring measurable progress
                  and obtaining client approval systematically.
                </div>
              </div>
            </div>

            {/* Middle Section (Data) */}
            <div
              style={{
                alignSelf: "stretch",
                background: "#151515",
                borderTop: "0.54px rgba(255, 255, 255, 0.10) solid",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                display: "flex",
              }}
            >
              {/* Agency Column */}
              <div
                style={{
                  flex: "1 1 0",
                  alignSelf: "stretch",
                  paddingTop: "60px",
                  paddingBottom: "60px",
                  paddingLeft: "60px",
                  paddingRight: "40px",
                  background: "rgba(255, 255, 255, 0.08)",
                  overflow: "hidden",
                  borderRight: "0.54px rgba(255, 255, 255, 0.10) solid",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  gap: "60px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    alignSelf: "stretch",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: "4px",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "8px",
                      paddingBottom: "8px",
                      background: "rgba(255, 255, 255, 0.10)",
                      borderRadius: "2px",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: "10px",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        color: "white",
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: "500",
                        lineHeight: "12px",
                        textTransform: "uppercase",
                      }}
                    >
                      UI/UX Creative Agency{" "}
                    </div>
                  </div>
                  <div
                    style={{
                      color: "white",
                      fontSize: "24px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "500",
                      lineHeight: "38.4px",
                    }}
                  >
                    {agencyInfo.name}
                  </div>
                  <div
                    style={{
                      alignSelf: "stretch",
                      color: "#E0E0E0",
                      fontSize: "16px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "450",
                      lineHeight: "24px",
                      letterSpacing: "0.16px",
                    }}
                  >
                    {agencyInfo.email}
                  </div>
                </div>
                <div
                  style={{
                    alignSelf: "stretch",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      alignSelf: "stretch",
                      color: "#E0E0E0",
                      fontSize: "16px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "500",
                      lineHeight: "24px",
                      letterSpacing: "0.16px",
                    }}
                  >
                    {agencyInfo.address}
                  </div>
                </div>
              </div>

              {/* Client Column */}
              <div
                style={{
                  flex: "1 1 0",
                  alignSelf: "stretch",
                  paddingTop: "60px",
                  paddingBottom: "60px",
                  paddingLeft: "60px",
                  paddingRight: "40px",
                  background: "rgba(255, 255, 255, 0.08)",
                  overflow: "hidden",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  gap: "60px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    alignSelf: "stretch",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: "4px",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "8px",
                      paddingBottom: "8px",
                      background: "rgba(255, 255, 255, 0.10)",
                      borderRadius: "2px",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: "10px",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        color: "white",
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: "500",
                        lineHeight: "12px",
                        textTransform: "uppercase",
                      }}
                    >
                      Client
                    </div>
                  </div>
                  <div
                    style={{
                      color: "white",
                      fontSize: "20px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "500",
                      lineHeight: "32px",
                    }}
                  >
                    {clientInfo.name}{" "}
                  </div>
                  <div
                    style={{
                      color: "#E0E0E0",
                      fontSize: "14px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "450",
                      lineHeight: "21px",
                      letterSpacing: "0.14px",
                    }}
                  >
                    {clientInfo.email}
                  </div>
                </div>
                <div
                  style={{
                    alignSelf: "stretch",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      alignSelf: "stretch",
                      color: "#E0E0E0",
                      fontSize: "14px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "500",
                      lineHeight: "21px",
                      letterSpacing: "0.14px",
                    }}
                  >
                    {clientInfo.address}
                  </div>
                </div>
              </div>

              {/* SLA Info Column */}
              <div
                style={{
                  width: "282px",
                  alignSelf: "stretch",
                  paddingLeft: "40px",
                  paddingRight: "40px",
                  paddingTop: "60px",
                  paddingBottom: "60px",
                  overflow: "hidden",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    alignSelf: "stretch",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: "8px",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      color: "white",
                      fontSize: "16px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "500",
                      lineHeight: "25.6px",
                    }}
                  >
                    SLA Created:
                  </div>
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "8px",
                      paddingBottom: "8px",
                      background: "rgba(255, 255, 255, 0.10)",
                      borderRadius: "2px",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: "10px",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        color: "white",
                        fontSize: "14px",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: "500",
                        lineHeight: "14px",
                      }}
                    >
                      {clientInfo.date}{" "}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    alignSelf: "stretch",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      alignSelf: "stretch",
                      color: "#E0E0E0",
                      fontSize: "14px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "450",
                      lineHeight: "21px",
                      letterSpacing: "0.14px",
                    }}
                  >
                    {clientInfo.name}{" "}
                  </div>
                  <div
                    style={{
                      alignSelf: "stretch",
                      color: "#E0E0E0",
                      fontSize: "14px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "500",
                      lineHeight: "21px",
                      letterSpacing: "0.14px",
                    }}
                  >
                    {agencyInfo.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Blue Bar */}
            <div
              style={{
                alignSelf: "stretch",
                height: "10px",
                background: BRAND_BLUE,
              }}
            ></div>
          </CoverPageContainer>
        </div>

        {/* --- DYNAMIC PAGES --- */}
        {pages.map((content, idx) => {
          const pageIndex = idx + 2
          return (
            <div
              key={idx}
              className={`print-page ${pageNum === pageIndex ? "active" : ""}`}
              style={{ display: pageNum === pageIndex ? "flex" : "none" }}
            >
              <StandardPageContainer>
                <InternalPageHeader />
                <InternalPageLabel />
                <div
                  style={{
                    alignSelf: "stretch",
                    flex: "0 1 auto",
                    minHeight: "1393px",
                    maxHeight: "1393px",
                    paddingTop: "12px",
                    paddingBottom: "40px",
                    paddingLeft: "60px",
                    paddingRight: "60px",
                    background: "white",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "stretch",
                    gap: "8px",
                    display: "flex",
                  }}
                >
                  {content.map((child, i) => (
                    <React.Fragment key={i}>{child}</React.Fragment>
                  ))}
                </div>
                <PageFooter pageNum={pageIndex} />
              </StandardPageContainer>
            </div>
          )
        })}
      </div>
    </div>
  )
})

SLADocumentPreview.displayName = "SLADocumentPreview"

export default SLADocumentPreview
