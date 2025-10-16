// prisma/seed.ts
import { PrismaClient, Role, EmploymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Adatbázis seed indítása...');

    // Törölünk minden meglévő adatot (opcionális)
    console.log('📝 Meglévő adatok törlése...');
    await prisma.todo.deleteMany();
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
                image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',

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

        // Inactive Employee
        prisma.user.create({
            data: {
                name: 'Kiss Gábor',
                email: 'gabor.kiss@company.com',
                hashedPassword,
                role: Role.Employee,
                image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face',

                employeeId: 'EMP008',
                phoneNumber: '+36708901234',
                employmentStatus: EmploymentStatus.INACTIVE, // Inaktív státusz
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
                notes: 'Jelenleg szabadságon, visszatérés 2025 szeptemberében várható'
            }
        })
    ]);

    console.log('📝 TODO-k létrehozása...');

    // All users for easier reference
    const allUsers = [ceoUser, ...users];

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