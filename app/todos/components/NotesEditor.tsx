"use client";

import { useState } from "react";
import { HiCheck, HiXMark } from "react-icons/hi2";

interface NotesEditorProps {
    initialNotes: string;
    onSave: (notes: string) => void;
    placeholder: string;
}

const NotesEditor: React.FC<NotesEditorProps> = ({
    initialNotes,
    onSave,
    placeholder
}) => {
    const [notes, setNotes] = useState(initialNotes);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(notes);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving notes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setNotes(initialNotes);
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div
                onClick={() => setIsEditing(true)}
                className="min-h-[80px] p-2 border border-gray-300 rounded cursor-text hover:border-gray-400 transition-colors bg-gray-50"
            >
                {notes ? (
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{notes}</p>
                ) : (
                    <p className="text-sm text-gray-500 italic">{placeholder}</p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded focus:ring-nexus-secondary focus:border-nexus-secondary"
                disabled={isSaving}
            />
            <div className="flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1 bg-nexus-tertiary text-white text-sm rounded hover:bg-nexus-secondary transition-colors disabled:opacity-50"
                >
                    <HiCheck className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                    <HiXMark className="h-4 w-4" />
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default NotesEditor;