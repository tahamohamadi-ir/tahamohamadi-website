import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContactForm } from "./ContactForm";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ContactForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: CSRF GET returns OK
        mockFetch.mockResolvedValue(new Response(JSON.stringify({ csrf: "cookie-set" }), { status: 200 }));
    });

    it("renders all form fields with English labels", () => {
        render(<ContactForm locale="en" />);

        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
    });

    it("renders all form fields with Persian labels", () => {
        render(<ContactForm locale="fa" />);

        expect(screen.getByLabelText(/نام/)).toBeInTheDocument();
        expect(screen.getByLabelText(/ایمیل/)).toBeInTheDocument();
        expect(screen.getByLabelText(/موضوع/)).toBeInTheDocument();
        expect(screen.getByLabelText(/پیام/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /ارسال پیام/ })).toBeInTheDocument();
    });

    it("shows validation errors for empty required fields", async () => {
        const user = userEvent.setup();
        render(<ContactForm locale="en" />);

        await user.click(screen.getByRole("button", { name: /send message/i }));

        await waitFor(() => {
            const errorMessages = screen.getAllByText("This field is required.");
            expect(errorMessages.length).toBe(4); // name, email, subject, message
        });
    });

    it("shows email validation error for invalid email", async () => {
        const user = userEvent.setup();
        render(<ContactForm locale="en" />);

        await user.type(screen.getByLabelText(/name/i), "John Doe");
        await user.type(screen.getByLabelText(/email/i), "not-an-email");
        await user.type(screen.getByLabelText(/subject/i), "Test Subject");
        await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");
        await user.click(screen.getByRole("button", { name: /send message/i }));

        await waitFor(() => {
            expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
        });
    });

    it("shows minimum length error for short message", async () => {
        const user = userEvent.setup();
        render(<ContactForm locale="en" />);

        await user.type(screen.getByLabelText(/name/i), "John Doe");
        await user.type(screen.getByLabelText(/email/i), "john@example.com");
        await user.type(screen.getByLabelText(/subject/i), "Hi");
        await user.type(screen.getByLabelText(/message/i), "Short");
        await user.click(screen.getByRole("button", { name: /send message/i }));

        await waitFor(() => {
            expect(screen.getByText("Message must be at least 10 characters.")).toBeInTheDocument();
        });
    });

    it("submits successfully and shows success message", async () => {
        const user = userEvent.setup();
        // First call is CSRF GET, second is the POST
        mockFetch
            .mockResolvedValueOnce(new Response(JSON.stringify({ csrf: "cookie-set" }), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ status: "sent" }), { status: 200 }));

        render(<ContactForm locale="en" />);

        await user.type(screen.getByLabelText(/name/i), "John Doe");
        await user.type(screen.getByLabelText(/email/i), "john@example.com");
        await user.type(screen.getByLabelText(/subject/i), "Test Subject");
        await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");
        await user.click(screen.getByRole("button", { name: /send message/i }));

        await waitFor(() => {
            expect(screen.getByText("Message sent!")).toBeInTheDocument();
        });
    });

    it("does not expose an arbitrary server error message on failed submission", async () => {
        const user = userEvent.setup();
        mockFetch
            .mockResolvedValueOnce(new Response(JSON.stringify({ csrf: "cookie-set" }), { status: 200 }))
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ detail: "Rate limit exceeded" }),
                    { status: 429 }
                )
            );

        render(<ContactForm locale="en" />);

        await user.type(screen.getByLabelText(/name/i), "John Doe");
        await user.type(screen.getByLabelText(/email/i), "john@example.com");
        await user.type(screen.getByLabelText(/subject/i), "Test Subject");
        await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");
        await user.click(screen.getByRole("button", { name: /send message/i }));

        await waitFor(() => {
            expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
        });
        expect(screen.queryByText("Rate limit exceeded")).not.toBeInTheDocument();
    });

    it("disables button during submission (single-submit protection)", async () => {
        const user = userEvent.setup();
        // Make the POST hang so we can check the button state
        mockFetch
            .mockResolvedValueOnce(new Response(JSON.stringify({ csrf: "cookie-set" }), { status: 200 }))
            .mockImplementationOnce(() => new Promise(() => { })); // Never resolves

        render(<ContactForm locale="en" />);

        await user.type(screen.getByLabelText(/name/i), "John Doe");
        await user.type(screen.getByLabelText(/email/i), "john@example.com");
        await user.type(screen.getByLabelText(/subject/i), "Test Subject");
        await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");
        await user.click(screen.getByRole("button", { name: /send message/i }));

        await waitFor(() => {
            const button = screen.getByRole("button");
            expect(button).toBeDisabled();
            expect(button).toHaveTextContent("Sending...");
        });
    });

    it("allows sending another message after success", async () => {
        const user = userEvent.setup();
        mockFetch
            .mockResolvedValueOnce(new Response(JSON.stringify({ csrf: "cookie-set" }), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ status: "sent" }), { status: 200 }));

        render(<ContactForm locale="en" />);

        await user.type(screen.getByLabelText(/name/i), "John Doe");
        await user.type(screen.getByLabelText(/email/i), "john@example.com");
        await user.type(screen.getByLabelText(/subject/i), "Test Subject");
        await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");
        await user.click(screen.getByRole("button", { name: /send message/i }));

        await waitFor(() => {
            expect(screen.getByText("Message sent!")).toBeInTheDocument();
        });

        await user.click(screen.getByText("Send another message"));

        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toHaveValue("");
    });

    it("has proper accessibility attributes on error", async () => {
        const user = userEvent.setup();
        render(<ContactForm locale="en" />);

        await user.click(screen.getByRole("button", { name: /send message/i }));

        await waitFor(() => {
            const nameInput = screen.getByLabelText(/name/i);
            expect(nameInput).toHaveAttribute("aria-invalid", "true");
            expect(nameInput).toHaveAttribute("aria-describedby", "contact-name-error");
        });
    });

    it("has an accessible form label", () => {
        render(<ContactForm locale="en" />);
        expect(screen.getByRole("form", { name: /contact form/i })).toBeInTheDocument();
    });

    it("includes a non-focusable honeypot outside the normal interaction path", () => {
        render(<ContactForm locale="en" />);

        const honeypot = document.getElementById("contact-website");
        expect(honeypot).toHaveAttribute("name", "website");
        expect(honeypot).toHaveAttribute("tabindex", "-1");
    });
});
