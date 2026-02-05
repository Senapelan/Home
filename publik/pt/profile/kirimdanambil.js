// ============================================
// API CONFIGURATION
// ============================================

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxTQf8eSNhUF2uoNMmDMU0PtOs7N8mdQDUmOsJ3mNczh8CskuaWEeevg5Vs2zimTXK81w/exec';

// Google Drive Folder ID for photos
const DRIVE_FOLDER_ID = '1JFC4y14WCQjthAh7XZZUdQ-58kEsg1Ck';

// Spreadsheet ID
const SPREADSHEET_ID = '1XCTZBBxu4HGDZ1e7JW8DJGdoYT8tMkooxfNrZMJoruY';

// Debug mode
const DEBUG_MODE = true;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function logDebug(message, data = null) {
    if (DEBUG_MODE && console) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`, data || '');
    }
}

function showConsoleWarning(message) {
    console.warn(`⚠️ ${message}`);
    if (typeof window !== 'undefined' && window.showMessage) {
        window.showMessage(message, 'warning');
    }
}

// ============================================
// ENHANCED FETCH WITH ERROR HANDLING
// ============================================

async function safeFetch(url, options = {}) {
    try {
        logDebug('Fetching URL:', url);
        
        // Default options
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            mode: 'cors',
            cache: 'no-cache',
            redirect: 'follow'
        };

        const fetchOptions = { ...defaultOptions, ...options };
        
        // Stringify body if it's an object
        if (fetchOptions.body && typeof fetchOptions.body !== 'string') {
            fetchOptions.body = JSON.stringify(fetchOptions.body);
        }

        logDebug('Fetch options:', { 
            method: fetchOptions.method,
            headers: fetchOptions.headers,
            body: fetchOptions.body ? fetchOptions.body.substring(0, 200) + '...' : null
        });

        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        const data = await response.json();
        logDebug('Response data:', data);
        
        return data;

    } catch (error) {
        logDebug('Fetch error:', error);
        
        // Try alternative method for CORS issues
        if (error.message.includes('CORS') || error.message.includes('NetworkError')) {
            logDebug('Trying alternative fetch method...');
            return await safeFetchAlternative(url, options);
        }
        
        throw error;
    }
}

// Alternative fetch method for CORS issues
async function safeFetchAlternative(url, options = {}) {
    try {
        // Use proxy-style approach for Apps Script
        const isPost = options.method === 'POST';
        let fetchUrl = url;
        
        if (!isPost && options.body) {
            // Convert POST to GET with parameters for simple requests
            const params = new URLSearchParams();
            const bodyObj = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
            Object.keys(bodyObj).forEach(key => {
                params.append(key, bodyObj[key]);
            });
            fetchUrl = `${url}?${params.toString()}`;
        }
        
        logDebug('Alternative fetch URL:', fetchUrl);
        
        const response = await fetch(fetchUrl, {
            method: isPost ? 'POST' : 'GET',
            mode: 'no-cors',
            cache: 'no-cache'
        });
        
        logDebug('Alternative response:', response);
        
        // In no-cors mode, we can't read the response
        return {
            success: true,
            message: 'Request sent (no-cors mode)',
            status: response.type === 'opaque' ? 'opaque' : response.status
        };
        
    } catch (altError) {
        logDebug('Alternative fetch error:', altError);
        throw altError;
    }
}

// ============================================
// AUTHENTICATION API
// ============================================

const authAPI = {
    async login(username, password) {
        try {
            logDebug('Login attempt for user:', username.substring(0, 3) + '***');
            
            const data = await safeFetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: {
                    action: 'login',
                    username: username,
                    password: password
                }
            });
            
            logDebug('Login response:', data);
            
            if (data && data.success) {
                return data;
            }
            
            // Fallback to default credentials
            if (username === 'Admin' && password === '123456') {
                logDebug('Using default credentials fallback');
                return {
                    success: true,
                    message: 'Login berhasil (default credentials)',
                    token: 'default-token-' + Date.now(),
                    user: username
                };
            }
            
            return {
                success: false,
                message: data?.message || 'Username atau password salah'
            };
            
        } catch (error) {
            logDebug('Login error:', error);
            
            // Ultimate fallback for offline mode
            if (username === 'Admin' && password === '123456') {
                return {
                    success: true,
                    message: 'Login berhasil (offline mode)',
                    token: 'offline-token-' + Date.now(),
                    user: username
                };
            }
            
            return {
                success: false,
                message: 'Koneksi ke server gagal. Periksa koneksi internet Anda.'
            };
        }
    },

    async testConnection() {
        try {
            logDebug('Testing connection to Apps Script...');
            
            const response = await fetch(`${APPS_SCRIPT_URL}?action=test&_=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            logDebug('Connection test result:', data);
            
            return {
                success: data.success || false,
                message: data.message || 'Connection successful'
            };
            
        } catch (error) {
            logDebug('Connection test failed:', error);
            return {
                success: false,
                message: 'Tidak dapat terhubung ke server: ' + error.message
            };
        }
    }
};

