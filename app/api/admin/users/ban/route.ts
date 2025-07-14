import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const { targetUserId } = await request.json();

        const authResult = await verifyAuth(request);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
        }

        const adminUserId = authResult.userId;

        // Admin yetkisi kontrolü
        const adminCheck = await checkAdminAuth(adminUserId);
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { error: 'Bu işlem için yetkiniz yok.' },
                { status: 403 }
            );
        }

        // Kendi kendini yasaklamaya çalışıyor mu?
        if (targetUserId === adminUserId) {
            return NextResponse.json(
                { error: 'Kendi hesabınızı yasaklayamazsınız.' },
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
        
        // Zaten yasaklı mı kontrol et
        if (targetUserData?.status === 'banned') {
            return NextResponse.json(
                { error: 'Bu kullanıcı zaten yasaklı.' },
                { status: 400 }
            );
        }

        // Kullanıcıyı yasakla
        await targetUserRef.update({
            status: 'banned',
            bannedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });

        // İşlemi logla
        await db.collection('admin_logs').add({
            action: 'BAN_USER',
            targetUserId,
            adminId: adminUserId,
            timestamp: FieldValue.serverTimestamp(),
            details: {
                targetUserEmail: targetUserData?.email
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Kullanıcı yasaklandı.' 
        });

    } catch (error) {
        console.error('Kullanıcı yasaklama hatası:', error);
        return NextResponse.json(
            { error: 'Kullanıcı yasaklama işlemi sırasında bir hata oluştu.' },
            { status: 500 }
        );
    }
}
