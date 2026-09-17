#!/usr/bin/env bash
# Ajusta el proyecto iOS que genera `npx cap add ios` (se regenera en cada build de CI — nadie edita Xcode desde Windows).
set -euo pipefail
PL=ios/App/App/Info.plist
str(){ plutil -replace "$1" -string "$2" "$PL"; }
bool(){ plutil -replace "$1" -bool "$2" "$PL"; }

str NSHealthShareUsageDescription "gym//TRK lee pasos, sueño, frecuencia cardíaca y entrenamientos de Salud para relacionarlos con tus series, tu recuperación y tu comida. No escribe nada en Salud."
str NSHealthUpdateUsageDescription "gym//TRK no escribe datos en Salud."
# la app web ya usa cámara (escáner de códigos) y fotos (etiquetas nutricionales): sin estas claves iOS la cierra
str NSCameraUsageDescription "Para escanear códigos de barras y leer etiquetas nutricionales."
str NSPhotoLibraryUsageDescription "Para leer fotos de etiquetas nutricionales."
# respaldos exportados visibles en la app Archivos
bool UIFileSharingEnabled YES
bool LSSupportsOpeningDocumentsInPlace YES
bool ITSAppUsesNonExemptEncryption NO
str CFBundleDisplayName "gym//TRK"
str CFBundleShortVersionString "${APP_VERSION:-0.1.0}"
str CFBundleVersion "${BUILD_NUMBER:-1}"
plutil -lint "$PL"
