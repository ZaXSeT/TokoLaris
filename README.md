# TokoLaris - Sistem Informasi Penjualan

Sistem Informasi Penjualan interaktif (Single Page Application) yang dibangun untuk memenuhi kebutuhan proyek PBO UAS "Sistem Informasi Penjualan Toko Laris Medan".

## Fitur Utama

- **Sistem Login Multi-Role**
  - **Kasir** (`kasir` / `123`): Akses ke portal transaksi penjualan, keranjang belanja, perhitungan harga, pembayaran tunai/QRIS, dan cetak struk.
  - **Pemilik** (`pemilik` / `123`): Akses ke dashboard admin, manajemen data barang (CRUD), kelola stok, dan rekapitulasi laporan penjualan (Harian, Bulanan, Tahunan).
- **Penyimpanan Lokal (Persistent)**: Menggunakan `localStorage` browser sehingga data barang dan riwayat transaksi tidak hilang saat halaman di-refresh.
- **Desain Responsif & Modern**: Menggunakan HTML5, CSS3 murni (Vanilla), dan Javascript, dengan desain antarmuka bergaya premium dan profesional.

## Struktur File
- `index.html` : Struktur utama aplikasi.
- `styles.css` : Sistem desain dan layout UI.
- `app.js` : Logika bisnis, _state management_, simulasi database, dan _routing_.

## Cara Menjalankan
1. Buka folder proyek ini.
2. Klik ganda pada file `index.html` untuk membukanya di browser pilihan Anda (Google Chrome, Mozilla Firefox, dll).
3. Anda tidak memerlukan instalasi web server (seperti XAMPP) karena sistem berjalan penuh di sisi _client_.

## Informasi Login
| Role | Username | Password |
| :--- | :--- | :--- |
| Kasir | `kasir` | `123` |
| Pemilik | `pemilik` | `123` |
