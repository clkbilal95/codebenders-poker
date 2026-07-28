# 🃏 Codebenders Scrum Poker

Fibonacci puanlamalı, animasyonlu, birbirine yemek-içecek gönderilebilen eğlenceli Scrum Poker uygulaması.

---

## 🚀 Kurulum (Adım Adım)

### 1. GitHub'a Yükle

1. [github.com](https://github.com) → sağ üst köşe **"+"** → **"New repository"**
2. İsim: `codebenders-poker` → **"Create repository"**
3. Bilgisayarında terminal aç (Mac: Terminal, Windows: Git Bash)
4. Bu klasörü upload et:
   ```
   cd codebenders-poker
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/codebenders-poker.git
   git push -u origin main
   ```

---

### 2. Supabase Kur

1. [supabase.com](https://supabase.com) → **"Start your project"** → GitHub ile giriş
2. **"New project"** → İsim: `codebenders` → Şifre belirle → Create
3. 2 dakika bekle (proje kurulumu)
4. Sol menü: **"SQL Editor"** → **"New query"**
5. `SUPABASE_SETUP.sql` dosyasının içindeki SQL'i yapıştır → **"Run"** (▶️)
6. Sol menü: **"Settings"** → **"API"**
7. Şunları not al:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...`

---

### 3. Vercel'e Deploy Et

1. [vercel.com](https://vercel.com) → **"Sign Up"** → GitHub ile giriş
2. **"Add New Project"** → `codebenders-poker` reposunu seç → **"Import"**
3. **"Environment Variables"** bölümüne gir ve ekle:
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL'in
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key'in
4. **"Deploy"** tıkla → 2 dakika bekle
5. 🎉 Sitenin adresi hazır! (örn: `codebenders-poker.vercel.app`)

---

## 🎮 Nasıl Kullanılır?

1. **Scrum Master** → Siteye gir → "Yeni Oda Oluştur"
2. Oda linkini ekibe at (Slack/Teams)
3. Herkes isim ve avatar seçip giriyor
4. Scrum Master ticket başlığını yazıyor
5. Herkes kartını seçiyor (gizli)
6. Tüm oylar verilince "Oyları Aç!" butonu aktif oluyor
7. Oylar açılıyor, istatistikler görünüyor
8. Oylama sırasında birbirine 🍕☕🍺🎁 gönderebilirsiniz!

---

## ✨ Özellikler

- 🃏 Fibonacci kartları (1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕)
- 🎴 Kartlar açılana kadar gizli (kart çevirme animasyonu)
- 🎁 Birbirine yemek/içecek gönderme (uçan emoji animasyonu)
- 📊 Oy istatistikleri (ortalama, min, max, dağılım)
- ⚡ Yüksek fark uyarısı
- 👥 Realtime - anlık güncelleme
- 🌌 Animasyonlu yıldız arka plan
- 📋 Tek tıkla link kopyalama

---

## 🆓 Tamamen Ücretsiz

- Vercel: Ücretsiz plan (yeterli)
- Supabase: Ücretsiz plan (yeterli)
- Toplam maliyet: **0₺**
