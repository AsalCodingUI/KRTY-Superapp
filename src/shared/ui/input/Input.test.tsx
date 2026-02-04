import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { Input } from "./Input"

describe("Input", () => {
  it("renders correctly", () => {
    render(<Input placeholder="Enter name" />)
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument()
  })

  it("handles user input", async () => {
    render(<Input placeholder="Type here" />)
    const input = screen.getByPlaceholderText("Type here")
    await userEvent.type(input, "Hello World")
    expect(input).toHaveValue("Hello World")
  })

  it("shows error state", () => {
    render(<Input hasError placeholder="Error input" />)
    const input = screen.getByPlaceholderText("Error input")
    // Check for error class (simplified check based on tv config)
    expect(input).toHaveClass("border-danger")
  })

  it("handles password visibility toggle", async () => {
    render(<Input type="password" placeholder="Password" />)
    const input = screen.getByPlaceholderText("Password")
    expect(input).toHaveAttribute("type", "password")

    const toggleButton = screen.getByRole("button", { name: /show password/i })
    await userEvent.click(toggleButton)

    expect(input).toHaveAttribute("type", "text")
  })
})
