class CompanyRegistration {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateProgress();
    }

    bindEvents() {
        // Step navigation
        document.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', (e) => this.nextStep(e));
        });
        
        document.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', (e) => this.prevStep(e));
        });

        // Form submission
        document.getElementById('companyRegistrationForm').addEventListener('submit', (e) => this.submitForm(e));

        // Real-time validation
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
        });
    }

    nextStep(e) {
        e.preventDefault();
        const currentStepData = this.collectStepData(this.currentStep);
        
        if (this.validateStep(this.currentStep, currentStepData)) {
            this.formData = { ...this.formData, ...currentStepData };
            this.currentStep++;
            this.updateProgress();
            this.showStep(this.currentStep);
        }
    }

    prevStep(e) {
        e.preventDefault();
        this.currentStep--;
        this.updateProgress();
        this.showStep(this.currentStep);
    }

    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.registration-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });
        
        // Show current step
        document.getElementById(`step-${step}`).classList.add('active');

        // Update navigation buttons
        document.querySelector('.prev-step').style.display = step === 1 ? 'none' : 'block';
        document.querySelector('.next-step').style.display = step === this.totalSteps ? 'none' : 'block';
        document.querySelector('.submit-btn').style.display = step === this.totalSteps ? 'block' : 'none';
    }

    updateProgress() {
        const progress = (this.currentStep / this.totalSteps) * 100;
        document.querySelector('.progress-bar').style.width = `${progress}%`;
        document.querySelector('.progress-text').textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
    }

    collectStepData(step) {
        const data = {};
        const inputs = document.querySelectorAll(`#step-${step} input, #step-${step} select, #step-${step} textarea`);
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                data[input.name] = input.checked;
            } else {
                data[input.name] = input.value;
            }
        });

        return data;
    }

    validateStep(step, data) {
        let isValid = true;

        switch(step) {
            case 1:
                if (!data.companyName?.trim()) {
                    this.showError('companyName', 'Company name is required');
                    isValid = false;
                }
                if (!this.isValidEmail(data.companyEmail)) {
                    this.showError('companyEmail', 'Valid email is required');
                    isValid = false;
                }
                if (!data.phone?.trim()) {
                    this.showError('phone', 'Phone number is required');
                    isValid = false;
                }
                break;
            
            case 2:
                if (!data.industry) {
                    this.showError('industry', 'Please select an industry');
                    isValid = false;
                }
                if (!data.taxNumber?.trim()) {
                    this.showError('taxNumber', 'Tax number is required');
                    isValid = false;
                }
                break;

            case 3:
                if (!this.isValidEmail(data.adminEmail)) {
                    this.showError('adminEmail', 'Valid admin email is required');
                    isValid = false;
                }
                if (!data.adminFirstName?.trim()) {
                    this.showError('adminFirstName', 'First name is required');
                    isValid = false;
                }
                if (!data.adminLastName?.trim()) {
                    this.showError('adminLastName', 'Last name is required');
                    isValid = false;
                }
                if (!this.isStrongPassword(data.adminPassword)) {
                    this.showError('adminPassword', 'Password must be at least 8 characters with numbers and letters');
                    isValid = false;
                }
                break;
        }

        return isValid;
    }

    validateField(field) {
        const value = field.value;
        let isValid = true;
        let errorMessage = '';

        switch(field.name) {
            case 'companyEmail':
            case 'adminEmail':
                if (!this.isValidEmail(value)) {
                    errorMessage = 'Please enter a valid email address';
                    isValid = false;
                }
                break;
            
            case 'adminPassword':
                if (!this.isStrongPassword(value)) {
                    errorMessage = 'Password must be at least 8 characters with numbers and letters';
                    isValid = false;
                }
                break;
            
            case 'phone':
                if (!value.trim()) {
                    errorMessage = 'Phone number is required';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            this.showError(field.name, errorMessage);
        } else {
            this.clearError(field.name);
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isStrongPassword(password) {
        return password.length >= 8 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password);
    }

    showError(fieldName, message) {
        this.clearError(fieldName);
        
        const field = document.querySelector(`[name="${fieldName}"]`);
        const formGroup = field.closest('.form-group');
        
        formGroup.classList.add('error');
        
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        formGroup.appendChild(errorEl);
    }

    clearError(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            const formGroup = field.closest('.form-group');
            formGroup.classList.remove('error');
            
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
        }
    }

    async submitForm(e) {
        e.preventDefault();
        
        const stepData = this.collectStepData(this.currentStep);
        this.formData = { ...this.formData, ...stepData };

        if (this.validateStep(this.currentStep, stepData)) {
            await this.registerCompany();
        }
    }

    async registerCompany() {
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/companies/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: this.formData.companyName,
                    email: this.formData.companyEmail,
                    phone: this.formData.phone,
                    website: this.formData.website,
                    industry: this.formData.industry,
                    description: this.formData.description,
                    taxNumber: this.formData.taxNumber,
                    address: {
                        street: this.formData.street,
                        city: this.formData.city,
                        postalCode: this.formData.postalCode,
                        country: this.formData.country
                    },
                    adminUser: {
                        email: this.formData.adminEmail,
                        password: this.formData.adminPassword,
                        firstName: this.formData.adminFirstName,
                        lastName: this.formData.adminLastName
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.message);
                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = '/company/dashboard.html';
                }, 2000);
            } else {
                this.showError('form', result.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('form', 'Network error. Please check your connection and try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showSuccess(message) {
        const successEl = document.createElement('div');
        successEl.className = 'success-message';
        successEl.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div>${message}</div>
        `;
        
        document.querySelector('.registration-form').prepend(successEl);
        
        setTimeout(() => {
            successEl.remove();
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CompanyRegistration();
});