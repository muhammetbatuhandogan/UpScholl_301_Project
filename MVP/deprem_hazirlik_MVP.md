**DEPREM HAZIRLIK UYGULAMASI**

MVP Tanım Belgesi

*Versiyon 1.0 \| Nisan 2026*

*Gizli / Dahili Kullanim*

**İçindekiler**

1\. MVP Felsefesi ve Hedef \..... 3

2\. Sorun Tanımı \..... 3

3\. Kullanıcı Profili (Persona) \..... 4

4\. Kapsam --- Ne var, ne yok \..... 4

5\. Özellik Detayları \..... 5

6\. Kullanıcı Akışı \..... 7

7\. Teknik Yığın Önerisi \..... 8

8\. Başarı Metrikleri \..... 9

9\. Sprint Planı (8 Hafta) \..... 9

10\. Riskler ve Azaltma \..... 10

**1. MVP Felsefesi ve Hedef**

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Temel Fikir**                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                 |
| Mevcut deprem uygulamalarının tamamı reaktiftir --- deprem olunca bildirim gönderir. Bu uygulama proaktiftir: kullanıcıyı depremden ÖNCE hazır hale getirir. Tek cümlelik değer önerisi: \"Deprem geldiğinde değil, gelmeden önce yanındayım.\" |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

MVP\'nin tek odağı şudur: hazırlık skoru sisteminin çalıştığını kanıtlamak. Tüm diğer özellikler (bina analizi, DASK entegrasyonu, şirket lisansı) bu kanıttan sonra gelir.

**MVP Başarı Kriteri**

-   30 gün sonunda DAU/MAU oranı \> %25 (haftalık aktif kullanım)

-   Kullanıcı başına ortalama tamamlanan görev sayısı \> 3

-   İlk 1000 kullanıcıdan Store rating \> 4.3

-   Organik yayılma: kullanıcıların en az %20\'si \"arkadaşına gönder\" özelliğini kullandı

**2. Sorun Tanımı**

  ------------------------------------------------------------------------------------------------------------------------------------
  **Mevcut Durum (Acı Nokta)**                                                **Bizim Çözümümüz**
  --------------------------------------------------------------------------- --------------------------------------------------------
  İnsanlar depreme hazırlanmak istiyor ama \"nasıl başlayacağını\" bilmiyor   Adım adım görev sistemi --- bugün sadece 1 şeyi yap

  Deprem çantası hazırlama listesi karmaşık ve bunaltıcı                      Gamification: tamamla, puanla, arkadaşınla yarış

  Aile bireylerinin hazırlık durumu bilinmiyor                                Aile skoru: tüm üyelerin durumunu tek ekranda gör

  Hazırlık yapıldıktan sonra uygulama silinir (retention yok)                 Haftalık görev döngüsü ile sürekli geri dönüş sağlanır

  Deprem anında ne yapacağını bilmemek --- panik                              Offline çalışan hızlı rehber, tek tuş SOS
  ------------------------------------------------------------------------------------------------------------------------------------

**3. Kullanıcı Profili (Persona)**

**Birincil Persona --- \"Endişeli Ebeveyn\" Merve, 34**

İstanbul\'da kiralık dairede oturuyor. 2 çocuğu var (6 ve 9 yaş). Kahramanmaraş depremini izleyince \"ya bize olsaydı\" korkusuna girdi. Deprem çantası almak istedi ama ne alacağını bilmedi, erteledi. Sosyal medyada hazırlık içerikleri görünce ilgilenip sonra unutuyor.

-   Temel motivasyon: Çocuklarını korumak --- suçluluk duygusu çok güçlü

-   Engel: Başlangıç bariyeri yüksek, \"hepsini birden\" düşünmek bunaltıcı

-   Tetikleyici: Arkadaşı \"bu uygulamayı kullan\" dediğinde indirir

-   Ödeme isteği: Ailesinin güvenliği için ayda 49 TL öder

**İkincil Persona --- \"Bilinçli Genç\" Kaan, 27**

