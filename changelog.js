'use strict';
/*
 Changelog der App, neueste Version zuerst.
 Bei jedem Update: hier einen Eintrag ergänzen, VERSION in app.js und CACHE in sw.js erhöhen.
 Texte auf Deutsch und Englisch; andere Sprachen zeigen die englische Fassung.
*/
window.CHANGELOG = [
  {
    v: '0.13', date: '2026-11-14',
    title: { de: 'Papierkorb für alles, Belichtungskorrektur, Doppelbelichtung und Feedback', en: 'Bin for everything, exposure compensation, double exposure and feedback' },
    de: {
      added: [
        'Belichtungskorrektur in Drittelstufen und Doppelbelichtung als eigene Felder, im Assistenten als gemeinsamer Schritt nach dem Blitz; nicht bei Point-and-Shoot',
        'Mehrere Shots auf einer Nummer (05, 05.2) gelten automatisch als Doppelbelichtung',
        'Korrektur und Doppelbelichtung in CSV, PDF, Karte, Scans (EXIF) und CSV-Import',
        'Shots, Ordner und Tags kommen beim Löschen in den Papierkorb',
        'Papierkorb nach Rollen, Shots, Ordnern und Tags gegliedert, jeweils zuerst was am wenigsten Zeit übrig hat',
        'Halten-Menü im Papierkorb und in den Filterergebnissen',
        'Feedback in den Einstellungen: Einträge mit Titel und Text, bleiben auf dem Gerät und lassen sich auf Wunsch als Text teilen'
      ],
      changed: [
        'Das Halten-Menü öffnet sich nach einer Sekunde statt nach zwei',
        'Alle Rückfragen, Auswahlfenster und Texteingaben nutzen die Aufklappmenüs und Systemabfragen',
        'Nach dem Löschen rücken Doppelnummern nach: bleibt nur 05.2 übrig, heißt sie wieder 05',
        'Neue, archivierte, reaktivierte, importierte und wiederhergestellte Rollen stehen oben in ihrer Liste'
      ],
      removed: ['Die alten Auswahlfenster von unten', 'Ungenutzte Stile, Texte und Codereste früherer Versionen']
    },
    en: {
      added: [
        'Exposure compensation in thirds of a stop and double exposure as fields of their own, asked together after the flash step; not for point-and-shoot',
        'Several shots on one number (05, 05.2) count as a double exposure automatically',
        'Compensation and double exposure in CSV, PDF, map, scans (EXIF) and CSV import',
        'Shots, folders and tags go to the bin when deleted',
        'Bin grouped into rolls, shots, folders and tags, each starting with what has the least time left',
        'Hold menu in the bin and in filter results',
        'Feedback in Settings: entries with a title and text that stay on the device and can be shared as text on request'
      ],
      changed: [
        'The hold menu opens after one second instead of two',
        'All confirmations, choices and text prompts use the popup menus and system-style alerts',
        'Duplicate numbers close up after deleting: if only 05.2 is left, it becomes 05 again',
        'New, archived, reactivated, imported and restored rolls appear at the top of their list'
      ],
      removed: ['The old choice sheets sliding up from the bottom', 'Unused styles, texts and leftover code from earlier versions']
    }
  },
  {
    v: '0.12', date: '2026-11-13',
    title: { de: 'Aufklappmenüs statt Wischen, einheitliche Rückfrage beim Löschen', en: 'Popup menus instead of swiping, one confirmation for deleting' },
    de: {
      added: ['Aufklappmenü im Stil der iOS-Auswahlmenüs für Rollen, Ordner und Shots, auch in Export', 'Shots: Menü mit Bearbeiten, Auf der Karte zeigen und Löschen', 'Rückfrage vor jedem Löschen im Stil der Systemabfragen'],
      changed: ['Zwei Sekunden halten öffnet das Menü, noch während der Finger liegt; wer vorher zieht, sortiert', 'Farbe und Sprache werden in den Einstellungen über ein Aufklappmenü gewählt', 'Auswahlmenüs und Datumsfelder des Systems folgen dem Theme der App'],
      removed: ['Wischen nach links mit Aktionsknöpfen', 'Themes als Liste untereinander']
    },
    en: {
      added: ['Popup menu in the style of the iOS selection menus for rolls, folders and shots, in Export too', 'Shots: menu with edit, show on map and delete', 'Confirmation before every deletion in the style of system prompts'],
      changed: ['Holding for two seconds opens the menu while the finger is still down; dragging before that reorders', 'Colour and language are chosen from a popup menu in Settings', 'System selection menus and date fields follow the app theme'],
      removed: ['Swiping left with action buttons', 'Themes as a list']
    }
  },
  {
    v: '0.11', date: '2026-11-13',
    title: { de: 'Flüssigeres Wischen mit mehreren Aktionen, Shots als Karten, Schritt-Dialog zurück', en: 'Smoother swiping with several actions, shots as cards, step dialog is back' },
    de: {
      added: ['Wischen nach links zeigt mehrere runde Knöpfe: Bearbeiten, Löschen und Verschieben', 'Unter Aktiv verschiebt der dritte Knopf die Rolle ins Archiv, im Archiv führt er zum Export dieser Rolle', 'Shots in der Rollenansicht lassen sich wischen: Bearbeiten und Löschen'],
      changed: ['Beim Wischen gleitet die Zeile mit dem Finger nach links aus der Karte, die Knöpfe blenden dabei weich ein', 'Shots stehen in der Rollenansicht als Zeilen in einer Karte, wie die Rollen', 'Ein neuer Shot wird wieder Schritt für Schritt abgefragt; beim Bearbeiten stehen alle Werte auf einer Seite']
    },
    en: {
      added: ['Swiping left shows several round buttons: edit, delete and move', 'Under Active the third button moves the roll to the archive, in the archive it leads to the export of that roll', 'Shots in the roll view can be swiped: edit and delete'],
      changed: ['While swiping the row glides left out of the card with your finger and the buttons fade in softly', 'Shots in the roll view are rows in a card, like the rolls', 'A new shot is asked step by step again; when editing, all values are on one page']
    }
  },
  {
    v: '0.10', date: '2026-11-13',
    title: { de: 'Glas-Tab-Leiste, Papierkorb, Rollen als Karten', en: 'Glass tab bar, bin, rolls as cards' },
    de: {
      added: ['Papierkorb: Gelöschte Rollen bleiben 30 Tage erhalten und lassen sich in den Einstellungen wiederherstellen', 'Wischen zum Löschen auch in der Export-Liste', 'App-Name und Version stehen oben auf allen vier Seiten'],
      changed: ['Tab-Leiste im Glas-Stil: Der Marker gleitet zum gewählten Punkt und folgt beim Drücken dem Finger', 'Rollen und Ordner in Aktiv und Archiv sehen aus wie in Export: Zeilen in einer Karte', 'Rollen werden ohne Rückfrage gelöscht, weil sie im Papierkorb landen']
    },
    en: {
      added: ['Bin: deleted rolls are kept for 30 days and can be restored in Settings', 'Swipe to delete in the export list too', 'App name and version are shown at the top of all four pages'],
      changed: ['Glass-style tab bar: the marker glides to the selected item and follows your finger while pressed', 'Rolls and folders in Active and Archive look like in Export: rows in a card', 'Rolls are deleted without a confirmation because they go to the bin']
    }
  },
  {
    v: '0.9', date: '2026-11-13',
    title: { de: 'Neuer Aufbau wie die Uhr-App, Simple Mode, Themes Hell und Dunkel', en: 'New layout like the Clock app, Simple Mode, Light and Dark themes' },
    de: {
      added: ['Tab-Leiste am unteren Rand mit Aktiv, Archiv, Export und Einstellungen', 'Simple Mode je Rolle: Der Auslöser speichert sofort Nummer, Zeit und Standort, alles andere lässt sich später nachtragen', 'Rollen und Ordner nach links wischen und über den roten Papierkorb löschen', 'Theme Dunkel mit dunklen Grautönen und Orange'],
      changed: ['Listen in Aktiv und Archiv wie die Weckerliste: Tippen öffnet die Rolle', 'Rolle und Shot werden in einem Fenster mit Einstellungszeilen bearbeitet, oben links schließen, oben rechts sichern', 'Shot: drei Wahlräder nebeneinander statt einzelner Schritte', 'Point-and-Shoot: Die Nummer steht an erster Stelle', 'Point-and-Shoot: Belichtungszeit, Blende und Brennweite bleiben beim Umschalten gespeichert und erscheinen nur nicht in der App und im Export', 'Theme Nebel heißt jetzt Hell', 'Eigenes Theme als dritte Option, ohne Speichern mehrerer Layouts', 'Systemschrift statt eigener Schriften'],
      removed: ['Hauptmenü und der Punkt „Erstellen“; neue Rollen legt das + unter Aktiv an', 'Themes Salbei und Nacht', 'Gespeicherte Farblayouts', 'Erklärungstext beim Point-and-Shoot-Schalter', 'Direktes Öffnen der Rolle, wenn nur eine aktiv ist']
    },
    en: {
      added: ['Tab bar at the bottom with Active, Archive, Export and Settings', 'Simple Mode per roll: the shutter button saves number, time and location at once, everything else can be added later', 'Swipe rolls and folders to the left and delete them with the red bin', 'Dark theme with dark greys and orange'],
      changed: ['Lists in Active and Archive like the alarm list: a tap opens the roll', 'Roll and shot are edited in one sheet with settings rows, close top left, save top right', 'Shot: three wheels side by side instead of single steps', 'Point-and-Shoot: the number comes first', 'Point-and-Shoot: shutter speed, aperture and focal length stay saved when switching and are only hidden in the app and in exports', 'The Mist theme is now called Light', 'Custom theme as a third option, without saving several layouts', 'System font instead of custom fonts'],
      removed: ['Main menu and the “Create” entry; the + under Active creates new rolls', 'Sage and Night themes', 'Saved colour layouts', 'Explanation text at the Point-and-Shoot switch', 'Opening the roll directly when only one is active']
    }
  },
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
