# SSR Editor

Starter project for DV1677 JSRamverk

# Dokumentation

## Applikation
Första steget för att få applikationen att fungera var att installera .env med hjälp av npm. Vi skapade en .env fil
och lade till porten som applikationen ska köra på i den.

Vi behövde också köra filen reset_db.bash i terminalen för att återställa/skapa databasen.

För att skapa ett dokument lade vi till en get-route "/new", som vi lade till en länk för i index-vyn,
och för att uppdatera ett dokument lade vi till en post-route "/update" som kallar på en funktion vi skapade.
Denna funktion gör en UPDATE med SQL på databasen och sedan gör en redirect till "/:id" med nya dokumentets ID.
Vi lade även till en rad i tabellen documents med ett AUTO INCREMENT ID.

Vi tog till slut bort innehållet i .gitignore för att kunna ladda upp och dela de ändringar vi har gjort för
sqlite, node_modules och .env.

## Val av ramverk
Vi har bestämt oss för att jobba med React, då vi inte har så mycket erfarenhet av JS-ramverk sedan tidigare, och
det blir då lite lättare att följa med i genomgångar och föreläsningar.
