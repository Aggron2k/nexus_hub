"use client";
import ReactSelect from "react-select";

interface SingleSelectProps {
    label: string;
    value?: { value: string, label: string } | null;
    onChange: (value: { value: string, label: string } | null) => void;
    options: { value: string, label: string }[];
    disabled?: boolean;
    placeholder?: string;
}

const SingleSelect: React.FC<SingleSelectProps> = ({
    label,
    value,
    onChange,
    options,
    disabled,
    placeholder = "Válassz..."
}) => {
    return (
        <div className="z-[100]">
            <label className="block text-sm font-medium leading-6 text-gray-900">
                {label}
            </label>
            <div className="mt-2">
                <ReactSelect
                    isDisabled={disabled}
                    value={value}
                    onChange={onChange}
                    isMulti={false} // Single select!
                    options={options}
                    placeholder={placeholder}
                    menuPortalTarget={document.body}
                    styles={{
                        menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999
                        })
                    }}
                    classNames={{
                        control: () => "text-sm"
                    }}
                />
            </div>
        </div>
    );
}

export default SingleSelect;