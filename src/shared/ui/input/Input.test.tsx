import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { TextInput } from "./TextInput"

describe("TextInput", () => {
  it("renders correctly", () => {
    render(<TextInput placeholder="Enter name" />)
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument()
  })

  it("handles user input", async () => {
    render(<TextInput placeholder="Type here" />)
    const input = screen.getByPlaceholderText("Type here")
    await userEvent.type(input, "Hello World")
    expect(input).toHaveValue("Hello World")
  })

  it("shows error state", () => {
    render(<TextInput error placeholder="Error input" />)
    const input = screen.getByPlaceholderText("Error input")
    expect(input).toHaveClass("shadow-input-error")
  })

  it("handles password visibility toggle", async () => {
    render(<TextInput type="password" placeholder="Password" />)
    const input = screen.getByPlaceholderText("Password")
    expect(input).toHaveAttribute("type", "password")

    const toggleButton = screen.getByRole("button")
    await userEvent.click(toggleButton)

    expect(input).toHaveAttribute("type", "text")
  })
})
