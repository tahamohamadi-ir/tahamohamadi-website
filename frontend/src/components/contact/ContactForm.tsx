"use client";

import { useState, useRef, useCallback, useEffect, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FieldErrors {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

interface ContactFormProps {
    locale: Locale;
}

// ─── i18n labels ───────────────────────────────────────────────────────────────

const labels = {
    fa: {
        name: "نام",
        email: "ایمیل",
        subject: "موضوع",
        message: "پیام",
        namePlaceholder: "نام شما",
        emailPlaceholder: "you@example.com",
        subjectPlaceholder: "موضوع پیام",
        messagePlaceholder: "پیام خود را بنویسید...",
        submit: "ارسال پیام",
        submitting: "در حال ارسال...",
        successTitle: "پیام شما ارسال شد!",
        successDescription: "از تماس شما متشکرم. به زودی پاسخ خواهم داد.",
        errorGeneral: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
        required: "این فیلد الزامی است.",
        nameTooShort: "نام باید حداقل ۲ حرف باشد.",
        invalidEmail: "آدرس ایمیل معتبر نیست.",
        subjectTooShort: "موضوع باید حداقل ۲ حرف باشد.",
        messageTooShort: "پیام باید حداقل ۱۰ حرف باشد.",
        sendAnother: "ارسال پیام دیگر",
    },
    en: {
        name: "Name",
        email: "Email",
        subject: "Subject",
        message: "Message",
        namePlaceholder: "Your name",
        emailPlaceholder: "you@example.com",
        subjectPlaceholder: "Subject of your message",
        messagePlaceholder: "Write your message...",
        submit: "Send Message",
        submitting: "Sending...",
        successTitle: "Message sent!",
        successDescription: "Thank you for reaching out. I'll get back to you soon.",
        errorGeneral: "Something went wrong. Please try again.",
        required: "This field is required.",
        nameTooShort: "Name must be at least 2 characters.",
        invalidEmail: "Please enter a valid email address.",
        subjectTooShort: "Subject must be at least 2 characters.",
        messageTooShort: "Message must be at least 10 characters.",
        sendAnother: "Send another message",
    },
} as const;

// ─── Client-side validation ────────────────────────────────────────────────────

function validateForm(
    data: { name: string; email: string; subject: string; message: string },
    t: { required: string; nameTooShort: string; invalidEmail: string; subjectTooShort: string; messageTooShort: string }
): FieldErrors {
    const errors: FieldErrors = {};

    if (!data.name.trim()) {
        errors.name = t.required;
    } else if (data.name.trim().length < 2) {
        errors.name = t.nameTooShort;
    }

    if (!data.email.trim()) {
        errors.email = t.required;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        errors.email = t.invalidEmail;
    }

    if (!data.subject.trim()) {
        errors.subject = t.required;
    } else if (data.subject.trim().length < 2) {
        errors.subject = t.subjectTooShort;
    }

    if (!data.message.trim()) {
        errors.message = t.required;
    } else if (data.message.trim().length < 10) {
        errors.message = t.messageTooShort;
    }

    return errors;
}

// ─── CSRF helper ───────────────────────────────────────────────────────────────

function getCsrfToken(): string {
    if (typeof document === "undefined") return "";
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : "";
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ContactForm({ locale }: ContactFormProps) {
    const t = labels[locale];

    // Ensure CSRF cookie is set on mount
    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        fetch(`${apiUrl}/api/public/contact/`, {
            method: "GET",
            credentials: "include",
        }).catch(() => {
            // Silent fail — CSRF cookie may already be set from prior navigation
        });
    }, []);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formStatus, setFormStatus] = useState<FormStatus>("idle");
    const [serverError, setServerError] = useState("");

    // Single-submit protection ref
    const isSubmittingRef = useRef(false);

    const handleSubmit = useCallback(
        async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            // Prevent duplicate submissions
            if (isSubmittingRef.current) return;

            const formData = { name, email, subject, message };
            const validationErrors = validateForm(formData, t);

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                // Focus the first invalid field
                const firstErrorField = Object.keys(validationErrors)[0];
                const el = document.getElementById(`contact-${firstErrorField}`);
                el?.focus();
                return;
            }

            setErrors({});
            setServerError("");
            setFormStatus("submitting");
            isSubmittingRef.current = true;

            try {
                const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

                const response = await fetch(`${apiUrl}/api/public/contact/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCsrfToken(),
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        name: formData.name.trim(),
                        email: formData.email.trim(),
                        subject: formData.subject.trim(),
                        message: formData.message.trim(),
                    }),
                });

                if (response.ok) {
                    setFormStatus("success");
                } else {
                    const errorData = await response.json().catch(() => null);
                    if (errorData?.errors) {
                        // Map server field errors to our error state
                        const serverFieldErrors: FieldErrors = {};
                        for (const [key, value] of Object.entries(errorData.errors)) {
                            if (key in formData) {
                                serverFieldErrors[key as keyof FieldErrors] = Array.isArray(
                                    value
                                )
                                    ? (value as string[])[0]
                                    : String(value);
                            }
                        }
                        setErrors(serverFieldErrors);
                    } else {
                        setServerError(errorData?.detail || t.errorGeneral);
                    }
                    setFormStatus("error");
                }
            } catch {
                setServerError(t.errorGeneral);
                setFormStatus("error");
            } finally {
                isSubmittingRef.current = false;
            }
        },
        [name, email, subject, message, t]
    );

    const handleReset = useCallback(() => {
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setErrors({});
        setServerError("");
        setFormStatus("idle");
    }, []);

    // Success state
    if (formStatus === "success") {
        return (
            <div
                className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950"
                role="status"
                aria-live="polite"
            >
                <svg
                    className="mx-auto mb-4 h-12 w-12 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                    {t.successTitle}
                </h2>
                <p className="mt-2 text-green-700 dark:text-green-300">
                    {t.successDescription}
                </p>
                <button
                    type="button"
                    onClick={handleReset}
                    className="mt-6 inline-flex items-center rounded-md border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:border-green-700 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                >
                    {t.sendAnother}
                </button>
            </div>
        );
    }

    const isDisabled = formStatus === "submitting";

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
            aria-label={locale === "fa" ? "فرم تماس" : "Contact form"}
        >
            {/* Server error banner */}
            {serverError && (
                <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                >
                    {serverError}
                </div>
            )}

            {/* Name field */}
            <div>
                <label
                    htmlFor="contact-name"
                    className="mb-1.5 block text-sm font-medium"
                >
                    {t.name}
                    <span className="text-red-500" aria-hidden="true">
                        {" "}
                        *
                    </span>
                    <span className="sr-only">
                        ({locale === "fa" ? "الزامی" : "required"})
                    </span>
                </label>
                <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    disabled={isDisabled}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "contact-name-error" : undefined}
                    placeholder={t.namePlaceholder}
                    className={`w-full rounded-md border px-3 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:placeholder:text-gray-500 ${errors.name
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 dark:border-gray-700 dark:focus:ring-blue-400"
                        }`}
                />
                {errors.name && (
                    <p
                        id="contact-name-error"
                        role="alert"
                        className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                    >
                        {errors.name}
                    </p>
                )}
            </div>

            {/* Email field */}
            <div>
                <label
                    htmlFor="contact-email"
                    className="mb-1.5 block text-sm font-medium"
                >
                    {t.email}
                    <span className="text-red-500" aria-hidden="true">
                        {" "}
                        *
                    </span>
                    <span className="sr-only">
                        ({locale === "fa" ? "الزامی" : "required"})
                    </span>
                </label>
                <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email)
                            setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    disabled={isDisabled}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "contact-email-error" : undefined}
                    placeholder={t.emailPlaceholder}
                    dir="ltr"
                    className={`w-full rounded-md border px-3 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:placeholder:text-gray-500 ${errors.email
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 dark:border-gray-700 dark:focus:ring-blue-400"
                        }`}
                />
                {errors.email && (
                    <p
                        id="contact-email-error"
                        role="alert"
                        className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                    >
                        {errors.email}
                    </p>
                )}
            </div>

            {/* Subject field */}
            <div>
                <label
                    htmlFor="contact-subject"
                    className="mb-1.5 block text-sm font-medium"
                >
                    {t.subject}
                    <span className="text-red-500" aria-hidden="true">
                        {" "}
                        *
                    </span>
                    <span className="sr-only">
                        ({locale === "fa" ? "الزامی" : "required"})
                    </span>
                </label>
                <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    required
                    maxLength={200}
                    value={subject}
                    onChange={(e) => {
                        setSubject(e.target.value);
                        if (errors.subject)
                            setErrors((prev) => ({ ...prev, subject: undefined }));
                    }}
                    disabled={isDisabled}
                    aria-invalid={!!errors.subject}
                    aria-describedby={
                        errors.subject ? "contact-subject-error" : undefined
                    }
                    placeholder={t.subjectPlaceholder}
                    className={`w-full rounded-md border px-3 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:placeholder:text-gray-500 ${errors.subject
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 dark:border-gray-700 dark:focus:ring-blue-400"
                        }`}
                />
                {errors.subject && (
                    <p
                        id="contact-subject-error"
                        role="alert"
                        className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                    >
                        {errors.subject}
                    </p>
                )}
            </div>

            {/* Message field */}
            <div>
                <label
                    htmlFor="contact-message"
                    className="mb-1.5 block text-sm font-medium"
                >
                    {t.message}
                    <span className="text-red-500" aria-hidden="true">
                        {" "}
                        *
                    </span>
                    <span className="sr-only">
                        ({locale === "fa" ? "الزامی" : "required"})
                    </span>
                </label>
                <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    maxLength={5000}
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        if (errors.message)
                            setErrors((prev) => ({ ...prev, message: undefined }));
                    }}
                    disabled={isDisabled}
                    aria-invalid={!!errors.message}
                    aria-describedby={
                        errors.message ? "contact-message-error" : undefined
                    }
                    placeholder={t.messagePlaceholder}
                    className={`w-full resize-y rounded-md border px-3 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:placeholder:text-gray-500 ${errors.message
                        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 dark:border-gray-700 dark:focus:ring-blue-400"
                        }`}
                />
                {errors.message && (
                    <p
                        id="contact-message-error"
                        role="alert"
                        className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                    >
                        {errors.message}
                    </p>
                )}
            </div>

            {/* Submit button */}
            <button
                type="submit"
                disabled={isDisabled}
                aria-disabled={isDisabled}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 sm:w-auto"
            >
                {isDisabled && (
                    <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                {isDisabled ? t.submitting : t.submit}
            </button>
        </form>
    );
}
