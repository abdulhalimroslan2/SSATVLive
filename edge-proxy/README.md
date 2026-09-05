# 🚀 Nginx Edge Cache Proxy (Kaedah 1: Paling Efisien & Ringan)

Sistem **Nginx Edge Cache Reverse Proxy** ini direka khas untuk membolehkan aplikasi web TV anda dikongsi kepada **100 pengguna serentak**, manakala pelayan sumber upstream (**ptv2026.com**, Astro Linear CDN, RTM, dll.) **hanya melihat 1 sambungan tunggal dan 1 alamat IP sahaja**.

---

## 🌟 Kenapa Kaedah Ini Paling Berkesan?

| Ciri | Tanpa Edge Proxy | Dengan Nginx Edge Cache Proxy |
| :--- | :--- | :--- |
| **Sambungan ke ptv2026** | 100 sambungan serentak (Risiko Ban 100%) | **1 sambungan tunggal sahaja** (Sifar Risiko) |
| **Penggunaan Jalur Lebar (100 Users)** | ~600 Mbps outbound dari ptv2026 | **~6 Mbps sahaja** (Jimat 99% bandwidth upstream!) |
| **Cap Jari Peranti (Fingerprint)** | 100 pelayar berbeza (Chrome, Safari, Firefox, Edge) | **1 peranti seragam:** Xiaomi MiTV Android STB |
| **Kelajuan Buffering** | Tertakluk kepada kesesakan pelayan upstream | **Sub-milisaat (<1ms)** terus dari RAM VPS |
| **Ketahanan Storan SSD** | Haus jika tulis ke disk berulang kali | **Sifar kehausan** (100% simpan di RAM `tmpfs`) |

---

## 🧠 Bagaimana Request Coalescing (`proxy_cache_lock`) Berfungsi?

1. Siaran langsung internet (HLS/DASH) menghantar video dalam bentuk serpihan fail kecil berdurasi 2 hingga 6 saat (`.m4s` atau `.ts`).
2. Apabila 100 pengguna menonton siaran langsung yang sama (cth: Astro SuperSport 1 atau HBO Hits), mereka semua akan meminta serpihan fail yang sama pada saat yang sama (cth: `chunk_1024.m4s`).
3. Tanpa proxy, 100 permintaan akan menyerang pelayan `ptv2026.com`.
4. Dengan **Nginx Request Coalescing (`proxy_cache_lock on;`)**:
   - Nginx akan **menahan (hold)** 99 pengguna selama beberapa milisaat.
   - Nginx hanya menghantar **1 permintaan sahaja** ke `ptv2026.com`.
   - Sebaik sahaja bait pertama diterima, Nginx menyimpannya ke dalam **RAM tmpfs** dan terus menyemburkannya kepada kesemua 100 pengguna secara serentak (multicast distribution).
   - Bagi pihak `ptv2026.com`, mereka hanya melayani **1 pengguna sahaja**!

---

## 🖥️ Cadangan VPS (Penyedia & Kos)

Untuk melayani 100 pengguna serentak dengan lancar:
- **Port Kelajuan Rangkaian:** Wajib **1 Gbps Port** (supaya VPS boleh menyembur 100 stream x 6 Mbps = 600 Mbps ke penonton tempatan).
- **RAM:** Minimum 1 GB RAM (Disyorkan 2 GB RAM untuk tmpfs cache).
- **Sistem Operasi:** Ubuntu 22.04 LTS / 24.04 LTS atau Debian 12.

### Pilihan Pembekal VPS Murah:
1. **Hetzner Cloud (Sangat Disyorkan)**:
   - Pelan: **CX22** (2 vCPU, 4GB RAM, 1 Gbps port, 20 TB Traffic).
   - Kos: ~€3.79/bulan (lebih kurang **RM18 - RM20 sebulan**).
   - Lokasi: Singapore (SG) atau Finland/Germany.
2. **Contabo VPS**:
   - Pelan: **Cloud VPS 1** (4 vCPU, 6GB RAM, 1 Gbps port, 32 TB Traffic).
   - Kos: ~€5.50/bulan (lebih kurang **RM28 sebulan**).
   - Lokasi: Singapore (paling pantas untuk Malaysia).
3. **OVHcloud / DigitalOcean / Linode**:
   - Pelan standard 1GB-2GB RAM (~$4 - $6/bulan).

