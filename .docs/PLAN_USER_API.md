# PLAN: Interne Benutzer über die globale Config verwalten

## 1. Hintergrund / Problem

Die `internal-users` API-Endpoints (`add`, `patch/{id}`, `replace/{id}`, `delete/{id}`, `list`, `get/{id}`) existieren **nur im unreleased Main-Branch** von MediaMTX. In den veröffentlichten Versionen (v1.21.1, v1.21.2) gibt es diese Endpoints **nicht** — sie liefern `404`.

Beweis:
- `v1.21.1` OpenAPI: keine `internal-users`-Pfade (nur `GlobalConf.authInternalUsers` als Schema-Feld)
- `v1.21.2` OpenAPI: ebenfalls keine `internal-users`-Pfade
- `main`-Branch OpenAPI: hat `list` + `get/{id}` (unreleased)

Interne Benutzer sind in der **globalen Config** gespeichert (`authInternalUsers`). Deshalb müssen die **globalen Config-Endpoints** genutzt werden, um Benutzer zu verwalten.

## 2. Verfügbare Endpoints (veröffentlichte MediaMTX)

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/config/global/get` | Liefert die komplette globale Config inkl. `authInternalUsers` |
| `PATCH` | `/config/global/patch` | Patcht die globale Config (alle Felder optional) |

## 3. Ansatz

- **Laden**: `GET /config/global/get` → `authInternalUsers` (Array von Benutzern)
- **Speichern**: `PATCH /config/global/patch` mit `{ authInternalUsers: [...] }`
- **Kernregel**: Wenn ein Benutzer gespeichert wird, werden **ALLE Benutzer UND die globale Config zusammen** gespeichert. Es gibt keinen Einzel-Benutzer-Write — immer das komplette `authInternalUsers`-Array.

### Benutzer-Struktur (Schema `AuthInternalUser`)

```json
{
  "user": "any",
  "pass": "",
  "ips": ["127.0.0.1/32"],
  "permissions": [
    { "action": "publish", "path": "" },
    { "action": "read", "path": "" }
  ]
}
```

Wichtig: **kein `id`, kein `pos`**. Das sind nur Runtime-Felder des unreleased Main-Branch.

## 4. Identifikation eines Benutzers

Da es kein `id` gibt, wird ein Benutzer über seinen **Index (Position)** im `authInternalUsers`-Array identifiziert.

- Detail-Route: `/config/internal-users/{index}` (z. B. `/config/internal-users/0`, `/config/internal-users/1`)
- `index` ist 0-basiert und entspricht der Position im Array.

### ⚠️ Fragilität der Index-Identifikation

Wenn ein Benutzer **gelöscht** wird, verschieben sich die Indizes aller folgenden Benutzer. Eine Detail-URL, die auf Index `2` zeigt, würde nach einem Löschen auf einen anderen Benutzer zeigen.

**Minderung:**
- Nach jeder Mutation (Add/Delete/Replace) die Liste neu laden und die Navigation neu auslösen.
- In der Detailseite den Index als "Momentaufnahme" behandeln — nach dem Speichern zurück zur Liste navigieren (nicht auf dem Index verweilen).
- Optional: Den Benutzernamen als sekundären Check in der Detailseite anzeigen, damit der Nutzer sieht, welchen Benutzer er bearbeitet.

## 5. Implementierung

### 5.1 Liste (`InternalUsers.jsx`)

**Aktueller Zustand (zu ändern):**
- Nutzt `GET /config/global/get` → `authInternalUsers` ✅ (bleibt so)
- Mutationen nutzen `internal-users/add|patch|replace|delete` ❌ (muss weg)
- Kein `onRowClick` ❌ (muss ergänzt werden)

**Zielzustand:**
- **Laden**: `GET /config/global/get` → `authInternalUsers` (bleibt)
- **Anzeige**: Tabelle mit `user`, `ips`, `permissions` + Aktionen
- **`onRowClick`**: `navigate(`/config/internal-users/${index}`)` — Index = Position im Array
- **Add**: Neues Objekt an `authInternalUsers` anhängen → `PATCH /config/global/patch` mit `{ authInternalUsers: [...neu] }`
- **Edit/Replace**: Benutzer am Index ersetzen → `PATCH /config/global/patch` mit `{ authInternalUsers: [...neu] }`
- **Delete**: Benutzer am Index entfernen → `PATCH /config/global/patch` mit `{ authInternalUsers: [...neu] }`
- **Invalidate**: `QUERY_KEYS.globalConfig` (da die globale Config geändert wird)

### 5.2 Detailseite (`InternalUserDetail.jsx`)

**Neue Komponente** (Spiegel von `ConfigPathDetail.jsx`, aber index-basiert):

- **URL-Param**: `index` (0-basiert)
- **Laden**: `GET /config/global/get` → `authInternalUsers[index]`
- **Anzeige**: `InternalUserForm` mit `initialValues = authInternalUsers[index]`
- **Speichern**:
  1. `GET /config/global/get` → komplette Config
  2. `authInternalUsers[index]` durch die neuen Werte ersetzen
  3. `PATCH /config/global/patch` mit `{ authInternalUsers: [...neu] }`
  4. Zurück zur Liste navigieren
- **Back-Link**: `← Alle Benutzer` → `/config/internal-users`
- **Fehlerfall**: Index out of bounds → Fehlermeldung anzeigen (Benutzer existiert nicht mehr)

### 5.3 Formular (`InternalUserForm.jsx`)

- `loading`/`loadError` Props ergänzen (1:1 Parität mit `PathConfigForm`) — **bereits umgesetzt** ✅
- `FormBuilder` unterstützt `loading`/`loadError` bereits

### 5.4 Route (`App.jsx`)

- `<Route path="config/internal-users/:index" element={<InternalUserDetail />} />` — **bereits umgesetzt** ✅ (Param-Name von `id` auf `index` umbenennen)

### 5.5 i18n

- `pages.internalUserDetail.title` + `pages.internalUserDetail.allUsers` in de/en/it — **bereits umgesetzt** ✅

## 6. Mutation-Logik (gemeinsam für Liste + Detail)

Alle Mutationen folgen demselben Muster:

```js
// 1. Aktuelle globale Config laden
const conf = await api.get('/config/global/get');
const users = conf.authInternalUsers ?? [];

