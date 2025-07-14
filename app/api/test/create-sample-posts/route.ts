import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST() {
    try {
        const samplePosts = [
            {
                title: "Harp Okulu Sözlü Mülakat Deneyimim",
                content: "Geçtiğimiz hafta Harp Okulu sözlü mülakatına katıldım. Komisyon oldukça sakin ve samimiydi. Güncel olaylar, askeri tarih ve kişisel motivasyon konularında sorular sordular. Özellikle 'Neden asker olmak istiyorsun?' sorusuna çok iyi hazırlanmış olmak önemli. Ayrıca kendini tanıtırken özgüvenli olmak, ancak kibirli görünmemek gerekiyor. Mülakatın yaklaşık 15-20 dakika sürdüğünü söyleyebilirim.",
                summary: "Harp Okulu sözlü mülakat deneyimi - güncel olaylar, askeri tarih ve motivasyon soruları",
                interviewType: "sozlu",
                candidateType: "harbiye",
                experienceDate: "2024-06-15",
                city: "Ankara",
                tags: ["harp-okulu", "sözlü-mülakat", "güven", "motivasyon"],
                userId: "sample-user-1",
                createdAt: FieldValue.serverTimestamp(),
                likes: 0,
                likedBy: [],
                status: "approved",
                isApproved: true
            },
            {
                title: "Astsubay Meslek Yüksekokulu Spor Testi",
                content: "AMYO spor testine katıldım ve oldukça zordu. Koşu, şınav, mekik ve asılma gibi testler var. Özellikle kondisyon çok önemli. Ben 3 ay boyunca düzenli antrenman yaptım. Koşu için en az 2.5 km'yi 12 dakika altında koşabilmek lazım. Şınav için 25-30 tane yapmak gerekiyor. Mekik de benzer şekilde. Asılma testinde ise en az 10 saniye asılı kalmak şart. Spor testinden önce kesinlikle düzenli antrenman yapın.",
                summary: "AMYO spor testi deneyimi - koşu, şınav, mekik ve asılma testleri",
                interviewType: "spor",
                candidateType: "astsubay",
                experienceDate: "2024-06-10",
                city: "İstanbul",
                tags: ["amyo", "spor-testi", "kondisyon", "antrenman"],
                userId: "sample-user-2",
                createdAt: FieldValue.serverTimestamp(),
                likes: 0,
                likedBy: [],
                status: "approved",
                isApproved: true
            },
            {
                title: "Sahil Güvenlik Psikolojik Test Deneyimi",
                content: "Sahil Güvenlik Komutanlığı psikolojik testine katıldım. Test oldukça kapsamlı ve yaklaşık 2 saaat sürdü. Çoktan seçmeli sorular, kişilik testi ve bazı görsel testler vardı. Önemli olan dürüst olmak ve tutarlı cevaplar vermek. Yapmacık cevaplar vermek yerine gerçek kişiliğinizi yansıtın. Ayrıca stres altında karar verebilme yeteneğinizi ölçen sorular da var. Sabırlı olun ve her soruyu dikkatlice okuyun.",
                summary: "Sahil Güvenlik psikolojik test deneyimi - 2 saatlik kapsamlı test",
                interviewType: "psikolojik",
                candidateType: "sahil-guvenlik",
                experienceDate: "2024-06-05",
                city: "İzmir",
                tags: ["sahil-güvenlik", "psikolojik-test", "dürüstlük", "stres"],
                userId: "sample-user-3",
                createdAt: FieldValue.serverTimestamp(),
                likes: 0,
                likedBy: [],
                status: "approved",
                isApproved: true
            }
        ];

        // Kullanıcıları da oluştur
        const sampleUsers = [
            {
                uid: "sample-user-1",
                email: "user1@example.com",
                displayName: "Ali Yılmaz",
                photoURL: null,
                birthYear: 2000,
                isAdmin: false,
                createdAt: FieldValue.serverTimestamp()
            },
            {
                uid: "sample-user-2",
                email: "user2@example.com",
                displayName: "Mehmet Kaya",
                photoURL: null,
                birthYear: 1999,
                isAdmin: false,
                createdAt: FieldValue.serverTimestamp()
            },
            {
                uid: "sample-user-3",
                email: "user3@example.com",
                displayName: "Ayşe Demir",
                photoURL: null,
                birthYear: 2001,
                isAdmin: false,
                createdAt: FieldValue.serverTimestamp()
            }
        ];

        // Kullanıcıları oluştur
        for (const user of sampleUsers) {
            await adminDb.collection('users').doc(user.uid).set(user);
        }

        // Postları oluştur
        const postIds = [];
        for (const post of samplePosts) {
            const docRef = await adminDb.collection('posts').add(post);
            postIds.push(docRef.id);
            
            // User alt koleksiyonuna da ekle
            await adminDb.collection('users').doc(post.userId).collection('posts').add({
                ...post,
                postId: docRef.id
            });
        }

        return new NextResponse(JSON.stringify({ 
            message: 'Sample posts created successfully',
            postIds 
        }), { status: 200 });

    } catch (error) {
        console.error('Error creating sample posts:', error);
        return new NextResponse(JSON.stringify({ error: 'Failed to create sample posts' }), { status: 500 });
    }
}
