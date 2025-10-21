class AdUpload {
    constructor() {
        this.videoFile = null;
        this.thumbnailFile = null;
        this.uploadProgress = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeFilePond();
    }

    bindEvents() {
        // File input changes
        document.getElementById('videoFile').addEventListener('change', (e) => this.handleVideoSelect(e));
        document.getElementById('thumbnailFile').addEventListener('change', (e) => this.handleThumbnailSelect(e));

        // Form submission
        document.getElementById('adUploadForm').addEventListener('submit', (e) => this.uploadAd(e));

        // Real-time preview
        document.getElementById('adTitle').addEventListener('input', (e) => this.updatePreview());
        document.getElementById('adDescription').addEventListener('input', (e) => this.updatePreview());
    }

    initializeFilePond() {
        // Initialize FilePond for better file handling
        if (window.FilePond) {
            const pond = FilePond.create(document.getElementById('videoFile'), {
                maxFiles: 1,
                maxFileSize: '50MB',
                acceptedFileTypes: ['video/mp4', 'video/webm'],
                labelIdle: 'Drag & Drop your video or <span class="filepond--label-action">Browse</span>',
                labelFileProcessing: 'Uploading...',
                labelFileProcessingComplete: 'Upload complete',
                labelFileProcessingAborted: 'Upload cancelled',
                labelFileProcessingError: 'Error during upload',
                labelTapToCancel: 'tap to cancel',
                labelTapToRetry: 'tap to retry',
                labelTapToUndo: 'tap to undo'
            });

            pond.on('addfile', (error, file) => {
                if (error) {
                    this.showError('videoFile', error);
                    return;
                }
                this.videoFile = file;
                this.validateVideoFile(file);
            });
        }
    }

    handleVideoSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.videoFile = file;
            this.validateVideoFile(file);
            this.generateThumbnail(file);
        }
    }

    handleThumbnailSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.thumbnailFile = file;
            this.validateThumbnailFile(file);
            this.previewThumbnail(file);
        }
    }

    validateVideoFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['video/mp4', 'video/webm'];

        if (file.size > maxSize) {
            this.showError('videoFile', 'Video must be less than 50MB');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showError('videoFile', 'Only MP4 and WebM formats are allowed');
            return false;
        }

        this.clearError('videoFile');
        return true;
    }

    validateThumbnailFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (file.size > maxSize) {
            this.showError('thumbnailFile', 'Thumbnail must be less than 5MB');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showError('thumbnailFile', 'Only JPEG, PNG and WebP images are allowed');
            return false;
        }

        this.clearError('thumbnailFile');
        return true;
    }

    generateThumbnail(videoFile) {
        // Create video element to generate thumbnail
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.src = URL.createObjectURL(videoFile);
        video.currentTime = 1; // Capture at 1 second

        video.addEventListener('loadeddata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                this.thumbnailFile = new File([blob], 'thumbnail.png', { type: 'image/png' });
                this.previewThumbnail(blob);
            }, 'image/png');
        });
    }

    previewThumbnail(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('thumbnailPreview').innerHTML = `
                <img src="${e.target.result}" alt="Thumbnail preview">
            `;
        };
        reader.readAsDataURL(file);
    }

    updatePreview() {
        const title = document.getElementById('adTitle').value || 'Ad Title';
        const description = document.getElementById('adDescription').value || 'Ad description will appear here...';
        
        document.getElementById('previewTitle').textContent = title;
        document.getElementById('previewDescription').textContent = description;
    }

    async uploadAd(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData();
        formData.append('video', this.videoFile);
        formData.append('thumbnail', this.thumbnailFile);
        formData.append('title', document.getElementById('adTitle').value);
        formData.append('description', document.getElementById('adDescription').value);
        formData.append('targetGrades', JSON.stringify(this.getSelectedGrades()));
        formData.append('targetSubjects', JSON.stringify(this.getSelectedSubjects()));
        formData.append('educationalContext', document.getElementById('educationalContext').value);
        formData.append('bidPerView', document.getElementById('bidPerView').value);

        const campaignId = document.getElementById('campaignSelect').value;
        if (campaignId) {
            formData.append('campaignId', campaignId);
        }

        await this.submitAd(formData);
    }

    validateForm() {
        let isValid = true;

        if (!this.videoFile) {
            this.showError('videoFile', 'Video file is required');
            isValid = false;
        }

        if (!this.thumbnailFile) {
            this.showError('thumbnailFile', 'Thumbnail is required');
            isValid = false;
        }

        if (!document.getElementById('adTitle').value.trim()) {
            this.showError('adTitle', 'Ad title is required');
            isValid = false;
        }

        if (!document.getElementById('educationalContext').value.trim()) {
            this.showError('educationalContext', 'Educational context is required');
            isValid = false;
        }

        const selectedGrades = this.getSelectedGrades();
        if (selectedGrades.length === 0) {
            this.showError('targetGrades', 'Please select at least one target grade');
            isValid = false;
        }

        const selectedSubjects = this.getSelectedSubjects();
        if (selectedSubjects.length === 0) {
            this.showError('targetSubjects', 'Please select at least one target subject');
            isValid = false;
        }

        return isValid;
    }

    getSelectedGrades() {
        const grades = [];
        document.querySelectorAll('input[name="targetGrades"]:checked').forEach(checkbox => {
            grades.push(parseInt(checkbox.value));
        });
        return grades;
    }

    getSelectedSubjects() {
        const subjects = [];
        document.querySelectorAll('input[name="targetSubjects"]:checked').forEach(checkbox => {
            subjects.push(checkbox.value);
        });
        return subjects;
    }

    async submitAd(formData) {
        const submitBtn = document.querySelector('.upload-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        submitBtn.disabled = true;

        // Show progress bar
        this.showProgressBar();

        try {
            const response = await fetch('/api/ads/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Ad uploaded successfully and submitted for moderation!');
                setTimeout(() => {
                    window.location.href = '/company/ads.html';
                }, 2000);
            } else {
                this.showError('form', result.message || 'Upload failed. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('form', 'Network error. Please check your connection and try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            this.hideProgressBar();
        }
    }

    showProgressBar() {
        document.getElementById('uploadProgress').style.display = 'block';
        this.updateProgress(0);
    }

    hideProgressBar() {
        document.getElementById('uploadProgress').style.display = 'none';
    }

    updateProgress(percent) {
        document.querySelector('.progress-bar').style.width = `${percent}%`;
        document.querySelector('.progress-text').textContent = `${percent}%`;
    }

    getAuthToken() {
        return localStorage.getItem('mindflow_token');
    }

    showError(field, message) {
        this.clearError(field);
        
        const fieldEl = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
        if (fieldEl) {
            const formGroup = fieldEl.closest('.form-group');
            formGroup.classList.add('error');
            
            const errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            errorEl.textContent = message;
            formGroup.appendChild(errorEl);
        } else if (field === 'form') {
            // Show general form error
            const errorEl = document.createElement('div');
            errorEl.className = 'alert alert-error';
            errorEl.textContent = message;
            document.querySelector('.upload-form').prepend(errorEl);
            
            setTimeout(() => errorEl.remove(), 5000);
        }
    }

    clearError(field) {
        const fieldEl = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
        if (fieldEl) {
            const formGroup = fieldEl.closest('.form-group');
            formGroup.classList.remove('error');
            
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
        }
    }

    showSuccess(message) {
        const successEl = document.createElement('div');
        successEl.className = 'alert alert-success';
        successEl.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${message}
        `;
        
        document.querySelector('.upload-form').prepend(successEl);
        
        setTimeout(() => {
            successEl.remove();
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdUpload();
});