---

## ⚡ Pemasangan 1-Klik (Turnkey Deployment)

### Langkah 1: Sambung ke VPS anda melalui SSH
```bash
ssh root@IP_VPS_ANDA
```

### Langkah 2: Muat naik folder `edge-proxy` atau salin terus ke VPS
Contoh salin dari komputer anda ke VPS:
```bash
scp -r edge-proxy root@IP_VPS_ANDA:/root/
```
Atau jika anda clone git:
```bash
cd /root/edge-proxy
```

### Langkah 3: Jalankan Skrip Pemasangan
```bash
sudo bash deploy.sh
```

Skrip ini akan secara automatik:
- Memasang Docker & Docker Compose (jika belum ada).
- Membuka port firewall (Port 80 HTTP, Port 443 HTTPS).
- Menjana sijil keselamatan SSL.
- Mengkonfigurasi 2,048 MB RAM `tmpfs` untuk cache video.
- Menghidupkan kontena Nginx dalam mod berterusan (`restart: always`).

---

## 🔍 Cara Menguji Status Cache (HIT vs MISS)

Selepas Nginx dihidupkan, buka Terminal dan jalankan:

```bash
bash test-proxy.sh http://IP_VPS_ANDA
```

Atau semak secara manual menggunakan `curl`:

```bash
# Permintaan pertama (Upstream fetch):
curl -I http://IP_VPS_ANDA/ptv2026/myunifi.mpd
# Anda akan melihat:
# X-Cache-Status: MISS

# Permintaan kedua (Dalam masa 2 saat):
curl -I http://IP_VPS_ANDA/ptv2026/myunifi.mpd
# Anda akan melihat:
# X-Cache-Status: HIT  <-- Diambil terus dari RAM dalam masa 0.0005 saat!
```

---

## 📱 Cara Menyambungkan Aplikasi Web TV ke VPS Edge Proxy

Terdapat 3 cara mudah untuk mengarahkan aplikasi web TV menggunakan VPS proxy ini:

### Kaedah A: Melalui Environment Variable Vercel (Paling Kemas)
Sekiranya aplikasi web anda di-host di Vercel (`https://ssalivetv.vercel.app`):
1. Buka **Vercel Dashboard** ➔ Pilih projek anda.
2. Pergi ke **Settings** ➔ **Environment Variables**.
3. Tambah pembolehubah baharu:
   - **Key:** `VITE_STREAM_PROXY_URL`
   - **Value:** `http://IP_VPS_ANDA` (atau `https://domain-anda.com` jika ada domain)
4. Tekan **Save** dan buat **Redeploy**.
5. Kini SEMUA penonton yang membuka laman web anda akan automatik menstrim melalui VPS Edge Cache Proxy anda!

### Kaedah B: Melalui Browser / Android TV Console (Serta-Merta Tanpa Rebuild)
Bagi mana-mana peranti atau pengguna yang sedang membuka aplikasi:
1. Buka Inspect Element (F12) ➔ Console (atau gunakan remote Android TV).
2. Taip arahan ini:
   ```javascript
   localStorage.setItem('custom_edge_proxy', 'http://IP_VPS_ANDA');
   ```
3. Refresh laman web. Aplikasi akan serta-merta menggunakan VPS tersebut!
4. Untuk batalkan kembali kepada proxy asal:
   ```javascript
   localStorage.removeItem('custom_edge_proxy');
   ```

### Kaedah C: Host Laman Web Terus di VPS (All-in-One)
Anda juga boleh meletakkan fail binaan frontend (`dist/`) ke dalam folder `edge-proxy/html/`:
```bash
# Di komputer lokal:
npm run build
scp -r dist/* root@IP_VPS_ANDA:/root/edge-proxy/html/
```
Nginx akan automatik menyajikan kedua-dua aplikasi web dan aliran strim serentak di alamat IP yang sama tanpa sebarang konfigurasi tambahan!

---

## 🛠️ Arahan Pengurusan Nginx

- **Semak Log Siaran Langsung & Cache:**
  ```bash
  docker compose logs -f
  ```
- **Hentikan Proxy:**
  ```bash
  docker compose down
  ```
- **Mulakan Semula Proxy:**
  ```bash
  docker compose restart
  ```
- **Lihat Penggunaan RAM Cache:**
  ```bash
  docker stats unifi_edge_proxy
  ```
