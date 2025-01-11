import getUserById from "@/app/actions/getUserById";

const DocumentsId = async ({ params }: { params: { documentsId: string } }) => {
    const user = await getUserById(params.documentsId);

    if (!user) {
        return (
            <div className="lg:pl-80 h-full">
                <div className="h-full flex flex-col items-center justify-center">
                    <p>User not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lg:pl-80 h-full">
            <div className="h-full flex flex-col">
                <h1 className="text-2xl font-bold">{user.name}'s Documents</h1>
                <p>Email: {user.email}</p>
                {/* Ha több adatot jelenítesz meg, itt add hozzá */}
            </div>
        </div>
    );
};

export default DocumentsId;
