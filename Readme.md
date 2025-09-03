# DiceRoom

## Projektbeschreibung

### Arbeitstitel

DiceRoom – geteilte, systemagnostische RPG-Würfel-PWA

### Elevator Pitch:
DiceRoom ist eine webbasierte, installierbare App (PWA) für Spielrunden. Spieler treten einem Raum bei und sehen alle Würfe live – inklusive detaillierter Aufschlüsselung (Explodes, Rerolls, Keep/Drop, Erfolge). Eine terminalartige Eingabe plus Schnellbuttons macht häufige Würfe extrem schnell. Variablen, Macros und Presets (z. B. Daggerheart, D&D 5e, WoD, Fate, Shadowrun) werden vom Spielleiter für den Raum bereitgestellt, so dass Spieler nur noch ihre Werte ausfüllen. Spielerfarben sind aus einer kuratierten Palette mit Eindeutigkeit pro Raum.

#### Zielgruppen:

  •	Spielleiter:innen, die Online-/Tischrunden mit gemeinsamen Würfeln führen wollen.
  •	Spieler:innen, die ohne Regelstudium schnell würfeln möchten.
  •	Systeme mit unterschiedlichen Mechaniken (Pool-Erfolge, D20, FATE, Daggerheart).

#### Wesentliche Ziele:

  1.	Synchrone, geteilte Würfe in Räumen (öffentlich/GM/whisper).
  2.	Einfachste Eingabe + Schnellbuttons, ohne lange Notation zu lernen.
  3.	System-Presets pro Raum (Variablen-Templates & Macros vordefiniert).
  4.	Fairness/Auditierbarkeit (Serverwürfe optional, Hash-Belege).
  5.	Null oder minimale laufende Kosten (statisches Hosting + Free-Tier Backend).


### Feature-Beschreibung

1) Räume & Rollen
	•	Räume mit Join-Code/Link.
	•	Rollen: GM und Player (GM kann Presets/raumweite Variablen/Macros setzen).
	•	Präsenz: Wer ist online; optionale Chat-Kurzzeile.

2) Spielerprofil
	•	Anzeige-Name (Pflicht).
	•	Spielerfarbe aus 16/32-Palette, einzigartig pro Raum (serverseitig garantiert).
	•	Optional: Avatar-Emoji.

3) Variablen
	•	User-Variablen (z. B. @STR, @AGI, @BONUS).
	•	Raum-Variablen (z. B. @TN, @DC) – vom GM vorgegeben, optional gesperrt.
	•	Sichtbarkeit: public, gm, private.
	•	Onboarding: Spieler werden beim Beitritt geführt, die vom Preset geforderten Variablen auszufüllen.

4) Macros & Presets
	•	Macros: Benannte Shortcuts, z. B. /attack = 1d20+@STR+@PROF t>=@AC.
	•	Presets pro System (raumweit vom GM importierbar):
	•	Variablen-Templates mit Label/Description/Default/Scope (user/room).
	•	Raum-Macros (z. B. „Daggerheart-Wurf“).
	•	Schnellbutton-Layout (z. B. dh, a+1, d+1, t>=).

5) Terminal-UI & Schnellbuttons
	•	Eingabezeile mit Autocomplete (Variablen @…, Modifikatoren wie kh, !, >=, r, a, d, t>=).
	•	Schnellbuttons: große Primäraktionen (z. B. „Daggerheart-Wurf“) + Chips (z. B. a+1, d+1, +1, t>=).
	•	History ↑/↓, Favoriten (Pin-Buttons), Fehlertooltips.

6) Würfelnotation – universell
	•	Grundform: NdS (z. B. 3d6), Operatoren + - * /, Klammern.
	•	Keep/Drop: khX / klX / dhX / dlX.
	•	Explode: ! (bei Max), !>=X / !>X / !=X; optional !x3 (Kettenlimit).
	•	Reroll: r<=X, r=1, ro<=X (once).
	•	Erfolge (pro Die): >=X, >X, =X → zählt Treffer.
	•	Gesamt-Zielwert: t>=X (auf Ergebnis nach Arithmetik).
	•	Fate/Fudge: dF (−1/0/+1).
	•	Adv/Dis Alias: adv d20 ≙ 2d20kh1, dis d20 ≙ 2d20kl1.
	•	Variablen: @NAME (user/raumweit).

