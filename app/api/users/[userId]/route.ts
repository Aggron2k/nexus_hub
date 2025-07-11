// app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { Role, EmploymentStatus } from "@prisma/client";

interface RouteParams {
    params: {
        userId: string;
    };
}

// GET - Felhasználó adatok lekérése
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { userId } = params;

        // Ellenőrizzük a jogosultságokat
        const canViewOthers = ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

        if (!canViewOthers && userId !== currentUser.id) {
            return new NextResponse("Forbidden - Csak a saját profil megtekintése engedélyezett", { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                position: {
                    select: {
                        id: true,
                        name: true,
                        displayNames: true,
                        descriptions: true,
                        color: true,
                        isActive: true,
                        order: true
                    }
                }
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Érzékeny adatok eltávolítása
        const { hashedPassword, ...safeUser } = user;

        return NextResponse.json(safeUser);

    } catch (error) {
        console.error('GET /api/users/[userId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PUT - Felhasználó adatok frissítése
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { userId } = params;
        const body = await request.json();

        // Jogosultságok ellenőrzése
        const canEdit = currentUser.id === userId ||
            ['Manager', 'GeneralManager', 'CEO'].includes(currentUser.role);

        if (!canEdit) {
            return new NextResponse("Forbidden - Nincs jogosultság a módosításhoz", { status: 403 });
        }

        // Szerepkör módosítás jogosultság ellenőrzése
        const canEditRole = ['GeneralManager', 'CEO'].includes(currentUser.role);

        // Adatok validálása
        const {
            name,
            email,
            role,
            positionId,
            image,
            employeeId,
            phoneNumber,
            employmentStatus,
            weeklyWorkHours,
            birthCountry,
            birthCity,
            bankName,
            accountNumber,
            birthDate,
            address,
            city,
            postalCode,
            country,
            personalIdNumber,
            taxNumber,
            socialSecurityNumber,
            hireDate,
            salary,
            hourlyRate,
            currency,
            notes
        } = body;

        // Email validálás
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return new NextResponse("Invalid email format", { status: 400 });
            }

            // Ellenőrizzük, hogy a email egyedi-e (kivéve a jelenlegi felhasználót)
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: email.toLowerCase(),
                    id: { not: userId }
                }
            });

            if (existingUser) {
                return new NextResponse("Email already exists", { status: 409 });
            }
        }

        // EmployeeId ellenőrzése (ha megadott)
        if (employeeId) {
            const existingEmployeeId = await prisma.user.findFirst({
                where: {
                    employeeId: employeeId,
                    id: { not: userId }
                }
            });

            if (existingEmployeeId) {
                return new NextResponse("Employee ID already exists", { status: 409 });
            }
        }

        // Frissítendő adatok összeállítása
        const updateData: any = {
            updatedAt: new Date()
        };

        // Alapadatok
        if (name !== undefined) updateData.name = name.trim();
        if (email !== undefined) updateData.email = email.toLowerCase();
        if (positionId !== undefined) updateData.positionId = positionId || null;
        if (image !== undefined) updateData.image = image || null;

        // Szerepkör csak jogosultsággal
        if (role !== undefined && canEditRole) {
            updateData.role = role;
        }

        // Új munkavállalói mezők
        if (employeeId !== undefined) updateData.employeeId = employeeId || null;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
        if (employmentStatus !== undefined) {
            // Validáljuk az employment status értéket
            const validStatuses = Object.values(EmploymentStatus);
            if (validStatuses.includes(employmentStatus as EmploymentStatus)) {
                updateData.employmentStatus = employmentStatus;
            }
        }
        if (weeklyWorkHours !== undefined) {
            const hours = parseInt(weeklyWorkHours);
            updateData.weeklyWorkHours = (hours >= 0 && hours <= 168) ? hours : null;
        }
        if (birthCountry !== undefined) updateData.birthCountry = birthCountry || null;
        if (birthCity !== undefined) updateData.birthCity = birthCity || null;
        if (bankName !== undefined) updateData.bankName = bankName || null;
        if (accountNumber !== undefined) updateData.accountNumber = accountNumber || null;
        if (birthDate !== undefined) {
            updateData.birthDate = birthDate ? new Date(birthDate) : null;
        }
        if (address !== undefined) updateData.address = address || null;
        if (city !== undefined) updateData.city = city || null;
        if (postalCode !== undefined) updateData.postalCode = postalCode || null;
        if (country !== undefined) updateData.country = country || null;
        if (personalIdNumber !== undefined) updateData.personalIdNumber = personalIdNumber || null;
        if (taxNumber !== undefined) updateData.taxNumber = taxNumber || null;
        if (socialSecurityNumber !== undefined) updateData.socialSecurityNumber = socialSecurityNumber || null;
        if (hireDate !== undefined) {
            updateData.hireDate = hireDate ? new Date(hireDate) : null;
        }
        if (salary !== undefined) {
            const salaryAmount = parseFloat(salary);
            updateData.salary = salaryAmount >= 0 ? salaryAmount : null;
        }
        if (hourlyRate !== undefined) {
            const rate = parseFloat(hourlyRate);
            updateData.hourlyRate = rate >= 0 ? rate : null;
        }
        if (currency !== undefined) updateData.currency = currency || 'HUF';
        if (notes !== undefined) updateData.notes = notes || null;

        // Felhasználó frissítése
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                position: {
                    select: {
                        id: true,
                        name: true,
                        displayNames: true,
                        descriptions: true,
                        color: true,
                        isActive: true,
                        order: true
                    }
                }
            }
        });

        // Érzékeny adatok eltávolítása
        const { hashedPassword, ...safeUser } = updatedUser;

        return NextResponse.json(safeUser);

    } catch (error) {
        console.error('PUT /api/users/[userId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE - Felhasználó törlése
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { userId } = params;

        // Csak CEO és GeneralManager törölhet felhasználókat
        if (!['CEO', 'GeneralManager'].includes(currentUser.role)) {
            return new NextResponse("Forbidden - Nincs jogosultság a törléshez", { status: 403 });
        }

        // Nem lehet saját magát törölni
        if (currentUser.id === userId) {
            return new NextResponse("Cannot delete own account", { status: 400 });
        }

        // Ellenőrizzük, hogy létezik-e a felhasználó
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userToDelete) {
            return new NextResponse("User not found", { status: 404 });
        }

        // CEO nem törölhető (kivéve másik CEO által)
        if (userToDelete.role === 'CEO' && currentUser.role !== 'CEO') {
            return new NextResponse("Cannot delete CEO account", { status: 403 });
        }

        // Felhasználó törlése
        await prisma.user.delete({
            where: { id: userId }
        });

        return new NextResponse("User deleted successfully", { status: 200 });

    } catch (error) {
        console.error('DELETE /api/users/[userId] error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}