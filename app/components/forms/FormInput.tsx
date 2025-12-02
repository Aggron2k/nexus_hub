'use client';

import clsx from 'clsx';
import {
    FieldErrors,
    FieldValues,
    UseFormRegister
} from 'react-hook-form';

/**
 * FormInput Props Interface
 */
interface FormInputProps {
    /** Unique identifier for the input field */
    id: string;
    /** Label text displayed above the input */
    label: string;
    /** Input type (text, email, password, etc.) */
    type?: string;
    /** Whether the field is required */
    required?: boolean;
    /** React Hook Form register function */
    register: UseFormRegister<FieldValues>;
    /** Form validation errors object */
    errors: FieldErrors;
    /** Whether the input is disabled */
    disabled?: boolean;
    /** Placeholder text */
    placeholder?: string;
}

/**
 * FormInput Component
 *
 * A reusable form input component integrated with react-hook-form.
 * Provides consistent styling, validation, and error handling.
 *
 * @example
 * ```tsx
 * <FormInput
 *   id="email"
 *   label="Email Address"
 *   type="email"
 *   register={register}
 *   errors={errors}
 *   required
 * />
 * ```
 */
const FormInput: React.FC<FormInputProps> = ({
    label,
    id,
    type = 'text',
    required = false,
    register,
    errors,
    disabled = false,
    placeholder
}) => {
    const hasError = !!errors[id];

    return (
        <div>
            <label
                htmlFor={id}
                className="block text-sm font-medium leading-6 text-gray-900"
            >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className='mt-2'>
                <input
                    id={id}
                    type={type}
                    autoComplete={id}
                    disabled={disabled}
                    placeholder={placeholder}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${id}-error` : undefined}
                    {...register(id, { required })}
                    className={clsx(
                        'form-input w-full block rounded-md border-0 text-gray-900 shadow-sm py-1.5',
                        'ring-1 ring-inset placeholder:text-gray-400',
                        'focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
                        hasError
                            ? 'ring-red-300 focus:ring-red-500'
                            : 'ring-gray-300 focus:ring-sky-600',
                        disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
                    )}
                />
                {hasError && (
                    <p
                        id={`${id}-error`}
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                    >
                        {errors[id]?.message as string || 'This field is required'}
                    </p>
                )}
            </div>
        </div>
    );
}

export default FormInput;
