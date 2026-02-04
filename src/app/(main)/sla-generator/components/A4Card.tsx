import React from "react"

/**
 * A4Card Component
 *
 * Ukuran A4 standar:
 * - Physical: 210mm x 297mm
 * - Digital (96 DPI): 794px x 1123px
 * - Digital (72 DPI): 595px x 842px
 *
 * Component ini menggunakan 794px x 1123px untuk tampilan web
 * dengan padding default 40px (sekitar 14mm) di semua sisi
 */

export interface A4CardProps {
  children: React.ReactNode
  className?: string
  padding?: string
  orientation?: "portrait" | "landscape"
  showBorder?: boolean
  backgroundColor?: string
  shadow?: boolean
}

export const A4Card = ({
  children,
  className = "",
  padding = "40px",
  orientation = "portrait", // 'portrait' or 'landscape'
  showBorder = true,
  backgroundColor = "white",
  shadow = true,
}: A4CardProps) => {
  // Ukuran A4 dalam pixel (96 DPI)
  const dimensions =
    orientation === "portrait"
      ? { width: "794px", height: "1123px" }
      : { width: "1123px", height: "794px" }

  return (
    <div
      className={`a4-card ${className} rounded-none ${shadow ? "shadow-sm-border" : ""} bg-surface`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: backgroundColor,
        margin: "0 auto",
        padding: 0,
        border: showBorder ? "1px solid #e2e8f0" : "none",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div style={{ padding: padding, width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  )
}

export const A4CardContainer = ({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={`a4-card-container bg-tremor-background-muted flex min-h-screen flex-col items-center gap-8 px-4 py-8 ${className}`}
    >
      {children}
    </div>
  )
}

export default A4Card
