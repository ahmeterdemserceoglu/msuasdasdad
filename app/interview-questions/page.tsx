'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Hash, BrainCircuit, Swords, Globe, ArrowLeft, User, Shield, Wind, Anchor, BookOpen, Scale, Lightbulb, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const questionsData = [
  {
    category: 'MSÜ VE GÜNCEL YÖNETİCİLER',
    icon: <Shield className="w-5 h-5" />,
    questions: [
      { q: "MSÜ rektörü kimdir?", a: "Prof. Dr. Erhan Afyoncu (Kasım 2023'te atandı, halen görevde)." },
      { q: "KHO dekanı kimdir?", a: "Tuğgeneral Mehmet Nail Yiğit (2024 itibarıyla)." },
      { q: "HHO dekanı kimdir?", a: "Tuğgeneral Mehmet Şükrü Eken (2024 itibarıyla)." },
      { q: "DHO dekanı kimdir?", a: "Tuğamiral Cihat Yaycı (2024 itibarıyla)." },
      { q: "Milli Savunma Bakanı kimdir?", a: "Yaşar Güler (2024 itibarıyla)." },
      { q: "Genelkurmay Başkanı kimdir?", a: "Orgeneral Metin Gürak (2024 itibarıyla)." },
      { q: "Kara Kuvvetleri Komutanı kimdir?", a: "Orgeneral Selçuk Bayraktaroğlu (2024 itibarıyla)." },
      { q: "Hava Kuvvetleri Komutanı kimdir?", a: "Orgeneral Ziya Cemal Kadıoğlu (2024 itibarıyla)." },
      { q: "Deniz Kuvvetleri Komutanı kimdir?", a: "Oramiral Ercüment Tatlıoğlu (2024 itibarıyla)." },
    ]
  },
  {
    category: 'GENEL MÜLAKAT SORULARI',
    icon: <BrainCircuit className="w-5 h-5" />,
    questions: [
      { q: "Neden subay/astsubay olmak istiyorsun?", a: "Vatanıma ve milletime hizmet etme arzusu, taşıdığım en büyük idealdir. Türk Silahlı Kuvvetleri'nin şerefli bir üyesi olarak bu ideale ulaşmak, benim için bir işten öte bir yaşam biçimidir. Disiplinli, kararlı ve liderlik ruhuna sahip bir birey olarak bu kutsal göreve en uygun kişi olduğuma inanıyorum." },
      { q: "Korkuların var mı?", a: "Her insan gibi benim de endişelerim var ancak görevimi yerine getirirken veya vatanımı savunurken yaşayacağım hiçbir korkunun, sorumluluklarımın ve kararlılığımın önüne geçmesine izin vermem. En büyük korkum, bana emanet edilen görevi layıkıyla yerine getirememektir." },
      { q: "Üniversiteyi başarıyla bitirebileceğine inanıyor musun?", a: "Evet, kesinlikle inanıyorum. Akademik hedeflerime ulaşmak için gerekli olan azim, disiplin ve çalışma alışkanlıklarına sahibim. Zorluklar karşısında pes etmeyen bir yapım var ve bu eğitimi başarıyla tamamlayacağıma eminim." },
      { q: "Savaş stratejisi kavramını açıklayınız.", a: "Savaş stratejisi, bir savaşta veya askeri harekatta, ulusal hedeflere ulaşmak için askeri, ekonomik, politik ve psikolojik güçlerin bir bütün olarak planlanması ve kullanılması sanatıdır. Sadece muharebe alanını değil, savaşın tüm boyutlarını kapsar." },
      { q: "Turan taktiği (Hilal Taktiği) nedir?", a: "Merkez çekilir, kanatlar kuşatır. Eski Türk devletleri tarafından sıklıkla kullanılan bir savaş stratejisidir. Ordu, merkez, sağ ve sol kanat olmak üzere üç kısma ayrılır. Savaş sırasında merkez kuvvetleri sahte bir geri çekilme yapar, düşman bu tuzağa çekildiğinde pusuya yatmış olan sağ ve sol kanatlar düşmanı çember içine alarak imha eder." },
    ]
  },
  {
    category: 'KENDİNİ TANITMA REHBERİ',
    icon: <User className="w-5 h-5" />,
    questions: [
      {
        q: "Mülakatta kendimi nasıl etkili bir şekilde tanıtmalıyım?",
        a: "Etkili bir kendini tanıtma, yapılandırılmış ve özgüvenli olmalıdır. Şu adımları izleyebilirsiniz:\n1. **Başlangıç:** Adınız, soyadınız ve memleketinizle başlayın. (Örn: \"Ben Ahmet Yılmaz, Ankara doğumluyum.\")\n2. **Eğitim:** Lise ve (varsa) üniversite bilgilerinizi kısaca belirtin. Alanınızdan ve önemli başarılarınızdan bahsedebilirsiniz.\n3. **Hedef:** Neden burada olduğunuzu net bir şekilde ifade edin. (Örn: \"Hedefim, şanlı Türk ordusunun bir subayı olarak Kara Harp Okulu'nda eğitim almak ve vatanıma hizmet etmektir.\")\n4. **Nitelikler:** Askeri bir kariyere uygun olduğunuzu düşündüğünüz kişisel özelliklerinizi vurgulayın. (Disiplin, liderlik, sorumluluk sahibi olma, fiziksel yeterlilik vb.)\n5. **İlgi Alanları:** Sizi geliştiren ve askeri yaşantıyla uyumlu olabilecek hobilerinizden bahsedin. (Takım sporları, strateji oyunları, kitap okumak, doğa sporları vb.)\n6. **Kapanış:** Teşekkür ederek ve kararlılığınızı belirterek bitirin. (Örn: \"Bu kutsal göreve layık olmak için her türlü zorluğa hazır olduğumu belirtmek isterim.\")"
      },
      { q: "Neden subay olmak istiyorsun?", a: "Bu mesleğin benim için sadece bir iş değil, bir yaşam biçimi olduğunu düşünüyorum. Vatanıma ve milletime hizmet etme arzusu, taşıdığım en büyük idealdir. Türk Silahlı Kuvvetleri'nin şerefli bir üyesi olarak bu ideale ulaşmak istiyorum." },
      { q: "Sizi neden bu okula almalıyız? Diğer adaylardan farkınız ne?", a: "Liderlik vasıflarına sahip, sorumluluk almaktan çekinmeyen, fiziksel ve zihinsel olarak zorluklara hazır biriyim. Takım çalışmasına yatkınım ve verilen görevi en iyi şekilde yerine getirme konusunda kararlıyım. Bu özelliklerimin beni diğer adaylardan ayırdığına ve bu kutsal görev için uygun bir aday yaptığına inanıyorum." },
      { q: "FETÖ'yü üç kelimeyle nasıl tanımlarsınız?", a: "Hain, sinsi ve din istismarcısı bir terör örgütü." },
    ]
  },
  {
    category: 'PSİKOLOJİK MÜLAKAT SORULARI',
    icon: <Brain className="w-5 h-5" />,
    questions: [
      {
        q: "Ailenizden ayrı kaldınız mı? Ailenizden ayrı kalabilir misiniz?",
        a: "**Daha önce ayrı kalanlar için:** Evet, daha önce [eğitim/iş/kurs vb.] nedeniyle ailemden ayrı kaldım. Bu deneyim bana özgüven kazandırdı ve bağımsızlık duygumu geliştirdi. Tabii ki ailemi özledim, ancak bu durumun beni daha güçlü ve sorumlu bir birey yaptığını gördüm. Askeri eğitim için de ailemden ayrı kalmaya hazırım.\n\n**Daha önce ayrı kalmayanlar için:** Hayır, daha önce ailemden uzun süre ayrı kalmadım. Ancak bu durum beni endişelendirmiyor. Aksine, bu yeni deneyimi bir fırsat olarak görüyorum. Ailem de bu kararımı destekliyor ve beni her zaman destekleyeceklerini biliyorum. Vatanıma hizmet etmek için gerekli olan her türlü fedakarlığa hazırım."
      },
      {
        q: "Stresli durumlarla nasıl başa çıkarsınız?",
        a: "Stresli durumlarla karşılaştığımda öncelikle sakin kalmaya çalışırım. Durumu analiz ederek önceliklerimi belirlerim ve adım adım çözüm üretirim. Nefes egzersizleri yaparım ve pozitif düşünmeye odaklanırım. Gerektiğinde güvendiğim kişilerden tavsiye alırım. Spor yapmak ve müzik dinlemek de stresimi atmama yardımcı olur."
      },
      {
        q: "Başarısızlıkla nasıl başa çıkarsınız?",
        a: "Başarısızlığı bir son değil, öğrenme fırsatı olarak görürüm. Önce neyi yanlış yaptığımı analiz ederim ve hatalarımdan ders çıkarırım. Kendimi suçlamak yerine, nasıl daha iyi olabileceğime odaklanırım. Motivasyonumu kaybetmem ve daha kararlı bir şekilde tekrar denerim. Her başarısızlık beni hedefe daha yaklaştırır."
      },
      {
        q: "Takım çalışması konusunda kendinizi nasıl değerlendirirsiniz?",
        a: "Takım çalışmasını çok önemserim ve bu konuda başarılı olduğumu düşünürüm. İyi bir dinleyiciyim, farklı görüşlere saygı duyarım ve ortak hedefe odaklanırım. Gerektiğinde liderlik yaparım, gerektiğinde de takipçi olurum. Çatışma durumlarında arabuluculuk yapar ve çözüm odaklı yaklaşırım. Takımın başarısını kendi başarım olarak görürüm."
      },
      {
        q: "Kendinizde değiştirmek istediğiniz özellikler var mı?",
        a: "Evet, sürekli kendimi geliştirmeye çalışırım. Bazen aşırı mükemmeliyetçi olabiliyorum, bu da zaman kaybına neden olabiliyor. Bu konuda daha pragmatik olmaya çalışıyorum. Ayrıca sabırsızlık konusunda kendimi geliştirmek istiyorum. Uzun vadeli hedeflere odaklanmayı ve süreçlerin zamanını beklemeyi öğrenmeye çalışıyorum."
      },
      {
        q: "Öfkenizi nasıl kontrol edersiniz?",
        a: "Öfkelendiğimde önce duraksarım ve derin nefes alırım. Hemen tepki vermek yerine, durumu soğukkanlılıkla değerlendirmeye çalışırım. Öfkemi yapıcı bir şekilde ifade etmeyi öğrendim. Spor yapmak, yürüyüş yapmak gibi fiziksel aktiviteler öfkemi atmama yardımcı olur. Öfkenin geçici bir duygu olduğunu ve kontrol edilebileceğini biliyorum."
      },
      {
        q: "Eleştiriye nasıl tepki verirsiniz?",
        a: "Yapıcı eleştirileri büyük bir fırsat olarak görürüm. Önce dinlerim, savunmaya geçmek yerine eleştiriyi objektif olarak değerlendiririm. Haklı olan noktaları kabul eder ve kendimi geliştirmek için kullanırım. Eleştiren kişiye teşekkür ederim çünkü beni daha iyi bir insan olmaya yönlendirmiş olur. Yıkıcı eleştirilerde ise sakin kalır ve yapıcı diyalog kurmaya çalışırım."
      },
      {
        q: "Liderlik deneyiminiz var mı? Kendinizi nasıl bir lider olarak görüyorsunuz?",
        a: "**Deneyimi olanlar için:** Evet, [okul/spor/proje] kapsamında liderlik deneyimim oldu. Bu süreçte takımı motive etmeyi, adil olmayı ve örnek olmayı öğrendim. Demokratik bir liderlik tarzım var, herkesi dinler ve ortak karar alırız.\n\n**Deneyimi olmayanlar için:** Henüz resmi bir liderlik deneyimim olmadı, ancak arkadaş gruplarında doğal olarak öncülük ettiğim durumlar oldu. Kendimi adaletli, anlayışlı ve motive edici bir lider olarak görüyorum. Bu konuda kendimi geliştirmeye açığım."
      },
      {
        q: "Hedeflerinize ulaşmak için neler yaparsınız?",
        a: "Öncelikle hedeflerimi net bir şekilde belirlerim ve yazılı hale getiririm. Büyük hedefleri küçük adımlara bölerim ve her adım için zaman planı yaparım. Düzenli olarak ilerlemeyi takip ederim ve gerektiğinde planımı revize ederim. Motivasyonumu korumak için küçük başarılarımı kutlarım. Engelleri fırsat olarak görür ve vazgeçmem."
      },
      {
        q: "Karar verme süreciniz nasıldır?",
        a: "Karar verirken önce mevcut bilgileri toplarım ve durumu detaylı analiz ederim. Alternatifleri listeler, her birinin artı ve eksilerini değerlendiririm. Güvendiğim kişilerden görüş alırım ama son kararı kendim veririm. Acil durumlarda hızlı karar verebilirim, önemli konularda ise daha dikkatli düşünürüm. Aldığım kararların sorumluluğunu üstlenirim."
      }
    ]
  },
  {
    category: 'KARA HARP OKULU (KHO)',
    icon: <Shield className="w-5 h-5" />,
    questions: [
      { q: "Kara Kuvvetleri'nin kuruluş tarihi nedir?", a: "Modern Türk Kara Kuvvetleri'nin temeli, Büyük Hun İmparatoru Mete Han'ın tahta çıktığı M.Ö. 209 yılı olarak kabul edilir. Bu tarih, aynı zamanda Kara Kuvvetleri'nin ambleminde de yer alır." },
      { q: "Kara Kuvvetleri'nin temel görevleri nelerdir?", a: "Türkiye'nin kara sınırlarını korumak, ülke bütünlüğünü ve bağımsızlığını sağlamak, barışı destekleme harekatlarına katılmak ve doğal afetlerde halka yardım etmektir." },
      { q: "Tarihten sizi en çok etkileyen kara savaşı hangisidir ve neden?", a: "Örnek: Sakarya Meydan Muharebesi. Çünkü bu savaş, Türk ordusunun savunmadan taarruza geçtiği bir dönüm noktasıdır ve Mustafa Kemal Atatürk'ün askeri dehasını ve liderliğini en net şekilde gösterdiği savaşlardan biridir." },
      { q: "Bir subayda olması gereken en önemli üç özellik nedir?", a: "Liderlik, cesaret ve sadakat. Liderlik, emrindeki personeli en zor şartlarda bile hedefe yönlendirebilmektir. Cesaret, görev ne kadar tehlikeli olursa olsun tereddüt etmemektir. Sadakat ise devlete, millete ve orduya koşulsuz bağlılıktır." }
    ]
  },
  {
    category: 'HAVA HARP OKULU (HHO)',
    icon: <Wind className="w-5 h-5" />,
    questions: [
      { q: "Hava Kuvvetlerimize ait uçaklar nelerdir?", a: "Türk Hava Kuvvetleri envanterinde F-16, F-4 Phantom, havadan ihbar ve kontrol uçağı (HİK), tanker uçakları (KC-135R), nakliye uçakları (A400M, C-130, C-160) ve eğitim uçakları (Hürkuş, KT-1T) gibi çeşitli tipte uçaklar bulunmaktadır. Ayrıca Bayraktar Akıncı ve TUSAŞ Aksungur gibi SİHA'lar da kullanılmaktadır." },
      { q: "Türk Hava Kuvvetleri'nin misyonu nedir?", a: "Türk hava sahasını korumak, caydırıcılık sağlamak, kara ve deniz kuvvetlerine destek vermek ve gerektiğinde taarruz görevleri icra etmektir." },
      { q: "Bir savaş pilotunda olması gereken en önemli özellikler nelerdir?", a: "Hızlı karar verme yeteneği, yüksek dikkat ve konsantrasyon, soğukkanlılık, mükemmel el-göz koordinasyonu ve güçlü bir vatan sevgisi." },
      { q: "Havacılık tarihinde sizi en çok etkileyen olay veya kişi kimdir?", a: "Örnek: Vecihi Hürkuş. Türkiye'nin ilk uçak tasarımcısı ve üreticisi olarak, imkansızlıklara rağmen havacılık tutkusundan vazgeçmemesi ve ülkesine hizmet etme azmi beni derinden etkilemektedir." },
      { q: "Hava gücünün modern savaşlardaki rolü hakkında ne düşünüyorsunuz?", a: "Modern savaşlarda hava gücü, üstünlük kurmanın anahtarıdır. Keşif, gözetleme, hassas vuruş kabiliyeti ve lojistik destek gibi görevleriyle savaşın seyrini doğrudan etkiler. İHA/SİHA teknolojisi bu alandaki en son ve en önemli developmentsdendir." },
    ]
  },
  {
    category: 'DENİZ HARP OKULU (DHO)',
    icon: <Anchor className="w-5 h-5" />,
    questions: [
      { q: "Deniz Kuvvetleri'nin ana görevleri nelerdir?", a: "Türkiye'nin denizlerdeki hak ve menfaatlerini korumak (Mavi Vatan), deniz ticaret yollarının güvenliğini sağlamak, denizden gelebilecek tehditleri caydırmak ve dost ve müttefik ülkelerle iş birliği yapmaktır." },
      { q: "Barbaros Hayreddin Paşa kimdir ve en önemli zaferi hangisidir?", a: "Osmanlı İmparatorluğu'nun en büyük amirallerinden biridir. En önemli zaferi, 1538'de Haçlı donanmasına karşı kazandığı Preveze Deniz Savaşı'dır. Bu zaferle Akdeniz'de Türk hakimiyeti pekişmiştir." },
      { q: "'Mavi Vatan' doktrini ne anlama gelmektedir?", a: "Türkiye'nin Karadeniz, Ege ve Akdeniz'deki deniz yetki alanlarını (kıta sahanlığı ve münhasır ekonomik bölge) kapsayan, bu alanlardaki egemenlik haklarını ve stratejik çıkarlarını tanımlayan bir doktrindir." },
    ]
  },
  {
    category: 'TARİH VE ATATÜRKÇÜLÜK',
    icon: <BookOpen className="w-5 h-5" />,
    questions: [
      { q: "Malazgirt Savaşı'nın Türk tarihi için anlamı ve önemi nedir?", a: "1071 yılında Selçuklu Sultanı Alparslan ile Bizans İmparatoru Romen Diyojen arasında yapılmıştır. Bu zafer, Anadolu'nun kapılarını Türklere kesin olarak açmış ve Türkiye tarihini başlatmıştır." },
      { q: "İstanbul'un Fethi'nin dünya tarihi açısından sonuçları nelerdir?", a: "1453'te Fatih Sultan Mehmet tarafından gerçekleştirilmiştir. Orta Çağ'ı kapatıp Yeni Çağ'ı açmış, Bizans İmparatorluğu'nu sona erdirmiş ve Avrupa'da coğrafi keşifleri tetikleyen önemli bir olay olmuştur." },
      { q: "Lozan Antlaşması'nın Türkiye Cumhuriyeti için önemi nedir?", a: "24 Temmuz 1923'te imzalanmıştır. Türkiye Cumhuriyeti'nin bağımsızlığının ve sınırlarının uluslararası alanda tanındığı kurucu antlaşmadır. Kapitülasyonlar tamamen kaldırılmıştır." },
      { q: "Atatürk'ün yazdığı en önemli eseri hangisidir?", a: "Nutuk (Söylev). 1919-1927 yılları arasını kapsayan, Kurtuluş Savaşı'nı ve Cumhuriyet'in kuruluşunu birinci ağızdan anlatan temel bir eserdir." },
      { q: "İzmir'de ilk kurşunu atan kimdir?", a: "15 Mayıs 1919'da İzmir'in işgali sırasında Gazeteci Hasan Tahsin'dir." },
      { q: "Atatürk'ün ilke ve inkılapları nelerdir?", a: "Atatürk'ün 6 temel ilkesi vardır: Cumhuriyetçilik, Milliyetçilik, Halkçılık, Devletçilik, Laiklik ve İnkılapçılık. Bu ilkeler doğrultusunda yapılan inkılaplar ise siyasi, hukuki, eğitim, kültür ve toplumsal alanlarda modern Türkiye'yi şekillendirmiştir." },
      { q: "Atatürk'ün yazdığı kitaplar nelerdir?", a: "En bilinen eseri Nutuk'tur. Bunun dışında Zabit ve Kumandan ile Hasbihal, Cumalı Ordugâhı, Tâbiye ve Tatbikat Seyahati, Bölüğün Muharebe Eğitimi, Geometri gibi askeri ve sivil alanlarda yazdığı eserleri bulunmaktadır." },
      { q: "Atatürk'ün Nutuk kitabında nelerden bahsediliyor?", a: "Nutuk, 1919'da Samsun'a çıkışından başlayarak 1927 yılına kadar olan dönemi kapsar. Kurtuluş Savaşı'nın hazırlık, savaş ve sonuç dönemlerini, Cumhuriyet'in kuruluşunu ve yapılan inkılapları bizzat Atatürk'ün kendi anlatımıyla belgelerle ortaya koyan temel bir tarih kaynağıdır." },
      { q: "Kurtuluş mücadelemiz ne zaman başlamıştır?", a: "Türk Kurtuluş Savaşı, Mustafa Kemal Atatürk'ün 19 Mayıs 1919'da Samsun'a ayak basmasıyla fiilen başlamıştır." },
      { q: "Mudanya Ateşkes Anlaşması'nın önemi nedir?", a: "3-11 Ekim 1922'de imzalanan Mudanya Ateşkesi, Kurtuluş Savaşı'nın silahlı mücadelesini sona erdiren ve diplomatik sürecini başlatan belgedir. Bu anlaşma ile İstanbul, Boğazlar ve Doğu Trakya savaşılmadan geri alınmış ve Osmanlı İmparatorluğu hukuken sona ermiştir." },
      { q: "On iki Ada Yunanistan'a ne zaman verildi?", a: "12 Ada, 1912'de Uşi Antlaşması ile geçici olarak İtalya'ya bırakılmış, II. Dünya Savaşı'ndan sonra 1947 Paris Antlaşması ile İtalya tarafından Yunanistan'a devredilmiştir." },
      { q: "Marshall Planı ve Truman Doktrini nedir?", a: "Truman Doktrini (1947), Sovyetler Birliği'nin yayılmacılığına karşı Türkiye ve Yunanistan'a askeri yardımı içerir. Marshall Planı (1948) ise II. Dünya Savaşı sonrası Avrupa ülkelerinin ekonomilerini yeniden inşa etmek amacıyla ABD tarafından sunulan bir ekonomik yardım paketidir. Türkiye de bu yardımdan faydalanmıştır." },
      { q: "Hoca Ahmet Yesevi kimdir?", a: "12. yüzyılda yaşamış büyük bir Türk mutasavvıfı ve şairidir. 'Divan-ı Hikmet' adlı eseriyle İslamiyet'in Türkler arasında yayılmasında ve Türk tasavvuf edebiyatının doğuşunda öncü rol oynamıştır. 'Pîr-i Türkistan' olarak anılır." },
      { q: "Tarih bilimi nedir?", a: "Geçmişte yaşamış insan topluluklarının siyasi, sosyal, kültürel ve ekonomik faaliyetlerini yer ve zaman göstererek, neden-sonuç ilişkisi içerisinde, belgelere dayanarak objektif bir şekilde inceleyen bilim dalıdır." },
      { q: "Kıbrıs Barış Harekatı'nın tarihi ve parolası nedir?", a: "Kıbrıs Barış Harekatı, 20 Temmuz 1974'te başlamıştır. Harekatın parolası 'Ayşe tatile çıksın' idi." },
      { q: "Atatürk'ün hayatındaki en önemli dönüm noktaları nelerdir?", a: "19 Mayıs 1919'da Samsun'a çıkışı, Erzurum ve Sivas Kongreleri, 23 Nisan 1920'de TBMM'nin açılması, Başkomutanlık Meydan Muharebesi ve Cumhuriyet'in ilanı en önemli dönüm noktalarıdır." },
      { q: "Milli Mücadele'nin amacı neydi?", a: "Milli Mücadele'nin temel amacı, işgal altındaki vatan topraklarını düşmandan kurtarmak, milletin bağımsızlığını sağlamak ve kayıtsız şartsız egemenliğe dayalı yeni bir Türk devleti kurmaktı." },
      { q: "Lozan Antlaşması'nın Türkiye için önemi nedir?", a: "Lozan Antlaşması, yeni Türk devletinin bağımsızlığının ve egemenliğinin uluslararası alanda tanınmasını sağlayan kurucu bir belgedir. Sevr Antlaşması'nı geçersiz kılmış ve Türkiye Cumhuriyeti'nin bugünkü sınırlarını büyük ölçüde belirlemiştir." },
      { q: "İzmir'de ilk kurşunu atan kimdir?", a: "15 Mayıs 1919'da İzmir'in işgali sırasında Gazeteci Hasan Tahsin'dir." },
      { q: "Kurtuluş Savaşı'nın fiili başlangıcı ne zamandır?", a: "19 Mayıs 1919 Samsun." },
      { q: "Lozan Antlaşması ne zaman imzalandı?", a: "24 Temmuz 1923." },
      { q: "Malazgirt Savaşı'nın yılı ve önemi nedir?", a: "1071 – Anadolu'nun kapısını açtı." },
      { q: "İstanbul'un fethi hangi yılda gerçekleşti?", a: "1453." },
      { q: "Çanakkale Deniz Zaferi ne zaman kazanıldı?", a: "18 Mart 1915." },
      { q: "Sakarya Meydan Muharebesi ne zaman yapıldı?", a: "23 Ağustos – 13 Eylül 1921." },
      { q: "Büyük Taarruz'un başlangıç yeri neresidir?", a: "Afyon Kocatepe." },
      { q: "Cumhuriyet'in ilan tarihi nedir?", a: "29 Ekim 1923." },
      { q: "TBMM'nin açılışı ne zamandır?", a: "23 Nisan 1920." },
      { q: "Misak-ı Millî sınırlarını 3 yer sayınız.", a: "Trakya, Doğu Anadolu, Batı Anadolu kıyıları." },
      { q: "Cumhuriyetçilik ilkesi nedir?", a: "Egemenliğin kayıtsız şartsız millete ait olduğu, yönetimin halk tarafından seçilen temsilciler eliyle yürütüldüğü yönetim biçimidir. Saltanat ve hilafet sisteminin yerine geçen modern devlet anlayışıdır." },
      { q: "Milliyetçilik ilkesi nedir?", a: "Atatürk milliyetçiliği, ırk, din ve mezhep ayrımı yapmayan, Türkiye Cumhuriyeti sınırları içinde yaşayan herkesi Türk milleti olarak kabul eden, barışçı ve insancıl bir milliyetçilik anlayışıdır. 'Yurtta sulh, cihanda sulh' ilkesiyle özetlenir." },
      { q: "Halkçılık ilkesi nedir?", a: "Toplumda sınıf ayrımının reddedilmesi, halkın yönetime katılması ve sosyal adaleti sağlayan bir ilkedir. Halk egemenliğini ve toplumsal eşitliği öngörür." },
      { q: "Devletçilik ilkesi nedir?", a: "Devletin ekonomik kalkınmada öncü rol oynaması, özel teşebbüsün yetersiz kaldığı alanlarda devletin ekonomiye müdahale etmesi ilkesidir. Karma ekonomi modelini benimser." },
      { q: "Laiklik ilkesi nedir?", a: "Din ve devlet işlerinin birbirinden ayrılması, devletin hiçbir dine dayalı olmaması, din ve vicdan özgürlüğünün sağlanması ilkesidir. Devlet, din konusunda tarafsızdır ve tüm dinlere eşit mesafede yaklaşır." },
      { q: "İnkılapçılık ilkesi nedir?", a: "Toplumsal değişim ve gelişimi sürekli kılma, çağdaş uygarlık seviyesine ulaşma ve bu seviyeyi geçme ilkesidir. Durağanlığa karşı sürekli ilerlemeyi öngörür." },
      { q: "Egemenlik nedir?", a: "Bir devletin kendi toprakları üzerinde tam bağımsız olarak karar verme ve uygulama yetkisidir. Atatürk'e göre egemenlik kayıtsız şartsız milletindir ve hiçbir kişi, kurum veya sınıfa devredilemez." },
      { q: "Atatürk'ün yaptığı başlıca inkılaplar nelerdir?", a: "**Siyasi İnkılaplar:** Saltanatın kaldırılması, Cumhuriyet'in ilanı, Halifeliğin kaldırılması. **Hukuki İnkılaplar:** Medeni Kanun, Ceza Kanunu, Ticaret Kanunu. **Eğitim İnkılapları:** Tevhid-i Tedrisat, Harf İnkılabı. **Toplumsal İnkılaplar:** Kıyafet İnkılabı, Kadın hakları, Soyadı Kanunu. **Kültürel İnkılaplar:** Takvim değişikliği, ölçü birimi değişikliği." },
      { q: "Tevhid-i Tedrisat Kanunu nedir?", a: "3 Mart 1924'te çıkarılan bu kanunla tüm eğitim kurumları Milli Eğitim Bakanlığı'na bağlanmış, eğitimde birlik sağlanmış ve medreseler kapatılmıştır." },
      { q: "Harf İnkılabı ne zaman yapıldı ve önemi nedir?", a: "1 Kasım 1928'de Arap harfleri yerine Latin harfleri kabul edildi. Bu inkılap okuma-yazma oranını artırmış, Batı kültürüyle bağları güçlendirmiş ve eğitimde modernleşmeyi hızlandırmıştır." },
      { q: "Medeni Kanun'un önemi nedir?", a: "17 Şubat 1926'da kabul edilen Türk Medeni Kanunu, İsviçre Medeni Kanunu'ndan uyarlanmıştır. Kadın-erkek eşitliğini sağlamış, çok eşliliği kaldırmış, evlilik ve boşanmayı düzenlemiş, modern hukuk sistemini getirmiştir." },
      { q: "Kıyafet İnkılabı nedir?", a: "25 Kasım 1925'te çıkarılan Şapka Kanunu ile fes ve sarık yasaklanmış, modern Batı kıyafetleri benimsenmiştir. Bu inkılap toplumsal modernleşmenin simgesi olmuştur." },
      { q: "Soyadı Kanunu ne zaman çıkarıldı?", a: "21 Haziran 1934'te çıkarılan bu kanunla herkesin soyadı alması zorunlu hale getirilmiş, modern kimlik sistemi kurulmuştur. Mustafa Kemal'e 'Atatürk' soyadı verilmiştir." }
    ]
  },
  {
    category: 'DEVLET VE HUKUK BİLGİSİ',
    icon: <Scale className="w-5 h-5" />,
    questions: [
      { q: "Anayasanın ilk 4 maddesini sayar mısınız?", a: "1. Madde: Devletin şekli (Türkiye Devleti bir Cumhuriyettir). 2. Madde: Cumhuriyetin nitelikleri (insan haklarına saygılı, Atatürk milliyetçiliğine bağlı, demokratik, laik ve sosyal bir hukuk Devleti). 3. Madde: Devletin bütünlüğü, resmi dili, bayrağı, milli marşı ve başkenti. 4. Madde: İlk üç maddenin değiştirilemeyeceği ve değiştirilmesinin teklif dahi edilemeyeceği." },
      { q: "Türk Silahlı Kuvvetleri'nin görevleri nelerdir?", a: "Türk Silahlı Kuvvetleri'nin temel görevi; Türk yurdunu ve Anayasa ile tayin edilmiş olan Türkiye Cumhuriyeti'ni kollamak ve korumaktır. Ayrıca, caydırıcılık sağlamak, uluslararası barışı destekleme harekatlarına katılmak ve doğal afetlerde halka yardım etmek gibi görevleri de vardır." },
      { q: "Milli Savunma Bakanı kimdir?", a: "(Bu bilgi güncel olarak değişebileceği için mülakat öncesi mutlaka kontrol edilmelidir. Şu anki Milli Savunma Bakanı Yaşar Güler'dir.)" },
      { q: "Anayasa nedir ve temel özellikleri nelerdir?", a: "Anayasa, bir devletin temel yapısını, yönetim biçimini, devlet organlarının görev ve yetkilerini, vatandaşların temel hak ve özgürlüklerini belirleyen en üstün hukuk kuralları bütünüdür. Diğer tüm kanunlar Anayasa'ya uygun olmak zorundadır." },
      { q: "Türkiye Büyük Millet Meclisi'nin (TBMM) temel görevleri nelerdir?", a: "Kanun yapmak, değiştirmek ve kaldırmak; bütçeyi görüşmek ve kabul etmek; para basılmasına karar vermek; savaş ilanına karar vermek; uluslararası antlaşmaları onaylamak ve denetim yetkisini kullanmaktır." },
      { q: "Milli Güvenlik Kurulu (MGK) nedir ve kimlerden oluşur?", a: "Cumhurbaşkanı başkanlığında toplanan; Cumhurbaşkanı yardımcıları, Adalet, Milli Savunma, İçişleri, Dışişleri Bakanları, Genelkurmay Başkanı, Kara, Deniz ve Hava Kuvvetleri Komutanlarından oluşan ve milli güvenlik siyasetinin belirlenmesiyle ilgili tavsiye kararları alan bir kuruldur." },
      { q: "NATO'nun kuruluş tarihi nedir?", a: "NATO (Kuzey Atlantik Antlaşması Örgütü), 4 Nisan 1949'da Washington D.C.'de kurulmuştur." },
      { q: "Türkiye NATO'ya ne zaman üye olmuştur?", a: "Türkiye, Kore Savaşı'na asker göndererek gösterdiği kararlılık ve stratejik konumu sayesinde 18 Şubat 1952'de NATO'ya üye olmuştur." },
      { q: "NATO'ya giriş tarihimiz nedir?", a: "18 Şubat 1952." },
      { q: "Anayasa'nın ilk 4 maddesi değiştirilebilir mi?", a: "Hayır, Anayasa'nın ilk 4 maddesi değiştirilemez ve değiştirilmesi teklif dahi edilemez." }
    ]
  },
  {
    category: 'GENEL KÜLTÜR VE MANTIK',
    icon: <Lightbulb className="w-5 h-5" />,
    questions: [
      { q: "Türkiye'nin komşularını sayınız.", a: "Türkiye'nin 8 sınır komşusu vardır: Kuzeybatıda Bulgaristan ve Yunanistan; kuzeydoğuda Gürcistan; doğuda Ermenistan, Azerbaycan'a bağlı Nahçıvan Özerk Cumhuriyeti ve İran; güneyde ise Irak ve Suriye." },
      { q: "4 bölgeye sınırı olan ilimiz hangisidir?", a: "Bilecik. Marmara, İç Anadolu, Ege ve Karadeniz bölgelerinin dördüne de sınırı olan tek ilimizdir." },
      { q: "8 kara komşumuz hangileridir?", a: "Yunanistan, Bulgaristan, Gürcistan, Ermenistan, Nahçıvan, İran, Irak, Suriye." },
      { q: "3 çevre denizimiz hangileridir?", a: "Karadeniz, Ege, Akdeniz." },
      { q: "En uzun nehrimiz hangisidir?", a: "Kızılırmak." },
      { q: "En yüksek dağımız hangisidir?", a: "Ağrı Dağı (5137 m)." },
      { q: "Başkentimiz neresidir?", a: "Ankara." },
      { q: "En büyük yüzölçümlü ilimiz hangisidir?", a: "Konya." },
      { q: "En kalabalık ilimiz hangisidir?", a: "İstanbul." },
      { q: "En büyük adamız hangisidir?", a: "Gökçeada." },
      { q: "En büyük gölümüz hangisidir?", a: "Van Gölü." },
      { q: "En büyük barajımız hangisidir?", a: "Atatürk Barajı." },
      { q: "En büyük havalimanımız hangisidir?", a: "İstanbul Havalimanı." },
      { q: "En büyük limanımız hangisidir?", a: "Ambarlı Limanı." },
      { q: "En büyük köprümüz hangisidir?", a: "1915 Çanakkale Köprüsü." },
      { q: "Miladi takvimin başlangıcı hangi olayı esas alır?", a: "Miladi takvim, Hz. İsa'nın doğumunu başlangıç (0 veya 1. yıl) olarak kabul eder." },
      { q: "Türkiye'nin coğrafi konumu hakkında ne biliyorsunuz?", a: "Türkiye, Asya ve Avrupa kıtalarını birleştiren stratejik bir konuma sahiptir. Üç tarafı denizlerle (Karadeniz, Ege, Akdeniz) çevrilidir. Komşuları Yunanistan, Bulgaristan, Gürcistan, Ermenistan, Nahçıvan (Azerbaycan), İran, Irak ve Suriye'dir." },
      { q: "Bir lider ile yönetici arasındaki temel fark nedir?", a: "Yönetici, mevcut düzeni ve kuralları uygulayarak işlerin doğru yapılmasını sağlar. Lider ise vizyon belirler, ilham verir ve insanları hedefe doğru motive ederek doğru işlerin yapılmasını sağlar. Liderlik, yöneticilikten daha geniş bir kavramdır." },
      { q: "S.O.S. neyin kısaltmasıdır ve ne anlama gelir?", a: "S.O.S. aslında bir kısaltma değildir. Mors alfabesinde kolayca ve belirgin bir şekilde gönderilebilen bir tehlike sinyalidir (...---...). Uluslararası bir acil durum sinyali olarak kabul edilir." },
      { q: "Türkiye'nin en büyük üç sorununu sayınız.", a: "Bu kişisel bir yorum sorusudur. Cevap verirken yapıcı olmak önemlidir. Örnek: Terörle mücadele, ekonomik istikrarsızlık ve dış politika sınamaları olarak sıralayabilirim. Ancak devletimiz bu sorunların üstesinden gelecek güce ve kararlılığa sahiptir." },
    ]
  },
  {
    category: 'GÜNCEL KONULAR VE ÇATIŞMALAR',
    icon: <Swords className="w-5 h-5" />,
    questions: [
      { q: "Ukrayna-Rusya Savaşının Nedenleri ve Özeti", a: "**Başlangıç:** 24 Şubat 2022. **Temel Nedenler:** NATO'nun doğuya doğru genişleme politikası, Ukrayna'nın Batı ile yakınlaşması, Rusya'nın Kırım'ı ilhakı (2014) ve Donbas bölgesindeki ayrılıkçı hareketlere verdiği destek, Rusya'nın Karadeniz'deki stratejik çıkarları. **Özet:** Rusya, Ukrayna'nın NATO'ya girmesini engellemek ve kendi etki alanını korumak amacıyla özel bir askeri operasyon başlattı. Savaş, konvansiyonel ve hibrit savaş taktikleriyle devam etmekte olup, küresel enerji ve gıda krizlerine yol açmıştır." },
      { q: "Suriye İç Savaşı'nın Nedenleri ve Özeti", a: "**Başlangıç:** 2011. **Temel Nedenler:** Arap Baharı'nın etkisiyle başlayan barışçıl gösterilerin Esad rejimi tarafından şiddetle bastırılması, etnik ve mezhepsel gerilimler, dış güçlerin müdahalesi. **Özet:** Savaş, rejim, muhalifler, terör örgütleri (IŞİD, YPG/PKK) ve uluslararası aktörlerin (Rusya, ABD, Türkiye, İran) dahil olduğu çok katmanlı bir vekalet savaşına dönüşmüştür. Türkiye, sınır güvenliğini sağlamak ve terör koridorunu engellemek için operasyonlar düzenlemiştir." },
      { q: "İsrail-Filistin Çatışmasının Kökeni ve Güncel Durum", a: "**Kökeni:** 20. yüzyılın başlarına, Siyonist hareketin Filistin'de bir Yahudi devleti kurma hedefine ve 1948'de İsrail'in kurulmasına dayanır. **Temel Nedenler:** Toprak anlaşmazlığı, Kudüs'ün statüsü, Filistinli mülteciler sorunu ve yasa dışı Yahudi yerleşim yerleri. **Özet:** Yıllardır devam eden çatışma, son olarak Hamas'ın 7 Ekim 2023'teki saldırısı ve İsrail'in Gazze'ye yönelik başlattığı yoğun askeri operasyonlarla yeniden alevlenmiştir. Çatışma, büyük bir insani krize yol açmıştır." },
      { q: "Kıbrıs Barış Harekâtı'nın parolası neydi?", a: "Ayşe tatile çıksın." },
      { q: "Barış Pınarı harekât bölgesi neresidir?", a: "Tel-Abyad / Rasulayn." },
      { q: "Pençe serisinin son harekâtı (2024) hangisidir?", a: "Pençe-Kilit." },
      { q: "KAFKAS KAPLANI-2024 harekâtının hedefi neydi?", a: "PKK üst düzey yönetimi." },
      { q: "Mavi Vatan tatbikatına kaç ülke gözlemci katıldı?", a: "8 ülke." },
      { q: "15 Temmuz'un sembol isimleri kimlerdir?", a: "Ömer Halisdemir – Şehit Astsubay Ömer Halisdemir." },
      { q: "FETÖ'yü üç kelimeyle tanımlayınız.", a: "Hain – Sinsi – Din istismarcısı." }
    ]
  },
  {
    category: 'ÇEŞİTLİ MÜLAKAT SORULARI',
    icon: <Globe className="w-5 h-5" />,
    questions: [
      { q: "Kıta sahanlığı nedir?", a: "Bir devletin kara sularının bittiği yerden başlayan ve denizin jeolojik olarak kıta uzantısının devam ettiği, o devlete deniz yatağı ve altındaki kaynakları araştırma ve işletme hakkı veren alandır. Türkiye'nin Ege Denizi'ndeki kıta sahanlığı Yunanistan ile temel anlaşmazlık konularından biridir." },
      { q: "Türkiye'nin önemli doğalgaz ve petrol boru hatları nelerdir?", a: "Türkiye, bir enerji koridorudur. Başlıca hatlar: Bakü-Tiflis-Ceyhan (BTC) Petrol Boru Hattı, TANAP (Trans-Anadolu Doğal Gaz Boru Hattı), TürkAkım ve Mavi Akım Doğal Gaz Boru Hatları." },
      { q: "Türkiye'nin geliştirdiği insansız hava araçları (İHA/SİHA) nelerdir?", a: "Bayraktar TB2, Bayraktar Akıncı, TUSAŞ Anka, TUSAŞ Aksungur, Bayraktar Kızılelma (MİUS) ve Vestel Karayel gibi yerli ve milli üretim birçok İHA/SİHA bulunmaktadır." },
      { q: "Büyük Ortadoğu Projesi (BOP) nedir?", a: "ABD tarafından 21. yüzyılın başlarında ortaya atılan, Ortadoğu ve çevresindeki ülkelerin siyasi ve ekonomik yapılarının dönüştürülmesini hedefleyen bir projedir. Genellikle bölgeyi istikrarsızlaştırdığı yönünde eleştirilir." },
      { q: "3 tane terör örgütü sayar mısınız?", a: "PKK/KCK/YPG, FETÖ (Fethullahçı Terör Örgütü) ve DEAŞ (IŞİD)." },
      { q: "Ünlü Türk denizcileri kimlerdir?", a: "Piri Reis, Barbaros Hayreddin Paşa, Turgut Reis, Seydi Ali Reis ve Çaka Bey gibi tarihimizde önemli izler bırakmış birçok büyük Türk denizcisi vardır." }
    ]
  }
];

const AccordionItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-slate-800">
    <button
      className="w-full flex justify-between items-center p-5 text-left"
      onClick={onClick}
    >
      <h3 className="text-md font-semibold text-slate-200 hover:text-blue-400 transition-colors">{question}</h3>
      <ChevronDown
        className={`w-5 h-5 text-slate-500 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial="collapsed"
          animate="open"
          exit="collapsed"
          variants={{
            open: { opacity: 1, height: 'auto' },
            collapsed: { opacity: 0, height: 0 },
          }}
          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="overflow-hidden"
        >
          <div className="px-5 pb-5 text-slate-400 leading-relaxed whitespace-pre-line">{answer}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function InterviewQuestionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openAccordion, setOpenAccordion] = useState(null);

  const filteredData = useMemo(() => {
    let data = questionsData;

    if (selectedCategory !== 'all') {
      data = data.filter(group => group.category === selectedCategory);
    }

    if (!searchTerm) return data;

    const lowercasedFilter = searchTerm.toLowerCase();
    return data
      .map(group => {
        const filteredQuestions = group.questions.filter(
          item =>
            item.q.toLowerCase().includes(lowercasedFilter) ||
            item.a.toLowerCase().includes(lowercasedFilter)
        );
        if (filteredQuestions.length > 0) {
          return { ...group, questions: filteredQuestions };
        }
        return null;
      })
      .filter(Boolean);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="bg-slate-900 min-h-screen text-slate-300 font-sans">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 tracking-tight">Mülakat Bilgi Bankası</h1>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">MSÜ mülakatları için hazırlanmış kapsamlı sorular, cevaplar ve rehberler.</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sol Yan Menü - Kategoriler */}
          <aside className="lg:w-1/4 lg:sticky lg:top-8 self-start">
            <div className="mb-6 pb-6 border-b border-slate-800">
              <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                <span className="font-medium">Ana Sayfaya Dön</span>
              </Link>
            </div>
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2"><Hash className="w-5 h-5 text-blue-500" /> Kategoriler</h2>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${selectedCategory === 'all' ? 'bg-blue-600/90 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                <Globe className="w-5 h-5" /> Tümü
              </button>
              {questionsData.map(cat => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${selectedCategory === cat.category ? 'bg-blue-600/90 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
                  {cat.icon} {cat.category}
                </button>
              ))}
            </div>
          </aside>

          {/* Sağ Ana İçerik - Sorular */}
          <main className="flex-1">
            <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md mb-6 py-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Sorular ve cevaplar içinde ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl border border-slate-800">
              {filteredData.length > 0 ? (
                filteredData.map(group => (
                  <div key={group.category}>
                    {selectedCategory === 'all' && (
                      <h2 className="text-xl font-bold text-slate-200 p-5 border-b border-slate-800 flex items-center gap-3">
                        {group.icon} {group.category}
                      </h2>
                    )}
                    <div>
                      {group.questions.map((item, index) => (
                        <AccordionItem
                          key={index}
                          question={item.q}
                          answer={item.a}
                          isOpen={openAccordion === `${group.category}-${index}`}
                          onClick={() => setOpenAccordion(openAccordion === `${group.category}-${index}` ? null : `${group.category}-${index}`)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-slate-500">Aramanızla eşleşen sonuç bulunamadı.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
