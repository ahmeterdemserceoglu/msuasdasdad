
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';
import { FieldValue } from 'firebase-admin/firestore';

// Helper function to check for admin privileges from Firestore
async function checkFirestoreAdmin(userId: string): Promise<boolean> {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists && userDoc.data()?.isAdmin === true) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking Firestore admin status:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { targetUserId, action } = await request.json();

        // 1. Verify the token of the user making the request (the admin)
        const authResult = await verifyAuth(request);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json({ error: 'Yetkisiz erişim: Geçersiz token.' }, { status: 401 });
        }
        const adminUserId = authResult.userId;

        // 2. Check if the authenticated user is an admin
        const isAdmin = await checkFirestoreAdmin(adminUserId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Bu işlem için admin yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        // 3. Prevent admin from taking action on themselves
        if (targetUserId === adminUserId) {
            return NextResponse.json({ error: 'Admin kendi üzerinde işlem yapamaz.' }, { status: 400 });
        }

        const targetUserRef = db.collection('users').doc(targetUserId);
        const updateData: { [key: string]: boolean | string | FieldValue | null } = {
            updatedAt: FieldValue.serverTimestamp()
        };
        let successMessage = '';

        // 4. Determine the action and prepare the data for update
        switch (action) {
            case 'promote':
                updateData.isAdmin = true;
                successMessage = 'Kullanıcı başarıyla admin yapıldı.';
                break;
            case 'demote':
                updateData.isAdmin = false;
                successMessage = 'Kullanıcının admin yetkisi kaldırıldı.';
                break;
            case 'ban':
                updateData.status = 'banned';
                updateData.bannedAt = FieldValue.serverTimestamp();
                successMessage = 'Kullanıcı başarıyla yasaklandı.';
                break;
            case 'unban':
                updateData.status = 'active';
                updateData.bannedAt = null;
                successMessage = 'Kullanıcının yasağı kaldırıldı.';
                break;
            case 'suspend':
                updateData.status = 'suspended';
                updateData.suspendedAt = FieldValue.serverTimestamp();
                successMessage = 'Kullanıcı başarıyla askıya alındı.';
                break;
            case 'unsuspend':
                updateData.status = 'active';
                updateData.suspendedAt = null;
                successMessage = 'Kullanıcının askı durumu kaldırıldı.';
                break;
            default:
                return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 });
        }

        // 5. Update the user document in Firestore
        await targetUserRef.update(updateData);
        
        // Optional: Log the admin action
        await db.collection('admin_logs').add({
            action: `USER_${action.toUpperCase()}`,
            targetUserId,
            adminId: adminUserId,
            timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, message: successMessage });

    } catch (error: Error) {
        console.error(`Kullanıcı işlemi hatası (${(await request.json()).action}):`, error);
        return NextResponse.json({ error: 'Sunucu hatası: İşlem gerçekleştirilemedi.' }, { status: 500 });
    }
}

