import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { text, action } = await req.json();

        // Simulate AI processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        let result = "";

        switch (action) {
            case "improve":
                result = `[بهبود یافته توسط هوش مصنوعی]: ${text} - این متن بسیار حرفه‌ای‌تر نوشته شده است.`;
                break;
            case "summarize":
                result = `[خلاصه هوش مصنوعی]: نسخه‌ی کوتاه شده‌ی متن شما.`;
                break;
            case "title":
                result = `عنوان پیشنهادی: راهنمای جامع برای ${text.substring(0, 20)}...`;
                break;
            default:
                result = `عملکرد ${action} ناشناخته است.`;
        }

        return NextResponse.json({ result });
    } catch (error) {
        return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 });
    }
}
