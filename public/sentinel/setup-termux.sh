#!/data/data/com.termux/files/usr/bin/bash
# Sentinel phone setup — open Termux, paste the one-liner below, done.
# One-liner:
#   curl -sL https://aridon-v02.vercel.app/sentinel/setup-termux.sh | bash
set -e
pkg update -y
pkg install -y nodejs
mkdir -p ~/sentinel
cd ~/sentinel
BASE="https://aridon-v02.vercel.app/sentinel"
curl -sL "$BASE/aridon-sentinel-0.7.1.tgz" -o sentinel.tgz
curl -sL "$BASE/sentinel-phone.mjs" -o sentinel-phone.mjs
[ -f package.json ] || npm init -y >/dev/null 2>&1
npm install ./sentinel.tgz
echo ""
echo "--- Sentinel installed. Starting the phone monitor (Ctrl-C to stop) ---"
echo ""
node sentinel-phone.mjs