7) Daggerheart (Duality Dice)

Notation: dh aN dN + … t>=X
	•	Wirf 2d12: hope, fear.
	•	Advantage: aN ⇒ wirf N× d6, höchsten addieren.
	•	Disadvantage: dN ⇒ wirf N× d6, höchsten subtrahieren.
	•	Gesamt: hope + fear + max(a) − max(d) + Boni.
	•	Tag: Hope wenn hope>fear, Fear wenn fear>hope, Critical bei Doubles.
	•	TN-Check: t>=X auf Gesamtwert.
	•	Beispiel-Macro (raumweit): „Daggerheart-Wurf“: dh a@ADV d@DIS + @BONUS t>=@TN.

8) Sichtbarkeit & Empfänger
	•	Public (alle sehen).
	•	GM-Only (nur GM & Werfer).
	•	Whisper (/w @alice 2d6+1 → nur ausgewählte Empfänger).

9) Ausgabe & Audit
	•	Zeile: Zeit • Name (Farbe) • Ausdruck • Total • Detail (Würfelaugen, explodes, gedroppt) • Erfolge/TN-Ergebnis • Tags (Hope/Fear/Critical).
	•	Audit-Hash (optional): SHA-256 über Parameter & Ergebnis.
	•	Autoritative Würfe (optional): Server/Function würfelt und signiert (Proof-Feld).

10) PWA & UX-Qualität
	•	Installierbar, Offline-Shell, letzte Historie/Presets lokal.
	•	Mobile-Optimierung, hoher Kontrast, Monospace, große Touch-Targets.
	•	DE/EN (Default DE).

## TechReader (Umsetzung)

### Statisches Frontend (IONOS/Webspace) + Supabase (Free-Tier)

Warum: echte Realtime, Auth & DB ohne eigenen Server, Free-Tier reicht i. d. R.
	•	Frontend: React + TypeScript + Vite (PWA), statisch auf IONOS.
	•	Backend (Supabase): Postgres + Realtime + Auth + RLS.
	•	Realtime: Postgres-Changes (LISTEN/NOTIFY) → Browser erhält Inserts/Updates.
	•	Auth: Magic-Link oder anonym + Display-Name.
	•	Kosten: 0 € im Free-Tier, Upgrade erst bei deutlichem Wachstum.

Kern-Tabellen (SQL-Skizze):

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text,
  system_preset text,              -- z.B. "daggerheart"
  join_code text unique not null,
  created_by uuid,
  created_at timestamptz default now()
);

create table public.players (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  color_id smallint not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (room_id, user_id)
);
create unique index players_room_color_unique on public.players(room_id, color_id);

create table public.variables (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  owner_user_id uuid,              -- NULL = raumweit
  key text not null,
  value jsonb not null,
  visibility text check (visibility in ('public','gm','private')) not null default 'public',
  updated_at timestamptz default now()
);

create table public.macros (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  owner_user_id uuid,              -- NULL = raumweit (GM)
  name text not null,
  expression text not null,
  sort_index int default 0,
  updated_at timestamptz default now()
);

create table public.rolls (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null,
  expression text not null,
  result jsonb not null,           -- detaillierter Breakdown
  total numeric not null,
  visibility text check (visibility in ('public','gm','whisper')) default 'public',
  recipients uuid[],               -- für whisper
  tag text,                        -- z.B. "Hope" | "Fear" | "Critical"
  tn jsonb,                        -- {op:'>=', value:15, pass:true}
  server_proof text,               -- optional: Proof-Hash
  created_at timestamptz default now()
);

-- (optional) Templates für Onboarding
create table public.variable_templates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  key text not null,
  label text not null,
  description text,
  default_value jsonb,
  required boolean default false,
  scope text check (scope in ('user','room')) not null
);