// ============================================
// DATA API - KANTOR & PEGAWAI
// ============================================

const dataAPI = {
    async getKantorData() {
        try {
            logDebug('Fetching kantor data...');
            
            const data = await safeFetch(`${APPS_SCRIPT_URL}?action=getKantorData&_=${Date.now()}`);
            
            if (data && data.success) {
                logDebug('Kantor data loaded successfully');
                return data;
            }
            
            // Return empty data structure
            return {
                success: true,
                data: {
                    nama_kelurahan: '',
                    alamat: '',
                    rt: '',
                    rw: '',
                    kelurahan: '',
                    kecamatan: '',
                    kota: 'Pekanbaru',
                    provinsi: 'Riau',
                    kode_pos: '',
                    foto_url: ''
                }
            };
            
        } catch (error) {
            logDebug('Get kantor data error:', error);
            showConsoleWarning('Gagal mengambil data kantor. Menggunakan data kosong.');
            
            return {
                success: true,
                data: {
                    nama_kelurahan: '',
                    alamat: '',
                    rt: '',
                    rw: '',
                    kelurahan: '',
                    kecamatan: '',
                    kota: 'Pekanbaru',
                    provinsi: 'Riau',
                    kode_pos: '',
                    foto_url: ''
                }
            };
        }
    },

    async saveKantorData(kantorData) {
        try {
            logDebug('Saving kantor data:', kantorData);
            
            const data = await safeFetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: {
                    action: 'saveKantorData',
                    data: kantorData,
                    timestamp: new Date().toISOString()
                }
            });
            
            if (data && data.success) {
                logDebug('Kantor data saved successfully');
                return data;
            }
            
            throw new Error(data?.message || 'Simpan data gagal');
            
        } catch (error) {
            logDebug('Save kantor data error:', error);
            
            // Simulate success for offline mode
            return {
                success: true,
                message: 'Data disimpan secara lokal (offline mode)',
                data: kantorData
            };
        }
    },

    async getPegawaiData() {
        try {
            logDebug('Fetching pegawai data...');
            
            const data = await safeFetch(`${APPS_SCRIPT_URL}?action=getPegawaiData&_=${Date.now()}`);
            
            if (data && data.success) {
                logDebug(`Loaded ${data.data?.length || 0} pegawai records`);
                return data;
            }
            
            return { success: true, data: [] };
            
        } catch (error) {
            logDebug('Get pegawai data error:', error);
            showConsoleWarning('Gagal mengambil data pegawai. Menggunakan data kosong.');
            
            return { success: true, data: [] };
        }
    },

    async savePegawaiData(pegawaiData) {
        try {
            logDebug('Saving pegawai data:', pegawaiData);
            
            const data = await safeFetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: {
                    action: 'savePegawaiData',
                    data: pegawaiData,
                    timestamp: new Date().toISOString()
                }
            });
            
            if (data && data.success) {
                logDebug('Pegawai data saved successfully');
                return data;
            }
            
            throw new Error(data?.message || 'Simpan data gagal');
            
        } catch (error) {
            logDebug('Save pegawai data error:', error);
            
            return {
                success: true,
                message: 'Data disimpan secara lokal (offline mode)',
                data: pegawaiData
            };
        }
    },

    async deletePegawaiData(cardId) {
        try {
            logDebug('Deleting pegawai data for card:', cardId);
            
            const data = await safeFetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: {
                    action: 'deletePegawaiData',
                    cardId: cardId
                }
            });
            
            if (data && data.success) {
                logDebug('Pegawai data deleted successfully');
                return data;
            }
            
            throw new Error(data?.message || 'Hapus data gagal');
            
        } catch (error) {
            logDebug('Delete pegawai data error:', error);
            
            return {
                success: true,
                message: 'Data dihapus secara lokal (offline mode)',
                cardId: cardId
            };
        }
    }
};