İzmir\'de solo yaşıyor, yazılımcı. Deprem konusunda bilinçli ama aksiyona geçemiyor. Oyun mekaniği ve puan sistemleri onu motive eder. Arkadaşlarıyla skor rekabeti yapar.

-   Temel motivasyon: Hazırlık skorunu arkadaşlarından yüksek tutmak

-   Tetikleyici: Store\'da öne çıkan uygulama, organik sosyal paylaşım

-   Ödeme isteği: Premium özellikleri merak ettiğinde aylık 29 TL öder

**4. MVP Kapsamı --- Ne Var, Ne Yok**

+---------------------------------------------------------------------------------------------------------------------------------+
| **Odak Kuralı**                                                                                                                 |
|                                                                                                                                 |
| MVP\'de olmayan her özellik, odağı böler ve lansman tarihini uzatır. Aşağıdaki \"yok\" listesi kasıtlıdır --- v2\'ye ertelendi. |
+---------------------------------------------------------------------------------------------------------------------------------+

  -------------------------------------------------------------------------------
  **MVP\'DE VAR ✓**                        **MVP\'DE YOK ✗ (Sonraki Versiyon)**
  ---------------------------------------- --------------------------------------
  Hazırlık skoru (0-100)                   Deprem anı erken uyarı bildirimi

  Haftalık görev sistemi (7 görev/hafta)   Bina deprem dayanıklılık analizi

  Deprem çantası kontrol listesi           DASK sigorta entegrasyonu

  Aile paylaşım modu (5 kişi)              Şirket / okul lisansı dashboard\'u

  Offline ilk yardım rehberi               AI chatbot / soru-cevap

  Tek tuş SOS (SMS konum gönderme)         Harita tabanlı risk görselleştirme

  Push notification (görev hatırlatma)     Deprem geçmiş veri analizi

  Sosyal paylaşım (skor paylaş)            Kullanıcı forum / topluluk

  Basit onboarding (3 adım)                Web uygulaması (sadece mobil)
  -------------------------------------------------------------------------------

**5. Özellik Detayları**

**5.1 Hazırlık Skoru Sistemi**

Uygulamanın kalbi. Kullanıcının hazırlık durumunu 0-100 arası bir skora dönüştürür. Skor 4 kategoriden hesaplanır:

  -----------------------------------------------------------------------------------------------------
  **Kategori**           **Ağırlık**   **Alt Metrikler**
  ---------------------- ------------- ----------------------------------------------------------------
  Deprem Çantası         %30           Temel malzeme (su, gıda, ilaç, belgeler, el feneri, düdük)

  Kaçış Planı            %25           Toplanma noktası belirlendi, aile bilgilendi, rota test edildi

  Bilgi & Hazırlık       %25           Tamamlanan görevler, izlenen rehberler, yapılan testler

  Aile Hazırlığı         %20           Aile üyelerinin ortalama skoru
  -----------------------------------------------------------------------------------------------------

-   Skor, push notification ile haftada 1 kez kullanıcıya hatırlatılır

-   \"Skorum 68 --- arkadaşım 74\" sosyal karşılaştırma motivasyon motoru olarak çalışır

-   Skor renk skalası: 0-40 kırmızı (kritik), 41-70 sarı (gelişiyor), 71-100 yeşil (hazır)

**5.2 Haftalık Görev Sistemi**

Her hafta 3 zorunlu + 2 opsiyonel görev. Görevler zorluk arttıkça değer kazanır. Örnek görev setleri:

-   **Bölgenin fay hattı riskini öğren (+5 puan)** Hafta 1 --- Farkındalık:

-   **İlk 3 çanta malzemesini satın al (+10 puan)** Hafta 1 --- Başlangıç:

-   **Aile toplanma noktasını belirle ve haritaya kaydet (+15 puan)** Hafta 2 --- Plan:

-   **Ailenle 3 dakikalık tahliye tatbikatı yap (+20 puan)** Hafta 3 --- Pratik:

