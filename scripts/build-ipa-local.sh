#!/usr/bin/env bash
set -e

echo "=== Memeriksa Keperluan Xcode ==="
if ! command -v xcodebuild &> /dev/null; then
    echo "Ralat: 'xcodebuild' tidak dijumpai. Sila pastikan Xcode.app telah dipasang dari App Store."
    exit 1
fi

echo "=== 1. Membina Web Bundle & Segerak Capacitor iOS ==="
npm run build
npx cap sync ios

echo "=== 2. Mengarkibkan Aplikasi iOS (xcodebuild) ==="
rm -rf build/App.xcarchive build/Payload build/SSATVLive.ipa
mkdir -p build

xcodebuild -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/App.xcarchive \
  archive \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  AD_HOC_CODE_SIGNING_ALLOWED=YES

echo "=== 3. Membungkus ke Format .ipa ==="
mkdir -p build/Payload
cp -r build/App.xcarchive/Products/Applications/App.app build/Payload/
cd build
zip -qr9 SSATVLive.ipa Payload

echo "=== SELESAI: Fail IPA berjaya dihasilkan di build/SSATVLive.ipa ==="
ls -lh SSATVLive.ipa
