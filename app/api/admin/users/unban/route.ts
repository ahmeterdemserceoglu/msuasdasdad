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
        
        // Zaten yasaklı değil mi kontrol et
        if (targetUserData?.status !== 'banned') {
            return NextResponse.json(
                { error: 'Bu kullanıcı zaten yasaklı değil.' },
                { status: 400 }
            );
        }

        // Kullanıcının yasağını kaldır
        await targetUserRef.update({
            status: 'active',
            bannedAt: null,
            unbannedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // İşlemi logla
        await db.collection('admin_logs').add({
            action: 'UNBAN_USER',
            targetUserId,
            adminId: adminUserId,
            timestamp: new Date().toISOString(),
            details: {
                targetUserEmail: targetUserData?.email
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Kullanıcının yasağı kaldırıldı.' 
        });

    } catch (error) {
        console.error('Kullanıcı yasak kaldırma hatası:', error);
        return NextResponse.json(
            { error: 'Kullanıcı yasak kaldırma işlemi sırasında bir hata oluştu.' },
            { status: 500 }
        );
    }
}