-   **Bir aile üyesini uygulamaya davet et (+25 puan)** Hafta 4 --- Sosyal:

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Gamification Mekaniği**                                                                                                                                                                                       |
|                                                                                                                                                                                                                 |
| Görev tamamlandığında: (1) Ses efekti + skor animasyonu. (2) Skordaki artış önce büyük görünür, sonra yerine oturur. (3) \"Bu haftaki en iyi görev\" rozeti. Bu micro-reward döngüsü retention\'ın anahtarıdır. |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**5.3 Deprem Çantası Kontrol Listesi**

45 maddeden oluşan, kategorilere ayrılmış kontrol listesi. Her madde tamamlandığında çanta skoru artar. Kullanıcı fotoğraf çekerek onaylayabilir (opsiyonel --- güven mekanizması değil, deneyim için).

-   Su (kişi başı 3 gün = 9 litre), gıda (konserve, kuruyemiş, bisküvi)

-   İlk yardım kiti, kişisel ilaçlar (30 günlük stok)

-   Önemli belgeler (fotokopi + dijital yedek), nakit para (küçük kupür)

-   El feneri + yedek pil, düdük, çok amaçlı bıçak

-   Isı battaniyesi, yağmurluk, güçlü ayakkabı

-   Çocuklar için özel liste (ek madde seti otomatik eklenir)

**5.4 Aile Modu**

Bir \"aile grubu\" oluşturulur (max 5 kişi). Grup lideri (uygulamayı ilk kuran) diğerlerini davet eder. Aile dashboard\'unda her üyenin skoru görünür. \"En zayıf halka\" vurgulanır: ailenin genel skoru en düşük üyenin skoru tarafından sınırlandırılır --- bu mekanik, aile içi yardımlaşmayı tetikler.

-   Davet: SMS veya WhatsApp ile paylaşılan link

-   Gizlilik: Aile üyeleri birbirinin skor detayını görebilir, görev içeriğini göremez

-   Toplanma noktası: Harita üzerinde pin, offline erişilebilir

**5.5 Offline Acil Rehber**

İnternet gerektirmez. Uygulama ilk kurulduğunda rehber cihaza indirilir ve her güncellemede otomatik yenilenir. İçerik:

