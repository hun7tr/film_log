'use strict';
/*
 Changelog der App, neueste Version zuerst.
 Bei jedem Update: hier einen Eintrag ergänzen, VERSION in app.js und CACHE in sw.js erhöhen.
 Texte auf Deutsch und Englisch; andere Sprachen zeigen die englische Fassung.
*/
window.CHANGELOG = [
  {
    v: '0.8', date: '2026-11-13',
    title: { de: 'Kacheln zum Verschieben, Menü per Halten, haptisches Feedback', en: 'Movable tiles, menu on hold, haptic feedback' },
    de: {
      added: ['Rollen lassen sich auch unter „Aktiv“ durch Halten und Ziehen sortieren', 'Langes Halten auf eine Rolle oder einen Ordner öffnet dasselbe Menü wie die drei Punkte', 'Leichtes haptisches Feedback beim Anlegen einer Rolle, am Auslöser, bei „Abschließen“, an den Wahlrädern, bei Nummer, Blitz und Standort sowie beim Anheben einer Kachel'],
      changed: ['Rollen und Ordner sind Kacheln mit runden Ecken; beim Ziehen rücken die anderen zur Seite und die Kachel rastet ein', 'Point-and-Shoot wird in den Listen als P&S abgekürzt', '„Eigene Farben“ öffnet direkt den Farbeditor', 'Sprache als Auswahlmenü', 'Blitz Ja/Nein in der Shot-Übersicht fett'],
      removed: ['Knopf „Eigene Farben anpassen“', 'Zwei Farben aus dem Theme Nacht']
    },
    en: {
      added: ['Rolls under “Active” can be reordered by holding and dragging too', 'Press and hold on a roll or folder opens the same menu as the three dots', 'Light haptic feedback when creating a roll, on the shutter button, on “Finish”, on the wheels, on number, flash and location, and when lifting a tile'],
      changed: ['Rolls and folders are tiles with rounded corners; while dragging the others move aside and the tile snaps into place', 'Point-and-Shoot is abbreviated to P&S in the lists', '“Custom colours” opens the colour editor directly', 'Language as a dropdown', 'Flash yes/no in the shot summary in bold'],
      removed: ['“Adjust custom colours” button', 'Two colours from the Night theme']
    }
  },
  {
    v: '0.7', date: '2026-11-13',
    title: { de: 'Changelog in den Einstellungen', en: 'Changelog in settings' },
    de: { added: ['Changelog in den Einstellungen: alle Versionen mit kurzer Zusammenfassung, Details per Tipp'], changed: ['Die Version im Hauptmenü heißt jetzt wie im Changelog, zum Beispiel „Alpha 0.7“'] },
    en: { added: ['Changelog in settings: every version with a short summary, details on tap'], changed: ['The version on the main menu now reads as in the changelog, for example “Alpha 0.7”'] }
  },
  {
    v: '0.6', date: '2026-11-13',
    title: { de: 'Verschieben durch Halten, Standort auf der Karte, Farblayouts', en: 'Hold to move, location on the map, colour layouts' },
    de: {
      added: ['Archiv: Rollen und Ordner durch langes Halten sortieren, Rolle in einen Ordner ziehen', 'Standort im Shot-Dialog auf der Karte wählen, auch nachträglich', 'Farblayouts speichern und benennen', 'Filter im Archiv nach Blitz Ja oder Nein', 'Point-and-Shoot: zusätzlich Notiz und Referenzfoto'],
      changed: ['Point-and-Shoot steht in den Listen und in der Unterzeile der Rolle', 'Blitz in der Shot-Übersicht als Ja oder Nein', 'Zähler in der Rollenansicht ohne farbige Hinterlegung']
    },
    en: {
      added: ['Archive: press and hold to reorder rolls and folders, drag a roll into a folder', 'Choose the location on the map in the shot dialog, also afterwards', 'Save and name colour layouts', 'Archive filter by flash yes or no', 'Point-and-Shoot: note and reference photo as well'],
      changed: ['Point-and-Shoot is shown in the lists and in the roll subline', 'Flash in the shot summary as yes or no', 'Counter in the roll view without coloured background']
    }
  },
  {
    v: '0.5', date: '2026-11-13',
    title: { de: 'CSV-Import, Point-and-Shoot, Blitz, eigene Farben, neues Logo', en: 'CSV import, Point-and-Shoot, flash, custom colours, new logo' },
    de: {
      added: ['Import von CSV-Dateien anderer Apps ins Archiv mit automatischer Spaltenerkennung', 'Point-and-Shoot-Modus je Rolle', 'Blitz als neuer Wert pro Shot, auch in CSV, PDF und in den Metadaten der Scans', 'Eigene Farben in den Einstellungen', 'Versionsnummer im Hauptmenü'],
      changed: ['Zähler im Hauptmenü als schlichte Zahl und nur, wenn Rollen vorhanden sind', 'Neues Logo: rotes abgerundetes Fünfeck auf Violett']
    },
    en: {
      added: ['Import of CSV files from other apps into the archive with automatic column matching', 'Point-and-Shoot mode per roll', 'Flash as a new value per shot, also in CSV, PDF and scan metadata', 'Custom colours in settings', 'Version number on the main menu'],
      changed: ['Main menu counters as plain numbers, shown only when rolls exist', 'New logo: red rounded pentagon on violet']
    }
  },
  {
    v: '0.4', date: '2026-11-13',
    title: { de: 'Themes Nacht und Nebel, drei neue Sprachen', en: 'Night and Mist themes, three new languages' },
    de: {
      added: ['Themes Nacht und Nebel', 'Sprachen Französisch, Spanisch und Portugiesisch'],
      changed: ['Beim ersten Start übernimmt die App die Gerätesprache', 'CSV-Export mit Datum und Dezimaltrennzeichen passend zur Sprache'],
      removed: ['Themes Wald und Sepia']
    },
    en: {
      added: ['Night and Mist themes', 'French, Spanish and Portuguese'],
      changed: ['On first start the app follows the device language', 'CSV export with date and decimal separator matching the language'],
      removed: ['Forest and Sepia themes']
    }
  },
  {
    v: '0.3', date: '2026-11-13',
    title: { de: 'Scans zuordnen, Ordner, Tags, Filter, Karte', en: 'Match scans, folders, tags, filter, map' },
    de: {
      added: ['Scans einer Rolle als ZIP oder Einzelbilder laden, den Shots zuordnen und mit Aufnahmedaten in den Bildern zurückbekommen', 'Eigene Ordner im Archiv', 'Farbige Tags für Rollen und Ordner', 'Filter im Archiv nach Tag, Kamera, Film, ISO, Jahr und Zeitraum', 'Karte für eine Rolle, das Archiv oder Filtertreffer, mit Sprung zu Apple Karten'],
      changed: ['Standort wird bei jedem Shot frisch ermittelt']
    },
    en: {
      added: ['Load the scans of a roll as ZIP or single images, match them to the shots and get them back with the shot data inside', 'Your own folders in the archive', 'Coloured tags for rolls and folders', 'Archive filter by tag, camera, film, ISO, year and period', 'Map for a roll, the archive or filter results, with a jump to Apple Maps'],
      changed: ['Location is determined fresh for every shot']
    }
  },
  {
    v: '0.2', date: '2026-11-13',
    title: { de: 'Ruhigere Rollenansicht, Zähler am Archiv', en: 'Calmer roll view, archive counter' },
    de: {
      added: ['Zähler auch neben „Archiv“', 'Hinweis, wenn der Standortzugriff verweigert ist'],
      changed: ['Titel im Hauptmenü: Film_Log', 'Stammdaten der Rolle als unauffällige Unterzeile, Bearbeiten über das Menü', 'Film und ISO getrennt eingeben, gemeinsam anzeigen', 'Listen in Aktiv, Archiv und Export: Name, darunter Film, Kamera und Bildanzahl', 'Standort: grobe und genaue Ortung parallel', 'Updates erscheinen beim nächsten Start mit Internet']
    },
    en: {
      added: ['Counter next to “Archive” as well', 'Hint when location access is denied'],
      changed: ['Main menu title: Film_Log', 'Roll data as a quiet subline, editing via the menu', 'Film and ISO entered separately, shown together', 'Lists in Active, Archive and Export: name, below it film, camera and frame count', 'Location: coarse and precise positioning in parallel', 'Updates appear on the next start with a connection']
    }
  },
  {
    v: '0.1', date: '2026-11-13',
    title: { de: 'Erste Version', en: 'First version' },
    de: {
      added: ['Hauptmenü mit Erstellen, Aktiv, Archiv, Export und Einstellungen', 'Rollen mit Titel, Film, ISO, Belichtet auf, Push/Pull, Kamera und Bildanzahl', 'Shot-Dialog mit Wahlrädern für Belichtungszeit, Blende und Brennweite', 'Standort, Datum, Notiz, Sprachnotiz und Referenzfoto pro Shot', 'Archiv für fertige Rollen', 'Export als CSV und PDF', 'Themes Salbei, Wald und Sepia', 'Sprachen Deutsch und Englisch', 'Backup sichern und wiederherstellen', 'Läuft ohne Internet']
    },
    en: {
      added: ['Main menu with Create, Active, Archive, Export and Settings', 'Rolls with title, film, ISO, exposed at, push/pull, camera and frame count', 'Shot dialog with wheels for shutter speed, aperture and focal length', 'Location, date, note, voice note and reference photo per shot', 'Archive for finished rolls', 'Export as CSV and PDF', 'Sage, Forest and Sepia themes', 'German and English', 'Save and restore backups', 'Works offline']
    }
  }
];
