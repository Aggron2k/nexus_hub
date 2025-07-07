// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
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
                    en: 'Inventory and warehouse management',
                    hu: 'Raktárkezelés, készletnyilvántartás'
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
                    en: 'Product packaging and preparation',
                    hu: 'Termékek csomagolása, kiszállítás előkészítése'
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
                    hu: 'Kiszállító'
                },
                descriptions: {
                    en: 'Home delivery and logistics',
                    hu: 'Házhozszállítás, logisztika'
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
                    hu: 'Takarító'
                },
                descriptions: {
                    en: 'Cleaning and maintenance',
                    hu: 'Tisztántartás, higiénia'
                },
                isActive: false, // Példa inaktív pozícióra
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
            positionId: positions[1].id, // Kitchen
            image: 'https://avatars.githubusercontent.com/u/40773732?v=4'
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
                positionId: positions[2].id, // Storage
                image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
            }
        }),

        // Manager
        prisma.user.create({
            data: {
                name: 'Kovács Péter',
                email: 'peter.kovacs@company.com',
                hashedPassword,
                role: Role.Manager,
                positionId: positions[1].id, // Kitchen
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
            }
        }),

        // Employee 1 - Cashier
        prisma.user.create({
            data: {
                name: 'Tóth Mária',
                email: 'maria.toth@company.com',
                hashedPassword,
                role: Role.Employee,
                positionId: positions[0].id, // Cashier
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
            }
        }),

        // Employee 2 - Packer
        prisma.user.create({
            data: {
                name: 'Szabó János',
                email: 'janos.szabo@company.com',
                hashedPassword,
                role: Role.Employee,
                positionId: positions[3].id, // Packer
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            }
        }),

        // Employee 3 - Delivery
        prisma.user.create({
            data: {
                name: 'Kiss Zoltán',
                email: 'zoltan.kiss@company.com',
                hashedPassword,
                role: Role.Employee,
                positionId: positions[4].id, // Delivery
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
            }
        })
    ]);

    const allUsers = [ceoUser, ...users];
    console.log(`✅ ${allUsers.length} felhasználó létrehozva!`);

    // Sample TODO-k létrehozása
    console.log('📋 Minta TODO-k létrehozása...');

    const sampleTodos = await Promise.all([
        // CEO által létrehozott TODO a Manager-nek
        prisma.todo.create({
            data: {
                title: 'Havi jelentés elkészítése',
                description: 'Készítsd el a havi értékesítési jelentést és küldd el a vezetőségnek.',
                priority: 'HIGH',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                targetPositionId: positions[1].id, // Kitchen
                assignedUserId: users[1].id, // Manager
                createdById: ceoUser.id,
                notes: 'Kérlek add hozzá a grafikus elemzéseket is.'
            }
        }),

        // Manager által létrehozott TODO az Employee-nak
        prisma.todo.create({
            data: {
                title: 'Raktár leltározása',
                description: 'Végezd el a teljes raktári leltárt és frissítsd a rendszerben.',
                priority: 'MEDIUM',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                targetPositionId: positions[0].id, // Cashier
                assignedUserId: users[2].id, // Employee 1
                createdById: users[1].id, // Manager
                notes: 'Különös figyelmet fordíts a lejárati dátumokra.'
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
                assignedUserId: users[3].id, // Employee 2
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
                assignedUserId: users[4].id, // Employee 3
                createdById: users[1].id, // Manager
                notes: 'GPS koordináták mellékelve minden címhez.'
            }
        })
    ]);

    console.log(`✅ ${sampleTodos.length} minta TODO létrehozva!`);

    // Összefoglaló statistikák
    console.log('\n📊 Seed eredmények:');
    console.log('===================');

    console.log('\n🏢 Pozíciók:');
    for (const position of positions) {
        const userCount = await prisma.user.count({
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
        const position = await prisma.position.findUnique({
            where: { id: user.positionId! }
        });
        const todoCount = await prisma.todo.count({
            where: { assignedUserId: user.id }
        });
        const positionName = position ? (position.displayNames as any)?.hu || position.name : 'Nincs pozíció';
        console.log(`👤 ${user.name} (${user.role}) - ${positionName} - ${todoCount} TODO`);
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