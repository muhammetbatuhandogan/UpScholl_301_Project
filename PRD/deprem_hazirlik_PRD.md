**DEPREM HAZIRLIK UYGULAMASI**

Product Requirements Document (PRD)

*Versiyon 1.0 \| Nisan 2026 \| MVP Kapsamı*

  -----------------------------------------------------------------------
  **Alan**          **Bilgi**
  ----------------- -----------------------------------------------------
  Ürün Adı          Deprem Hazırlık Uygulaması (çalışma adı)

  Versiyon          1.0 --- MVP

  Hedef Platform    iOS 15+ ve Android 10+

  Durum             Geliştirme aşamasında

  Geliştirici       Solo --- Yazılımcı/Kurucu

  Hedef Pazar       Türkiye (v1), Deprem kuşağı ülkeler (v2+)
  -----------------------------------------------------------------------

**İçindekiler**

1\. Doküman Amacı ve Kapsam

2\. Ürün Genel Bakış

3\. Teknik Mimari ve Kısıtlar

4\. Özellik Modülleri

4.1 Kullanıcı Kimlik Doğrulama

4.2 Onboarding

4.3 Hazırlık Skoru Motoru

4.4 Haftalık Görev Sistemi

4.5 Deprem Çantası Modülü

4.6 Aile Modu

4.7 Offline Acil Rehber

4.8 SOS Butonu

4.9 Bildirim Sistemi

5\. Kullanıcı Hikayeleri (User Stories)

6\. Veri Modeli

7\. API Kontratları

8\. Edge Case ve Hata Yönetimi

9\. Güvenlik ve KVKK

10\. Performans Gereksinimleri

11\. Test Kabul Kriterleri

**1. Doküman Amacı ve Kapsam**

Bu PRD, deprem hazırlık uygulamasının MVP sürümünü geliştirmek için gereken tüm işlevsel gereksinimleri, kullanıcı hikayelerini, veri modelini, API kontratlarını ve test kabul kriterlerini tanımlar. Belge, geliştirme süresince referans kaynağı olarak kullanılır.

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Kapsam Sınırı**                                                                                                                                                      |
|                                                                                                                                                                        |
| Bu belge yalnızca MVP (v1.0) kapsamını içerir. Bina analizi, DASK entegrasyonu, şirket lisansı ve erken deprem uyarı sistemi v2 kapsamındadır ve bu belgede yer almaz. |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**Terimler ve Kısaltmalar**

  -----------------------------------------------------------------------------------
  **Terim**        **Açıklama**
  ---------------- ------------------------------------------------------------------
  Hazırlık Skoru   Kullanıcının 0-100 arası ölçülen toplam hazırlık puanı

  Aile Grubu       Uygulamayı birlikte kullanan max 5 kişilik grup

  Görev            Skoru artırmak için tamamlanması gereken haftalık aksiyon birimi

  Offline-First    İnternet bağlantısı olmadan temel işlevlerin çalışması mimarisi

  SOS              Deprem anında konum bilgisi içeren tek tuş acil SMS sistemi

  DAU/MAU          Günlük aktif kullanıcı / aylık aktif kullanıcı oranı

  KVKK             Kişisel Verilerin Korunması Kanunu (6698 sayılı)
  -----------------------------------------------------------------------------------

**2. Ürün Genel Bakış**

**2.1 Değer Önerisi**

+---------------------------------------------------------------------------------------------------------------------------------+
| **Temel Cümle**                                                                                                                 |
|                                                                                                                                 |
| \"Mevcut deprem uygulamaları deprem olunca devreye girer. Bu uygulama deprem gelmeden önce seni ve aileni hazır hale getirir.\" |
+---------------------------------------------------------------------------------------------------------------------------------+

**2.2 Kullanıcı Segmentleri**

  ---------------------------------------------------------------------------------------------------------
  **Segment**        **Tanım**                                    **Birincil İhtiyaç**   **Ödeme Niyeti**
  ------------------ -------------------------------------------- ---------------------- ------------------
  Endişeli Ebeveyn   25-45, çocuklu, şehirde kiracı/ev sahibi     Aile güvenliği         Yüksek

  Bilinçli Genç      20-30, solo yaşayan, teknoloji kullanıcısı   Hazırlık skoru         Orta

  Olgun Kullanıcı    45+, geniş aile koordinasyonu                Aile grubu yönetimi    Orta
  ---------------------------------------------------------------------------------------------------------

**2.3 Temel Varsayımlar**

-   Kullanıcılar deprem öncesi hazırlık için aktif motivasyona sahip --- uygulamayı önce merak, sonra korku tetikler

-   Aile modu viral büyümenin birincil kanalıdır --- davet linki organik yayılımı sağlar

-   Gamification (skor, görev, rozet) haftalık aktif kullanımı sürdürmek için yeterli motivasyon sağlar

-   Offline çalışma zorunludur --- deprem anında internet olmayabilir, şebeke düşebilir

