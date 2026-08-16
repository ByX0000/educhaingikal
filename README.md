# EDUCHAIN

## AKADEMIK BASARILAR ICIN BLOK ZINCIRI TABANLI KAYIT SISTEMI

EduChain, ogrencilerin okul projelerine, yarismalara ve akademik etkinliklere katilimlarini degistirilemez ve dogrulanabilir kayitlar halinde saklamak icin gelistirilmis bir web uygulamasidir.

Uygulama, Firebase Firestore uzerinde tutulan blok verilerini React arayuzu ile gercek zamanli olarak gosterir. Yonetici paneli uzerinden ogrenci, proje ve katilim kayitlari eklenebilir; her katilim kaydi SHA-256 ile ozetlenerek zincire yeni bir blok olarak islenir.

## PROJENIN AMACI

Bu projenin temel amaci, ogrencilerin akademik calismalarini guvenilir bir dijital defterde saklamaktir. Geleneksel kayit sistemlerinde veriler sonradan degistirilebilir veya silinebilirken, EduChain blok zinciri mantigi sayesinde her kaydi onceki blokla kriptografik olarak baglar.

Boylece:

- Ogrenci basarilari dogrulanabilir hale gelir.
- Proje ve yarisma katilimlari kalici olarak saklanir.
- Kayit gecmisi seffaf bir defter uzerinden incelenebilir.
- Yetkisiz kullanicilarin veri eklemesi veya degistirmesi engellenir.

## ONE CIKAN OZELLIKLER

- Gercek zamanli blok zinciri defteri
- Ogrenci kaydi olusturma
- Proje ve yarisma kaydi olusturma
- Ogrenci-proje katilim kaydi ekleme
- SHA-256 tabanli blok ozeti hesaplama
- Baslangic blogu olusturma
- Onceki blok hash'i ile zincir butunlugu
- Firebase Authentication ile kullanici girisi
- Firestore guvenlik kurallari ile admin kontrolu
- Modern, hareketli ve duyarli React arayuzu

## TEKNOLOJI YIGINI

- React 19
- TypeScript
- Vite
- Firebase Authentication
- Firebase Firestore
- React Firebase Hooks
- Tailwind CSS
- Motion
- Lucide React
- js-sha256

## PROJE YAPISI

```text
educhain/
├── src/
│   ├── components/
│   │   ├── AdminPanel.tsx
│   │   ├── BlockchainLedger.tsx
│   │   └── Header.tsx
│   ├── lib/
│   │   ├── blockchain.ts
│   │   └── firebase.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── firestore.rules
├── firebase-applet-config.json
├── firebase-blueprint.json
├── security_spec.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## KURULUM

Projeyi calistirmak icin once bagimliliklari yukleyin:

```bash
npm install
```

Ardindan gelistirme sunucusunu baslatin:

```bash
npm run dev
```

Uygulama varsayilan olarak su adreste calisir:

```text
http://localhost:3000
```

## KULLANILABILIR KOMUTLAR

```bash
npm run dev
```

Gelistirme sunucusunu baslatir.

```bash
npm run build
```

Uretim icin uygulamayi derler.

```bash
npm run preview
```

Derlenmis uygulamayi onizleme modunda calistirir.

```bash
npm run lint
```

TypeScript tip kontrollerini calistirir.

## FIREBASE YAPILANDIRMASI

Proje Firebase ile calisir. Firebase ayarlari `firebase-applet-config.json` dosyasindan okunur.

Kullanilan Firebase servisleri:

- Authentication
- Firestore Database

Firestore koleksiyonlari:

- `students`
- `projects`
- `blocks`

Admin islemleri icin uygulamada belirli bir e-posta adresi kontrol edilmektedir. Yonetici yetkisi olmayan kullanicilar admin panelinden veri ekleyemez.

## BLOK ZINCIRI MANTIGI

Her blok su alanlardan olusur:

- `index`
- `timestamp`
- `data`
- `previousHash`
- `hash`
- `nonce`

Yeni bir blok olusturulurken:

1. Son blok Firestore uzerinden okunur.
2. Yeni blogun `index` degeri bir artirilir.
3. Yeni blogun `previousHash` alani son blogun `hash` degeriyle doldurulur.
4. SHA-256 ile yeni blok ozeti hesaplanir.
5. Basit Proof of Work mantigiyle uygun hash uretilir.
6. Blok Firestore `blocks` koleksiyonuna eklenir.

## GUVENLIK YAKLASIMI

Projede guvenlik icin temel olarak su kurallar hedeflenmistir:

- Bloklar herkese okunabilir.
- Blok olusturma sadece admin kullanicilar tarafindan yapilabilir.
- Var olan bloklar guncellenemez.
- Var olan bloklar silinemez.
- Ogrenci ve proje kayitlari sadece admin tarafindan yonetilebilir.
- Yeni blok, onceki blokla tutarli olmak zorundadir.

Detayli guvenlik notlari `security_spec.md` dosyasinda yer almaktadir.

## EKRANLAR

### CANLI DEFTER

Canli Defter ekrani, Firestore uzerindeki bloklari gercek zamanli olarak listeler. Her blokta ogrenci bilgisi, proje bilgisi, blok hash'i, onceki hash ve dogrulama durumu goruntulenir.

### YONETICI DUGUMU

Yonetici paneli uzerinden:

- Yeni ogrenci eklenebilir.
- Yeni proje veya yarisma eklenebilir.
- Ogrencinin bir projeye katilimi zincire yeni blok olarak islenebilir.

## VERI MODELLERI

### STUDENT

```ts
interface Student {
  id: string;
  name: string;
  grade: string;
  email?: string;
}
```

### PROJECT

```ts
interface Project {
  id: string;
  name: string;
  type: 'Project' | 'Competition' | 'Seminar';
  description: string;
  date: string;
}
```

### BLOCK

```ts
interface Block {
  index: number;
  timestamp: number;
  data: ParticipationRecord[];
  previousHash: string;
  hash: string;
  nonce: number;
}
```

## GELISTIRME NOTLARI

- Uygulama Vite ile gelistirilmistir.
- Arayuz React ve TypeScript kullanir.
- Blok hash islemleri `src/lib/blockchain.ts` dosyasinda bulunur.
- Firebase baglantisi `src/lib/firebase.ts` dosyasinda yapilandirilmistir.
- Firestore guvenlik kurallari `firestore.rules` dosyasinda tanimlanmistir.
