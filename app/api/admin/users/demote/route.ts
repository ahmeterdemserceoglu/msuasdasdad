import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { checkAdminAuth } from '@/app/lib/admin-utils';

export async function POST(request: NextRequest) {
    try {
        const { targetUserId, adminUserId } = await request.json();

        // Admin yetkisi kontrolü
        const adminCheck = await checkAdminAuth(adminUserId);
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { error: 'Bu işlem için yetkiniz yok.' },
                { status: 403 }
            );
        }

        // Kendi kendini demote etmeye çalışıyor mu?
        if (targetUserId === adminUserId) {
            return NextResponse.json(
                { error: 'Kendi admin yetkinizi kaldıramazsınız.' },
                { status: 400 }
            );
        }

        // Hedef kullanıcının var olup olmadığını kontrol et
        const targetUserRef = db.collection('users').doc(targetUserId);
        const targetUserDoc = await targetUserRef.get();

        if (!targetUserDoc.exists) {
            return NextResponse.json(
                { error: 'Kullanıcı bulunamadı.' },
                { status: 404 }
            );
        }

        const targetUserData = targetUserDoc.data();
        
        // Zaten admin değil mi kontrol et
        if (!targetUserData?.isAdmin) {
            return NextResponse.json(
                { error: 'Bu kullanıcı zaten admin değil.' },
                { status: 400 }
            );
        }

        // Kullanıcının admin yetkisini kaldır
        await targetUserRef.update({
            isAdmin: false,
            updatedAt: new Date().toISOString()
        });

        // İşlemi logla
        await db.collection('admin_logs').add({
            action: 'DEMOTE_USER',
            targetUserId,
            adminId: adminUserId,
            timestamp: new Date().toISOString(),
            details: {
                targetUserEmail: targetUserData?.email
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Kullanıcının admin yetkisi kaldırıldı.' 
        });

    } catch (error) {
        console.error('Kullanıcı rütbe düşürme hatası:', error);
        return NextResponse.json(
            { error: 'Kullanıcı rütbe düşürme işlemi sırasında bir hata oluştu.' },
            { status: 500 }
        );
    }
}