RLS-Policies (Prinzip):
	•	players: SELECT für Raum-Mitglieder; UPSERT nur auth.uid() = user_id.
	•	variables: SELECT für Raum-Mitglieder, abhängig von visibility; INSERT/UPDATE:
	•	owner = auth.uid() oder owner = NULL und Rolle = GM.
	•	macros: owner = auth.uid() oder owner = NULL (nur GM).
	•	rolls: SELECT wenn Mitglied und (visibility=public oder (gm & visibility=gm) oder (visibility=whisper & auth.uid() ∈ recipients)); INSERT nur Mitglieder.

Realtime-Flow:
	•	Client subscribt auf rolls (room_id) + players/variables/macros (room-scoped).
	•	Roll-Insert triggert Broadcast → alle Clients rendern sofort.

Fairness (optional):
	•	Edge Function /roll evaluiert serverseitig (CSPRNG via Web Crypto), erzeugt server_proof (SHA-256 über Raum|User|Expr|Seed|Result), schreibt rolls.

Vorteile: echte Realtime, saubere Rechte, kein eigener Server.
Risiken: Abhängigkeit von Drittanbieter (Free-Tier-Limits).

### B) Frontend (für beide Varianten identisch)

Stack: React + TypeScript + Vite → PWA.
State: UI-State (Zustand/Jotai), Server-State (Supabase-Client oder Fetcher).
Service Worker: App-Shell, zuletzt geladene Presets/History offline anzeigen.
Komponenten:
	•	Lobby/Wizard: Name, Farbe (Palette mit „belegt“/„frei“), Preset-Variablen (Form).
	•	Terminal: Eingabezeile mit Autocomplete, Output-Feed, History.
	•	Schnellbutton-Leiste: Primärbutton(s) + Mod-Chips.
	•	Variablen-Panel: Meine/raumweite Variablen (bearbeiten gem. Rechten).
	•	Macro-Panel: Raum-Macros (vom GM) + persönliche Macros.