-   Türkiye\'de SMS altyapısı deprem anında bile kısmen çalışır (Netgsm SLA garantisi)

**3. Teknik Mimari ve Kısıtlar**

**3.1 Mimari Prensipler**

  -----------------------------------------------------------------------------------------------------
  **Prensip**           **Uygulama**
  --------------------- -------------------------------------------------------------------------------
  Offline-First         WatermelonDB lokal DB; tüm okuma/yazma işlemleri önce lokale, sonra sync

  Güvenli Varsayılan    Konum verisi yalnızca SOS anında, açık izin sonrası toplanır

  İnce İstemci          Skor hesaplama lokal motorda çalışır, sunucu sadece senkronizasyon yapar

  Kademeli Yükleme      Acil rehber ilk kurulumda cihaza indirilir, güncellemeler arka planda çekilir

  Bağımsız Servis       SMS (SOS), push notification ve auth ayrı servis katmanlarında
  -----------------------------------------------------------------------------------------------------

**3.2 Teknik Yığın**

  ------------------------------------------------------------------------------------------------------------
  **Katman**       **Teknoloji**                   **Konfigürasyon Notu**
  ---------------- ------------------------------- -----------------------------------------------------------
  Mobil            React Native (Expo SDK 51+)     Expo managed workflow; EAS Build ile dağıtım

  Lokal DB         WatermelonDB + SQLite           Schema versiyon 1; migration stratejisi belgede 6.3\'te

  Backend/Auth     Supabase                        Row Level Security aktif; free tier → pro lansman öncesi

  Push             Expo Notifications + FCM/APNs   FCM v1 API; APNs sertifika yenileme takvimi

  SOS SMS          Netgsm REST API                 Tek yönlü SMS; fallback: sistem SMS API (Twilio)

  Harita           react-native-maps + MapLibre    Offline tile cache maks 50MB; toplanma noktası koordinatı

  Analytics        PostHog (EU cloud)              KVKK: event IP maskeleme aktif; kullanıcı ID anonim

  State            Zustand                         Skor store, görev store, aile store ayrı slice\'lar
  ------------------------------------------------------------------------------------------------------------

**3.3 Kısıtlar**

-   iOS 15 ve Android 10 minimum --- daha eski cihazlar desteklenmez

-   Offline rehber maksimum 15MB cihaz depolama kullanır

-   Aile grubu maksimum 5 kişi (v1); API bu limiti sunucu tarafında zorlar

-   SOS SMS lokal şebeke üzerinden gönderilir --- VoIP üzerinden değil

-   Supabase free tier: 500MB DB, 2GB storage; lansman öncesi pro\'ya geçilmeli

**4. Özellik Modülleri**

**4.1 Kullanıcı Kimlik Doğrulama**

Kullanıcı kaydı ve girişi telefon numarası + OTP ile yapılır. E-posta veya şifre gerektirmez. Sosyal giriş (Google/Apple) v2\'ye ertelenmiştir.

**İşlevsel Gereksinimler**

-   **Kullanıcı telefon numarası girerek 6 haneli OTP alır (SMS, Supabase Auth)** FR-AUTH-01:

-   **OTP 5 dakika geçerlidir, yanlış girişte 3 deneme hakkı; 3. hatada 10 dakika bekleme** FR-AUTH-02:

-   **Başarılı girişte JWT token lokal secure storage\'a yazılır (Expo SecureStore)** FR-AUTH-03:

-   **Token 30 gün geçerlidir; sessiz yenileme arka planda çalışır** FR-AUTH-04:

-   **Hesap silme talebi işlendiğinde tüm kişisel veri 30 gün içinde silinir** FR-AUTH-05:

**İşlevsel Olmayan Gereksinimler**

-   **OTP teslim süresi \< 5 saniye (P95)** NFR-AUTH-01:

-   **Auth işlemi sırasında hata logları kullanıcı kimliğini açık metin içermez** NFR-AUTH-02:

**4.2 Onboarding Akışı**

Kullanıcının uygulamayı ilk kez açmasından ana ekrana geçişine kadar olan 3 adımlı süreç. Hedef: 90 saniyeden kısa, sıfır form doldurma.

**Adım 1 --- Bölge ve Risk**

