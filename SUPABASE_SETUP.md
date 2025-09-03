# Supabase Setup für DiceRoom

## 🎯 Schnellstart

### 1. Supabase Projekt erstellen
1. Gehe zu [https://supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt (wähle Region EU für DSGVO)
3. Warte bis das Projekt vollständig initialisiert ist

### 2. Credentials holen
1. Gehe zu **Settings** → **API**
2. Kopiere:
   - **Project URL** 
   - **anon / public** API Key

### 3. Environment konfigurieren
Erstelle `.env.local` im Projekt-Root:

```bash
VITE_SUPABASE_URL=https://deinprojekt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Database Schema deployen
1. Gehe zu **SQL Editor** im Supabase Dashboard
2. Kopiere den Inhalt von `supabase-schema.sql`
3. Führe das SQL aus
4. Prüfe dass alle Tabellen erstellt wurden

### 5. Testen
1. Starte die App: `npm run dev`
2. Wechsle zum **Supabase Integration Test** Tab
3. Klicke **Create New Room**
4. Bei Erfolg: ✅ Room wurde erstellt und in der Database gespeichert

## 📋 Schema Übersicht

Das SQL Schema erstellt folgende Tabellen:

### Core Tables
- **`rooms`** - Spiel-Räume mit Join-Codes
- **`players`** - Spieler in Räumen (mit Farben und Rollen)
- **`variables`** - User- und Raum-Variablen (@STR, @TN, etc.)
- **`macros`** - Gespeicherte Würfel-Shortcuts

### Dice System
- **`rolls`** - Alle Würfel-Ergebnisse mit Details
- **`roll_requests`** - GM kann Würfe von Spielern anfordern
- **`variable_templates`** - System-Presets (Daggerheart, D&D, etc.)

### Sicherheit (RLS)
- **Row Level Security** ist aktiviert
- Spieler sehen nur ihre eigenen Räume
- GM-only und Whisper-Rolls sind geschützt
- Variables haben Sichtbarkeits-Kontrolle

## 🔧 Fehlerbehebung

### "Supabase not configured"
- Prüfe `.env.local` Datei
- Restart der App nach Environment-Änderungen
- Prüfe Browser Console für Details

### "User not authenticated"
- Implementiere Supabase Auth (später)
- Aktuell verwendet Demo-Modus ohne Auth

### SQL Schema Fehler
- Prüfe ob alle Extensions aktiviert sind
- RLS Policies müssen nach Tabellen erstellt werden
- Bei Fehlern: Tabellen einzeln erstellen

## 🚀 Nächste Schritte

1. **Auth System** - Login/Magic Links implementieren
2. **Real-time** - Live Updates für Würfe
3. **UI Components** - Schöne Interfaces für Room/Player Management
4. **System Presets** - Daggerheart, D&D 5e, etc.

## 📚 Supabase Dokumentation

- [Getting Started](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time](https://supabase.com/docs/guides/realtime)
- [JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
