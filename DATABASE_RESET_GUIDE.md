# Database Reset & Reseed Guide

Ez az útmutató végigvezet a MongoDB adatbázis teljes resetelésén és újratöltésén.

---

## Mikor van szükség database reset-re?

- Prisma schema jelentős változtatása után
- Seed adatok frissítése után
- Fejlesztés során a tesztadatok újratöltéséhez
- Migrációs problémák esetén
- "Tiszta lappal" kezdés development környezetben

---

## Lépések

### 1. Prisma Schema Módosítása

Ha változtattál a `prisma/schema.prisma` fájlban, akkor először ezt kell frissíteni.

**Példa módosítások:**
```prisma
model Shift {
  id               String    @id @default(auto()) @map("_id") @db.ObjectId

  // Új mezők hozzáadása:
  actualStartTime   DateTime?
  actualEndTime     DateTime?
  actualStatus      ActualWorkStatus?
  actualHoursWorked Float?

  // ... többi mező
}
```

### 2. MongoDB Adatbázis Törlése

**FIGYELEM:** Ez VÉGLEGESEN TÖRLI az összes adatot!

#### Opció A: MongoDB Atlas (Production/Cloud)

1. Lépj be a MongoDB Atlas-ba: https://cloud.mongodb.com
2. Navigálj a projekt → Clusters menüponthoz
3. Kattints a cluster nevére (pl. `Cluster0`)
4. Menj a **Collections** tab-ra
5. Válaszd ki az adatbázist (pl. `nexus_hub`)
6. Kattints a **Delete Database** gombra
7. Erősítsd meg a törlést az adatbázis nevének beírásával

#### Opció B: MongoDB Compass (Local/Visual)

1. Nyisd meg a MongoDB Compass-t
2. Csatlakozz az adatbázishoz (connection string-gel)
3. Kattints jobb gombbal az adatbázisra (pl. `nexus_hub`)
4. Válaszd a **Drop Database** opciót
5. Erősítsd meg a törlést

#### Opció C: MongoDB Shell (Command Line)

```bash
# Csatlakozás
mongosh "your_mongodb_connection_string"

# Adatbázis váltás
use nexus_hub

# Adatbázis törlése
db.dropDatabase()

# Kilépés
exit
```

#### Opció D: VS Code Extension (MongoDB for VS Code)

1. Telepítsd a "MongoDB for VS Code" extension-t
2. Csatlakozz az adatbázishoz
3. Kattints jobb gombbal az adatbázisra
4. Válaszd a "Drop Database" opciót

### 3. Prisma Push (Schema szinkronizálás)

Miután törölted az adatbázist, szinkronizáld a Prisma schema-t:

```bash
npx prisma db push
```

**Mit csinál ez a parancs:**
- Létrehozza az új adatbázist (ha nem létezik)
- Létrehozza az összes modellt (collection-öket)
- Szinkronizálja az indexeket
- Alkalmazzi a schema változásokat

**Példa kimenet:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": MongoDB database "nexus_hub" at "cluster0.xxxxx.mongodb.net"

🚀  Your database is now in sync with your Prisma schema. Done in 1.23s

✔ Generated Prisma Client (5.x.x) to .\node_modules\@prisma\client in 234ms
```

### 4. Seed Futtatása

Most töltsük fel az adatbázist kezdő adatokkal:

```bash
npx prisma db seed
```

**Mit csinál a seed script (`prisma/seed.ts`):**

1. **Törli a meglévő adatokat** (ha vannak):
   ```typescript
   await prisma.shift.deleteMany();
   await prisma.weekSchedule.deleteMany();
   await prisma.position.deleteMany();
   await prisma.user.deleteMany();
   ```

2. **Létrehozza a tesztfelhasználókat:**
   - CEO: kriszcs04@gmail.com (jelszó: "password")
   - General Manager: gm@company.com
   - Manager: manager@company.com
   - Employee: tamas.varga@company.com

3. **Létrehozza a pozíciókat:**
   - Cashier (Pénztáros)
   - Storage (Raktár)
   - Kitchen (Konyha)
   - Cleaning (Takarítás)

4. **UserPosition kapcsolatok** létrehozása (felhasználó-pozíció hozzárendelés)

5. **WeekSchedule** létrehozása példa héttel

6. **Shifts** létrehozása példa műszakokkal

**Példa kimenet:**
```
🌱 Seeding database...
✅ Cleared existing data
✅ Created 4 users
✅ Created 4 positions
✅ Created user-position assignments
✅ Created week schedule
✅ Created 5 shifts
🎉 Seeding completed!
```

### 5. Ellenőrzés

Ellenőrizd hogy minden rendben van:

```bash
# Prisma Studio indítása (Visual Database Browser)
npx prisma studio
```

Vagy MongoDB Compass / Atlas-ban nézd meg a collections-öket:
- `User` - 4 felhasználó
- `Position` - 4 pozíció
- `UserPosition` - felhasználó-pozíció kapcsolatok
- `WeekSchedule` - 1 hét
- `Shift` - példa műszakok

---

## Gyors Reset Script (Opcionális)

Készíthetsz egy script-et ami az egészet egyben csinálja:

**Fájl:** `scripts/reset-db.sh` (Linux/Mac)
```bash
#!/bin/bash