Farbpaletten (ID→HEX→Name, Beispiele):
16-Palette: ocean #1f77b4, amber #ff7f0e, spruce #2ca02c, crimson #d62728, …
32-Palette erweitert (cornflower #3a86ff, amethyst #7b2cbf, teal #1b998b, …).
Serverseitig garantiert: UNIQUE(room_id,color_id).

Farb-Vergabelogik:
	•	Lade players → taken = Set(color_id).
	•	Vorschlag: erste freie ID (oder hash-basiert ab Startindex).
	•	Upsert → bei Unique-Fehler sofort Alternativfarbe anbieten.

### C) Dice-Engine (Evaluator)

Tokenizer → Parser → AST → Evaluator (deterministische Pass-Reihenfolge):
	1.	Würfeln (Web Crypto RNG).
	2.	Rerolls anwenden (r, dann ro).
	3.	Explode rekursiv (mit optionalem Limit).
	4.	Keep/Drop.
	5.	Per-Die-Erfolge oder Summe (wenn kein Erfolgs-Mod).
	6.	Arithmetik.
	7.	Gesamt-Target t… prüfen.

Daggerheart-Spezial:
	•	Node-Typ DaggerheartRoll { adv: number|@VAR, dis: number|@VAR }.
	•	Auswertung gemäß Regeln (2×d12, max(d6) add/sub, Tag, Critical bei Double, TN).
	•	Ausgabe: tag, critical, tn: {op,value,pass}, advDice, disDice, hope, fear.

Audit:
	•	Hash über {room,user,expr,expandedVars,rolls,total,ts} → server_proof (bei Serverwürfen), client_hash (bei Clientwürfen).

Tests:
	•	Unit-Tests pro Modifikator (kh/kl/dh/dl/!/r/ro/>=).
	•	Snapshot-Tests (Parser AST).
	•	RNG mockbar für deterministische Tests.
	•	Daggerheart-Sonderfälle: (a) keine a/d, (b) nur a, (c) nur d, (d) a&d, (e) Doubles.

### D) Sicherheit, Rechte, Datenschutz

Supabase (RLS):
	•	Zugriff nur für Raum-Mitglieder.
	•	GM-Only/Whisper per Row-Visibility (siehe rolls.visibility/recipients).
	•	variables/macros owner-basiert (Self vs. Raum/GM).

PHP-Variante:
	•	Raum-Token + Session-ID; einfache Rate-Limits (IP/User) auf roll.php.
	•	CSRF auf POST, Input-Validierung (Whitelist für Keys, Limits für Anzahl/Seiten/Zahlen).
	•	Prepared Statements für SQL.

Datenschutz:
	•	Keine Tracker, keine personenbezogenen Pflichtangaben außer Display-Name.
	•	Option: „Lokaler Speicher“ (Favoriten/History) nur im Browser.
	•	Lösch-/Verlassen-Funktionen (Profil/Variablen).
	•	Rechtliches: kurzer Datenschutzhinweis (keine Cookies außer technisch nötig).

### E) Deploy & Betrieb

Supabase-Variante:
	1.	Supabase-Projekt (EU) anlegen; URL/Key in .env.
	2.	SQL-Schema & RLS deployen.
	3.	Frontend vite build → dist/ auf IONOS hochladen.
	4.	Domain/HTTPS via IONOS (fertig).

PHP-Variante:
	1.	MySQL-Tabellen anlegen.
	2.	PHP-Endpunkte roll.php, feed.php, player_upsert.php, variables.php.
	3.	Frontend-ENV (API_BASE) setzen, dist/ hochladen.
	4.	Test: zwei Browser, Long-Polling-Flow prüfen.

Monitoring (leicht):
	•	Konsolen-Log in der App (dev-Toggle).
	•	Optional: einfache Health-Page /health (PHP) oder Supabase-Statusanzeige im UI.

### F) Performance-Budget
	•	Roll-Events: < 1 kB JSON/Insert.
	•	Polling (PHP): 15–30 s Long-Poll, Sofort-Reconnect; Server Timeout < 60 s.
	•	Supabase: Realtime-Events sofort, kaum Overhead.
	•	Client: Feed-Liste windowen (z. B. letzte 200 Zeilen im DOM).

### G) QA & Abnahme-Kriterien (MVP)
	•	Räume: Erstellen/Beitreten/Verlassen; Join-Code funktioniert.
	•	Profil: Name setzen, einzigartige Farbe enforced.
	•	Onboarding: Preset lädt; Variablen-Form erscheint; Pflichteinträge erzwungen.
	•	Notation: NdS, +/-, kh/kl/dh/dl, !, r/ro, >= (Erfolge), t>=, dF, Daggerheart dh aN dN.
	•	Sichtbarkeit: Public/GM/Whisper korrekt gefiltert.
	•	Realtime: 2+ Clients sehen Roll zeitgleich.
	•	Daggerheart: Hope/Fear/Tag/Critical/TN korrekt, a/d höchster d6.
	•	Schnellbuttons: Primär & Chips funktionsfähig; History/Favoriten.
	•	PWA: Installierbar, offline UI-Shell, keine Fehler.
	•	Ohne Doku nutzbar: Onboarding + Autocomplete + Beispiele reichen aus.

### H) Beispiel-Preset Daggerheart (JSON-Ausschnitt)

variable_templates

[
  {"key":"@STR","label":"Strength","description":"Körperkraft","default_value":0,"required":false,"scope":"user"},
  {"key":"@AGI","label":"Agility","description":"Beweglichkeit","default_value":0,"required":false,"scope":"user"},
  {"key":"@CON","label":"Constitution","description":"Zähigkeit","default_value":0,"required":false,"scope":"user"},
  {"key":"@BONUS","label":"Boni","description":"Allgemeiner Bonus","default_value":0,"required":false,"scope":"user"},
  {"key":"@ADV","label":"Advantages","description":"Anzahl Advantage-d6","default_value":0,"required":false,"scope":"user"},
  {"key":"@DIS","label":"Disadvantages","description":"Anzahl Disadvantage-d6","default_value":0,"required":false,"scope":"user"},
  {"key":"@TN","label":"Target Number","description":"Zielwert für Checks","default_value":12,"required":true,"scope":"room"}
]

raumweite macros

[
  {"name":"Daggerheart-Wurf","expression":"dh a@ADV d@DIS + @BONUS t>=@TN"},
  {"name":"Probe STR","expression":"dh a@ADV d@DIS + @STR t>=@TN"},
  {"name":"Probe AGI","expression":"dh a@ADV d@DIS + @AGI t>=@TN"}
]

Schnellbuttons (Empfehlung):
[ Daggerheart-Wurf ] [ a+1 ] [ a−1 ] [ d+1 ] [ d−1 ] [ +1 ] [ −1 ] [ t>= ]

### I) Kleine Code-Schnipsel

Farbvorschlag (Client):

function suggestFreeColor(taken:Set<number>, size=32, seed?:string) {
  if (!seed) for (let i=0;i<size;i++) if (!taken.has(i)) return i;
  const start = Math.abs([...seed].reduce((a,c)=>a*31+c.charCodeAt(0),7)) % size;
  for (let n=0;n<size;n++){ const i=(start+n)%size; if(!taken.has(i)) return i; }
  return null;
}

Daggerheart-Kern (Pseudo-TS):

const d12 = () => 1 + (crypto.getRandomValues(new Uint32Array(1))[0] % 12);
const d6  = () => 1 + (crypto.getRandomValues(new Uint32Array(1))[0] % 6);

function evalDh(adv=0, dis=0, mods:number[]=[], tn?:{op:string,value:number}) {
  const hope = d12(), fear = d12();
  const advs = Array.from({length:Math.max(0,adv)}, d6);
  const diss = Array.from({length:Math.max(0,dis)}, d6);
  const maxA = advs.length ? Math.max(...advs) : 0;
  const maxD = diss.length ? Math.max(...diss) : 0;
  const total = hope + fear + maxA - maxD + mods.reduce((a,b)=>a+b,0);
  const critical = hope === fear;
  const tag = critical ? 'Critical' : (hope > fear ? 'Hope' : 'Fear');
  const pass = tn ? compare(tn.op,total,tn.value) : undefined;
  return {hope,fear,advs,diss,maxA,maxD,total,tag,critical,tn: tn && {...tn, pass}};
}


### J) Warum dieser Plan „einfach nutzbar“ ist
	•	SL wählt Preset, die App zeigt nur relevante Variablen und liefert Buttons.
	•	Spieler geben Werte ein, tippen entweder einen Macro-Button oder „dh a@ADV d@DIS + @BONUS t>=@TN“, wobei Autocomplete/Tooltips helfen.
	•	Farben/Name sind in 2 Klicks erledigt und einzigartig geregelt.
	•	Notation ist mächtig, aber mit Beispielen und Buttons überbrückbar – niemand muss sie auswendig lernen.

## Feature-Erweiterung: SL-gestützte Roll-Requests

### Ziel

Der Spielleiter kann Würfe anfordern (individuell oder an alle Spieler), dabei Sichtbarkeit und Bezeichnung festlegen. Spieler sehen die Anfrage sofort im UI, können mit einem Klick würfeln, und die Ergebnisse werden zurückgeschickt und entsprechend markiert.

### Funktionsweise

Rollen
	•	Spielleiter (GM):
	•	sendet Roll-Requests → an alle Spieler oder eine Subset-Auswahl.
	•	wählt: Makro/Ausdruck oder freie Notation.
	•	definiert: Name/Bezeichnung des Wurfs (z. B. „Perception Check“).
	•	legt fest: Sichtbarkeit (public / gm-only).
	•	Spieler:
	•	erhalten Popup/Sidebar-Card: „GM verlangt Wurf: Perception Check (1d20+@WIS+@PROF)“.
	•	können Akzeptieren & Würfeln (per Klick oder Terminal).
	•	Ergebnis wird zurück an den Raum/GM geschickt, mit Marker „Antwort auf Roll-Request X“.

### UI-Erweiterung

Für GM
	•	Button „Roll anfordern“ im Terminal oder als Menüpunkt.
	•	Dialog:
	•	Titel/Bezeichnung (frei, z. B. „Perception“).
	•	Empfänger: [Alle Spieler] oder Auswahl-Checkboxen.
	•	Wurfdefinition: Dropdown aus Raum-Macros / freier Ausdruck.
	•	Sichtbarkeit: Radio Public / GM-only.
	•	Anzeige im Feed: „Roll-Request #42: Perception an [Alice, Bob,…]“. Ergebnisse hängen sich darunter an.

Für Spieler
	•	Notification (Banner oder Sidebar): „GM verlangt Wurf: Perception“.
	•	Button: „Jetzt würfeln“ → führt angegebenen Ausdruck automatisch aus.
	•	Optional: Spieler können den Ausdruck anpassen (z. B. wenn sie Sonderboni haben).
	•	Feed-Eintrag: „Alice → Perception = 17 (1d20+@WIS+@PROF)“.

### Datenmodell-Erweiterung

roll_requests

create table public.roll_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  gm_id uuid not null,
  label text not null,             -- "Perception Check"
  expression text not null,        -- z. B. "1d20+@WIS+@PROF"
  recipients uuid[],               -- NULL = alle Spieler
  visibility text check (visibility in ('public','gm')) not null default 'public',
  created_at timestamptz default now()
);

