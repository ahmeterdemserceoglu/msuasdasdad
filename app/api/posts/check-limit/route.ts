import { NextRequest, NextResponse } from 'next/server';
import { checkDailyPostLimit } from '@/app/lib/post-limits';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return new NextResponse(JSON.stringify({ error: 'userId parametresi gerekli.' }), { status: 400 });
        }

        const limitStatus = await checkDailyPostLimit(userId);

        return new NextResponse(JSON.stringify(limitStatus), { status: 200 });
    } catch (error) {
        console.error("Error checking post limit: ", error);
        return new NextResponse(JSON.stringify({ error: 'Sunucu hatası.' }), { status: 500 });
    }
}
