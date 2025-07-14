import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';
import { checkAdminAuth } from '@/app/lib/admin-utils';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Kullanıcı ID gerekli.' },
                { status: 400 }
            );
        }

        // Admin yetkisi kontrolü
        const adminCheck = await checkAdminAuth(userId);
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { error: 'Bu işlem için yetkiniz yok.' },
                { status: 403 }
            );
        }

        // Bekleyen gönderileri say
        const pendingPostsSnapshot = await db.collection('posts')
            .where('status', '==', 'pending')
            .get();
        const pendingPostsCount = pendingPostsSnapshot.size;

        // Bugün kayıt olan kullanıcıları say
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const newUsersSnapshot = await db.collection('users')
            .where('createdAt', '>=', todayStart.toISOString())
            .get();
        const newUsersCount = newUsersSnapshot.size;

        // Bildirimi oluştur
        const notifications = [];
        let totalCount = 0;

        if (pendingPostsCount > 0) {
            notifications.push({
                id: 'pending_posts',
                type: 'pending_post',
                count: pendingPostsCount,
                message: `${pendingPostsCount} gönderi onay bekliyor`,
                timestamp: new Date().toISOString()
            });
            totalCount += pendingPostsCount;
        }

        if (newUsersCount > 0) {
            notifications.push({
                id: 'new_users',
                type: 'new_user',
                count: newUsersCount,
                message: `${newUsersCount} yeni kullanıcı bugün katıldı`,
                timestamp: new Date().toISOString()
            });
        }

        // Rapor edilen içerikleri kontrol et (eğer böyle bir sistem varsa)
        // Şimdilik boş bırakıyoruz

        return NextResponse.json({
            notifications,
            totalCount,
            pendingPostsCount,
            newUsersCount
        });

    } catch (error) {
        console.error('Bildirim alma hatası:', error);
        return NextResponse.json(
            { error: 'Bildirimler alınırken bir hata oluştu.' },
            { status: 500 }
        );
    }
}

// Admin bildirimlerini kaydetmek için POST metodu
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, userId, data } = body;

        if (!type || !userId) {
            return NextResponse.json(
                { error: 'Tip ve kullanıcı ID gerekli.' },
                { status: 400 }
            );
        }

        // Admin yetkisi kontrolü
        const adminCheck = await checkAdminAuth(userId);
        if (!adminCheck.isAdmin) {
            return NextResponse.json(
                { error: 'Bu işlem için yetkiniz yok.' },
                { status: 403 }
            );
        }

        // Bildirim tipine göre işlem yap
        let notification = {
            type,
            createdAt: FieldValue.serverTimestamp(),
            read: false,
            data: data || {}
        };

        switch (type) {
            case 'new_post':
                notification = {
                    ...notification,
                    title: 'Yeni Post Eklendi',
                    message: `${data.authorName} tarafından yeni bir post eklendi: "${data.postTitle}"`,
                    postId: data.postId,
                    authorId: data.authorId
                };
                break;
            
            case 'new_user':
                notification = {
                    ...notification,
                    title: 'Yeni Kullanıcı Kaydoldu',
                    message: `${data.userName} (${data.userEmail}) sisteme katıldı`,
                    newUserId: data.userId
                };
                break;
            
            case 'pending_posts_alert':
                notification = {
                    ...notification,
                    title: 'Bekleyen Postlar',
                    message: `${data.count} adet post onay bekliyor`,
                    count: data.count
                };
                break;
            
            default:
                notification = {
                    ...notification,
                    title: data.title || 'Bildirim',
                    message: data.message || 'Yeni bir bildirim'
                };
        }

        // Bildirimi admin_notifications koleksiyonuna kaydet
        const notificationRef = await db.collection('admin_notifications').add(notification);

        // Tüm adminlere bildirim gönder
        const adminsSnapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .get();

        const batch = db.batch();
        adminsSnapshot.docs.forEach(adminDoc => {
            const adminNotificationRef = db.collection('users')
                .doc(adminDoc.id)
                .collection('notifications')
                .doc(notificationRef.id);
            
            batch.set(adminNotificationRef, {
                ...notification,
                notificationId: notificationRef.id
            });
        });

        await batch.commit();

        // Webhook'ları tetikle (eğer tanımlanmışsa)
        await triggerWebhooks(type, notification);

        return NextResponse.json({
            success: true,
            notificationId: notificationRef.id,
            message: 'Bildirim başarıyla oluşturuldu'
        });

    } catch (error) {
        console.error('Bildirim oluşturma hatası:', error);
        return NextResponse.json(
            { error: 'Bildirim oluşturulurken bir hata oluştu.' },
            { status: 500 }
        );
    }
}

// Webhook'ları tetikleme fonksiyonu
async function triggerWebhooks(type: string, notification: any) {
    try {
        // Webhook ayarlarını al
        const webhookSettings = await db.collection('settings')
            .doc('webhooks')
            .get();
        
        if (!webhookSettings.exists) {
            return;
        }

        const webhooks = webhookSettings.data()?.endpoints || [];
        const activeWebhooks = webhooks.filter((webhook: any) => 
            webhook.active && 
            (!webhook.events || webhook.events.includes(type))
        );

        // Her webhook'a paralel istek gönder
        const webhookPromises = activeWebhooks.map(async (webhook: any) => {
            try {
                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Secret': webhook.secret || '',
                        'X-Event-Type': type
                    },
                    body: JSON.stringify({
                        event: type,
                        timestamp: new Date().toISOString(),
                        data: notification
                    })
                });

                // Webhook log kaydet
                await db.collection('webhook_logs').add({
                    webhookId: webhook.id,
                    url: webhook.url,
                    event: type,
                    status: response.status,
                    success: response.ok,
                    timestamp: FieldValue.serverTimestamp()
                });

            } catch (error) {
                console.error(`Webhook hatası (${webhook.url}):`, error);
                
                // Hata logunu kaydet
                await db.collection('webhook_logs').add({
                    webhookId: webhook.id,
                    url: webhook.url,
                    event: type,
                    status: 0,
                    success: false,
                    error: error.message,
                    timestamp: FieldValue.serverTimestamp()
                });
            }
        });

        await Promise.allSettled(webhookPromises);
        
    } catch (error) {
        console.error('Webhook tetikleme hatası:', error);
    }
}
