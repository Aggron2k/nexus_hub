// app/api/payroll/generate-pdf/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { jsPDF } from "jspdf";
import axios from "axios";

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Csak GM és CEO generálhat PDF-et
        if (currentUser.role !== "GeneralManager" && currentUser.role !== "CEO") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await request.json();
        const { userId, year, month } = body;

        if (!userId || !year || !month) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Dolgozó adatai
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userPositions: {
                    where: {
                        isPrimary: true,
                    },
                    include: {
                        position: true,
                    },
                },
            },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Hónap kezdete és vége
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        console.log('PDF Generation - Query params:', {
            userId,
            year,
            month,
            monthStart: monthStart.toISOString(),
            monthEnd: monthEnd.toISOString()
        });

        // Ledolgozott órák
        const actualWorkHours = await prisma.actualWorkHours.findMany({
            where: {
                userId,
                shift: {
                    date: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
            },
            include: {
                shift: true,
            },
        });

        console.log('PDF Generation - Found work hours:', actualWorkHours.length);
        console.log('PDF Generation - Shift dates:', actualWorkHours.map(h => ({
            date: h.shift.date,
            hours: h.actualHoursWorked
        })));

        const totalHours = actualWorkHours.reduce(
            (sum, record) => sum + (record.actualHoursWorked || 0),
            0
        );

        const hourlyRate = user.hourlyRate || 0;
        const grossAmount = totalHours * hourlyRate;

        // Ellenőrizzük hogy van-e már PDF ehhez a hónaphoz
        const existingDocuments = await prisma.document.findMany({
            where: {
                userId,
                name: {
                    startsWith: `Payslip - ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month - 1]} ${year}`,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const version = existingDocuments.length + 1;
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // PDF generálás
        const pdfBuffer = generatePayslipPDF(user, year, month, totalHours, hourlyRate, grossAmount, version);

        // Feltöltés Cloudinary-ba
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "krkiyocl";

        if (!cloudName) {
            return new NextResponse("Cloudinary not configured", { status: 500 });
        }

        // Sanitize user name for filename
        const sanitizedName = user.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';

        const formData = new FormData();
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
        formData.append("file", blob);
        formData.append("upload_preset", uploadPreset);
        formData.append("resource_type", "raw");
        formData.append("public_id", `payslip_${sanitizedName}_${year}_${month}_v${version}_${timestamp}`);

        const uploadResponse = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
            formData
        );

        const fileUrl = uploadResponse.data.secure_url;

        // Dokumentum mentése az adatbázisba
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const documentName = version === 1
            ? `Payslip - ${monthNames[month - 1]} ${year}`
            : `Payslip - ${monthNames[month - 1]} ${year} (v${version})`;

        const newDocument = await prisma.document.create({
            data: {
                userId,
                name: documentName,
                fileType: "application/pdf",
                fileUrl,
            },
            include: {
                user: true,
            },
        });

        return NextResponse.json({
            success: true,
            document: newDocument,
            message: "Payslip generated and uploaded successfully"
        });
    } catch (error) {
        console.error("PAYROLL_PDF_GENERATION_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

function generatePayslipPDF(
    user: any,
    year: number,
    month: number,
    totalHours: number,
    hourlyRate: number,
    grossAmount: number,
    version: number
): Uint8Array {
    const doc = new jsPDF();

    const monthNames = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('hu-HU', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Header
    doc.setFontSize(24);
    doc.text('FIZETESI BIZONYLAT', 105, 30, { align: 'center' });

    // Version number (only if > 1)
    if (version > 1) {
        doc.setFontSize(10);
        doc.text(`Version ${version}`, 190, 15, { align: 'right' });
    }

    doc.setFontSize(12);
    doc.text('PAYSLIP', 105, 40, { align: 'center' });

    // Dolgozó adatai
    doc.setFontSize(14);
    doc.text('Dolgozó / Employee:', 20, 60);

    doc.setFontSize(12);
    doc.text(`Név / Name: ${user.name || 'N/A'}`, 20, 70);
    doc.text(`Email: ${user.email}`, 20, 77);

    const positionName = user.userPositions[0]?.position?.displayNames?.hu ||
                        user.userPositions[0]?.position?.displayNames?.en ||
                        'N/A';
    doc.text(`Pozíció / Position: ${positionName}`, 20, 84);

    // Időszak
    doc.setFontSize(12);
    doc.text(`Idöszak / Period: ${monthNames[month - 1]} ${year}`, 20, 100);

    // Bérezési adatok
    doc.setFontSize(14);
    doc.text('Bérezési Adatok / Payment Details:', 20, 120);

    doc.setFontSize(12);
    doc.text('Ledolgozott órák / Hours Worked:', 20, 135);
    doc.text(`${Math.round(totalHours * 10) / 10}h`, 150, 135);

    doc.text('Órabér / Hourly Rate:', 20, 145);
    doc.text(`${formatCurrency(hourlyRate)} Ft/h`, 150, 145);

    // Vonal
    doc.line(20, 155, 190, 155);

    // Bruttó összeg
    doc.setFontSize(14);
    doc.text('BRUTTÓ ÖSSZEG / GROSS AMOUNT:', 20, 165);
    doc.text(`${formatCurrency(grossAmount)} Ft`, 150, 165);

    // Kifizetés dátuma
    const paymentDate = new Date(year, month, 5);
    doc.setFontSize(12);
    doc.text(
        `Kifizetés dátuma / Payment Date: ${paymentDate.getFullYear()}. ${String(paymentDate.getMonth() + 1).padStart(2, '0')}. ${String(paymentDate.getDate()).padStart(2, '0')}.`,
        20,
        185
    );

    // Footer
    doc.setFontSize(10);
    doc.text('Ez egy automatikusan generált fizetési bizonylat.', 105, 250, { align: 'center' });
    doc.text('This is an automatically generated payslip.', 105, 257, { align: 'center' });
    doc.text(`Generálva / Generated: ${new Date().toLocaleDateString('hu-HU')}`, 105, 264, { align: 'center' });

    return doc.output('arraybuffer');
}