rolls bekommt ein Zusatzfeld:

alter table public.rolls add column request_id uuid references public.roll_requests(id);

### Flow

1.	GM erstellt Request → Insert in roll_requests.
2.	Clients (Spieler) → Subscribed auf roll_requests → erhalten neuen Request, wenn Empfänger sie einschließt oder recipients=NULL.
3.	Spieler würfeln → Insert in rolls, mit request_id = ….
4.	GM sieht Ergebnisse (gefiltert nach Request-ID) gesammelt.
5.	Feed-Darstellung:
	•	Request als Card mit Titel.
	•	Darunter Antworten der Spieler.
	•	Falls Spieler nicht würfeln → GM sieht offene Antworten.

### UX/Komfort
	•	Automatische Befüllung: Spieler sehen den fertigen Ausdruck; Klick = Wurf.
	•	Anpassbar: Eingabefeld erlaubt Modifikatoren einzutragen.
	•	Nicht-Blocking: GM kann Request senden, während das Spiel läuft. Spieler reagieren, wenn sie dran sind.
	•	Option „Auto-Roll“: Spieler können in Settings aktivieren, dass Requests sofort automatisch gewürfelt und zurückgesendet werden (für schnelle Systeme).

### Beispielnutzung
	•	GM klickt: „Roll anfordern → Alle → Label: Perception Check → Ausdruck: 1d20+@WIS+@PROF → Sichtbarkeit: GM-only“.
	•	Spieler sehen: „Bitte Perception Check“ (mit Knopf „würfeln“).
	•	Alice klickt → 1d20+3+2=17, Feed zeigt: „Alice: Perception Check = 17 (GM-only)“.
	•	Bob klickt später, Ergebnis hängt darunter.
	•	GM sieht gesammelt: Request #42, darunter alle Ergebnisse.

