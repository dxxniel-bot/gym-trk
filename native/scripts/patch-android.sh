#!/usr/bin/env bash
# Ajusta el proyecto Android que genera `npx cap add android` (se regenera en cada build de CI).
set -euo pipefail
V=android/variables.gradle
M=android/app/src/main/AndroidManifest.xml

# Health Connect necesita API 26+
sed -i -E 's/minSdkVersion = [0-9]+/minSdkVersion = 26/' "$V"

# namespace tools para poder quitar permisos que declara el plugin
grep -q 'xmlns:tools' "$M" || sed -i 's#<manifest xmlns:android="http://schemas.android.com/apk/res/android"#<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools"#' "$M"

add_before_application(){ grep -q "$1" "$M" || sed -i "s#<application#$2\n    <application#" "$M"; }
# cámara: escáner de códigos y fotos de etiquetas de la app web
add_before_application 'android.permission.CAMERA"' '<uses-permission android:name="android.permission.CAMERA" />'
# historial de Health Connect más allá de 30 días (el plugin lo pide con requestHistoryAccess)
add_before_application 'READ_HEALTH_DATA_HISTORY' '<uses-permission android:name="android.permission.health.READ_HEALTH_DATA_HISTORY" />'
# app de solo lectura: fuera todos los WRITE_* de salud que trae el manifest del plugin
for P in STEPS DISTANCE ACTIVE_CALORIES_BURNED HEART_RATE WEIGHT SLEEP RESPIRATORY_RATE OXYGEN_SATURATION \
         RESTING_HEART_RATE HEART_RATE_VARIABILITY VO2_MAX BLOOD_PRESSURE BLOOD_GLUCOSE BODY_TEMPERATURE HEIGHT \
         FLOORS_CLIMBED BODY_FAT BASAL_BODY_TEMPERATURE BASAL_METABOLIC_RATE TOTAL_CALORIES_BURNED MINDFULNESS \
         HYDRATION NUTRITION EXERCISE; do
  add_before_application "WRITE_${P}\"" "<uses-permission android:name=\"android.permission.health.WRITE_${P}\" tools:node=\"remove\" />"
done

# versionCode = número de corrida de CI (cada APK instala encima del anterior)
sed -i -E "s/versionCode [0-9]+/versionCode ${BUILD_NUMBER:-1}/" android/app/build.gradle
grep -c 'uses-permission' "$M"
