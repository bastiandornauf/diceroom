## Roadmap Overview - Pre-Rollout

### ⚡ Phase 1: Core Fixes (A, B, C)
  + Color & Name Backend → Funktionalität fertigstellen
  + Admin Access Control → Nur für dich sichtbar
  + Name Persistence Fix → Rejoin funktioniert korrekt

### 🎲 Phase 2: Advanced Room Features
  + System Presets Extended → Generic + Daggerheart + D&D 5e + WoD + Custom
  + Room-wide Variables → GM kann für alle setzen
  + Roll Presets → Vordefinierte Würfe pro System (quick rolls aber nicht generisch, quick rolls erstellen und speichernm evtl einfach aus der Roll-Bar)

### 👥 Phase 3: GM Features
  + GM Roll Requests → Request an Spieler mit Sichtbarkeitsoptionen
  + known Rooms Display → "Wo war ich schon" statt Code-Eingabe
  + Room Password Protection → Code + PW System

### 🛠 Phase 4: Polish & Rollout
  + Local Dice Roller → Dice Test → Standalone Roller (gleiches UI)
  + Webspace Rollout → Live-Deployment für Spieler-Tests
  + PWA optimisierung

### finale neue features. 
 - login link zu raum zum teilen, ggfs auch als qrcode
 - integriere Raum Infos in die Titeleiste
 - app icon und title bar (window name)

--------

# 🎲 DiceRoom - Progressive Web App for RPG Dice Rolling






[![PWA Ready](https://img.shields.io/badge/📱_PWA-Ready-4FACFE?style=for-the-badge)](#features)
[![Real-time](https://img.shields.io/badge/⚡_Real--time-Supabase-2ED573?style=for-the-badge)](#tech-stack)

## 🎯 **What is DiceRoom?**

DiceRoom ist eine webbasierte, installierbare Progressive Web App für RPG-Spielrunden. Spieler treten einem Raum bei und sehen alle Würfe live – inklusive detaillierter Aufschlüsselung (Explodes, Rerolls, Keep/Drop, Erfolge). Eine terminalartige Eingabe plus Schnellbuttons macht häufige Würfe extrem schnell.

**🎮 Modern Gaming Interface • 🎲 Universal Dice Engine • ⚡ Real-time Sync • 📱 Mobile-First PWA**

## ✨ **Current Features (v1.0 MVP)**

### 🎮 **Gaming Interface**
- ✅ **Modern Gaming UI**: Dark gradient design with glassmorphism effects
- ✅ **Mobile-First**: Responsive design optimized for all screen sizes  
- ✅ **PWA Ready**: Installable on mobile and desktop devices
- ✅ **Real-time Sync**: Live dice rolls synchronized across all players

### 🎲 **Dice Engine**
- ✅ **Universal Notation**: NdS, +/-, keep/drop (kh/kl/dh/dl), exploding (!), rerolls (r/ro)
- ✅ **Success Counting**: Count successes with >=X, >X, =X modifiers
- ✅ **Target Numbers**: Check total against target with t>=X
- ✅ **Daggerheart Support**: Native dh aN dN notation with Hope/Fear/Critical
- ✅ **Fate/Fudge Dice**: dF notation for -1/0/+1 dice
- ✅ **Advantage/Disadvantage**: adv/dis aliases for 2d20kh1/kl1

### 🎯 **Room System**
- ✅ **Create/Join Rooms**: Simple room codes for easy joining
- ✅ **Player Management**: Unique player colors and display names
- ✅ **Real-time Feed**: Live roll feed with detailed breakdowns
- ✅ **Anonymous Auth**: No registration required, instant play

### 📊 **Variables & UI**
- ✅ **Dynamic Variables**: Create, edit, and delete variables (@STR, @DEX, etc.)
- ✅ **Collapsible Panels**: Clean, organized interface elements
- ✅ **Quick Roll Buttons**: Color-coded buttons for different roll types
- ✅ **Color Picker**: Choose unique player colors with availability checking
- ✅ **Help System**: Comprehensive dice notation guide

## 🚀 **Tech Stack**

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **Dice Engine**: Web Crypto API + AST Parser
- **Design**: Custom CSS with gaming aesthetics

## 📋 **Project Status & Roadmap**

### ✅ **COMPLETED (v1.0)**
- [x] Core UI Redesign: Modern gaming interface
- [x] Variables System: Full CRUD with validation  
- [x] Dice Engine: Universal notation support
- [x] Real-time Rolls: Live synchronization
- [x] Color Picker: Unique selection system
- [x] Help System: Comprehensive documentation
- [x] PWA Features: Full-screen experience
- [x] Mobile Optimization: Touch-friendly design

### 🚧 **IN PROGRESS (v1.1)**  
- [ ] Player Color Backend Integration
- [ ] Name Persistence Fix
- [ ] Admin Access Control

### 📋 **PLANNED (v1.2+)**
- [ ] Session History ("Where was I?")
- [ ] GM Roll Requests System
- [ ] System Presets (Daggerheart, D&D 5e, WoD)
- [ ] Macro System & Room-wide Variables
- [ ] Whisper Rolls & Enhanced Privacy
- [ ] Server-side Rolls with Proofs

## 🎲 **Quick Dice Reference**

```
2d6          Basic dice
4d6kh3       Keep highest 3
3d6!         Exploding dice  
5d10>=7      Success counting
dh a2 d1     Daggerheart with advantage/disadvantage
1d20+@STR    Using variables
```

## 🚀 **Getting Started**

### **For Players**
1. Visit DiceRoom web app
2. Enter display name → Create/Join room  
3. Choose unique color → Start rolling!

### **For Developers**
```bash
git clone https://github.com/bastiandornauf/diceroom.git
cd diceroom && npm install
cp env.template .env.local  # Add Supabase credentials
npm run dev
```

## 🤝 **Contributing**

Key areas: New RPG systems, UI/UX improvements, dice mechanics, performance optimization.

---

**Made with ❤️ for the RPG community**  
*Where every roll matters, and every player is connected* 🎲✨