echo "🗑️  Resetting database..."

# Prisma push (creates DB if not exists)
echo "📦 Pushing schema..."
npx prisma db push --force-reset

# Seed
echo "🌱 Seeding database..."
npx prisma db seed

echo "✅ Database reset complete!"
```

**Fájl:** `scripts/reset-db.bat` (Windows)
```batch
@echo off
echo 🗑️  Resetting database...

echo 📦 Pushing schema...
npx prisma db push --force-reset

echo 🌱 Seeding database...
npx prisma db seed

echo ✅ Database reset complete!
```

**Használat:**
```bash
# Linux/Mac
chmod +x scripts/reset-db.sh
./scripts/reset-db.sh

# Windows
scripts\reset-db.bat
```

---

## Troubleshooting

### Hiba: "P1003: Database does not exist"

**Megoldás:** Hozd létre az adatbázist először:
```bash
npx prisma db push
```

### Hiba: "connect ECONNREFUSED"

**Megoldás:** Ellenőrizd a `.env` fájlban a `DATABASE_URL`-t:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/nexus_hub?retryWrites=true&w=majority"
```

### Hiba: "Schema validation error"

**Megoldás:** Ellenőrizd a `prisma/schema.prisma` szintaxisát:
```bash
npx prisma validate
```

### Hiba: "Seed script failed"

**Megoldás:** Futtasd manuálisan és nézd meg a hibát:
```bash
npx ts-node prisma/seed.ts
```

### Hiba: "Prisma Client not found"

**Megoldás:** Generáld újra a Prisma Client-et:
```bash
npx prisma generate
```

---

## Best Practices

### Development környezetben:
✅ **Használj seed-et** tesztadatokhoz
✅ **Reset gyakran** ha változtatsz a schema-n
✅ **Commitolj** minden schema változást git-be

### Production környezetben:
❌ **SOHA ne használj `db push --force-reset`**
❌ **SOHA ne töröld az adatbázist**
✅ **Használj migrációkat** (`prisma migrate`)
✅ **Backup-olj** reset előtt

---

## Gyors Parancsok Referencia

```bash
# 1. Schema validálás
npx prisma validate

# 2. Schema push (MongoDB)
npx prisma db push

# 3. Schema push FORCE RESET-tel (törli az adatokat!)
npx prisma db push --force-reset

# 4. Prisma Client generálás
npx prisma generate

# 5. Seed futtatása
npx prisma db seed

# 6. Prisma Studio (DB viewer)
npx prisma studio

# 7. Schema formázás
npx prisma format
```

---

## Seed.ts Módosítása

Ha egyedi seed adatokat szeretnél, módosítsd a `prisma/seed.ts` fájlt:

**Példa: Több felhasználó hozzáadása**
```typescript
const users = await Promise.all([
  prisma.user.create({
    data: {
      name: "Új Alkalmazott",
      email: "uj@company.com",
      hashedPassword: await bcrypt.hash("password", 10),
      role: "Employee",
      employmentStatus: "ACTIVE",
      employeeId: "EMP005",
    },
  }),
  // ... több user
]);
```

**Példa: Több pozíció hozzáadása**
```typescript
const positions = await Promise.all([
  prisma.position.create({
    data: {
      name: "NewPosition",
      displayNames: {
        en: "New Position",
        hu: "Új Pozíció"
      },
      color: "#10B981",
      isActive: true,
    },
  }),
  // ... több pozíció
]);
```

---

## Következő Lépések Reset Után

1. ✅ Ellenőrizd a Prisma Studio-ban az adatokat
2. ✅ Jelentkezz be az alkalmazásba teszt user-rel
3. ✅ Teszteld a főbb funkciókat
4. ✅ Commitold a változásokat git-be

---

## Kapcsolódó Fájlok

- `prisma/schema.prisma` - Adatbázis schema
- `prisma/seed.ts` - Seed script
- `.env` - Environment változók (DATABASE_URL)
- `package.json` - Prisma seed konfiguráció

---

## Hasznos Linkek

- [Prisma MongoDB Docs](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [Prisma DB Push](https://www.prisma.io/docs/concepts/components/prisma-migrate/db-push)
- [Prisma Seeding](https://www.prisma.io/docs/guides/database/seed-database)
- [MongoDB Atlas](https://cloud.mongodb.com)

---

**Utolsó frissítés:** 2025-10-29
**Verzió:** 1.0
