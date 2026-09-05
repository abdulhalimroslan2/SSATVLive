#!/usr/bin/env bash
# =============================================================================
# CIDS TV - 1-CLICK NGINX EDGE CACHE PROXY DEPLOYMENT SCRIPT
# Kaedah 1: Nginx Edge Cache Proxy (Paling Efisien & Ringan)
# =============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "======================================================================"
echo "    🚀 CIDS TV - NGINX EDGE CACHE PROXY DEPLOYMENT (1-CLICK)          "
echo "    100 Pengguna Serentak ➔ 1 Sambungan Sahaja ke Upstream (ptv2026)  "
echo "======================================================================"
echo -e "${NC}"

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Sila jalankan skrip ini sebagai root atau gunakan 'sudo bash deploy.sh'${NC}"
  exit 1
fi

# 2. Update System Packages
echo -e "${YELLOW}📦 [1/6] Mengemas kini senarai pakej sistem...${NC}"
if command -v apt-get &>/dev/null; then
    apt-get update -y
    apt-get install -y curl wget git openssl ca-certificates ufw
elif command -v yum &>/dev/null; then
    yum update -y
    yum install -y curl wget git openssl ca-certificates
fi

# 3. Check and Install Docker & Docker Compose
echo -e "${YELLOW}🐳 [2/6] Memeriksa status Docker & Docker Compose...${NC}"
if ! command -v docker &>/dev/null; then
    echo -e "${BLUE}Memasang Docker secara automatik...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm -f get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker berjaya dipasang!${NC}"
else
    echo -e "${GREEN}✓ Docker sedia ada.${NC}"
fi

# Ensure docker compose plugin exists
if ! docker compose version &>/dev/null; then
    echo -e "${BLUE}Memasang docker compose plugin...${NC}"
    if command -v apt-get &>/dev/null; then
        apt-get install -y docker-compose-plugin
    fi
fi

# 4. Configure Firewall (Port 80 & 443)
echo -e "${YELLOW}🛡️ [3/6] Mengkonfigurasi firewall (UFW)...${NC}"
if command -v ufw &>/dev/null; then
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw allow 22/tcp || true
    echo -e "${GREEN}✓ Port 80, 443, dan 22 dibuka.${NC}"
fi

# 5. SSL Certificate Setup
echo -e "${YELLOW}🔒 [4/6] Menetapkan Sijil Keselamatan SSL...${NC}"
mkdir -p certs html

if [ ! -f certs/fullchain.pem ] || [ ! -f certs/privkey.pem ]; then
    echo -e "${BLUE}Menjana sijil SSL kendiri (Self-Signed 2048-bit) sebagai sandaran...${NC}"
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout certs/privkey.pem \
        -out certs/fullchain.pem \
        -subj "/CN=localhost" 2>/dev/null
    echo -e "${GREEN}✓ Sijil SSL kendiri dijana.${NC}"
else
    echo -e "${GREEN}✓ Sijil SSL sedia ada dikesan.${NC}"
fi

# 6. Launch Nginx Container with Docker Compose
echo -e "${YELLOW}⚙️ [5/6] Memulakan Nginx Edge Cache Proxy Container...${NC}"
docker compose down 2>/dev/null || true
docker compose up -d

# 7. Verification & Health Check
echo -e "${YELLOW}🔍 [6/6] Memeriksa status kesihatan pelayan...${NC}"
sleep 3

HEALTH_CHECK=$(curl -s http://127.0.0.1/health || true)
SERVER_IP=$(curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')

if [[ $HEALTH_CHECK == *"\"status\":\"ok\""* ]]; then
    echo -e "${GREEN}"
    echo "======================================================================"
    echo "  🎉 TAHNIAH! NGINX EDGE CACHE PROXY BERJAYA DIPASANG & BERFUNGSI!    "
    echo "======================================================================"
    echo -e "${NC}"
    echo -e "📍 ${GREEN}Alamat VPS Edge Proxy anda:${NC} http://${SERVER_IP}"
    echo -e "⚡ ${GREEN}RAM Cache (tmpfs):${NC} 2,048 MB (Aktif di Memori)"
    echo -e "🛡️ ${GREEN}Mod Penyamaran:${NC} Xiaomi MiTV Android STB (Disguised)"
    echo -e "🔗 ${GREEN}Request Coalescing:${NC} AKTIF (100 Users ➔ 1 Upstream Connection)"
    echo ""
    echo -e "${BLUE}Langkah Seterusnya:${NC}"
    echo "1. Semak status cache bila menonton siaran:"
    echo "   curl -I http://${SERVER_IP}/ptv2026/myunifi.mpd"
    echo "   (Lihat header: 'X-Cache-Status: HIT' atau 'MISS')"
    echo ""
    echo "2. Sambungkan web app frontend ke VPS Edge Proxy ini:"
    echo "   - Pada Vercel, tetapkan Environment Variable:"
    echo "     VITE_STREAM_PROXY_URL = http://${SERVER_IP}"
    echo "   - Atau pada pelayar web mana-mana pengguna, buka Console dan taip:"
    echo "     localStorage.setItem('custom_edge_proxy', 'http://${SERVER_IP}');"
    echo ""
    echo -e "${GREEN}Semua 100 pengguna kini menikmati penstriman lancar tanpa sebarang risiko sekatan daripada ptv2026.com!${NC}"
else
    echo -e "${RED}⚠️ Amaran: Healthcheck tidak memberi respons seperti yang dijangka.${NC}"
    echo "Sila semak log kontena dengan arahan: docker compose logs"
fi