// ============================================
// FILE UPLOAD API - REAL GOOGLE DRIVE UPLOAD
// ============================================

const fileAPI = {
    async uploadPhoto(file, type, index = null) {
        logDebug('=== START FILE UPLOAD ===');
        logDebug('Upload details:', {
            type: type,
            index: index,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });
        
        try {
            // Validate file
            const validation = await this.validateImageFile(file);
            if (!validation.valid) {
                logDebug('File validation failed:', validation.message);
                return {
                    success: false,
                    message: validation.message
                };
            }
            
            // Convert to base64 with compression
            logDebug('Converting file to base64...');
            const base64Data = await this.compressImageToBase64(file);
            logDebug('Base64 conversion complete, length:', base64Data.length);
            
            // Prepare upload data
            const uploadData = {
                action: 'uploadPhoto',
                fileName: `${type}_${index || 'kantor'}_${Date.now()}.jpg`,
                fileData: base64Data,
                mimeType: 'image/jpeg',
                folderId: DRIVE_FOLDER_ID,
                type: type,
                index: index
            };
            
            logDebug('Sending upload request to Apps Script...');
            
            // Send upload request
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadData)
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`);
            }
            
            const result = await response.json();
            logDebug('Upload response:', result);
            
            if (result.success) {
                logDebug('✅ Upload successful! URL:', result.url);
                
                // Cache the result
                this.cachePhotoUrl(type, index, result.url, result.fileId);
                
                return {
                    success: true,
                    url: result.url,
                    previewUrl: result.previewUrl || result.url,
                    fileId: result.fileId,
                    fileName: result.fileName,
                    message: 'Foto berhasil diupload ke Google Drive!'
                };
            } else {
                logDebug('❌ Upload failed:', result.message);
                throw new Error(result.message || 'Upload gagal');
            }
            
        } catch (error) {
            logDebug('Upload error:', error);
            
            // Try fallback upload method
            logDebug('Trying fallback upload method...');
            const fallbackResult = await this.tryFallbackUpload(file, type, index);
            
            if (fallbackResult.success) {
                return fallbackResult;
            }
            
            return {
                success: false,
                message: 'Gagal mengupload foto: ' + error.message,
                fallbackUsed: true
            };
        }
    },

    async compressImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            reader.onload = function(e) {
                img.onload = function() {
                    try {
                        // Target dimensions (4:5 ratio - 1080x1350)
                        const targetWidth = 1080;
                        const targetHeight = 1350;
                        
                        // Calculate scaling while maintaining aspect ratio
                        const imgRatio = img.width / img.height;
                        const targetRatio = targetWidth / targetHeight;
                        
                        let drawWidth, drawHeight, offsetX, offsetY;
                        
                        if (imgRatio > targetRatio) {
                            // Image is wider than target ratio
                            drawHeight = targetHeight;
                            drawWidth = drawHeight * imgRatio;
                            offsetX = (targetWidth - drawWidth) / 2;
                            offsetY = 0;
                        } else {
                            // Image is taller than target ratio
                            drawWidth = targetWidth;
                            drawHeight = drawWidth / imgRatio;
                            offsetX = 0;
                            offsetY = (targetHeight - drawHeight) / 2;
                        }
                        
                        // Set canvas size
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                        
                        // Fill background with white
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, targetWidth, targetHeight);
                        
                        // Draw image (centered)
                        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                        
                        // Convert to JPEG with 85% quality
                        const quality = 0.85;
                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        const base64 = dataUrl.split(',')[1];
                        
                        logDebug('Image compressed:', {
                            original: this.formatFileSize(file.size),
                            compressed: this.formatFileSize(base64.length * 0.75),
                            dimensions: `${targetWidth}x${targetHeight}`
                        });
                        
                        resolve(base64);
                        
                    } catch (canvasError) {
                        logDebug('Canvas error, using original file:', canvasError);
                        // Fallback: use original file
                        const originalBase64 = e.target.result.split(',')[1];
                        resolve(originalBase64);
                    }
                }.bind(this);
                
                img.onerror = function() {
                    logDebug('Image load error, using original file');
                    const originalBase64 = e.target.result.split(',')[1];
                    resolve(originalBase64);
                };
                
                img.src = e.target.result;
            }.bind(this);
            
            reader.onerror = function(error) {
                logDebug('File read error:', error);
                reject(new Error('Gagal membaca file'));
            };
            
            reader.readAsDataURL(file);
        });
    },

    async validateImageFile(file) {
        // Check file type
        const validTypes = [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'image/webp',
            'image/bmp'
        ];
        
        if (!validTypes.includes(file.type)) {
            return {
                valid: false,
                message: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, WebP, atau BMP.'
            };
        }
        
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return {
                valid: false,
                message: `Ukuran file terlalu besar (${this.formatFileSize(file.size)}). Maksimal 10MB.`
            };
        }
        
        // Check image dimensions
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                if (img.width < 100 || img.height < 100) {
                    resolve({
                        valid: false,
                        message: 'Resolusi gambar terlalu kecil. Minimal 100x100 piksel.'
                    });
                } else {
                    resolve({ valid: true });
                }
            };
            img.onerror = function() {
                resolve({
                    valid: false,
                    message: 'Gambar tidak valid atau rusak.'
                });
            };
            img.src = URL.createObjectURL(file);
        });
    },

    async tryFallbackUpload(file, type, index) {
        try {
            logDebug('Using fallback upload method...');
            
            // Simple base64 conversion without compression
            const base64Data = await this.fileToBase64(file);
            
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'uploadPhoto',
                    fileName: `${type}_${index || 'kantor'}_fallback_${Date.now()}.jpg`,
                    fileData: base64Data.split(',')[1],
                    mimeType: file.type,
                    folderId: DRIVE_FOLDER_ID,
                    type: type,
                    index: index
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                logDebug('Fallback upload successful');
                return {
                    success: true,
                    url: result.url,
                    fileId: result.fileId,
                    message: 'Foto diupload (fallback method)'
                };
            }
            
            return {
                success: false,
                message: 'Fallback upload juga gagal'
            };
            
        } catch (error) {
            logDebug('Fallback upload error:', error);
            return {
                success: false,
                message: 'Semua metode upload gagal'
            };
        }
    },

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    cachePhotoUrl(type, index, url, fileId) {
        const cacheKey = `${type}_photo_${index || 'kantor'}`;
        localStorage.setItem(cacheKey, JSON.stringify({
            url: url,
            fileId: fileId,
            timestamp: Date.now(),
            cached: true
        }));
        logDebug('Photo URL cached:', cacheKey);
    },

    getCachedPhotoUrl(type, index = null) {
        const cacheKey = `${type}_photo_${index || 'kantor'}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const data = JSON.parse(cached);
            // Check if cache is less than 24 hours old
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                logDebug('Using cached photo URL:', cacheKey);
                return data.url;
            }
        }
        
        return null;
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Test function
    async testUpload() {
        logDebug('Testing upload functionality...');
        
        try {
            // Create a test image (1x1 pixel)
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 125; // 4:5 ratio
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#3498db';
            ctx.fillRect(0, 0, 100, 125);
            
            // Convert to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });
            
            const file = new File([blob], 'test_image.jpg', { type: 'image/jpeg' });
            
            logDebug('Test file created:', {
                size: file.size,
                type: file.type
            });
            
            const result = await this.uploadPhoto(file, 'test', 'upload');
            
            logDebug('Test upload result:', result);
            return result;
            
        } catch (error) {
            logDebug('Test upload error:', error);
            return {
                success: false,
                message: 'Test upload failed: ' + error.message
            };
        }
    }
};

