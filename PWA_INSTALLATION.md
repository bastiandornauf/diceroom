# PWA Installation Guide - DiceRoom

## Was ist eine PWA?

Eine Progressive Web App (PWA) ist eine Webanwendung, die wie eine native App funktioniert. Sie kann auf dem Gerät installiert werden und funktioniert auch offline.

## Installation der DiceRoom PWA

### Auf Desktop (Chrome, Edge, Firefox)

1. **Öffnen Sie DiceRoom in Ihrem Browser**
2. **Suchen Sie nach dem Installationssymbol:**
   - Chrome/Edge: Ein "+" Symbol in der Adressleiste oder ein Installationssymbol in der Symbolleiste
   - Firefox: Ein "+" Symbol in der Adressleiste
3. **Klicken Sie auf "Installieren" oder "App installieren"**
4. **Bestätigen Sie die Installation**

### Auf Mobile Geräten

#### Android (Chrome)
1. Öffnen Sie DiceRoom in Chrome
2. Tippen Sie auf das Menü (drei Punkte)
3. Wählen Sie "App installieren" oder "Zum Startbildschirm hinzufügen"
4. Bestätigen Sie die Installation

#### iOS (Safari)
1. Öffnen Sie DiceRoom in Safari
2. Tippen Sie auf das Teilen-Symbol (Quadrat mit Pfeil)
3. Wählen Sie "Zum Startbildschirm hinzufügen"
4. Bestätigen Sie die Installation

## PWA Features

### ✅ Offline-Funktionalität
- Die App funktioniert auch ohne Internetverbindung
- Automatisches Caching von Ressourcen
- Service Worker für Hintergrund-Updates

### ✅ App-ähnliche Erfahrung
- Vollbildmodus ohne Browser-UI
- Eigene App-Icons auf dem Startbildschirm
- Schneller Start und bessere Performance

### ✅ Automatische Updates
- Die App aktualisiert sich automatisch im Hintergrund
- Benutzer werden über verfügbare Updates informiert
- Nahtlose Update-Erfahrung

### ✅ Push-Benachrichtigungen
- Unterstützung für Push-Benachrichtigungen (geplant)
- Benachrichtigungen über neue Würfelwürfe
- Echtzeit-Updates in Spielräumen

## Technische Details

### Service Worker
- Automatisches Caching von statischen Ressourcen
- Offline-Fallback für API-Aufrufe
- Hintergrund-Synchronisation

### Web App Manifest
- App-Metadaten (Name, Beschreibung, Icons)
- Display-Modi (Standalone, Fullscreen)
- Theme-Farben und Hintergrundfarben

### Icons
- Verschiedene Größen für verschiedene Geräte
- Maskable Icons für adaptive UI
- Apple Touch Icons für iOS

## Entwicklung

### PWA-Test
```bash
npm run build
npm run preview
```

### PWA-Validierung
- Verwenden Sie Chrome DevTools > Lighthouse
- Testen Sie die PWA-Audit-Funktionen
- Überprüfen Sie die Manifest-Validierung

### Debugging
- Service Worker: Chrome DevTools > Application > Service Workers
- Manifest: Chrome DevTools > Application > Manifest
- Cache: Chrome DevTools > Application > Storage

## Browser-Unterstützung

### Vollständige Unterstützung
- Chrome 68+
- Edge 79+
- Firefox 90+
- Safari 14+

### Teilweise Unterstützung
- Safari iOS 14+ (keine Service Worker Updates)
- Ältere Browser (Fallback auf normale Web-App)

## Troubleshooting

### App installiert sich nicht
1. Überprüfen Sie, ob HTTPS aktiviert ist
2. Stellen Sie sicher, dass der Service Worker registriert ist
3. Überprüfen Sie die Browser-Konsole auf Fehler

### Offline-Funktionalität funktioniert nicht
1. Überprüfen Sie den Service Worker Status
2. Testen Sie das Caching in DevTools
3. Überprüfen Sie die Netzwerk-Tab auf fehlgeschlagene Requests

### Icons werden nicht angezeigt
1. Überprüfen Sie die Icon-Pfade im Manifest
2. Stellen Sie sicher, dass alle Icon-Größen vorhanden sind
3. Testen Sie die Icons in verschiedenen Browsern