/**
 * Input validation utilities
 */
class ValidationService {
    constructor() {
        this.errorMessages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            minLength: 'Must be at least {min} characters long',
            maxLength: 'Must be no more than {max} characters long',
            pattern: 'Invalid format',
            number: 'Must be a valid number',
            url: 'Must be a valid URL'
        };
    }

    /**
     * Validates email address format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            valid: emailRegex.test(email),
            message: this.errorMessages.email
        };
    }

    /**
     * Validates password strength
     */
    validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validates phone number format
     */
    validatePhoneNumber(phone) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return {
            valid: phoneRegex.test(phone.replace(/\s/g, '')),
            message: 'Please enter a valid phone number'
        };
    }

    /**
     * Validates URL format
     */
    validateUrl(url) {
        try {
            new URL(url);
            return { valid: true };
        } catch {
            return {
                valid: false,
                message: this.errorMessages.url
            };
        }
    }

    /**
     * Validates input length
     */
    validateLength(value, min, max) {
        const length = value ? value.length : 0;
        
        if (min && length < min) {
            return {
                valid: false,
                message: this.errorMessages.minLength.replace('{min}', min)
            };
        }
        
        if (max && length > max) {
            return {
                valid: false,
                message: this.errorMessages.maxLength.replace('{max}', max)
            };
        }
        
        return { valid: true };
    }

    /**
     * Validates required fields
     */
    validateRequired(value) {
        const isEmpty = value === null || value === undefined || value === '';
        return {
            valid: !isEmpty,
            message: this.errorMessages.required
        };
    }

    /**
     * Validates numeric input
     */
    validateNumber(value, min, max) {
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return {
                valid: false,
                message: this.errorMessages.number
            };
        }
        
        if (min !== undefined && num < min) {
            return {
                valid: false,
                message: `Must be at least ${min}`
            };
        }
        
        if (max !== undefined && num > max) {
            return {
                valid: false,
                message: `Must be no more than ${max}`
            };
        }
        
        return { valid: true };
    }

    /**
     * Validates credit card number
     */
    validateCreditCard(cardNumber) {
        const cleaned = cardNumber.replace(/\D/g, '');
        
        if (cleaned.length < 13 || cleaned.length > 19) {
            return {
                valid: false,
                message: 'Invalid credit card number length'
            };
        }
        
        // Luhn algorithm
        const isValid = this.luhnCheck(cleaned);
        
        return {
            valid: isValid,
            message: isValid ? '' : 'Invalid credit card number'
        };
    }

    /**
     * Validates form data against rules
     */
    validateForm(formData, rules) {
        const errors = {};
        let isValid = true;
        
        for (const [field, value] of Object.entries(formData)) {
            const fieldRules = rules[field];
            if (!fieldRules) continue;
            
            const fieldErrors = [];
            
            for (const rule of fieldRules) {
                const result = this.applyValidationRule(value, rule);
                if (!result.valid) {
                    fieldErrors.push(result.message);
                    isValid = false;
                }
            }
            
            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
            }
        }
        
        return { valid: isValid, errors };
    }

    /**
     * Applies validation rule to value
     */
    applyValidationRule(value, rule) {
        switch (rule.type) {
            case 'required':
                return this.validateRequired(value);
            case 'email':
                return this.validateEmail(value);
            case 'length':
                return this.validateLength(value, rule.min, rule.max);
            case 'number':
                return this.validateNumber(value, rule.min, rule.max);
            case 'pattern':
                return this.validatePattern(value, rule.pattern);
            default:
                return { valid: true };
        }
    }

    /**
     * Validates pattern matching
     */
    validatePattern(value, pattern) {
        const regex = new RegExp(pattern);
        return {
            valid: regex.test(value),
            message: this.errorMessages.pattern
        };
    }

    /**
     * Luhn algorithm for credit card validation
     */
    luhnCheck(cardNumber) {
        let sum = 0;
        let alternate = false;
        
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i));
            
            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit = (digit % 10) + 1;
                }
            }
            
            sum += digit;
            alternate = !alternate;
        }
        
        return sum % 10 === 0;
    }
}