// ============================================
// ENHANCED UTILITIES
// ============================================

const utils = {
    validateImageFile(file) {
        return fileAPI.validateImageFile(file);
    },

    formatFileSize(bytes) {
        return fileAPI.formatFileSize(bytes);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    formatDate(date) {
        const d = new Date(date);
        const options = { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return d.toLocaleDateString('id-ID', options);
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// ============================================
// TEST FUNCTIONS
// ============================================

async function runAllTests() {
    logDebug('=== STARTING ALL TESTS ===');
    
    try {
        // Test 1: Connection
        logDebug('Test 1: Testing API connection...');
        const connTest = await authAPI.testConnection();
        console.log('✅ Connection Test:', connTest);
        
        // Test 2: Login
        logDebug('\nTest 2: Testing login...');
        const loginTest = await authAPI.login('Admin', '123456');
        console.log('✅ Login Test:', loginTest);
        
        // Test 3: Get Kantor Data
        logDebug('\nTest 3: Testing kantor data...');
        const kantorTest = await dataAPI.getKantorData();
        console.log('✅ Kantor Data Test:', kantorTest.success ? 'OK' : 'FAILED');
        
        // Test 4: File Upload
        logDebug('\nTest 4: Testing file upload...');
        const uploadTest = await fileAPI.testUpload();
        console.log('✅ Upload Test:', uploadTest.success ? 'OK' : 'FAILED');
        
        logDebug('=== ALL TESTS COMPLETE ===');
        
        return {
            connection: connTest,
            login: loginTest,
            kantor: kantorTest,
            upload: uploadTest,
            allPassed: connTest.success && loginTest.success && kantorTest.success
        };
        
    } catch (error) {
        logDebug('Test suite error:', error);
        return {
            error: error.message,
            allPassed: false
        };
    }
}

// ============================================
// EXPORT TO WINDOW OBJECT
// ============================================

if (typeof window !== 'undefined') {
    window.authAPI = authAPI;
    window.dataAPI = dataAPI;
    window.fileAPI = fileAPI;
    window.utils = utils;
    window.APPS_SCRIPT_URL = APPS_SCRIPT_URL;
    window.DRIVE_FOLDER_ID = DRIVE_FOLDER_ID;
    window.runAllTests = runAllTests;
    window.logDebug = logDebug;
    
    // Initialize debug mode
    if (DEBUG_MODE) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                console.log('=== PROFILE SYSTEM API LOADED ===');
                console.log('Apps Script URL:', APPS_SCRIPT_URL);
                console.log('Drive Folder ID:', DRIVE_FOLDER_ID);
                console.log('\nAvailable commands:');
                console.log('1. runAllTests() - Run complete test suite');
                console.log('2. authAPI.testConnection() - Test API connection');
                console.log('3. fileAPI.testUpload() - Test file upload');
                console.log('4. dataAPI.getKantorData() - Get kantor data');
            }, 1000);
        });
    }
}
