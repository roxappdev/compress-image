class ImageCompressor {
    constructor() {
        this.files = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const compressBtn = document.getElementById('compressBtn');

        // Click to select files
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // Compress button
        compressBtn.addEventListener('click', () => {
            this.compressImages();
        });
    }

    handleFiles(fileList) {
        const imageFiles = Array.from(fileList).filter(file => 
            file.type.startsWith('image/')
        );

        if (imageFiles.length === 0) {
            alert('Please select image files only (JPG, PNG, WebP)');
            return;
        }

        this.files = imageFiles;
        this.updateUI();
    }

    updateUI() {
        const compressBtn = document.getElementById('compressBtn');
        const uploadArea = document.getElementById('uploadArea');
        const uploadText = uploadArea.querySelector('.upload-text');

        if (this.files.length > 0) {
            compressBtn.disabled = false;
            uploadText.innerHTML = `
                <p>${this.files.length} file(s) selected</p>
                <p class="subtext">Click to select different files</p>
            `;
        } else {
            compressBtn.disabled = true;
            uploadText.innerHTML = `
                <p>Drop images here or click to select</p>
                <p class="subtext">Supports JPG, PNG, WebP</p>
            `;
        }
    }

    async compressImages() {
        if (this.files.length === 0) return;

        const loading = document.getElementById('loading');
        const results = document.getElementById('results');
        const resultsList = document.getElementById('resultsList');
        const compressBtn = document.getElementById('compressBtn');

        // Show loading
        loading.style.display = 'block';
        results.style.display = 'none';
        compressBtn.disabled = true;

        try {
            const maxWidth = parseInt(document.getElementById('maxWidth').value) || 1920;
            const maxHeight = parseInt(document.getElementById('maxHeight').value) || 1080;
            const quality = parseFloat(document.getElementById('quality').value) || 0.8;

            const compressionOptions = {
                maxSizeMB: 10,
                maxWidthOrHeight: Math.max(maxWidth, maxHeight),
                useWebWorker: true,
                maxIteration: 10,
                exifOrientation: 1,
                fileType: 'image/jpeg',
                initialQuality: quality
            };

            resultsList.innerHTML = '';
            const compressedFiles = [];

            for (const file of this.files) {
                try {
                    console.log(`Compressing: ${file.name}`);
                    
                    const compressedFile = await imageCompression(file, compressionOptions);
                    
                    // Calculate compression ratio
                    const originalSize = file.size;
                    const compressedSize = compressedFile.size;
                    const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
                    
                    compressedFiles.push({
                        originalFile: file,
                        compressedFile: compressedFile,
                        originalSize: originalSize,
                        compressedSize: compressedSize,
                        ratio: ratio
                    });

                    this.addResultItem(file.name, originalSize, compressedSize, ratio, compressedFile);
                    
                } catch (error) {
                    console.error(`Error compressing ${file.name}:`, error);
                    this.addErrorItem(file.name, error.message);
                }
            }

            results.style.display = 'block';

        } catch (error) {
            console.error('Compression error:', error);
            alert('Error compressing images: ' + error.message);
        } finally {
            loading.style.display = 'none';
            compressBtn.disabled = false;
        }
    }

    addResultItem(fileName, originalSize, compressedSize, ratio, compressedFile) {
        const resultsList = document.getElementById('resultsList');
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const getRatioClass = (ratio) => {
            if (ratio > 50) return 'ratio-good';
            if (ratio > 20) return 'ratio-average';
            return 'ratio-poor';
        };

        resultItem.innerHTML = `
            <div class="result-info">
                <span class="result-name">${fileName}</span>
                <span class="result-size">${formatBytes(originalSize)} → ${formatBytes(compressedSize)}</span>
            </div>
            <div class="compression-ratio ${getRatioClass(ratio)}">
                ${ratio}% smaller
            </div>
            <button class="download-btn" data-file="${fileName}">Download</button>
        `;

        // Add download event listener
        const downloadBtn = resultItem.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => {
            this.downloadFile(compressedFile, fileName);
        });

        resultsList.appendChild(resultItem);
    }

    addErrorItem(fileName, errorMessage) {
        const resultsList = document.getElementById('resultsList');
        
        const errorItem = document.createElement('div');
        errorItem.className = 'result-item';
        errorItem.style.borderColor = '#e74c3c';
        errorItem.style.backgroundColor = '#fdf2f2';
        
        errorItem.innerHTML = `
            <div class="result-info">
                <span class="result-name" style="color: #e74c3c;">${fileName}</span>
                <span style="color: #e74c3c;">Error</span>
            </div>
            <div style="color: #e74c3c; font-size: 0.8em;">${errorMessage}</div>
        `;

        resultsList.appendChild(errorItem);
    }

    downloadFile(file, fileName) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        
        // Create new filename with compressed prefix
        const nameParts = fileName.split('.');
        const extension = nameParts.pop();
        const baseName = nameParts.join('.');
        a.download = `compressed_${baseName}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the compressor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageCompressor();
});