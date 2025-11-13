// prisma/seed.ts
import { PrismaClient, Role, EmploymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Adatbázis seed indítása...');

    // Törölünk minden meglévő adatot (opcionális)
    console.log('📝 Meglévő adatok törlése...');
    await prisma.shift.deleteMany();
    await prisma.weekSchedule.deleteMany();
    await prisma.todoAssignment.deleteMany();
    await prisma.todo.deleteMany();
    await prisma.userPosition.deleteMany();
    await prisma.user.deleteMany();
    await prisma.position.deleteMany();

    console.log('🏢 Pozíciók létrehozása...');

    // Alapértelmezett pozíciók létrehozása
    const positions = await Promise.all([
        prisma.position.create({
            data: {
                name: 'cashier',
                displayNames: {
                    en: 'Cashier',
                    hu: 'Pénztáros'
                },
                descriptions: {
                    en: 'Customer service and payment processing',
                    hu: 'Pénztárgép kezelése, ügyfélszolgálat'
                },
                isActive: true,
                color: '#10B981', // zöld
                order: 1
            }
        }),

        prisma.position.create({
            data: {
                name: 'kitchen',
                displayNames: {
                    en: 'Kitchen',
                    hu: 'Konyha'
                },
                descriptions: {
                    en: 'Kitchen and food preparation',
                    hu: 'Ételkészítés, konyhai munkák'
                },
                isActive: true,
                color: '#F59E0B', // sárga
                order: 2
            }
        }),

        prisma.position.create({
            data: {
                name: 'storage',
                displayNames: {
                    en: 'Storage',
                    hu: 'Raktár'
                },
                descriptions: {
                    en: 'Inventory management and storage',
                    hu: 'Készletkezelés és raktározás'
                },
                isActive: true,
                color: '#3B82F6', // kék
                order: 3
            }
        }),

        prisma.position.create({
            data: {
                name: 'packer',
                displayNames: {
                    en: 'Packer',
                    hu: 'Csomagoló'
                },
                descriptions: {
                    en: 'Order packing and preparation',
                    hu: 'Rendelések csomagolása és előkészítése'
                },
                isActive: true,
                color: '#8B5CF6', // lila
                order: 4
            }
        }),

        prisma.position.create({
            data: {
                name: 'delivery',
                displayNames: {
                    en: 'Delivery',
                    hu: 'Kiszállítás'
                },
                descriptions: {
                    en: 'Food delivery and logistics',
                    hu: 'Étel kiszállítás és logisztika'
                },
                isActive: true,
                color: '#EF4444', // piros
                order: 5
            }
        }),

        prisma.position.create({
            data: {
                name: 'cleaning',
                displayNames: {
                    en: 'Cleaning',
                    hu: 'Takarítás'
                },
                descriptions: {
                    en: 'Cleaning and maintenance',
                    hu: 'Takarítás és karbantartás'
                },
                isActive: true,
                color: '#6B7280', // szürke
                order: 6
            }
        })
    ]);

    console.log(`✅ ${positions.length} pozíció létrehozva!`);

    console.log('👥 Felhasználók létrehozása...');

    // Hash a default password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // CEO létrehozása
    const ceoUser = await prisma.user.create({
        data: {
            name: 'Horváth Krisztián',
            email: 'kriszcs04@gmail.com',
            hashedPassword,
            role: Role.CEO,
            image: 'https://avatars.githubusercontent.com/u/40773732?v=4',

            // ÚJ MUNKAVÁLLALÓI ADATOK
            employeeId: 'EMP001',
            phoneNumber: '+36701234567',
            employmentStatus: EmploymentStatus.ACTIVE,
            weeklyWorkHours: 50,
            birthCountry: 'Magyarország',
            birthCity: 'Budapest',
            bankName: 'OTP Bank',
            accountNumber: '12345678-12345678-12345678',
            birthDate: new Date('1985-03-15'),
            address: 'Fő utca 1.',
            city: 'Budapest',
            postalCode: '1011',
            country: 'Magyarország',
            personalIdNumber: '123456AB',
            taxNumber: '12345678-1-01',
            socialSecurityNumber: '123456789',
            hireDate: new Date('2020-01-01'),
            salary: 800000,
            currency: 'HUF',
            notes: 'Cég alapítója és vezérigazgatója'
        }
    });

    // Update positions to track who created them
    await prisma.position.updateMany({
        data: {
            createdById: ceoUser.id
        }
    });

    // További felhasználók
    const users = await Promise.all([
        // General Manager
        prisma.user.create({
            data: {
                name: 'Nagy Anna',
                email: 'anna.nagy@company.com',
                hashedPassword,
                role: Role.GeneralManager,
                image: 'https://images.unsplash.com/vector-1741461267840-1bbdfddec191?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=764',

                employeeId: 'EMP002',
                phoneNumber: '+36702345678',
                employmentStatus: EmploymentStatus.ACTIVE,
                weeklyWorkHours: 45,
                birthCountry: 'Magyarország',
                birthCity: 'Szeged',
                bankName: 'Erste Bank',
                accountNumber: '23456789-23456789-23456789',
                birthDate: new Date('1988-07-22'),
                address: 'Kossuth utca 15.',
                city: 'Szeged',
                postalCode: '6720',
                country: 'Magyarország',
                personalIdNumber: '234567CD',
                taxNumber: '23456789-2-02',
                socialSecurityNumber: '234567890',
                hireDate: new Date('2020-06-01'),
                salary: 650000,
                currency: 'HUF',
                notes: 'Tapasztalt raktárkezelő, később előlépett vezetőnek'
            }
        }),

        // Manager
        prisma.user.create({
            data: {
                name: 'Kovács Péter',
                email: 'peter.kovacs@company.com',
                hashedPassword,
                role: Role.Manager,
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',

                employeeId: 'EMP003',
                phoneNumber: '+36703456789',
                employmentStatus: EmploymentStatus.ACTIVE,
                weeklyWorkHours: 42,
                birthCountry: 'Magyarország',
                birthCity: 'Debrecen',
                bankName: 'K&H Bank',
                accountNumber: '34567890-34567890-34567890',
                birthDate: new Date('1990-11-08'),
                address: 'Petőfi utca 23.',
                city: 'Debrecen',
                postalCode: '4025',
                country: 'Magyarország',
                personalIdNumber: '345678EF',
                taxNumber: '34567890-3-03',
                socialSecurityNumber: '345678901',
                hireDate: new Date('2021-02-15'),
                salary: 520000,
                currency: 'HUF',
                notes: 'Szakács végzettséggel, kitűnő konyhai vezetési képességek'
            }
        }),

        // Employee 1 - Cashier
        prisma.user.create({
            data: {
                name: 'Szabó Éva',
                email: 'eva.szabo@company.com',
                hashedPassword,
                role: Role.Employee,
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',

                employeeId: 'EMP004',
                phoneNumber: '+36704567890',
                employmentStatus: EmploymentStatus.ACTIVE,
                weeklyWorkHours: 40,
                birthCountry: 'Magyarország',
                birthCity: 'Pécs',
                bankName: 'UniCredit Bank',
                accountNumber: '45678901-45678901-45678901',
                birthDate: new Date('1995-05-20'),
                address: 'Rákóczi út 45.',
                city: 'Pécs',
                postalCode: '7621',
                country: 'Magyarország',
                personalIdNumber: '456789GH',
                taxNumber: '45678901-4-04',
                socialSecurityNumber: '456789012',
                hireDate: new Date('2022-09-01'),
                hourlyRate: 2200,
                currency: 'HUF',
                notes: 'Kiváló ügyfélszolgálati készségek, precíz munkavégzés'
            }
        }),

        // Employee 2 - Packer
        prisma.user.create({
            data: {
                name: 'Tóth Marcell',
                email: 'marcell.toth@company.com',
                hashedPassword,
                role: Role.Employee,
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',

                employeeId: 'EMP005',
                phoneNumber: '+36705678901',
                employmentStatus: EmploymentStatus.ACTIVE,
                weeklyWorkHours: 38,
                birthCountry: 'Románia',
                birthCity: 'Kolozsvár',
                bankName: 'MKB Bank',
                accountNumber: '56789012-56789012-56789012',
                birthDate: new Date('1992-12-03'),
                address: 'Váci út 78.',
                city: 'Budapest',
                postalCode: '1056',
                country: 'Magyarország',
                personalIdNumber: '567890IJ',
                taxNumber: '56789012-5-05',
                socialSecurityNumber: '567890123',
                hireDate: new Date('2023-01-20'),
                hourlyRate: 2000,
                currency: 'HUF',
                notes: 'Gyors és pontos csomagolási technikák, megbízható'
            }
        }),

        // Employee 3 - Delivery
        prisma.user.create({
            data: {
                name: 'Varga Tamás',
                email: 'tamas.varga@company.com',
                hashedPassword,
                role: Role.Employee,
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',

                employeeId: 'EMP006',
                phoneNumber: '+36706789012',
                employmentStatus: EmploymentStatus.ACTIVE,
                weeklyWorkHours: 44,
                birthCountry: 'Magyarország',
                birthCity: 'Miskolc',
                bankName: 'CIB Bank',
                accountNumber: '67890123-67890123-67890123',
                birthDate: new Date('1987-09-14'),
                address: 'Alkotmány utca 12.',
                city: 'Miskolc',
                postalCode: '3525',
                country: 'Magyarország',
                personalIdNumber: '678901KL',
                taxNumber: '67890123-6-06',
                socialSecurityNumber: '678901234',
                hireDate: new Date('2021-11-10'),
                hourlyRate: 2300,
                currency: 'HUF',
                notes: 'B kategóriás jogosítvány, helyi úthálózat ismerete kiváló'
            }
        }),

        // Employee 4 - Part-time Cleaning
        prisma.user.create({
            data: {
                name: 'Molnár Zsuzsanna',
                email: 'zsuzsa.molnar@company.com',
                hashedPassword,
                role: Role.Employee,
                image: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',

                employeeId: 'EMP007',
                phoneNumber: '+36707890123',
                employmentStatus: EmploymentStatus.ACTIVE,
                weeklyWorkHours: 20, // részmunkaidős
                birthCountry: 'Szlovákia',
                birthCity: 'Pozsony',
                bankName: 'Raiffeisen Bank',
                accountNumber: '78901234-78901234-78901234',
                birthDate: new Date('1975-04-18'),
                address: 'Bem utca 33.',
                city: 'Győr',
                postalCode: '9022',
                country: 'Magyarország',
                personalIdNumber: '789012MN',
                taxNumber: '78901234-7-07',
                socialSecurityNumber: '789012345',
                hireDate: new Date('2023-03-01'),
                hourlyRate: 1800,
                currency: 'HUF',
                notes: 'Részmunkaidős, hajnali és esti takarítási műszakok'
            }
        }),

        // Deleted Employee (SOFT DELETED)
        prisma.user.create({
            data: {
                name: 'Kiss Gábor',
                email: 'gabor.kiss@company.com',
                hashedPassword,
                role: Role.Employee,
                image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face',

                employeeId: 'EMP008',
                phoneNumber: '+36708901234',
                employmentStatus: EmploymentStatus.TERMINATED, // Megszüntetett státusz
                weeklyWorkHours: 0,
                birthCountry: 'Magyarország',
                birthCity: 'Szombathely',
                bankName: 'Budapest Bank',
                accountNumber: '89012345-89012345-89012345',
                birthDate: new Date('1980-06-25'),
                address: 'Dózsa György út 67.',
                city: 'Szombathely',
                postalCode: '9700',
                country: 'Magyarország',
                personalIdNumber: '890123OP',
                taxNumber: '89012345-8-08',
                socialSecurityNumber: '890123456',
                hireDate: new Date('2019-08-15'),
                hourlyRate: 2100,
                currency: 'HUF',
                notes: 'Munkaviszonya 2024 decemberében megszüntetésre került',

                // SOFT DELETE mezők
                deletedAt: new Date('2024-12-15'),
                deletedBy: ceoUser.id // CEO törölte
            }
        })
    ]);

    console.log('🔗 UserPosition kapcsolatok létrehozása...');

    // All users for easier reference
    const allUsers = [ceoUser, ...users];

    // Pozíciók hozzárendelése felhasználókhoz
    await Promise.all([
        // CEO - minden pozícióhoz hozzáfér
        prisma.userPosition.create({
            data: {
                userId: ceoUser.id,
                positionId: positions[0].id, // Cashier
                isPrimary: false
            }
        }),
        prisma.userPosition.create({
            data: {
                userId: ceoUser.id,
                positionId: positions[1].id, // Kitchen
                isPrimary: true
            }
        }),

        // General Manager (Nagy Anna) - Raktár
        prisma.userPosition.create({
            data: {
                userId: users[0].id, // Nagy Anna
                positionId: positions[2].id, // Storage
                isPrimary: true
            }
        }),
        prisma.userPosition.create({
            data: {
                userId: users[0].id,
                positionId: positions[3].id, // Packer
                isPrimary: false
            }
        }),

        // Manager (Kovács Péter) - Konyha
        prisma.userPosition.create({
            data: {
                userId: users[1].id, // Kovács Péter
                positionId: positions[1].id, // Kitchen
                isPrimary: true
            }
        }),

        // Employee 1 (Szabó Éva) - Pénztáros
        prisma.userPosition.create({
            data: {
                userId: users[2].id, // Szabó Éva
                positionId: positions[0].id, // Cashier
                isPrimary: true
            }
        }),

        // Employee 2 (Tóth Marcell) - Csomagoló
        prisma.userPosition.create({
            data: {
                userId: users[3].id, // Tóth Marcell
                positionId: positions[3].id, // Packer
                isPrimary: true
            }
        }),
        prisma.userPosition.create({
            data: {
                userId: users[3].id,
                positionId: positions[2].id, // Storage
                isPrimary: false
            }
        }),

        // Employee 3 (Varga Tamás) - Kiszállítás
        prisma.userPosition.create({
            data: {
                userId: users[4].id, // Varga Tamás
                positionId: positions[4].id, // Delivery
                isPrimary: true
            }
        }),

        // Employee 4 (Molnár Zsuzsanna) - Takarítás
        prisma.userPosition.create({
            data: {
                userId: users[5].id, // Molnár Zsuzsanna
                positionId: positions[5].id, // Cleaning
                isPrimary: true
            }
        }),

        // Deleted Employee (Kiss Gábor) - Csomagoló (törölt user, de megmaradnak a pozíciói)
        prisma.userPosition.create({
            data: {
                userId: users[6].id, // Kiss Gábor
                positionId: positions[3].id, // Packer
                isPrimary: true
            }
        })
    ]);

    console.log('✅ UserPosition kapcsolatok létrehozva!');

    console.log('📝 TODO-k létrehozása...');

    // Sample TODOs
    const sampleTodos = await Promise.all([
        // Konyhai TODO
        prisma.todo.create({
            data: {
                title: 'Reggeli menu előkészítése',
                description: 'A holnapi reggeli menü összes alapanyagának előkészítése és portionálása.',
                priority: 'HIGH',
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                targetPositionId: positions[1].id, // Kitchen
                createdById: users[0].id, // General Manager
                notes: 'Különös figyelmet fordítani a friss alapanyagokra.'
            }
        }),

        // Pénztári TODO
        prisma.todo.create({
            data: {
                title: 'Napi kassza ellenőrzés',
                description: 'A napi bevételek összesítése és a pénztárgép zárása.',
                priority: 'MEDIUM',
                dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000),
                targetPositionId: positions[0].id, // Cashier
                createdById: users[0].id, // General Manager
                notes: 'Minden nyugtát ellenőrizni kell.'
            }
        }),

        // Sürgős TODO
        prisma.todo.create({
            data: {
                title: 'Csomagolási hiba javítása',
                description: 'A reggeli műszakban történt csomagolási hibát orvosolni kell.',
                priority: 'URGENT',
                dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
                targetPositionId: positions[3].id, // Packer
                createdById: users[0].id, // General Manager
                notes: 'SÜRGŐS! Azonnal kezelendő!'
            }
        }),

        // Kiszállítási TODO
        prisma.todo.create({
            data: {
                title: 'Délutáni kiszállítások',
                description: 'Délután 3 óráig minden megrendelést ki kell szállítani.',
                priority: 'HIGH',
                dueDate: new Date(Date.now() + 5 * 60 * 60 * 1000),
                targetPositionId: positions[4].id, // Delivery
                createdById: users[1].id, // Manager
                notes: 'GPS koordináták mellékelve minden címhez.'
            }
        })
    ]);

    console.log(`✅ ${sampleTodos.length} minta TODO létrehozva!`);

    // Create TODO assignments
    console.log('📌 TODO hozzárendelések létrehozása...');
    await Promise.all([
        // Reggeli menu -> Kovács Péter (Manager)
        prisma.todoAssignment.create({
            data: {
                todoId: sampleTodos[0].id,
                userId: users[1].id,
                status: 'PENDING'
            }
        }),

        // Kassza ellenőrzés -> Szabó Éva (Employee 1)
        prisma.todoAssignment.create({
            data: {
                todoId: sampleTodos[1].id,
                userId: users[2].id,
                status: 'PENDING'
            }
        }),

        // Csomagolási hiba -> Tóth Marcell (Employee 2)
        prisma.todoAssignment.create({
            data: {
                todoId: sampleTodos[2].id,
                userId: users[3].id,
                status: 'PENDING'
            }
        }),

        // Kiszállítások -> Varga Tamás (Employee 3)
        prisma.todoAssignment.create({
            data: {
                todoId: sampleTodos[3].id,
                userId: users[4].id,
                status: 'PENDING'
            }
        })
    ]);

    console.log(`✅ TODO hozzárendelések létrehozva!`);

    // ========================================
    // ÚJ RÉSZ: SCHEDULE, SHIFT, REQUEST ADATOK
    // ========================================

    console.log('\n📅 WeekSchedule-ok létrehozása (2025 október)...');

    // Week 1: 2025-09-29 (hétfő) - 2025-10-05 (vasárnap) - PUBLISHED
    const week1 = await prisma.weekSchedule.create({
        data: {
            weekStart: new Date('2025-09-29T00:00:00.000Z'),
            weekEnd: new Date('2025-10-05T23:59:59.999Z'),
            requestDeadline: new Date('2025-09-26T23:59:59.999Z'),
            createdById: ceoUser.id,
            isPublished: true
        }
    });

    // Week 2: 2025-10-06 (hétfő) - 2025-10-12 (vasárnap) - PUBLISHED
    const week2 = await prisma.weekSchedule.create({
        data: {
            weekStart: new Date('2025-10-06T00:00:00.000Z'),
            weekEnd: new Date('2025-10-12T23:59:59.999Z'),
            requestDeadline: new Date('2025-10-03T23:59:59.999Z'),
            createdById: ceoUser.id,
            isPublished: true
        }
    });

    // Week 3: 2025-10-13 (hétfő) - 2025-10-19 (vasárnap) - PUBLISHED
    const week3 = await prisma.weekSchedule.create({
        data: {
            weekStart: new Date('2025-10-13T00:00:00.000Z'),
            weekEnd: new Date('2025-10-19T23:59:59.999Z'),
            requestDeadline: new Date('2025-10-10T23:59:59.999Z'),
            createdById: ceoUser.id,
            isPublished: true
        }
    });

    // Week 4: 2025-10-20 (hétfő) - 2025-10-26 (vasárnap) - DRAFT
    const week4 = await prisma.weekSchedule.create({
        data: {
            weekStart: new Date('2025-10-20T00:00:00.000Z'),
            weekEnd: new Date('2025-10-26T23:59:59.999Z'),
            requestDeadline: new Date('2025-10-17T23:59:59.999Z'),
            createdById: ceoUser.id,
            isPublished: false // DRAFT
        }
    });

    console.log(`✅ 4 WeekSchedule létrehozva!`);

    console.log('\n🔄 Placeholder shift-ek generálása minden aktív dolgozónak...');

    // Csak ACTIVE dolgozók (nem töröltek)
    const activeUsers = allUsers.filter(u => u.employmentStatus === 'ACTIVE');
    const weeks = [week1, week2, week3, week4];

    let totalPlaceholders = 0;
    for (const week of weeks) {
        const weekStartDate = new Date(week.weekStart);

        for (const user of activeUsers) {
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const shiftDate = new Date(weekStartDate);
                shiftDate.setDate(weekStartDate.getDate() + dayOffset);
                shiftDate.setHours(0, 0, 0, 0);

                await prisma.shift.create({
                    data: {
                        weekScheduleId: week.id,
                        userId: user.id,
                        date: shiftDate,
                        positionId: null,
                        startTime: null,
                        endTime: null,
                        hoursWorked: null,
                        notes: null
                    }
                });
                totalPlaceholders++;
            }
        }
    }

    console.log(`✅ ${totalPlaceholders} placeholder shift létrehozva!`);

    console.log('\n📝 Kitöltött shift-ek létrehozása...');

    // Helper function: Get user by name
    const getUserByName = (name: string) => allUsers.find(u => u.name === name);

    // Helper function: Budapesti időzónában hoz létre dátumot (UTC+2)
    const createBudapestTime = (dateStr: string, hour: number, minute: number = 0) => {
        // Budapesti időzóna: UTC+2 (október)
        const date = new Date(dateStr);
        date.setUTCHours(hour - 2, minute, 0, 0); // UTC-ben 2 órával korábbi
        return date;
    };

    // Helper function: Shift létrehozás/update
    const createOrUpdateShift = async (
        weekScheduleId: string,
        userId: string,
        date: Date,
        positionId: string,
        startHour: number,
        endHour: number,
        notes?: string
    ) => {
        const dateOnly = new Date(date);
        dateOnly.setUTCHours(0, 0, 0, 0);

        // Budapest időzóna: UTC+2, ezért 2 órát levonunk
        const startTime = new Date(date);
        startTime.setUTCHours(startHour - 2, 0, 0, 0);

        const endTime = new Date(date);
        endTime.setUTCHours(endHour - 2, 0, 0, 0);

        const hoursWorked = endHour - startHour;

        // Find existing placeholder
        const existingShift = await prisma.shift.findFirst({
            where: {
                weekScheduleId,
                userId,
                date: dateOnly
            }
        });

        if (existingShift) {
            return await prisma.shift.update({
                where: { id: existingShift.id },
                data: {
                    positionId,
                    startTime,
                    endTime,
                    hoursWorked,
                    notes
                }
            });
        } else {
            return await prisma.shift.create({
                data: {
                    weekScheduleId,
                    userId,
                    date: dateOnly,
                    positionId,
                    startTime,
                    endTime,
                    hoursWorked,
                    notes
                }
            });
        }
    };

    // Week 1 shifts (2025-09-29 - 2025-10-05)
    // CEO - Hétfő-Péntek, Kitchen
    for (let i = 0; i < 5; i++) {
        const shiftDate = new Date('2025-09-29');
        shiftDate.setDate(shiftDate.getDate() + i);
        await createOrUpdateShift(week1.id, ceoUser.id, shiftDate, positions[1].id, 8, 16);
    }

    // GM (Nagy Anna) - Hétfő-Szombat, Storage
    for (let i = 0; i < 6; i++) {
        const shiftDate = new Date('2025-09-29');
        shiftDate.setDate(shiftDate.getDate() + i);
        await createOrUpdateShift(week1.id, users[0].id, shiftDate, positions[2].id, 7, 15);
    }

    // Manager (Kovács Péter) - Kedd-Vasárnap, Kitchen
    for (let i = 1; i < 7; i++) {
        const shiftDate = new Date('2025-09-29');
        shiftDate.setDate(shiftDate.getDate() + i);
        await createOrUpdateShift(week1.id, users[1].id, shiftDate, positions[1].id, 10, 18);
    }

    // Szabó Éva - Hétfő, Szerda, Péntek, Cashier
    await createOrUpdateShift(week1.id, users[2].id, new Date('2025-09-29'), positions[0].id, 9, 17);
    await createOrUpdateShift(week1.id, users[2].id, new Date('2025-10-01'), positions[0].id, 9, 17);
    await createOrUpdateShift(week1.id, users[2].id, new Date('2025-10-03'), positions[0].id, 9, 17);

    // Tóth Marcell - Kedd, Csütörtök, Szombat, Packer
    await createOrUpdateShift(week1.id, users[3].id, new Date('2025-09-30'), positions[3].id, 6, 14);
    await createOrUpdateShift(week1.id, users[3].id, new Date('2025-10-02'), positions[3].id, 6, 14);
    await createOrUpdateShift(week1.id, users[3].id, new Date('2025-10-04'), positions[3].id, 6, 14);

    // Varga Tamás - Hétfő-Péntek, Delivery
    for (let i = 0; i < 5; i++) {
        const shiftDate = new Date('2025-09-29');
        shiftDate.setDate(shiftDate.getDate() + i);
        await createOrUpdateShift(week1.id, users[4].id, shiftDate, positions[4].id, 11, 19);
    }

    // Molnár Zsuzsanna - Hétfő, Szerda, Cleaning (4 óra - részmunkaidős)
    await createOrUpdateShift(week1.id, users[5].id, new Date('2025-09-29'), positions[5].id, 5, 9);
    await createOrUpdateShift(week1.id, users[5].id, new Date('2025-10-01'), positions[5].id, 5, 9);

    console.log('✅ Week 1 shifts kitöltve!');

    // Week 2 shifts (2025-10-06 - 2025-10-12) - ShiftRequest időpontokhoz igazítva
    // CEO
    for (let i = 0; i < 5; i++) {
        const shiftDate = new Date('2025-10-06');
        shiftDate.setDate(shiftDate.getDate() + i);
        await createOrUpdateShift(week2.id, ceoUser.id, shiftDate, positions[1].id, 8, 16);
    }

    // GM (Nagy Anna)
    for (let i = 0; i < 6; i++) {
        const shiftDate = new Date('2025-10-06');
        shiftDate.setDate(shiftDate.getDate() + i);
        await createOrUpdateShift(week2.id, users[0].id, shiftDate, positions[2].id, 7, 15);
    }

    // Manager (Kovács Péter)
    // Oct 7 - SPECIFIC_TIME request 10:00-18:00 APPROVED
    await createOrUpdateShift(week2.id, users[1].id, new Date('2025-10-07'), positions[0].id, 10, 18);
    // Oct 9 - AVAILABLE_ALL_DAY request APPROVED
    await createOrUpdateShift(week2.id, users[1].id, new Date('2025-10-09'), positions[0].id, 10, 18);
    // Többi nap: standard
    await createOrUpdateShift(week2.id, users[1].id, new Date('2025-10-08'), positions[1].id, 10, 18);
    await createOrUpdateShift(week2.id, users[1].id, new Date('2025-10-10'), positions[1].id, 10, 18);
    await createOrUpdateShift(week2.id, users[1].id, new Date('2025-10-11'), positions[1].id, 10, 18);
    await createOrUpdateShift(week2.id, users[1].id, new Date('2025-10-12'), positions[1].id, 10, 18);

    // Szabó Éva (Cashier)
    // Oct 6 - AVAILABLE_ALL_DAY request APPROVED
    await createOrUpdateShift(week2.id, users[2].id, new Date('2025-10-06'), positions[1].id, 9, 17);
    // Oct 7 - nincs request, standard
    await createOrUpdateShift(week2.id, users[2].id, new Date('2025-10-07'), positions[1].id, 9, 17);
    // Oct 8 - TIME_OFF request APPROVED, nincs shift
    // Oct 9 - nincs request, standard
    await createOrUpdateShift(week2.id, users[2].id, new Date('2025-10-09'), positions[1].id, 9, 17);
    // Oct 10 - SPECIFIC_TIME request 10:00-18:00 APPROVED
    await createOrUpdateShift(week2.id, users[2].id, new Date('2025-10-10'), positions[1].id, 10, 18);
    // Oct 11 - SPECIFIC_TIME request REJECTED, nincs shift

    // Tóth Marcell (Packer)
    // Oct 7 - AVAILABLE_ALL_DAY request CONVERTED_TO_SHIFT
    await createOrUpdateShift(week2.id, users[3].id, new Date('2025-10-07'), positions[3].id, 6, 14);
    // Oct 8 - SPECIFIC_TIME request 8:00-16:00 APPROVED
    await createOrUpdateShift(week2.id, users[3].id, new Date('2025-10-08'), positions[3].id, 8, 16);
    // Oct 9 - nincs request, standard
    await createOrUpdateShift(week2.id, users[3].id, new Date('2025-10-09'), positions[3].id, 6, 14);
    // Oct 10 - SPECIFIC_TIME request 14:00-22:00 CONVERTED_TO_SHIFT
    await createOrUpdateShift(week2.id, users[3].id, new Date('2025-10-10'), positions[3].id, 14, 22);
    // Oct 11 - AVAILABLE_ALL_DAY request APPROVED
    await createOrUpdateShift(week2.id, users[3].id, new Date('2025-10-11'), positions[3].id, 6, 14);

    // Varga Tamás (Delivery)
    // Oct 6 - SPECIFIC_TIME request 14:00-22:00 PENDING
    await createOrUpdateShift(week2.id, users[4].id, new Date('2025-10-06'), positions[4].id, 14, 22);
    // Oct 7 - nincs request, standard
    await createOrUpdateShift(week2.id, users[4].id, new Date('2025-10-07'), positions[4].id, 11, 19);
    // Oct 8 - AVAILABLE_ALL_DAY request PENDING
    await createOrUpdateShift(week2.id, users[4].id, new Date('2025-10-08'), positions[4].id, 11, 19);
    // Oct 9 - nincs request, standard
    await createOrUpdateShift(week2.id, users[4].id, new Date('2025-10-09'), positions[4].id, 11, 19);
    // Oct 10 - AVAILABLE_ALL_DAY request PENDING
    await createOrUpdateShift(week2.id, users[4].id, new Date('2025-10-10'), positions[4].id, 11, 19);
    // Oct 12 - AVAILABLE_ALL_DAY request PENDING
    await createOrUpdateShift(week2.id, users[4].id, new Date('2025-10-12'), positions[4].id, 11, 19);

    // Molnár Zsuzsanna (Cleaning)
    // Oct 6 - nincs request, standard
    await createOrUpdateShift(week2.id, users[5].id, new Date('2025-10-06'), positions[5].id, 5, 9);
    // Oct 7 - SPECIFIC_TIME request 6:00-10:00 APPROVED
    await createOrUpdateShift(week2.id, users[5].id, new Date('2025-10-07'), positions[5].id, 6, 10);
    // Oct 8 - nincs request, standard
    await createOrUpdateShift(week2.id, users[5].id, new Date('2025-10-08'), positions[5].id, 5, 9);
    // Oct 9 - TIME_OFF request PENDING, nincs shift
    // Oct 12 - SPECIFIC_TIME request 6:00-10:00 APPROVED
    await createOrUpdateShift(week2.id, users[5].id, new Date('2025-10-12'), positions[5].id, 6, 10);

    console.log('✅ Week 2 shifts kitöltve!');

    // Week 3 shifts (2025-10-13 - 2025-10-19)
    // CEO
    for (let i = 0; i < 5; i++) {
        const shiftDate = new Date('2025-10-13');
        shiftDate.setDate(shiftDate.getDate() + i);
        await createOrUpdateShift(week3.id, ceoUser.id, shiftDate, positions[1].id, 8, 16);
    }

    // GM
    for (let i = 0; i < 6; i++) {
        const shiftDate = new Date('2025-10-13');
        shiftDate.setDate(shiftDate.getDate() + i);
        await createOrUpdateShift(week3.id, users[0].id, shiftDate, positions[2].id, 7, 15);
    }

    // Manager
    for (let i = 1; i < 7; i++) {
        const shiftDate = new Date('2025-10-13');
        shiftDate.setDate(shiftDate.getDate() + i);
        await createOrUpdateShift(week3.id, users[1].id, shiftDate, positions[1].id, 10, 18);
    }

    // Szabó Éva
    await createOrUpdateShift(week3.id, users[2].id, new Date('2025-10-13'), positions[0].id, 9, 17);
    // 2025-10-15 - TIME_OFF request (PENDING)
    await createOrUpdateShift(week3.id, users[2].id, new Date('2025-10-17'), positions[0].id, 9, 17);

    // Tóth Marcell
    await createOrUpdateShift(week3.id, users[3].id, new Date('2025-10-14'), positions[3].id, 6, 14);
    await createOrUpdateShift(week3.id, users[3].id, new Date('2025-10-16'), positions[3].id, 6, 14);
    await createOrUpdateShift(week3.id, users[3].id, new Date('2025-10-18'), positions[3].id, 6, 14);

    // Varga Tamás - SKIP 2025-10-16 (csütörtök) - TIME_OFF
    await createOrUpdateShift(week3.id, users[4].id, new Date('2025-10-13'), positions[4].id, 11, 19);
    await createOrUpdateShift(week3.id, users[4].id, new Date('2025-10-14'), positions[4].id, 11, 19);
    await createOrUpdateShift(week3.id, users[4].id, new Date('2025-10-15'), positions[4].id, 11, 19);
    // 2025-10-16 - TIME_OFF
    await createOrUpdateShift(week3.id, users[4].id, new Date('2025-10-17'), positions[4].id, 11, 19);

    // Molnár Zsuzsanna
    await createOrUpdateShift(week3.id, users[5].id, new Date('2025-10-13'), positions[5].id, 5, 9);
    await createOrUpdateShift(week3.id, users[5].id, new Date('2025-10-15'), positions[5].id, 5, 9);

    console.log('✅ Week 3 shifts kitöltve!');

    console.log('\n📋 ShiftRequest-ek létrehozása...');

    // Week 2 requests (Oct 6-12) - Több kérés különböző emberektől

    // Október 6 (Hétfő) - 2 request
    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[2].id, // Szabó Éva
            positionId: positions[1].id, // Cashier
            type: 'AVAILABLE_ALL_DAY',
            date: new Date('2025-10-06T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'APPROVED',
            notes: 'Hétfőn bármikor elérhető vagyok'
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[4].id, // Varga Tamás
            positionId: positions[4].id, // Delivery
            type: 'SPECIFIC_TIME',
            date: new Date('2025-10-06T00:00:00.000Z'),
            preferredStartTime: createBudapestTime('2025-10-06', 14, 0), // 14:00 Budapest = 12:00 UTC
            preferredEndTime: createBudapestTime('2025-10-06', 22, 0), // 22:00 Budapest = 20:00 UTC
            status: 'PENDING',
            notes: 'Délutáni műszak preferált'
        }
    });

    // Október 7 (Kedd) - 3 request
    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[3].id, // Tóth Marcell
            positionId: positions[3].id, // Packer
            type: 'AVAILABLE_ALL_DAY',
            date: new Date('2025-10-07T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'CONVERTED_TO_SHIFT',
            notes: 'Kedden elérhető vagyok'
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[5].id, // Molnár Zsuzsanna
            positionId: positions[5].id, // Cleaning
            type: 'SPECIFIC_TIME',
            date: new Date('2025-10-07T00:00:00.000Z'),
            preferredStartTime: createBudapestTime('2025-10-07', 6, 0), // 6:00 Budapest = 4:00 UTC
            preferredEndTime: createBudapestTime('2025-10-07', 10, 0), // 10:00 Budapest = 8:00 UTC
            status: 'APPROVED',
            notes: 'Hajnali műszak kérése'
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[1].id, // Kovács Péter (Manager)
            positionId: positions[0].id, // Manager
            type: 'SPECIFIC_TIME',
            date: new Date('2025-10-07T00:00:00.000Z'),
            preferredStartTime: createBudapestTime('2025-10-07', 10, 0), // 10:00 Budapest = 8:00 UTC
            preferredEndTime: createBudapestTime('2025-10-07', 18, 0), // 18:00 Budapest = 16:00 UTC
            status: 'APPROVED',
            notes: 'Normál műszak'
        }
    });

    // Október 8 (Szerda) - TIME_OFF + 2 másik request
    const request1 = await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[2].id, // Szabó Éva
            positionId: null,
            type: 'TIME_OFF',
            date: new Date('2025-10-08T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'APPROVED',
            notes: 'Családi rendezvény',
            vacationDays: 1,
            deductedFromBalance: true
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[4].id, // Varga Tamás
            positionId: positions[4].id, // Delivery
            type: 'AVAILABLE_ALL_DAY',
            date: new Date('2025-10-08T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'PENDING',
            notes: 'Szerdán bármikor tudok dolgozni'
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[3].id, // Tóth Marcell
            positionId: positions[3].id, // Packer
            type: 'SPECIFIC_TIME',
            date: new Date('2025-10-08T00:00:00.000Z'),
            preferredStartTime: createBudapestTime('2025-10-08', 8, 0), // 8:00 Budapest = 6:00 UTC
            preferredEndTime: createBudapestTime('2025-10-08', 16, 0), // 16:00 Budapest = 14:00 UTC
            status: 'APPROVED',
            notes: 'Reggeli műszak preferált'
        }
    });

    // Október 9 (Csütörtök) - 2 request
    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[5].id, // Molnár Zsuzsanna
            positionId: null,
            type: 'TIME_OFF',
            date: new Date('2025-10-09T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'PENDING',
            notes: 'Orvosi vizsgálat',
            vacationDays: 0.5,
            deductedFromBalance: false
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[1].id, // Kovács Péter
            positionId: positions[0].id, // Manager
            type: 'AVAILABLE_ALL_DAY',
            date: new Date('2025-10-09T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'APPROVED',
            notes: 'Csütörtökön be tudok jönni'
        }
    });

    // Október 10 (Péntek) - 3 request
    const request2 = await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[3].id, // Tóth Marcell
            positionId: positions[3].id, // Packer
            type: 'SPECIFIC_TIME',
            date: new Date('2025-10-10T00:00:00.000Z'),
            preferredStartTime: createBudapestTime('2025-10-10', 14, 0), // 14:00 Budapest = 12:00 UTC
            preferredEndTime: createBudapestTime('2025-10-10', 22, 0), // 22:00 Budapest = 20:00 UTC
            status: 'CONVERTED_TO_SHIFT',
            notes: 'Esti műszak kérése'
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[2].id, // Szabó Éva
            positionId: positions[1].id, // Cashier
            type: 'SPECIFIC_TIME',
            date: new Date('2025-10-10T00:00:00.000Z'),
            preferredStartTime: createBudapestTime('2025-10-10', 10, 0), // 10:00 Budapest = 8:00 UTC
            preferredEndTime: createBudapestTime('2025-10-10', 18, 0), // 18:00 Budapest = 16:00 UTC
            status: 'APPROVED',
            notes: 'Délelőtti kezdés'
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[4].id, // Varga Tamás
            positionId: positions[4].id, // Delivery
            type: 'AVAILABLE_ALL_DAY',
            date: new Date('2025-10-10T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'PENDING',
            notes: 'Pénteken rugalmas vagyok'
        }
    });

    // Október 11 (Szombat) - 2 request
    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[2].id, // Szabó Éva
            positionId: positions[1].id, // Cashier
            type: 'SPECIFIC_TIME',
            date: new Date('2025-10-11T00:00:00.000Z'),
            preferredStartTime: createBudapestTime('2025-10-11', 9, 0), // 9:00 Budapest = 7:00 UTC
            preferredEndTime: createBudapestTime('2025-10-11', 17, 0), // 17:00 Budapest = 15:00 UTC
            status: 'REJECTED',
            notes: 'Szombat délelőtt preferált',
            rejectionReason: 'Már elegendő létszám van erre a napra'
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[3].id, // Tóth Marcell
            positionId: positions[3].id, // Packer
            type: 'AVAILABLE_ALL_DAY',
            date: new Date('2025-10-11T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'APPROVED',
            notes: 'Szombaton bármikor tudok'
        }
    });

    // Október 12 (Vasárnap) - 2 request
    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[4].id, // Varga Tamás
            positionId: positions[4].id, // Delivery
            type: 'AVAILABLE_ALL_DAY',
            date: new Date('2025-10-12T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'PENDING',
            notes: 'Vasárnap elérhető vagyok'
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week2.id,
            userId: users[5].id, // Molnár Zsuzsanna
            positionId: positions[5].id, // Cleaning
            type: 'SPECIFIC_TIME',
            date: new Date('2025-10-12T00:00:00.000Z'),
            preferredStartTime: createBudapestTime('2025-10-12', 6, 0), // 6:00 Budapest = 4:00 UTC
            preferredEndTime: createBudapestTime('2025-10-12', 10, 0), // 10:00 Budapest = 8:00 UTC
            status: 'APPROVED',
            notes: 'Vasárnap reggel takarítás'
        }
    });

    // Week 3 requests
    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week3.id,
            userId: users[2].id, // Szabó Éva
            positionId: null,
            type: 'TIME_OFF',
            date: new Date('2025-10-15T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'PENDING',
            notes: 'Orvosi vizsgálat',
            vacationDays: 1
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week3.id,
            userId: users[5].id, // Molnár Zsuzsanna
            positionId: positions[5].id, // Cleaning
            type: 'SPECIFIC_TIME',
            date: new Date('2025-10-17T00:00:00.000Z'),
            preferredStartTime: createBudapestTime('2025-10-17', 10, 0), // 10:00 Budapest = 8:00 UTC
            preferredEndTime: createBudapestTime('2025-10-17', 14, 0), // 14:00 Budapest = 12:00 UTC
            status: 'REJECTED',
            notes: 'Délutáni műszak kérése',
            rejectionReason: 'Nincs elegendő létszám takarításhoz reggel'
        }
    });

    const request3 = await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week3.id,
            userId: users[4].id, // Varga Tamás
            positionId: null,
            type: 'TIME_OFF',
            date: new Date('2025-10-16T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'APPROVED',
            notes: 'Családi rendezvény',
            vacationDays: 1,
            deductedFromBalance: true
        }
    });

    // Week 4 requests
    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week4.id,
            userId: users[3].id, // Tóth Marcell
            positionId: positions[3].id, // Packer
            type: 'AVAILABLE_ALL_DAY',
            date: new Date('2025-10-22T00:00:00.000Z'),
            preferredStartTime: null,
            preferredEndTime: null,
            status: 'PENDING',
            notes: 'Szerda bármikor elérhető'
        }
    });

    await prisma.shiftRequest.create({
        data: {
            weekScheduleId: week4.id,
            userId: users[2].id, // Szabó Éva
            positionId: positions[0].id, // Cashier
            type: 'SPECIFIC_TIME',
            date: new Date('2025-10-24T00:00:00.000Z'),
            preferredStartTime: createBudapestTime('2025-10-24', 12, 0), // 12:00 Budapest = 10:00 UTC
            preferredEndTime: createBudapestTime('2025-10-24', 20, 0), // 20:00 Budapest = 18:00 UTC
            status: 'PENDING',
            notes: 'Délutáni-esti műszak kérése'
        }
    });

    console.log('✅ 8 ShiftRequest létrehozva!');

    console.log('\n⏱️ ActualWorkHours rögzítése (Week 1)...');

    // Week 1 - múltbéli hét, már ledolgozva
    // Helper: Get shifts for user on specific date
    const getShift = async (weekId: string, userId: string, dateStr: string) => {
        const date = new Date(dateStr);
        date.setUTCHours(0, 0, 0, 0); // UTC-ben kell keresni, mert createOrUpdateShift UTC-t használ
        return await prisma.shift.findFirst({
            where: {
                weekScheduleId: weekId,
                userId,
                date,
                startTime: { not: null }
            }
        });
    };

    // CEO - 5 napot dolgozott (Hétfő-Péntek), mind PRESENT
    for (let i = 0; i < 5; i++) {
        const dateStr = new Date('2025-09-29');
        dateStr.setDate(dateStr.getDate() + i);
        const shift = await getShift(week1.id, ceoUser.id, dateStr.toISOString().split('T')[0]);
        if (shift && shift.startTime && shift.endTime) {
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId: ceoUser.id,
                    actualStartTime: shift.startTime,
                    actualEndTime: shift.endTime,
                    actualHoursWorked: 8.0,
                    status: 'PRESENT',
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-06T10:00:00.000Z')
                }
            });
        }
    }

    // GM - 6 napot dolgozott
    for (let i = 0; i < 6; i++) {
        const dateStr = new Date('2025-09-29');
        dateStr.setDate(dateStr.getDate() + i);
        const shift = await getShift(week1.id, users[0].id, dateStr.toISOString().split('T')[0]);
        if (shift && shift.startTime && shift.endTime) {
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId: users[0].id,
                    actualStartTime: shift.startTime,
                    actualEndTime: shift.endTime,
                    actualHoursWorked: 8.0,
                    status: 'PRESENT',
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-06T10:00:00.000Z')
                }
            });
        }
    }

    // Manager - 6 nap, de 2025-10-02 (csütörtök) SICK volt
    for (let i = 1; i < 7; i++) {
        const dateStr = new Date('2025-09-29');
        dateStr.setDate(dateStr.getDate() + i);
        const shift = await getShift(week1.id, users[1].id, dateStr.toISOString().split('T')[0]);
        if (shift) {
            const isSick = dateStr.toISOString().split('T')[0] === '2025-10-02';
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId: users[1].id,
                    actualStartTime: isSick ? null : shift.startTime,
                    actualEndTime: isSick ? null : shift.endTime,
                    actualHoursWorked: isSick ? null : 8.0,
                    status: isSick ? 'SICK' : 'PRESENT',
                    notes: isSick ? 'Influenza' : null,
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-06T10:00:00.000Z')
                }
            });
        }
    }

    // Szabó Éva - 3 nap (hétfő, szerda, péntek)
    const szaboShifts = ['2025-09-29', '2025-10-01', '2025-10-03'];
    for (const dateStr of szaboShifts) {
        const shift = await getShift(week1.id, users[2].id, dateStr);
        if (shift && shift.startTime && shift.endTime) {
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId: users[2].id,
                    actualStartTime: shift.startTime,
                    actualEndTime: shift.endTime,
                    actualHoursWorked: 8.0,
                    status: 'PRESENT',
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-06T10:00:00.000Z')
                }
            });
        }
    }

    // Tóth Marcell - 3 nap, de 2025-09-30 (kedd) ABSENT
    const tothShifts = ['2025-09-30', '2025-10-02', '2025-10-04'];
    for (const dateStr of tothShifts) {
        const shift = await getShift(week1.id, users[3].id, dateStr);
        if (shift) {
            const isAbsent = dateStr === '2025-09-30';
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId: users[3].id,
                    actualStartTime: isAbsent ? null : shift.startTime,
                    actualEndTime: isAbsent ? null : shift.endTime,
                    actualHoursWorked: isAbsent ? null : 8.0,
                    status: isAbsent ? 'ABSENT' : 'PRESENT',
                    notes: isAbsent ? 'Igazolatlan hiányzás' : null,
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-06T10:00:00.000Z')
                }
            });
        }
    }

    // Varga Tamás - 5 nap
    for (let i = 0; i < 5; i++) {
        const dateStr = new Date('2025-09-29');
        dateStr.setDate(dateStr.getDate() + i);
        const shift = await getShift(week1.id, users[4].id, dateStr.toISOString().split('T')[0]);
        if (shift && shift.startTime && shift.endTime) {
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId: users[4].id,
                    actualStartTime: shift.startTime,
                    actualEndTime: shift.endTime,
                    actualHoursWorked: 8.0,
                    status: 'PRESENT',
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-06T10:00:00.000Z')
                }
            });
        }
    }

    // Molnár Zsuzsanna - 2 nap (4 óra/nap)
    const molnarShifts = ['2025-09-29', '2025-10-01'];
    for (const dateStr of molnarShifts) {
        const shift = await getShift(week1.id, users[5].id, dateStr);
        if (shift && shift.startTime && shift.endTime) {
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId: users[5].id,
                    actualStartTime: shift.startTime,
                    actualEndTime: shift.endTime,
                    actualHoursWorked: 4.0,
                    status: 'PRESENT',
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-06T10:00:00.000Z')
                }
            });
        }
    }

    console.log('✅ ActualWorkHours rögzítve Week 1-hez!');

    console.log('\n⏱️ ActualWorkHours rögzítése (Week 2 - Oct 6-12)...');

    // Week 2 - múltbéli hét, már ledolgozva (Oct 6-12)

    // Hétfő, Oct 6
    // CEO
    const ceoShiftOct6 = await getShift(week2.id, ceoUser.id, '2025-10-06');
    if (ceoShiftOct6 && ceoShiftOct6.startTime && ceoShiftOct6.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: ceoShiftOct6.id,
                userId: ceoUser.id,
                actualStartTime: ceoShiftOct6.startTime,
                actualEndTime: ceoShiftOct6.endTime,
                actualHoursWorked: 8.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // GM (Nagy Anna)
    const gmShiftOct6 = await getShift(week2.id, users[0].id, '2025-10-06');
    if (gmShiftOct6 && gmShiftOct6.startTime && gmShiftOct6.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: gmShiftOct6.id,
                userId: users[0].id,
                actualStartTime: gmShiftOct6.startTime,
                actualEndTime: gmShiftOct6.endTime,
                actualHoursWorked: 8.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Kovács Péter (Manager)
    const managerShiftOct6 = await getShift(week2.id, users[1].id, '2025-10-06');
    if (managerShiftOct6 && managerShiftOct6.startTime && managerShiftOct6.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: managerShiftOct6.id,
                userId: users[1].id,
                actualStartTime: managerShiftOct6.startTime,
                actualEndTime: managerShiftOct6.endTime,
                actualHoursWorked: 8.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Szabó Éva
    const szaboShiftOct6 = await getShift(week2.id, users[2].id, '2025-10-06');
    if (szaboShiftOct6 && szaboShiftOct6.startTime && szaboShiftOct6.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: szaboShiftOct6.id,
                userId: users[2].id,
                actualStartTime: szaboShiftOct6.startTime,
                actualEndTime: szaboShiftOct6.endTime,
                actualHoursWorked: 8.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Varga Tamás
    const vargaShiftOct6 = await getShift(week2.id, users[4].id, '2025-10-06');
    if (vargaShiftOct6 && vargaShiftOct6.startTime && vargaShiftOct6.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: vargaShiftOct6.id,
                userId: users[4].id,
                actualStartTime: vargaShiftOct6.startTime,
                actualEndTime: vargaShiftOct6.endTime,
                actualHoursWorked: 8.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Molnár Zsuzsanna
    const molnarShiftOct6 = await getShift(week2.id, users[5].id, '2025-10-06');
    if (molnarShiftOct6 && molnarShiftOct6.startTime && molnarShiftOct6.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: molnarShiftOct6.id,
                userId: users[5].id,
                actualStartTime: molnarShiftOct6.startTime,
                actualEndTime: molnarShiftOct6.endTime,
                actualHoursWorked: 4.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Kedd, Oct 7
    const week2Oct7Shifts = [
        { userId: ceoUser.id, hours: 8.0 },
        { userId: users[0].id, hours: 8.0 }, // Nagy Anna
        { userId: users[1].id, hours: 8.0 }, // Kovács Péter
        { userId: users[2].id, hours: 8.0 }, // Szabó Éva
        { userId: users[3].id, hours: 8.0 }, // Tóth Marcell
        { userId: users[4].id, hours: 8.0 }, // Varga Tamás
        { userId: users[5].id, hours: 4.0 }, // Molnár Zsuzsanna
    ];

    for (const { userId, hours } of week2Oct7Shifts) {
        const shift = await getShift(week2.id, userId, '2025-10-07');
        if (shift && shift.startTime && shift.endTime) {
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId,
                    actualStartTime: shift.startTime,
                    actualEndTime: shift.endTime,
                    actualHoursWorked: hours,
                    status: 'PRESENT',
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-13T10:00:00.000Z')
                }
            });
        }
    }

    // Szerda, Oct 8 - Szabó Éva TIME_OFF, nincs ActualWorkHours
    const week2Oct8Shifts = [
        { userId: ceoUser.id, hours: 8.0 },
        { userId: users[0].id, hours: 8.0 }, // Nagy Anna
        { userId: users[1].id, hours: 8.0 }, // Kovács Péter
        // Szabó Éva - TIME_OFF, skip
        { userId: users[3].id, hours: 8.0 }, // Tóth Marcell
        { userId: users[4].id, hours: 8.0 }, // Varga Tamás
        { userId: users[5].id, hours: 4.0 }, // Molnár Zsuzsanna
    ];

    for (const { userId, hours } of week2Oct8Shifts) {
        const shift = await getShift(week2.id, userId, '2025-10-08');
        if (shift && shift.startTime && shift.endTime) {
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId,
                    actualStartTime: shift.startTime,
                    actualEndTime: shift.endTime,
                    actualHoursWorked: hours,
                    status: 'PRESENT',
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-13T10:00:00.000Z')
                }
            });
        }
    }

    // Csütörtök, Oct 9 - Molnár Zsuzsanna TIME_OFF PENDING
    const week2Oct9Shifts = [
        { userId: ceoUser.id, hours: 8.0 },
        { userId: users[0].id, hours: 8.0 }, // Nagy Anna
        { userId: users[1].id, hours: 8.0 }, // Kovács Péter
        { userId: users[2].id, hours: 8.0 }, // Szabó Éva
        { userId: users[3].id, hours: 8.0 }, // Tóth Marcell
        { userId: users[4].id, hours: 8.0 }, // Varga Tamás
        // Molnár Zsuzsanna - TIME_OFF, skip
    ];

    for (const { userId, hours } of week2Oct9Shifts) {
        const shift = await getShift(week2.id, userId, '2025-10-09');
        if (shift && shift.startTime && shift.endTime) {
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId,
                    actualStartTime: shift.startTime,
                    actualEndTime: shift.endTime,
                    actualHoursWorked: hours,
                    status: 'PRESENT',
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-13T10:00:00.000Z')
                }
            });
        }
    }

    // Péntek, Oct 10 - Varga Tamás ABSENT
    // CEO
    const ceoShiftOct10 = await getShift(week2.id, ceoUser.id, '2025-10-10');
    if (ceoShiftOct10 && ceoShiftOct10.startTime && ceoShiftOct10.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: ceoShiftOct10.id,
                userId: ceoUser.id,
                actualStartTime: ceoShiftOct10.startTime,
                actualEndTime: ceoShiftOct10.endTime,
                actualHoursWorked: 8.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Nagy Anna
    const gmShiftOct10 = await getShift(week2.id, users[0].id, '2025-10-10');
    if (gmShiftOct10 && gmShiftOct10.startTime && gmShiftOct10.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: gmShiftOct10.id,
                userId: users[0].id,
                actualStartTime: gmShiftOct10.startTime,
                actualEndTime: gmShiftOct10.endTime,
                actualHoursWorked: 8.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Kovács Péter
    const managerShiftOct10 = await getShift(week2.id, users[1].id, '2025-10-10');
    if (managerShiftOct10 && managerShiftOct10.startTime && managerShiftOct10.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: managerShiftOct10.id,
                userId: users[1].id,
                actualStartTime: managerShiftOct10.startTime,
                actualEndTime: managerShiftOct10.endTime,
                actualHoursWorked: 8.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Szabó Éva
    const szaboShiftOct10 = await getShift(week2.id, users[2].id, '2025-10-10');
    if (szaboShiftOct10 && szaboShiftOct10.startTime && szaboShiftOct10.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: szaboShiftOct10.id,
                userId: users[2].id,
                actualStartTime: szaboShiftOct10.startTime,
                actualEndTime: szaboShiftOct10.endTime,
                actualHoursWorked: 8.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Tóth Marcell
    const tothShiftOct10 = await getShift(week2.id, users[3].id, '2025-10-10');
    if (tothShiftOct10 && tothShiftOct10.startTime && tothShiftOct10.endTime) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: tothShiftOct10.id,
                userId: users[3].id,
                actualStartTime: tothShiftOct10.startTime,
                actualEndTime: tothShiftOct10.endTime,
                actualHoursWorked: 8.0,
                status: 'PRESENT',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Varga Tamás - ABSENT
    const vargaShiftOct10 = await getShift(week2.id, users[4].id, '2025-10-10');
    if (vargaShiftOct10) {
        await prisma.actualWorkHours.create({
            data: {
                shiftId: vargaShiftOct10.id,
                userId: users[4].id,
                actualStartTime: null,
                actualEndTime: null,
                actualHoursWorked: null,
                status: 'ABSENT',
                notes: 'Igazolatlan hiányzás',
                recordedById: ceoUser.id,
                recordedAt: new Date('2025-10-13T10:00:00.000Z')
            }
        });
    }

    // Szombat, Oct 11
    const week2Oct11Shifts = [
        { userId: users[0].id, hours: 8.0 }, // Nagy Anna
        { userId: users[1].id, hours: 8.0 }, // Kovács Péter
        { userId: users[3].id, hours: 8.0 }, // Tóth Marcell
    ];

    for (const { userId, hours } of week2Oct11Shifts) {
        const shift = await getShift(week2.id, userId, '2025-10-11');
        if (shift && shift.startTime && shift.endTime) {
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId,
                    actualStartTime: shift.startTime,
                    actualEndTime: shift.endTime,
                    actualHoursWorked: hours,
                    status: 'PRESENT',
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-13T10:00:00.000Z')
                }
            });
        }
    }

    // Vasárnap, Oct 12
    const week2Oct12Shifts = [
        { userId: users[1].id, hours: 8.0 }, // Kovács Péter
        { userId: users[4].id, hours: 8.0 }, // Varga Tamás
        { userId: users[5].id, hours: 4.0 }, // Molnár Zsuzsanna
    ];

    for (const { userId, hours } of week2Oct12Shifts) {
        const shift = await getShift(week2.id, userId, '2025-10-12');
        if (shift && shift.startTime && shift.endTime) {
            await prisma.actualWorkHours.create({
                data: {
                    shiftId: shift.id,
                    userId,
                    actualStartTime: shift.startTime,
                    actualEndTime: shift.endTime,
                    actualHoursWorked: hours,
                    status: 'PRESENT',
                    recordedById: ceoUser.id,
                    recordedAt: new Date('2025-10-13T10:00:00.000Z')
                }
            });
        }
    }

    console.log('✅ ActualWorkHours rögzítve Week 2-höz!');

    console.log('\n🏖️ TimeOffRequest-ek létrehozása...');

    // VACATION típusú kérések
    await prisma.timeOffRequest.create({
        data: {
            userId: users[2].id, // Szabó Éva
            type: 'VACATION',
            startDate: new Date('2025-10-21T00:00:00.000Z'),
            endDate: new Date('2025-10-25T00:00:00.000Z'),
            daysCount: 5,
            status: 'PENDING',
            notes: 'Családi nyaralás',
            deductedFromBalance: false
        }
    });

    await prisma.timeOffRequest.create({
        data: {
            userId: users[4].id, // Varga Tamás
            type: 'VACATION',
            startDate: new Date('2025-10-28T00:00:00.000Z'),
            endDate: new Date('2025-11-01T00:00:00.000Z'),
            daysCount: 5,
            status: 'APPROVED',
            notes: 'Őszi pihenés',
            reviewedById: ceoUser.id,
            reviewedAt: new Date('2025-10-15T14:00:00.000Z'),
            deductedFromBalance: true
        }
    });

    await prisma.timeOffRequest.create({
        data: {
            userId: users[3].id, // Tóth Marcell
            type: 'VACATION',
            startDate: new Date('2025-11-04T00:00:00.000Z'),
            endDate: new Date('2025-11-08T00:00:00.000Z'),
            daysCount: 5,
            status: 'REJECTED',
            notes: 'Pihenés',
            rejectionReason: 'Túl sok dolgozó hiányzik abban a héten',
            reviewedById: users[0].id, // GM
            reviewedAt: new Date('2025-10-20T10:00:00.000Z'),
            deductedFromBalance: false
        }
    });

    // SICK_LEAVE típusú kérés
    await prisma.timeOffRequest.create({
        data: {
            userId: users[1].id, // Kovács Péter (Manager)
            type: 'SICK_LEAVE',
            startDate: new Date('2025-10-02T00:00:00.000Z'),
            endDate: new Date('2025-10-02T00:00:00.000Z'),
            daysCount: 1,
            status: 'APPROVED',
            notes: 'Influenza',
            sickLeaveDocumentUrl: '/uploads/sick_notes/sick_note_001.pdf',
            documentUploadedAt: new Date('2025-10-03T08:00:00.000Z'),
            reviewedById: ceoUser.id,
            reviewedAt: new Date('2025-10-03T09:00:00.000Z'),
            deductedFromBalance: false
        }
    });

    console.log('✅ 4 TimeOffRequest létrehozva!');

    // Összefoglaló statistikák
    console.log('\n📊 Seed eredmények:');
    console.log('===================');

    console.log('\n🏢 Pozíciók:');
    for (const position of positions) {
        const userCount = await prisma.userPosition.count({
            where: { positionId: position.id }
        });
        const todoCount = await prisma.todo.count({
            where: { targetPositionId: position.id }
        });
        const status = position.isActive ? '✅' : '❌';
        const displayName = (position.displayNames as any).hu || position.name;
        console.log(`${status} ${displayName} (${position.name}) - ${userCount} felhasználó, ${todoCount} TODO`);
    }

    console.log('\n👥 Felhasználók:');
    for (const user of allUsers) {
        const userPosition = await prisma.userPosition.findFirst({
            where: { userId: user.id, isPrimary: true },
            include: { position: true }
        });
        const todoAssignments = await prisma.todoAssignment.count({
            where: { userId: user.id }
        });
        const positionName = userPosition?.position ? (userPosition.position.displayNames as any)?.hu || userPosition.position.name : 'Nincs pozíció';
        const employeeStatus = user.employmentStatus === 'ACTIVE' ? '✅' : '❌';
        console.log(`${employeeStatus} ${user.name} (${user.employeeId}) - ${user.role} - ${positionName} - ${todoAssignments} TODO hozzárendelés - ${user.weeklyWorkHours}h/hét`);
    }

    console.log('\n📅 WeekSchedule-ok:');
    const weekSchedules = await prisma.weekSchedule.findMany({
        orderBy: { weekStart: 'asc' }
    });
    for (const schedule of weekSchedules) {
        const shiftCount = await prisma.shift.count({
            where: { weekScheduleId: schedule.id }
        });
        const filledShiftCount = await prisma.shift.count({
            where: {
                weekScheduleId: schedule.id,
                startTime: { not: null }
            }
        });
        const requestCount = await prisma.shiftRequest.count({
            where: { weekScheduleId: schedule.id }
        });
        const weekLabel = schedule.weekStart.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
        const publishStatus = schedule.isPublished ? '✅ PUBLISHED' : '📝 DRAFT';
        console.log(`${publishStatus} ${weekLabel} - ${filledShiftCount}/${shiftCount} shift kitöltve, ${requestCount} kérés`);
    }

    console.log('\n📋 ShiftRequest-ek státusz szerint:');
    const allRequests = await prisma.shiftRequest.findMany({ select: { status: true } });
    const requestsByStatus = allRequests.reduce((acc: any, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
    }, {});
    for (const [status, count] of Object.entries(requestsByStatus)) {
        console.log(`  ${status}: ${count} db`);
    }

    console.log('\n⏱️ ActualWorkHours:');
    const actualHoursCount = await prisma.actualWorkHours.count();
    const allActualHours = await prisma.actualWorkHours.findMany({ select: { status: true } });
    const actualHoursByStatus = allActualHours.reduce((acc: any, ah) => {
        acc[ah.status] = (acc[ah.status] || 0) + 1;
        return acc;
    }, {});
    console.log(`  Összesen: ${actualHoursCount} rögzített munkaóra`);
    for (const [status, count] of Object.entries(actualHoursByStatus)) {
        console.log(`    ${status}: ${count} db`);
    }

    console.log('\n🏖️ TimeOffRequest-ek:');
    const timeOffCount = await prisma.timeOffRequest.count();
    const allTimeOff = await prisma.timeOffRequest.findMany({ select: { type: true } });
    const timeOffByType = allTimeOff.reduce((acc: any, to) => {
        acc[to.type] = (acc[to.type] || 0) + 1;
        return acc;
    }, {});
    console.log(`  Összesen: ${timeOffCount} szabadság kérés`);
    for (const [type, count] of Object.entries(timeOffByType)) {
        console.log(`    ${type}: ${count} db`);
    }

    console.log('\n🎉 Seed sikeresen befejezve!');
    console.log('📝 Alapértelmezett jelszó minden felhasználónak: password123');
    console.log('🔐 Bejelentkezés: kriszcs04@gmail.com / password123 (CEO)');
    console.log('\n💡 Pozíciók menedzsment elérhető lesz a /admin/positions útvonalon');
}

main()
    .catch((e) => {
        console.error('❌ Seed hiba:', e);
        process.exit(1);
        
    })
    .finally(async () => {
        await prisma.$disconnect();
    });