-   **Uygulama açılışında konum izni istenir (iOS: \"Kullanırken izin ver\", Android: precise location)** FR-ONB-01:

-   **İzin reddedilirse manuel şehir seçimi sunulur (81 il listesi, arama destekli)** FR-ONB-02:

-   **Seçilen bölgenin deprem risk seviyesi gösterilir (AFAD tehlike haritası verisi, statik JSON)** FR-ONB-03:

-   **Risk seviyesi 3 kategori: Yüksek (kırmızı), Orta (turuncu), Düşük (sarı)** FR-ONB-04:

**Adım 2 --- Profil**

-   **Aile büyüklüğü seçimi: 1 / 2 / 3 / 4 / 5+ kişi** FR-ONB-05:

-   **Çocuk var mı? Evet/Hayır --- Evet seçilirse çocuk odaklı görevler ve çanta ekleri aktifleşir** FR-ONB-06:

-   **Yaşlı veya engelli birey var mı? --- Evet seçilirse özel görev seti eklenir** FR-ONB-07:

-   **Profil verisi lokal DB\'ye yazılır, Supabase\'e senkronize edilir** FR-ONB-08:

**Adım 3 --- İlk Skor**

-   **Skor 0\'dan başlar; 3 saniyelik animasyonla gösterilir** FR-ONB-09:

-   **İlk 3 görev otomatik atanır ve ekranda önizlenir** FR-ONB-10:

-   **Push notification izni bu adımda istenir; izin metni şeffaf ve açıklayıcı olmalı** FR-ONB-11:

-   **Onboarding tamamlandı flag\'i lokal DB\'ye yazılır; uygulama bir daha onboarding göstermez** FR-ONB-12:

**4.3 Hazırlık Skoru Motoru**

Skor hesaplama tamamen istemci tarafında (lokal JS fonksiyon) çalışır. Sunucu yalnızca son skor değerini senkronize eder, hesaplamayı yapmaz.

**Skor Formülü**

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Hesaplama**                                                                                                                                                                            |
|                                                                                                                                                                                          |
| finalScore = (cantaScore \* 0.30) + (kasPlaniScore \* 0.25) + (bilgiScore \* 0.25) + (aileScore \* 0.20) Her alt skor 0-100 arasındadır. finalScore Math.floor ile tamsayıya yuvarlanır. |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**Alt Skor Hesaplama Kuralları**

-   **cantaScore: Tamamlanan çanta maddesi sayısı / toplam madde sayısı \* 100** FR-SCR-01:

-   **kasPlaniScore: (Toplanma noktası belirlendi ? 40 : 0) + (Aile bilgilendi ? 35 : 0) + (Tatbikat yapıldı ? 25 : 0)** FR-SCR-02:

-   **bilgiScore: Tamamlanan görev puanlarının toplamı / maksimum haftalık puan \* 100 (son 4 haftanın ağırlıklı ortalaması)** FR-SCR-03:

-   **aileScore: Aile üyelerinin finalScore ortalaması; aile grubu yoksa bu bileşen 0 kabul edilir ve ağırlık bilgiScore\'a aktarılır** FR-SCR-04:

-   **Skor her görev tamamlandığında, her çanta güncellemesinde ve her profil değişikliğinde yeniden hesaplanır** FR-SCR-05:

-   **Skor renk eşiği: 0-40 = #DC2626 (kırmızı), 41-70 = #D97706 (amber), 71-100 = #16A34A (yeşil)** FR-SCR-06:

**İşlevsel Olmayan Gereksinimler**

-   **Skor hesaplama \< 50ms (lokal, P99)** NFR-SCR-01:

-   **Skor Supabase\'e en fazla 60 saniyede bir yazılır (debounce); offline iken kuyrukta bekler** NFR-SCR-02:

**4.4 Haftalık Görev Sistemi**

Pazartesi 00:00\'da yeni görev seti yüklenir. Her set 3 zorunlu + 2 opsiyonel görev içerir. Görevler Supabase\'den çekilir ve lokal DB\'ye cache\'lenir.

**Görev Veri Yapısı**

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Görev Şeması (JSON)**                                                                                                                                                       |
|                                                                                                                                                                               |
| { id, title, description, category, points, difficulty: 1-3, targetAction, proofType: \'checkbox\'\|\'photo\'\|\'text\', weekNumber, profileTags: \[\'child\',\'elderly\'\] } |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

-   **Her hafta başında sunucudan görev seti çekilir; başarısız olursa önceki hafta görevleri gösterilir** FR-TSK-01:

-   **Görevler profil etiketlerine göre filtrelenir (çocuklu aile = çocuk görevleri dahil)** FR-TSK-02:

-   **Görev tamamlama: kullanıcı ilgili aksiyonu yapar, checkbox işaretler, puan anında güncellenir** FR-TSK-03:

-   **proofType: \'photo\' olan görevlerde fotoğraf opsiyoneldir --- zorunlu değil, deneyim için** FR-TSK-04:

-   **Tamamlanan görev geri alınamaz (checkbox kaldırılamaz)** FR-TSK-05:

-   **Hafta bitmeden tamamlanmayan görevler arşive taşınır, puan verilmez** FR-TSK-06:

-   **Toplam 40+ farklı görev içeriği başlangıçta hazır olmalı (tekrar süresi: min 4 hafta)** FR-TSK-07:

-   **Tamamlama animasyonu: skor sayacı artış efekti + kısa titreşim (haptik)** FR-TSK-08:

**4.5 Deprem Çantası Modülü**

45 maddeli, 5 kategoriye ayrılmış kontrol listesi. Tamamlanma durumu lokal DB\'de tutulur. Profil bazlı dinamik maddeler vardır.

-   **Kategoriler: Su & Gıda (9 madde), Sağlık (8 madde), Belgeler & Para (7 madde), Ekipman (11 madde), Giysi & Kişisel (10 madde)** FR-BAG-01:

-   **Çocuk profili aktifse +6 ek madde (bebek maması, ıslak mendil, oyuncak, ilaç vb.)** FR-BAG-02:

-   **Yaşlı/engelli profili aktifse +4 ek madde (yedek gözlük, işitme cihazı pili, yürüteç vb.)** FR-BAG-03:

-   **Madde tamamlandığında cantaScore anında yeniden hesaplanır** FR-BAG-04:

-   **\"Tümünü paylaş\" butonu: tamamlanmamış maddeleri WhatsApp\'a metin olarak kopyalar** FR-BAG-05:

-   **Madde detayında \"neden önemli\" açıklaması max 2 cümle** FR-BAG-06:

-   **Liste offline erişilebilir; ilk yükleme sonrası internet gerektirmez** FR-BAG-07:

**4.6 Aile Modu**

Bir kullanıcı \"aile grubu\" oluşturur ve diğerlerini davet eder. Grup üyeleri birbirinin skorunu görebilir.

-   **Grup oluşturma: otomatik 6 haneli davet kodu üretilir + paylaşılabilir deep link** FR-FAM-01:

-   **Davet linki: app://join?code=XXXXXX formatında; tarayıcıdan açılırsa Store\'a yönlendirir** FR-FAM-02:

-   **Gruba katılım: kod girişi veya link tıklaması ile; onay gerekmez (link güvenlik sağlar)** FR-FAM-03:

-   **Grup maksimum 5 üye; 5. kişi katılmaya çalışırsa hata mesajı gösterilir** FR-FAM-04:

-   **Aile dashboard\'u: her üyenin adı (kısaltılmış), skoru ve skor rengi gösterilir** FR-FAM-05:

-   **\"En zayıf halka\" vurgusu: en düşük skorlu üyenin kartı farklı kenarlık rengi ile belirtilir** FR-FAM-06:

-   **Aile skoru (aileScore) gerçek zamanlı hesaplanır; üye skor güncellemesi 5 dakika içinde yansır** FR-FAM-07:

-   **Toplanma noktası: grup lideri harita üzerinde pin koyar, tüm üyeler görür ve offline cache\'ler** FR-FAM-08:

-   **Gruptan ayrılma: üye istediği zaman çıkabilir; çıkan üyenin skoru aile skorundan düşer** FR-FAM-09:

-   **Gizlilik: üyeler birbirinin görev içeriğini göremez, yalnızca final skoru görür** FR-FAM-10:

**4.7 Offline Acil Rehber**

İnternet gerektirmeyen statik içerik. İlk kurulumda cihaza indirilir (\< 5MB). Her uygulama güncellemesinde arka planda yenilenir.

-   **4 ana bölüm: Deprem Anında, Depremden Sonra (ilk 1 saat), İlk 72 Saat, Enkazda Kalma** FR-GDE-01:

-   **Her bölüm numaralı adımlardan oluşur, max 12 adım per bölüm** FR-GDE-02:

-   **Içerik sade Türkçe, okuma seviyesi: 6. sınıf (SMOG indeksi hedefi)** FR-GDE-03:

-   **Rehber ana menüden tek dokunuşla erişilebilir (navigation stack dışında modal)** FR-GDE-04:

-   **Rehber açıkken ekran uyku moduna geçmez (keepAwake aktif)** FR-GDE-05:

-   **İçerik versiyonlanır; sunucuda yeni versiyon varsa arka planda indirilir, sonraki açılışta aktif olur** FR-GDE-06:

**4.8 SOS Butonu**

Ana ekranda kalıcı kırmızı düğme. Basıldığında önceden belirlenen kişilere SMS gönderir. İnternet gerektirmez.

-   **SOS alıcıları (max 3 kişi) ayarlar ekranında önceden girilir; isim + telefon numarası** FR-SOS-01:

-   **SOS basıldığında önce onay diyaloğu: \"SOS gönderilsin mi?\" --- 3 saniye bekleyip otomatik iptal (yanlış basma önlemi)** FR-SOS-02:

-   **Onaylanırsa: Netgsm SMS API çağrısı yapılır; içerik: \"\[Ad Soyad\] deprem nedeniyle yardım istiyor. Konum: \[lat\],\[lon\]. Tarih: \[timestamp\]\"** FR-SOS-03:

-   **SMS başarısız olursa 30 saniye aralıkla 3 kez tekrar dener; hepsi başarısızsa lokal log\'a yazar** FR-SOS-04:

-   **SOS alıcısı yoksa butona basıldığında önce alıcı ekleme ekranı açılır** FR-SOS-05:

-   **SOS gönderildikten sonra offline acil rehber otomatik açılır** FR-SOS-06:

-   **SOS gönderimi lokal log\'a yazılır: timestamp, alıcılar, başarı/başarısız durumu** FR-SOS-07:

-   **Konum: SOS anında tek seferlik alınır; sürekli izleme değil** FR-SOS-08:

**4.9 Bildirim Sistemi**

Push notification\'lar kullanıcıyı haftada maksimum 3 kez rahatsız eder. Bildirim tercihleri ayarlardan kapatılabilir.

-   **Pazartesi 09:00: \"Bu haftanın görevleri hazır --- başlamaya hazır mısın?\"** FR-NOT-01:

-   **Çarşamba 18:00 (görev tamamlanmadıysa): \"\[X\] görev kaldı, skorum \[N\]\"** FR-NOT-02:

-   **Cuma 18:00 (aile üyesi görev yapmadıysa): \"\[İsim\] henüz başlamadı --- hatırlatır mısın?\"** FR-NOT-03:

-   **Bildirimler yerelleştirilmiş saatte gönderilir (kullanıcının timezone\'u)** FR-NOT-04:

-   **Bildirim tıklandığında ilgili ekran açılır (deep link)** FR-NOT-05:

-   **\"Rahatsız Etme\" modu: kullanıcı tüm bildirimleri tek toggle ile kapatabilir** FR-NOT-06:

**5. Kullanıcı Hikayeleri**

Her hikaye için kabul kriterleri (AC) ve öncelik seviyesi belirtilmiştir. Öncelik: P0 = lansman bloker, P1 = yüksek, P2 = orta.

  -----------------------------------------------------------------------
  **AUTH & ONBOARDING**

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------------------------------------------------------------------------------------
  **US-001** *Öncelik: P0 \| Story Point: 3*

  Ben bir yeni kullanıcı olarak, **telefon numaram ile 30 saniyede kayıt olabilmek istiyorum**, böylece hızlıca uygulamayı kullanmaya başlayabileyim.
  -----------------------------------------------------------------------------------------------------------------------------------------------------

-   **Telefon numarası +90 ile başlayan format; geçersiz formatta hata mesajı gösterilir** AC1:

-   **OTP 60 saniye içinde alınır** AC2:

-   **Yanlış OTP\'de \"X deneme hakkınız kaldı\" mesajı gösterilir** AC3:

-   **Başarılı girişte ana ekran açılır, onboarding başlar** AC4:

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **US-002** *Öncelik: P0 \| Story Point: 2*

  Ben bir kullanıcı olarak, **onboarding sırasında kaç kişilik aile olduğumu belirtmek istiyorum**, böylece uygulamanın bana özel görev ve çanta listesi oluşturabilmesi için.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

-   **1-5+ kişi seçeneği sunulur** AC1:

-   **Çocuk seçildiğinde otomatik çocuk görevleri eklenir** AC2:

-   **Profil verisi değiştirilebilir (ayarlar \> profil)** AC3:

  -----------------------------------------------------------------------
  **SKOR & GÖREV**

  -----------------------------------------------------------------------

  ---------------------------------------------------------------------------------------------------------------------------------------------------
  **US-003** *Öncelik: P0 \| Story Point: 5*

  Ben bir kullanıcı olarak, **hazırlık skorumu anlık görmek istiyorum**, böylece ne kadar hazır olduğumu ve ne kadar ilerlediğimi takip edebileyim.
  ---------------------------------------------------------------------------------------------------------------------------------------------------

-   **Skor ana ekranın üst bölümünde büyük, renkli rakamla gösterilir** AC1:

-   **Skor rengi eşik değerlerine göre değişir (kırmızı/amber/yeşil)** AC2:

-   **Görev tamamlandıktan sonra skor 3 saniye içinde güncellenir** AC3:

-   **Geçen haftaya göre değişim (+X veya -X) skoru yanında küçük gösterilir** AC4:

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **US-004** *Öncelik: P0 \| Story Point: 8*

  Ben bir kullanıcı olarak, **haftalık görevlerimi tamamlayarak skor kazanmak istiyorum**, böylece hazırlık sürecim küçük adımlarla ilerleyebilsin ve motive kalabileyim.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------

-   **Her hafta 3 zorunlu + 2 opsiyonel görev listelenir** AC1:

-   **Görev tamamlandığında checkbox yeşile döner, puan animasyonu oynar** AC2:

-   **Hafta bitmeden tamamlanmayan görevler \"kaçırılan görevler\" arşivine düşer** AC3:

-   **Pazartesi yeni görevler yüklenir; eski haftanın tamamlanmamışları görünmez** AC4:

  -----------------------------------------------------------------------
  **ÇANTA & AİLE**

  -----------------------------------------------------------------------

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **US-005** *Öncelik: P0 \| Story Point: 5*

  Ben bir kullanıcı olarak, **deprem çantamın içeriğini uygulama üzerinden takip etmek istiyorum**, böylece neyi aldığımı ve neyin eksik olduğunu her zaman bileyim.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------

-   **Tüm maddeler kategorilere göre gruplandırılmış listelenir** AC1:

-   **Tamamlanan madde sayısı / toplam üst kısımda gösterilir** AC2:

-   **Madde işaretlendiğinde cantaScore anında güncellenir** AC3:

-   **Offline erişilebilir: internet olmadan liste açılabilir ve güncellenebilir** AC4:

  ----------------------------------------------------------------------------------------------------------------------------------------------
  **US-006** *Öncelik: P1 \| Story Point: 8*

  Ben bir kullanıcı olarak, **aile üyelerimi gruba davet etmek istiyorum**, böylece ailemizin toplu hazırlık durumunu tek ekranda görebilelim.
  ----------------------------------------------------------------------------------------------------------------------------------------------

-   **Davet kodu veya link WhatsApp/SMS ile paylaşılabilir** AC1:

-   **Link tıklandığında uygulama kuruluysa direkt gruba katılır, kurulu değilse Store\'a yönlendirir** AC2:

-   **Grup dashboard\'unda her üyenin adı ve skoru görünür** AC3:

-   **En düşük skorlu üyenin kartı farklı renkte vurgulanır** AC4:

  -----------------------------------------------------------------------
  **ACİL & SOS**

  -----------------------------------------------------------------------

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **US-007** *Öncelik: P0 \| Story Point: 5*

  Ben bir kullanıcı olarak, **deprem anında tek dokunuşla aileme konumumu göndermek istiyorum**, böylece internet olmasa bile onların beni bulabilmesini sağlayayım.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------

-   **SOS butonu ana ekranda her zaman görünür, scroll\'lanarak kaybolmaz** AC1:

-   **Basıldığında 3 saniyelik onay diyaloğu açılır** AC2:

-   **SMS başarıyla gönderildiğinde yeşil onay gösterilir** AC3:

-   **SMS başarısız olursa kullanıcıya hata bildirimi + retry seçeneği sunulur** AC4:

-   **SOS testi: ayarlar ekranında \"test SMS gönder\" butonu bulunur** AC5:

  -----------------------------------------------------------------------------------------------------------------------------------------
  **US-008** *Öncelik: P0 \| Story Point: 3*

  Ben bir kullanıcı olarak, **internet olmadan acil rehbere erişmek istiyorum**, böylece deprem anında ne yapacağımı hızlıca görebileyim.
  -----------------------------------------------------------------------------------------------------------------------------------------

-   **Rehber uçak modunda (offline) açılabilir ve okunabilir** AC1:

-   **Açılış süresi \< 1 saniye** AC2:

-   **Rehber içeriği uygulama güncellemesi olmadan içerik güncellemesiyle değiştirilebilir** AC3:

**6. Veri Modeli**

**6.1 Supabase (Sunucu) Tabloları**

  ------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Tablo**          **Temel Alanlar**                                        **RLS Politikası**                  **Not**
  ------------------ -------------------------------------------------------- ----------------------------------- --------------------------------------------
  users              id, phone, created_at, profile_json                      Sadece kendi kaydı                  profile_json: aile büyüklüğü, şehir, flags

  scores             user_id, score, components_json, synced_at               Sadece kendi + aile grubu üyeleri   components_json: 4 alt skor

  tasks              id, week_number, title, points, category, profile_tags   Herkes okuyabilir                   Sunucu tarafında statik içerik

  task_completions   user_id, task_id, completed_at                           Sadece kendi kaydı                  Unique constraint: user_id + task_id

  bag_items          user_id, item_id, completed, updated_at                  Sadece kendi kaydı                  Soft delete yok; item_id statik listeden

  family_groups      id, code, leader_id, created_at                          Üyeler okuyabilir                   code: 6 hane, unique index

  family_members     group_id, user_id, joined_at                             Aynı grup üyeleri                   Cascade delete group silinince

  gathering_points   group_id, lat, lon, label, updated_at                    Aynı grup üyeleri                   Group başına 1 kayıt
  ------------------------------------------------------------------------------------------------------------------------------------------------------------

**6.2 WatermelonDB (Lokal) Şeması**

Lokal DB sunucu tablolarının alt kümesidir. Senkronizasyon Supabase Realtime üzerinden değil, pull-push cycle ile yapılır (bant genişliği verimliliği için).

-   Tablo: local_scores --- son hesaplanan skor ve bileşenler, dirty flag (sunucuya yazılmadıysa true)

-   Tablo: local_tasks --- bu haftanın görev listesi + tamamlama durumu

-   Tablo: local_bag_items --- tüm çanta maddelerinin tamamlama durumu

-   Tablo: local_family --- aile üyelerinin son bilinen skoru ve adı

-   Tablo: offline_guide --- rehber içeriği versiyon + JSON blob

-   Sync cycle: uygulama ön plana geçtiğinde + arka planda 15 dakikada bir tetiklenir

**7. API Kontratları**

**7.1 Supabase Auth Endpoint\'leri**

  ----------------------------------------------------------------------------------------------------------------------------------------------
  **Method**   **Endpoint**      **Request Body**                                   **Response**
  ------------ ----------------- -------------------------------------------------- ------------------------------------------------------------
  POST         /auth/v1/otp      { phone: \"+90\...\" }                             200: { message_id } \| 429: rate limit

  POST         /auth/v1/verify   { phone, token, type: \'sms\' }                    200: { access_token, refresh_token } \| 422: invalid token

  POST         /auth/v1/token    { grant_type: \'refresh_token\', refresh_token }   200: { access_token } \| 401: expired

  DELETE       /auth/v1/user     --- (Bearer token)                                 200: scheduled \| 401: unauthorized
  ----------------------------------------------------------------------------------------------------------------------------------------------

**7.2 Skor Senkronizasyon**

  -------------------------------------------------------------------------------------------------------------------------------------------
  **Method**   **Endpoint**                       **Request Body**                        **Response**
  ------------ ---------------------------------- --------------------------------------- ---------------------------------------------------
  PUT          /rest/v1/scores                    { score, components_json, synced_at }   200: { id } \| 409: conflict (last-write-wins)

  GET          /rest/v1/scores?user_id=eq.{id}    ---                                     200: \[ { score, components_json, synced_at } \]

  GET          /rest/v1/scores?group_id=eq.{id}   ---                                     200: \[ { user_id, score } \] (üye skoru listesi)
  -------------------------------------------------------------------------------------------------------------------------------------------

**7.3 Netgsm SOS SMS**

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **SOS SMS Request**                                                                                                                                                                                                    |
|                                                                                                                                                                                                                        |
| POST https://api.netgsm.com.tr/sms/send/get Params: usercode, password, gsmno (alıcı), message, msgheader (Sender ID) Response: 00 = başarılı \| 20 = hatalı mesaj \| 30 = geçersiz kullanıcı \| 70 = hatalı sorgulama |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

-   Sender ID: \"DEPREMHAZ\" (max 11 karakter, Netgsm\'den önceden onaylanmalı)

-   SMS mesaj şablonu: \"ACIL: \[Ad\] deprem nedeniyle yardim istiyor. Konum: \[lat\],\[lon\]. \[DD/MM HH:MM\]\"

-   Karakter sınırı: 160 karakter (tek SMS); koordinatlar kısaltılır gerekirse

-   API anahtarı Expo SecureStore\'da saklanır, kod içine yazılmaz

**7.4 Görev İçeriği CDN**

-   GET https://cdn.depremhazirlik.app/tasks/v{version}.json --- haftalık görev seti

-   GET https://cdn.depremhazirlik.app/guide/v{version}.json --- offline rehber içeriği

-   GET https://cdn.depremhazirlik.app/bag/v{version}.json --- çanta madde listesi

-   Versiyon kontrolü: ETag başlığı ile; eşleşiyorsa 304 Not Modified, bant genişliği korunur

**8. Edge Case ve Hata Yönetimi**

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Senaryo**                                      **Davranış**                                                                             **Kullanıcıya Gösterilen**
  ------------------------------------------------ ---------------------------------------------------------------------------------------- --------------------------------------------------------
  SOS sırasında GPS alınamıyor                     Son bilinen konum kullanılır; yoksa koordinatsız SMS gönderilir                          \"Konum alınamadı, SMS yine de gönderildi\"

  Aile üyesi uygulamayı siliyor                    family_members\'dan kaldırılır; aile skoru yeniden hesaplanır                            Diğer üyelere bildirim gönderilmez (gizlilik)

  5\. kişi gruba katılmaya çalışıyor               API 400 döner                                                                            \"Grup kapasitesi doldu (5/5)\"

  Skor hesaplama sırasında NaN oluşuyor            Tüm bileşenler 0 kabul edilir, skor 0 döner; Sentry\'e log gönderilir                    Skor gösterilir (0), sessiz hata

  Offline rehber indirilemedi (ilk kurulum)        Uygulama içinde bundle edilmiş fallback versiyon kullanılır                              \"Rehber yükleniyor\...\" spinner kısa süre gösterilir

  Görev içeriği çekilemiyor (API down)             Önceki hafta cache\'i gösterilir; yoksa boş durum ekranı                                 \"Görevler yüklenemedi, tekrar dene\"

  Telefon numarası değişikliği                     Yeni OTP ile yeni oturum; eski veriler yeni hesaba taşınmaz                              \"Yeni hesap oluşturuldu\"

  Aynı anda iki cihazdan giriş                     Her ikisi de geçerli (JWT tabanlı); son skor kazanır (last-write-wins)                   Kullanıcıya bildirilmez

  Uygulama arka plandayken deprem bildirimi (OS)   Uygulama kendi push\'unu gönderir; OS seviye bildirimleriyle çakışma yönetimi gerekmez   Her bildirim bağımsız görünür
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**9. Güvenlik ve KVKK**

**9.1 Veri Minimizasyonu**

-   Konum verisi yalnızca SOS anında, single-shot olarak toplanır; saklanmaz

-   Telefon numaraları hash\'lenerek Supabase\'de tutulur (plain text değil)

-   Analytics\'e gönderilen event\'lerde kullanıcı ID anonim UUID; telefon/isim gönderilmez

-   Fotoğraf kanıtı (opsiyonel görev): cihaz galerisi dışına çıkmaz, sunucuya yüklenmez

**9.2 Veri Depolama**

-   JWT token: Expo SecureStore (iOS Keychain, Android Keystore)

-   API anahtarları (Netgsm): SecureStore; bundle içine gömülmez

-   Supabase URL ve anon key: Expo Constants (bundle içinde, public kabul edilir)

-   Lokal DB (WatermelonDB): cihaz şifrelemesine tabi (iOS Data Protection, Android FDE)

**9.3 KVKK Gereksinimleri**

-   Onboarding\'de açık rıza metni sunulur ve onay lokal DB + Supabase\'e log\'lanır

-   \"Verilerimi sil\" talebi: uygulama içi ayarlar ekranından yapılabilir; 30 gün içinde işlenir

-   Çerez/izleme politikası: PostHog analytics kullanımı aydınlatma metninde belirtilir

-   Veri işleme sözleşmesi (DPA): Supabase ve Netgsm ile imzalanmalı

-   Veri ihlali prosedürü: 72 saat içinde KVKK Kurumu\'na bildirim; etkilenen kullanıcılara uygulama içi bildirim

**10. Performans Gereksinimleri**

  ---------------------------------------------------------------------------------------------------------
  **Metrik**                      **Hedef**               **Ölçüm**           **Araç**
  ------------------------------- ----------------------- ------------------- -----------------------------
  Uygulama soğuk başlatma (TTI)   \< 2 saniye             P95                 Flipper / Perfetto

  Offline rehber açılışı          \< 1 saniye             P99                 Jest + react-native-testing

  Skor hesaplama süresi           \< 50ms                 P99                 Performance.now() log

  Ana ekran frame rate            \>= 60fps               Ortalama            React Native Perf Monitor

  SOS SMS teslim süresi           \< 10 saniye            P95                 Netgsm webhook + log

  Skor sync gecikme               \< 60 saniye (online)   P95                 Supabase logs

  Uygulama bundle boyutu          \< 30MB (indirme)       Mutlak max          EAS Build çıktısı

  Offline içerik depolama         \< 15MB                 Mutlak max          Cihaz depolama ölçümü

  Crash-free oranı                \> %99.5                7 günlük ortalama   Sentry
  ---------------------------------------------------------------------------------------------------------

**11. Test Kabul Kriterleri**

**11.1 Birim Testler (Unit Tests)**

-   **Skor motoru: 20 farklı input kombinasyonu için beklenen output değerlerini doğrula** TCU-01:

-   **Skor formülü: aile üyesi yoksa aileScore ağırlığı bilgiScore\'a aktarılır --- doğrula** TCU-02:

-   **cantaScore: 0 madde tamamlandığında 0, tümü tamamlandığında 100 döner** TCU-03:

-   **Görev puan hesabı: haftalık maksimum puan aşılamaz** TCU-04:

-   **OTP retry: 3. başarısız denemede fonksiyon locked flag döner** TCU-05:

**11.2 Entegrasyon Testler**

-   **Onboarding → profil kaydı → lokal DB\'de profil_json doğrulanır** TCI-01:

-   **Görev tamamlama → skor güncellemesi → Supabase sync (mock) → dirty flag temizlenir** TCI-02:

-   **Aile davet linki → grup oluşturulur → üye katılır → aile dashboard güncellenir** TCI-03:

-   **SOS offline modda: Netgsm API erişilemiyor → retry kuyruğu oluşur → online olunca gönderilir** TCI-04:

-   **Offline rehber: uçak modunda tam içerik erişilebilir, içerik kayıpsız** TCI-05:

**11.3 UAT Kabul Kriterleri (Beta Kullanıcı)**

-   **10 beta kullanıcısının 8\'i onboarding\'i 90 saniyede tamamlamalı** UAT-01:

-   **10 beta kullanıcısının 9\'u SOS butonunu \"kolayca buldum\" diye işaretlemeli** UAT-02:

-   **10 beta kullanıcısının 7\'si ilk haftada en az 2 görev tamamlamalı** UAT-03:

-   **Offline rehber testi: 5 kullanıcı uçak modunda rehbere erişebilmeli, tümü başarılı** UAT-04:

-   **5 beta kullanıcısı aile grubu oluşturmalı ve en az 1 kişiyi davet etmeli** UAT-05:

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **PRD Sonraki Adımlar**                                                                                                                                                                                                                                                                |
|                                                                                                                                                                                                                                                                                        |
| Bu PRD onaylandıktan sonra: (1) Sprint 1 başlar --- auth + altyapı. (2) Her sprint sonunda PRD ilgili bölümü gözden geçirilir. (3) Beta geri bildirimleri doğrultusunda v1.1 PRD hazırlanır. Belge Notion/Linear\'a aktarılabilir; User Stories doğrudan ticket olarak kullanılabilir. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