// 2. Array modifizieren (Add / Replace / Delete)
//    Add:    users.push(newUser)
//    Replace: users[index] = newUser
//    Delete: users.splice(index, 1)

// 3. Komplettes Array speichern
await api.patch('/config/global/patch', { authInternalUsers: users });

// 4. Query invalidieren
queryClient.invalidateQueries({ queryKey: QUERY_KEYS.globalConfig });
```

## 7. Wichtige Überlegungen

| Thema | Detail |
|---|---|
| **Kein Einzel-Write** | Immer das komplette `authInternalUsers`-Array speichern. Kein `patch/{id}`. |
| **Index-Fragilität** | Nach Delete verschieben sich Indizes. Nach Mutation immer zur Liste zurück. |
| **Passwort-Redaction** | `pass` kann nicht zurückgelesen werden (leer bei `GET`). Beim Editieren: leeres Passwort = unverändert lassen (oder explicit setzen). |
| **Race Condition** | Zwischen `GET` und `PATCH` könnte die Config geändert werden. Minderung: `PATCH` direkt nach `GET` ausführen, keine lange Pause. |
| **Invalidate** | `QUERY_KEYS.globalConfig` invalidieren (nicht `internalUsers`), da die globale Config geändert wird. |

## 8. Trade-offs

| | |
|---|---|
| **Vorteile** | Funktioniert mit den veröffentlichten MediaMTX-Versionen (v1.21.1/v1.21.2). Kein MediaMTX-Upgrade nötig. |
| **Nachteile** | Index-basierte Identifikation ist fragil. Beim Speichern eines Benutzers wird die gesamte globale Config gespeichert (größerer Payload). |

## 9. Abweichung vom Paths-Pattern

| | Paths | Internal Users |
|---|---|---|
| **Identifier** | `name` (stabil, Teil der Config) | `index` (Position im Array, fragil) |
| **Laden** | `GET /config/paths/get/{name}` | `GET /config/global/get` → `authInternalUsers[index]` |
| **Speichern** | `PATCH /config/paths/patch/{name}` | `PATCH /config/global/patch` mit `{ authInternalUsers: [...] }` |
| **Scope** | Nur der eine Pfad | Alle Benutzer + globale Config |

## 10. Offene Fragen

1. **Passwort-Handling**: Wie soll das Passwort beim Editieren behandelt werden? (leer = unverändert? oder explicit setzen?)
2. **Index vs. Name**: Soll die Detail-URL den Index oder den Benutzernamen verwenden? (Index ist stabiler bei Duplikaten, Name ist lesbarer)
3. **Race Condition**: Brauchen wir einen Optimistic-Lock oder ist das für den Use-Case unkritisch?

---

# ERGÄNZUNG (Analyse 2026-10-23)

> Folgende Abschnitte ergänzen den Plan um verifizierte Fakten und **kritische Lücken**, die den ursprünglichen Ansatz (§3, §6, §7) in seiner Kernannahme angreifen. Alle Punkte wurden gegen die laufende Instanz (`bluenviron/mediamtx:1.21.1`) und die MediaMTX-Quellcode (v1.21.1) geprüft.

## 11. Verifikation (2026-10-23)

| # | Behauptung | Ergebnis | Beweis |
|---|---|---|---|
| 1 | `internal-users/*` existiert nicht in v1.21.1 | ✅ **Bestätigt** | Live: `GET /v3/config/internal-users/list` → `404`; `GET /v3/config/internal-users/get/0` → `404`. Quellcode `internal/api/api.go` (v1.21.1) registriert **keine** `internal-users`-Routes — nur `config/global/get` + `config/global/patch`. |
| 2 | `global/get` liefert `authInternalUsers` | ✅ **Bestätigt** | Live: `GET /v3/config/global/get` → `200`, enthält `authInternalUsers` (Array). |
| 3 | `global/patch` akzeptiert `authInternalUsers` | ✅ **Bestätigt** | Live: `PATCH /v3/config/global/patch` mit `{ authInternalUsers: [...] }` → `200 {"status":"ok"}` (No-Op-Test, Config unverändert). |
| 4 | `AuthAction`-Enum | ✅ **Bestätigt** | `openapi.yml`: `publish, read, playback, api, metrics, pprof`. |
| 5 | `GlobalConf` enthält `authInternalUsers` | ✅ **Bestätigt** | `openapi.yml` Schema `GlobalConf.authInternalUsers` → `AuthInternalUser[]`. |
| 6 | **Passwörter werden bei `GET` redigiert** | ✅ **Bestätigt — aber anders als im Plan** | Live: Benutzer mit Passwort → `pass: "<redacted>"` (siehe §12). |

**Fazit:** Die Kernannahme des Plans (veröffentlichte Version → globale Config nutzen) ist **korrekt**. Aber die Passwort-Annahme in §7 ist **falsch** und führt zu einem Datenverlust-Bug (§12–§14).

## 12. ⛔ KRITISCH: Passwort-Redaction ist `<redacted>`, NICHT leer

**Der Plan (§7) sagt:**
> `pass` kann nicht zurückgelesen werden (**leer bei `GET`**).

**Das ist falsch.** MediaMTX redigiert nicht auf leer, sondern auf den **Literal-String `"<redacted>"`**.

Quellcode (v1.21.1):
- `internal/api/api_config_global.go` → `onConfigGlobalGet` ruft `conf.Redact(...)` auf.
- `internal/conf/redact.go`:
  ```go
  const redactedCredential = "<redacted>"
  func Redact(c *Conf) *Conf {
      c = c.Clone()
      for i := range c.AuthInternalUsers {
          if c.AuthInternalUsers[i].Pass != "" {
              c.AuthInternalUsers[i].Pass = Credential(redactedCredential) // "<redacted>"
          }
      }
      // … (auch PathDefaults.PublishPass/ReadPass, Paths.*.PublishPass/ReadPass)
      return c
  }
  ```

Live-Verifikation (2026-10-23):
```
Benutzer "pwtest" mit pass="s3cret" angelegt →
GET /v3/config/global/get →  pwtest -> '<redacted>'
```

**Warum das fatal ist:**
1. `<redacted>` besteht nur aus erlaubten Zeichen (`<`, `>`, Buchstaben) → es **besteht** die `Credential.validate()`-Prüfung als *plain* Credential.
2. Wer das Array aus dem `GET` unverändert zurück-`PATCH`-t, setzt das Passwort des Benutzers auf den **Literal-String `<redacted>`**.
3. Das echte Passwort ist damit **unwiderruflich verloren** (MediaMTX speichert es nicht mehr, es gibt keinen Weg, es zurückzuholen).

> ⚠️ Der Plan behandelt die Redaction als harmloses "kann nicht lesen". In Wahrheit ist es ein **aktiver Datenverlust-Trigger**: Jede Mutation, die das Array zurücksendet, überschreibt alle Passwörter mit `<redacted>`.

## 13. ⛔ KRITISCH: Jede Mutation (Add/Edit/Delete) korruptiert ALLE Passwörter

Der Kernansatz des Plans (§3, §6) ist: **immer das komplette `authInternalUsers`-Array speichern**.

Kombiniert mit §12 ergibt sich:

| Operation | Was gesendet wird | Folge für Passwörter |
|---|---|---|
| **Add** | komplettes Array + neuer User | Alle *bestehenden* User mit Passwort → `pass` wird auf `<redacted>` gesetzt |
| **Edit** | komplettes Array (1 User geändert) | Alle *anderen* User mit Passwort → `pass` wird auf `<redacted>` gesetzt |
| **Delete** | komplettes Array (1 User entfernt) | Alle *verbleibenden* User mit Passwort → `pass` wird auf `<redacted>` gesetzt |

**Es gibt keine sichere Mutation.** Selbst ein reines Hinzufügen eines neuen Benutzers löscht die Passwörter aller vorhandenen Benutzer, weil das Array aus dem `GET` (mit `<redacted>`) zurückgesendet wird.

**Konsequenz:** Der Ansatz "globale Config nutzen" ist für die Passwortverwaltung **nicht ohne Weiteres einsetzbar**. Er ist nur sicher, wenn **kein** Benutzer ein Passwort hat (z. B. reine `user: any`-Einträge wie in der Default-Config).

## 14. ⛔ KRITISCH: Server-Config-Persistenz korruptiert Passwörter (vorhandener Bug)

Unabhängig vom Frontend hat die **Server-Architektur** denselben Bug:

- `server/src/Router/index.js:51` → `this.bridge.onConfigMutated = () => this.configStore.save();`
- `server/src/MediaMTXBridge.js:102-108` → nach jeder erfolgreichen Config-Mutation (POST/PATCH/PUT/DELETE unter `/config/`) wird `onConfigMutated` feuergelöst.
- `server/src/MediaMTXConfigStore.js:59` → `save()` liest die Config **aus der API** (`GET /config/global/get`) — also die **redigierte** Version — und schreibt sie nach `mediamtxConfigPath`.

**Folge:** Sobald `MEDIAMTX_CONFIG_PATH` gesetzt ist (in Dev: `../mediamtx/mediamtx.yml`, siehe `compose-dev.yml` + `.env`), schreibt **jede** Config-Mutation die redigierte Config in die YAML-Datei. Ein Benutzer mit Passwort bekommt in der Datei `pass: "<redacted>"`. Beim nächsten MediaMTX-Neustart (der die Datei lädt) ist das Passwort **dauerhaft `<redacted>`**.

> Dieser Bug existiert **bereits** und betrifft nicht nur interne Benutzer, sondern auch `pathDefaults.publishPass/readPass` und `paths.*.publishPass/readPass` (alle werden von `Redact()` maskiert). Er muss separat gefixt werden, bevor die Benutzer-Verwaltung sicher ist.

**Mögliche Fixes (Server):**
1. `MediaMTXConfigStore.save()` liest die **YAML-Datei** (hat echte Passwörter/Hashes) statt der API, und merged nur die geänderten Felder.
2. Oder: `save()` ersetzt in der zu schreibenden Config alle `"<redacted>"`-Werte durch die Werte aus der bestehenden YAML-Datei.
3. Oder: Persistenz nur für nicht-redigierte Felder; Passwörter bleiben in der Datei unverändert.

## 15. `user: 'any'` ist ein Sonderwert

Die Default-Config (und die laufende Instanz) nutzt `user: any`. Laut MediaMTX-Doku bedeutet `any`:
> "Username. 'any' means any user, including anonymous ones."

**Implikationen für die UI:**
- `user: any` + `pass: ""` = **anonyme Zugriffe erlaubt** (jeder User, jedes Passwort).
- `user: any` + `pass: "x"` = jeder User, aber nur mit Passwort `x`.
- Ein `any`-Eintrag mit `api`-Permission macht die **gesamte API** für jeden erreichbar — ein Sicherheitsrisiko, das die UI klar kennzeichnen sollte.
- Die Formular-Validierung darf `any` nicht als "leeren/ungültigen" User ablehnen.
- In der Liste sollte `any` visuell hervorgehoben werden (z. B. Badge "ANY"), weil es ein Sicherheitsrelevantes Sonderrecht ist.

## 16. Passwort-Hashing (sha256 / argon2)

MediaMTX unterstützt gehashte Passwörter (Doku + `internal/conf/credential.go`):
- `sha256:<base64>` — SHA-256-Hash
- `argon2:<encoded>` — Argon2id-Hash

**Implikationen:**
- Gehashte Passwörter sind **nicht umkehrbar** → sie werden bei `GET` ebenfalls zu `<redacted>` (weil nicht leer).
- Die UI sollte idealerweise die **Erzeugung** von Hashes anbieten (Client-seitig `sha256` via WebCrypto, oder Server-Endpoint), damit Klartext-Passwörter nie in der Config landen.
- Mindestens: Das Passwort-Feld sollte `sha256:`/`argon2:`-Präfixe erkennen und nicht als "ungültig" ablehnen.
- **Achtung:** Einmal gehasht, kann das Passwort nicht mehr geändert werden, ohne den Klartext neu zu kennen (Hash → kein Read-Back).

## 17. Alternative: Main-Branch-Partial-Updates (löst §12–§14)

Der unreleased Main-Branch (lokal in `mediamtx/openapi.yml`) hat die `internal-users`-Endpoints **und** ein Schema `OptionalAuthInternalUser`, bei dem **alle Felder `nullable: true`** sind:

```yaml
OptionalAuthInternalUser:
  properties:
    ips:         { type: array,  nullable: true, ... }
    pass:        { type: string, nullable: true }
    permissions: { type: array,  nullable: true, ... }
    user:        { type: string, nullable: true }
```

Das erlaubt **Partial-Updates**: `PATCH /config/internal-users/patch/{id}` mit nur den geänderten Feldern. Wird `pass` nicht gesendet, bleibt das bestehende Passwort **unverändert** → **kein Datenverlust**.

**Voraussetzung:** MediaMTX auf den Main-Branch (oder eine zukünftige Release-Version mit diesen Endpoints) upgraden. Das widerspricht dem Plan-Vorteil "Kein MediaMTX-Upgrade nötig" (§8) — ist aber der **sauberste** Weg.

## 18. Design-Entscheidung (muss vor Implementierung fallen)

| Option | Passwort-Sicherheit | MediaMTX-Version | Aufwand | Empfehlung |
|---|---|---|---|---|
| **A. Globale Config (Plan)** | ⛔ Unsicher (korruptiert alle Passwörter, §12–§14) | v1.21.x (veröffentlicht) | Mittel | Nur wenn **keine** Passwörter genutzt werden ODER Server-Fix (§14) + Client-Regel "Passwort nie zurücksenden" |
| **B. Main-Branch-Endpoints** | ✅ Sicher (Partial-Update, Passwort bleibt) | Main / zukünftige Release | Gering (Frontend-Code existiert bereits!) | **Empfohlen**, sobald eine Release-Version die Endpoints enthält |
| **C. Server-seitige Config-Datei-Manipulation** | ✅ Sicher (liest echte Passwörter aus YAML) | v1.21.x | Hoch (neue Server-Logik + Restart) | Fallback, wenn kein Upgrade möglich |

**Kernkonflikt:** Der Plan-Vorteil "funktioniert mit veröffentlichten Versionen" (§8) kollidiert mit der Passwort-Sicherheit. Man kann beides nicht gleichzeitig haben — **außer** man akzeptiert, dass Passwörter bei jeder Mutation verloren gehen (inakzeptabel) oder man nutzt Option C.

## 19. Empfohlener Ansatz (konkret)

1. **Sofort (Blocker):** Server-Bug §14 fixen — `MediaMTXConfigStore.save()` darf keine `<redacted>`-Werte in die YAML schreiben. Sonst ist **jede** Config-Änderung ein Datenverlust.
2. **Kurzfristig (v1.21.x) — nur sicher, wenn KEIN Benutzer ein Passwort hat:**
   - ⚠️ **Harte Grenze:** Solange ein bestehender Benutzer ein Passwort hat, ist **jede** Array-Mutation unsicher (Add/Edit/Delete setzen dessen Passwort auf `""` oder `<redacted>`). Option A ist dann **nicht einsetzbar** — nur Option B/C.
   - Falls alle Benutzer passwortlos sind (z. B. reine `user: any`):
     - Add: neuer User, Passwort optional (wird gesetzt, nie zurückgelesen).
     - Edit: `ips` + `permissions` + `user` änderbar; `pass`-Feld **deaktiviert** mit Hinweis "Passwort kann hier nicht geändert werden (Redaction)".
     - Delete: erlaubt.
   - **Warum "pass entfernen" NICHT reicht:** `AuthInternalUser.pass` ist `type: string` (nicht nullable). Fehlt das Feld im Payload, defaultet MediaMTX es auf `""` → Passwort wird **gelöscht** (User wird passwortlos erreichbar). Es gibt also **keine** sichere Art, ein bestehendes Passwort über die globale Config zu erhalten.
3. **Mittelfristig (empfohlen):** Auf eine MediaMTX-Version mit `internal-users`-Endpoints upgraden → Option B. Der bestehende Frontend-Code (`InternalUsers.jsx`, `InternalUserDetail.jsx`) nutzt **bereits** diese Endpoints und würde dann "einfach funktionieren".
4. **UX:** `user: any` als Sicherheits-Badge kennzeichnen (§15). Passwort-Hash-Erzeugung anbieten (§16).

## 20. Offene Fragen (ergänzt)

4. **Passwort-Redaction (§12):** Wie gehen wir mit `<redacted>` um? (Niemals zurücksenden? Feld deaktivieren? Hash-Erzeugung?)
5. **Server-Persistenz (§14):** Wer fixt den `MediaMTXConfigStore`-Bug und wann? (Blocker für sichere Benutzer-Verwaltung)
6. **Version-Strategie (§18):** Bleiben wir bei v1.21.x (Option A/C) oder upgraden wir (Option B)?
7. **`user: any` (§15):** Wie kennzeichnen wir das Sicherheitsrisiko in der UI?
8. **Hashing (§16):** Sollen wir Client-/Server-seitige Hash-Erzeugung anbieten?
