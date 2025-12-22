# Aurora Casino

Ein vollständiges Online-Casino als Schulprojekt mit modernem Frontend, sicherem Backend und verschiedenen Spielen.

**Live Demo:** [arora.up.railway.app](https://arora.up.railway.app/)

---

## Projektübersicht

**Aurora Casino** ist ein Web-basiertes Online-Casino mit echten Casino-Spielen, Benutzerregistrierung, Guthaltenverwaltung und Spielstatistiken.

### Hauptfunktionen
- Benutzerregistrierung und Login mit E-Mail-Verifizierung
- Startguthaben von 1000 Euro pro Spieler
- Verschiedene Casino-Spiele: Slots, Roulette, Coinflip, Texas Hold'em
- Echtzeit-Guthabenverwaltung
- Spielstatistiken und Verlaufsanzeige
- Verschlüsselte Passwörter und sichere Authentifizierung

---

## Architektur

Das Projekt besteht aus **zwei Hauptteilen**:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│   FRONTEND      │ ◄─────► │    BACKEND      │ ◄─────► │   DATENBANK     │
│   (React)       │  HTTP   │   (Express)     │   SQL   │  (PostgreSQL)   │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Frontend (Client)
- **Technologie:** React 19 + Vite + TailwindCSS
- **Aufgabe:** Benutzeroberfläche, Spiel-Darstellung, API-Kommunikation

### Backend (Server)
- **Technologie:** Node.js + Express
- **Aufgabe:** Spiellogik, Benutzerkonten, Datenverwaltung, E-Mail-Versand

### Datenbank
- **Technologie:** PostgreSQL
- **Aufgabe:** Speichert Benutzer, Guthaben, Spielrunden, Verifizierungs-Tokens

---

## Technologien

### Frontend
- React 19 - UI-Framework
- Vite - Build-Tool und Dev-Server
- TailwindCSS - Styling
- Framer Motion - Animationen
- React Router - Navigation

### Backend
- Node.js - JavaScript-Runtime
- Express.js - Web-Framework
- PostgreSQL - Datenbank
- bcryptjs - Passwort-Verschlüsselung
- nodemailer - E-Mail-Versand
- mailchecker - E-Mail-Validierung

---

## Registrierung (Sign-Up)

Der Registrierungsprozess umfasst mehrere Validierungsschritte:

### Erforderliche Felder
| Feld | Beschreibung |
|------|--------------|
| Username | Eindeutiger Benutzername |
| E-Mail | Gültige, nicht-temporäre E-Mail-Adresse |
| Passwort | Wird verschlüsselt gespeichert (bcrypt) |
| Straße | Mindestens 5 Zeichen |
| Stadt | Mindestens 2 Zeichen |
| Postleitzahl | Länderspezifisches Format |
| Land | Mindestens 2 Zeichen |

### Validierungsschritte

1. **E-Mail-Validierung** → [`server/server.js` Zeile 532-536](server/server.js#L532-L536)
   - Wegwerf-E-Mail-Adressen (temp-mail, guerrillamail, etc.) werden blockiert
   - Überprüfung durch [MailChecker](https://github.com/FGRibreau/mailchecker)

2. **Adress-Validierung** → [`server/server.js` Zeile 359-410](server/server.js#L359-L410)
   - Format-Prüfung aller Adressfelder
   - Postleitzahl-Format je nach Land (DE, AT, CH, US, GB, etc.)

3. **Adress-Verifizierung (OpenPLZ API)** → [`server/server.js` Zeile 412-483](server/server.js#L412-L483)
   - Für Deutschland, Österreich, Schweiz und Liechtenstein
   - Überprüft ob Postleitzahl und Stadt zusammenpassen
   - Optional: Straßenname-Verifizierung

4. **Passwort-Verschlüsselung** → [`server/server.js` Zeile 539-540](server/server.js#L539-L540)
   - Passwort wird mit bcrypt (Salt-Runden: 10) gehasht
   - Nur der Hash wird in der Datenbank gespeichert

### Nach erfolgreicher Registrierung
- Benutzer erhält automatisch **1000 € Startguthaben**
- Account ist sofort spielbereit