### Technischer Reader – Ergänzung

Daten
	•	roll_requests: neue Tabelle (siehe oben).
	•	rolls.request_id: Referenz auf Request.
	•	Unique Constraint (optional): (request_id,user_id) → jeder User nur eine Antwort pro Request.

Realtime
	•	Subscriptions auf roll_requests (nur Mitglieder sehen Requests, die sie betreffen).
	•	rolls ohnehin schon Realtime – GM filtert nach request_id.

Policies
	•	roll_requests:
	•	INSERT nur GM.
	•	SELECT: Spieler nur, wenn Mitglied & Empfänger oder recipients IS NULL.
	•	rolls:
	•	INSERT: Spieler nur in Antwort auf Requests, die sie betreffen (oder frei).
	•	SELECT: abhängig von visibility + Rolle (wie bisher).

Frontend
	•	GM-Seite: Button „Roll anfordern“ öffnet Dialog, schreibt roll_requests.
	•	Spieler-Seite: Abo auf neue Requests, UI zeigt Banner/Modal, Knopf zum Würfeln.
	•	Antwort senden: Insert in rolls mit request_id.
	•	Feed: Requests mit Label + zugehörigen Roll-Events.

Vorteil
	•	Spieler:innen müssen nicht nachfragen, was genau gewürfelt wird.
	•	SL spart sich „Meta-Kommunikation“, alles läuft im Tool.
	•	Erweiterbar für komplexe Checks (mehrere Würfe, Sequenzen).