-   Deprem anında (masanın altına geç, \"çök-kapan-tutun\" tekniği)

-   Depremden hemen sonra (gaz vanasını kapat, hasarı değerlendir, binadan çık)

-   İlk 72 saat hayatta kalma rehberi

-   Enkazda kalma rehberi (düdük kullan, hareket et, ses çıkar)

-   Toplanma alanına gitme: Aile üyelerinin konumu (son senkronizasyondan)

**5.6 Tek Tuş SOS**

Uygulama ana ekranından erişilen kırmızı düğme. Basıldığında:

-   Önceden belirlenen 3 kişiye SMS gönderilir (internet gerektirmez)

-   SMS içeriği: Ad, konum koordinatları, zaman damgası, \"Deprem --- Güvende değilim\" mesajı

-   SMS başarısızsa 30 saniye sonra tekrar dener (telefon ağı kalabalıksa)

-   SOS gönderildikten sonra offline acil rehber otomatik açılır

**6. Kullanıcı Akışı**

**6.1 Onboarding (İlk Açılış --- 3 Adım, Maks 90 Saniye)**

  ----------------------------------------------------------------------------------------------------------
  **Adım**   **Ekran Adı**      **Kullanıcı Aksiyonu**            **Sistem Aksiyonu**
  ---------- ------------------ --------------------------------- ------------------------------------------
  1          Karşılama          \"Başla\" butonuna basar          Bölge seçimi + risk seviyesi göster

  2          Profil             Kaç kişilik aile? Çocuk var mı?   Kişiselleştirilmiş çanta listesi oluştur

  3          İlk Skor           Hazırlık skoru: 0 → animasyon     İlk 3 görevi ata, bildirim izni iste
  ----------------------------------------------------------------------------------------------------------

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Onboarding İlkesi**                                                                                                                                                                              |
|                                                                                                                                                                                                    |
| Kayıt formu yok. E-posta / şifre yok (en azından ilk versiyonda). Sadece telefon numarası ile anonim kullanım. Sürtüşme en aza indirilmeli --- kullanıcı uygulamayı ilk 60 saniyede terk etmemeli. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**6.2 Ana Ekran Hiyerarşisi**

Ana ekran 3 bölümden oluşur, her şey tek scroll\'da görünür:

-   Üst bant: Hazırlık skoru (büyük, renkli sayı) + haftalık değişim

-   Orta bölüm: Bu haftanın görevleri (3 kart, tamamlananlar yeşile döner)

-   Alt bölüm: Aile skoru özeti + en düşük skorlu üyenin görevi öner

**6.3 Retention Döngüsü**

  --------------------------------------------------------------------------------------------------------------
  **Zaman**         **Tetikleyici**                                      **Beklenen Aksiyon**
  ----------------- ---------------------------------------------------- ---------------------------------------
  Pazartesi 09:00   Push: \"Bu haftanın görevleri hazır\"                Uygulamayı aç, görevi gör

  Çarşamba          Push: \"2 görev kaldı, skorum artıyor\"              Eksik görevi tamamla

  Cuma 18:00        Push: \"Aile skorun 62, \[İsim\] henüz başlamadı\"   Aile üyesine hatırlat

  Pazar             Skor güncellemesi animasyonu                         Sonraki haftanın görevlerini merak et

  Aylık             \"Hazırlık Raporu\" özet bildirimi                   Gelişimi gör, paylaş
  --------------------------------------------------------------------------------------------------------------

**7. Teknik Yığın Önerisi**

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Yazılımcıya Not**                                                                                                                                                           |
|                                                                                                                                                                               |
| Bu öneriler cross-platform ilk versiyonu hızlıca çıkarmak için seçildi. Kendi tercihlerini buna göre uyarla. Kritik kısıt: offline çalışma ve offline içerik indirme zorunlu. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

  ---------------------------------------------------------------------------------------------------------
  **Katman**          **Öneri**                        **Neden**
  ------------------- -------------------------------- ----------------------------------------------------
  Mobil Framework     React Native (Expo)              Tek kod tabanı iOS + Android, hızlı prototip

  Yerel Veritabanı    WatermelonDB veya SQLite         Offline-first, skor hesaplama lokal çalışır

  Backend             Supabase (BaaS)                  Hızlı kurulum, auth, real-time, ücretsiz başlangıç

  Push Notification   Expo Notifications + FCM/APNs    Cross-platform, ücretsiz

  SMS (SOS)           Twilio veya Netgsm (TR)          SOS SMS için, Netgsm Türkiye\'de güvenilir

  Harita              react-native-maps                Toplanma noktası için, offline tile cache

  Analytics           PostHog (self-host veya cloud)   Açık kaynak, KVKK için veri konumunu kontrol et

  State Yönetimi      Zustand veya Redux Toolkit       Skor hesaplama için merkezi state şart
  ---------------------------------------------------------------------------------------------------------

**7.1 Offline Strateji**

-   İlk kurulumda tüm statik içerik (rehber, görev metinleri, çanta listesi) cihaza indirilir

-   Kullanıcı aksiyonları (görev tamamlama, skor güncelleme) önce local DB\'ye yazılır

-   İnternet gelince background sync ile sunucuya yansıtılır (conflict resolution: last-write-wins)

-   Aile skoru senkronizasyonu: online iken her 15 dakikada bir, offline iken son bilinen değeri gösterir

**7.2 KVKK Notları**

-   Konum verisi (SOS için) sadece kullanıcı izniyle ve sadece SOS anında toplanır

-   Aile üyesi verileri uçtan uca şifreli kanal üzerinden paylaşılır

-   Kullanıcı hesabını sildiğinde tüm veriler 30 gün içinde tamamen silinir

-   Açık rıza metni onboarding\'de gösterilir, log\'lanır

**8. Başarı Metrikleri**

  ----------------------------------------------------------------------------------------------
  **Metrik**              **Hedef (30. Gün)**     **Hedef (90. Gün)**   **Ölçüm Yöntemi**
  ----------------------- ----------------------- --------------------- ------------------------
  DAU/MAU Oranı           \> %20                  \> %30                Analytics (PostHog)

  Görev tamamlama oranı   \> %40 haftalık         \> %55 haftalık       Analytics

  Aile daveti gönderme    Kullanıcıların %25\'i   %40\'ı                Davet linkleri

  Uygulama store puanı    \> 4.2                  \> 4.4                App Store / Play Store

  Ortalama skor artışı    +15 puan/ay             +20 puan/ay           Skor delta hesabı

  D7 Retention            \> %35                  \> %40                Analytics cohort

  SOS testi kullanımı     Kullanıcıların %15\'i   %25\'i                SOS event log
  ----------------------------------------------------------------------------------------------

**9. Sprint Planı (8 Hafta)**

+---------------------------------------------------------------------------------------------------------------------------------------+
| **Varsayım**                                                                                                                          |
|                                                                                                                                       |
| Tek yazılımcı, full-time çalışma. Her sprint 1 haftadır. Sprint 6 sonunda Play Store beta, Sprint 8\'de genel yayın hedeflenmektedir. |
+---------------------------------------------------------------------------------------------------------------------------------------+

  ----------------------------------------------------------------------------------------------------------------------
  **Sprint**   **Tema**                 **Çıktılar**
  ------------ ------------------------ --------------------------------------------------------------------------------
  1            Temel altyapı            Expo kurulum, Supabase bağlantısı, WatermelonDB schema, offline sync taslağı

  2            Skor sistemi             Skor hesaplama motoru (lokal), 4 kategori ağırlık sistemi, skor UI

  3            Görev sistemi            7 görev/hafta veri modeli, tamamlama akışı, puan animasyonu, push notification

  4            Çanta listesi            45 madde listesi, kategori grupları, tamamlama skora yansıma, offline erişim

  5            Aile modu                Grup oluşturma, davet linki (SMS/WA), aile dashboard, toplanma noktası harita

  6            Acil özellikler + Beta   Offline rehber, SOS butonu (Netgsm), onboarding akışı, Play Store beta

  7            Cila + test              UX iyileştirmeleri, performans, beta geri bildirim düzeltmeleri, crash fix

  8            Lansman                  App Store başvurusu, Play Store genel yayın, ilk kullanıcı edinim kampanyası
  ----------------------------------------------------------------------------------------------------------------------

**10. Riskler ve Azaltma Stratejileri**

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Risk**                                                   **Seviye**   **Azaltma Stratejisi**
  ---------------------------------------------------------- ------------ -------------------------------------------------------------------------------------------------------------------------
  Kullanıcılar uygulamayı indirip 1 kez kullanıp terk eder   Yüksek       İlk hafta görevleri çok kolay ve hızlı yapılabilir olmalı. D3 push kampanyası. Aile daveti ilk haftada teşvik edilmeli.

  SOS SMS\'i deprem anında iletilmez (şebeke kalabalığı)     Orta         Retry mekanizması (30sn ara ile 3 deneme). Bluetooth Low Energy ile yakındaki telefona aktarma (v2).

  KVKK uyumsuzluğu / konum veri ihlali                       Orta         Konum sadece SOS anında ve açık izinle. Veri işleme politikası avukattan geçirilmeli lansman öncesi.

  Mevcut deprem uygulamaları aynı özellikleri kopyalar       Düşük        Gamification + aile modu kombinasyonu kopyalanması zor. Topluluğu ve veriyi hızlıca büyüt.

  App Store / Play Store red (içerik politikası)             Düşük        Panik tetikleyici dil kullanma. Yıkıcı görsel yok. Bilgilendirici ton benimse.

  Tek geliştirici --- burnout / hız riski                    Orta         Sprint 5 sonunda en az 50 beta kullanıcısı olmadan Sprint 6\'ya geçme. Kendi sağlığını metrik yap.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Son Not --- MVP\'nin Ruhu**                                                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                             |
| Bu belge bir yol haritası, bir hapishane değil. Kullanıcılardan gelen ilk geri bildirimler herhangi bir özelliği değiştirebilir, silebilir veya önceliğini değiştirebilir. Önemli olan skor sistemi ile retention hipotezini 30 günde test etmek. Geri kalan her şey bu hipotezin sonucuna göre şekillenir. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
