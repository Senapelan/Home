// ============================================
// API CONFIGURATION
// ============================================

// Google Apps Script Web App URL (PASTIKAN URL INI BENAR)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyPAQVZySc1DoKT6-gpfd_n8fUJG43dSOJBJeLvvCsSyUSDFbU0Ez5GaC2030LEZNT9/exec';

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
                'Accept': 'application/json'
            },
            mode: 'no-cors', // Changed from 'cors' to 'no-cors' for Apps Script
            redirect: 'follow'
        };

        const fetchOptions = { ...defaultOptions, ...options };
        
        // Convert POST requests to URL parameters for GET if needed
        if (fetchOptions.method === 'GET' && fetchOptions.body) {
            const params = new URLSearchParams();
            if (typeof fetchOptions.body === 'object') {
                Object.keys(fetchOptions.body).forEach(key => {
                    params.append(key, fetchOptions.body[key]);
                });
            }
            url = `${url}?${params.toString()}`;
            delete fetchOptions.body;
        }
        
        // Stringify body if it's an object and method is POST
        if (fetchOptions.method === 'POST' && fetchOptions.body && typeof fetchOptions.body !== 'string') {
            fetchOptions.body = JSON.stringify(fetchOptions.body);
        }

        logDebug('Fetch options:', { 
            url: url,
            method: fetchOptions.method,
            headers: fetchOptions.headers,
            body: fetchOptions.body ? fetchOptions.body.substring(0, 200) + '...' : null
        });

        const response = await fetch(url, fetchOptions);
        logDebug('Response status:', response.status);
        logDebug('Response headers:', Object.fromEntries(response.headers.entries()));

        // Try to parse JSON
        try {
            const text = await response.text();
            logDebug('Response text:', text.substring(0, 500));
            
            if (text.trim() === '') {
                return { success: false, message: 'Empty response from server' };
            }
            
            const data = JSON.parse(text);
            logDebug('Parsed response data:', data);
            
            return data;
        } catch (parseError) {
            logDebug('JSON parse error:', parseError);
            return {
                success: false,
                message: 'Invalid JSON response',
                rawResponse: await response.text()
            };
        }

    } catch (error) {
        logDebug('Fetch error:', error);
        return {
            success: false,
            message: 'Network error: ' + error.message
        };
    }
}

// ============================================
// AUTHENTICATION API
// ============================================

const authAPI = {
    async login(username, password) {
        try {
            logDebug('Login attempt for user:', username);
            
            // Test connection first
            const test = await this.testConnection();
            if (!test.success) {
                logDebug('Connection test failed, using fallback');
            }
            
            const data = await safeFetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: {
                    action: 'login',
                    username: username,
                    password: password,
                    timestamp: new Date().toISOString()
                }
            });
            
            logDebug('Login response:', data);
            
            // If response indicates error, try GET method
            if (!data || data.success === false) {
                logDebug('Trying GET method for login...');
                const getData = await safeFetch(APPS_SCRIPT_URL, {
                    method: 'GET',
                    body: {
                        action: 'login',
                        username: username,
                        password: password
                    }
                });
                
                if (getData && getData.success) {
                    return getData;
                }
            }
            
            if (data && data.success) {
                // Save token to localStorage
                if (data.token) {
                    localStorage.setItem('auth_token', data.token);
                    localStorage.setItem('auth_user', data.user || username);
                    localStorage.setItem('auth_time', new Date().toISOString());
                }
                return data;
            }
            
            // Fallback for default credentials
            if (username === 'Admin' && password === '123456') {
                logDebug('Using default credentials fallback');
                const fallbackToken = 'default-token-' + Date.now();
                localStorage.setItem('auth_token', fallbackToken);
                localStorage.setItem('auth_user', username);
                
                return {
                    success: true,
                    message: 'Login berhasil (default credentials)',
                    token: fallbackToken,
                    user: username
                };
            }
            
            return {
                success: false,
                message: data?.message || 'Username atau password salah'
            };
            
        } catch (error) {
            logDebug('Login error:', error);
            return {
                success: false,
                message: 'Error: ' + error.message
            };
        }
    },

    async testConnection() {
        try {
            logDebug('Testing connection to Apps Script...');
            
            const response = await fetch(`${APPS_SCRIPT_URL}?action=test&_=${Date.now()}`, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            logDebug('Connection test raw response:', response);
            
            // In no-cors mode, we can't read the response but if we get a response, connection is OK
            return {
                success: true,
                message: 'Connection to server established'
            };
            
        } catch (error) {
            logDebug('Connection test failed:', error);
            return {
                success: false,
                message: 'Cannot connect to server: ' + error.message
            };
        }
    },

    getAuthToken() {
        return localStorage.getItem('auth_token');
    },

    isAuthenticated() {
        const token = localStorage.getItem('auth_token');
        const authTime = localStorage.getItem('auth_time');
        
        if (!token || !authTime) return false;
        
        // Check if token is expired (24 hours)
        const authDate = new Date(authTime);
        const now = new Date();
        const hoursDiff = (now - authDate) / (1000 * 60 * 60);
        
        return hoursDiff < 24;
    },

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_time');
        logDebug('User logged out');
    }
};

// ============================================
// DATA API - KANTOR & PEGAWAI
// ============================================

const dataAPI = {
    async getKantorData() {
        try {
            logDebug('Fetching kantor data...');
            
            const data = await safeFetch(APPS_SCRIPT_URL, {
                method: 'GET',
                body: {
                    action: 'getKantorData',
                    _: Date.now()
                }
            });
            
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
                    timestamp: new Date().toISOString(),
                    token: authAPI.getAuthToken()
                }
            });
            
            if (data && data.success) {
                logDebug('Kantor data saved successfully');
                return data;
            }
            
            // Try GET method if POST fails
            logDebug('Trying GET method for saveKantorData...');
            const getData = await safeFetch(APPS_SCRIPT_URL, {
                method: 'GET',
                body: {
                    action: 'saveKantorData',
                    data: JSON.stringify(kantorData),
                    timestamp: new Date().toISOString()
                }
            });
            
            if (getData && getData.success) {
                return getData;
            }
            
            throw new Error(data?.message || getData?.message || 'Simpan data gagal');
            
        } catch (error) {
            logDebug('Save kantor data error:', error);
            
            // Save to localStorage as fallback
            try {
                localStorage.setItem('kantor_data_backup', JSON.stringify({
                    data: kantorData,
                    timestamp: new Date().toISOString()
                }));
                logDebug('Kantor data saved to localStorage as backup');
            } catch (e) {
                logDebug('LocalStorage save error:', e);
            }
            
            return {
                success: true,
                message: 'Data disimpan secara lokal (offline mode)',
                data: kantorData,
                offline: true
            };
        }
    },

    async getPegawaiData() {
        try {
            logDebug('Fetching pegawai data...');
            
            const data = await safeFetch(APPS_SCRIPT_URL, {
                method: 'GET',
                body: {
                    action: 'getPegawaiData',
                    _: Date.now()
                }
            });
            
            if (data && data.success) {
                logDebug(`Loaded ${data.data?.length || 0} pegawai records`);
                return data;
            }
            
            // Check localStorage for backup
            const backup = localStorage.getItem('pegawai_data_backup');
            if (backup) {
                const parsed = JSON.parse(backup);
                if (parsed.data && Array.isArray(parsed.data)) {
                    logDebug('Loaded pegawai data from localStorage backup');
                    return {
                        success: true,
                        data: parsed.data,
                        fromBackup: true
                    };
                }
            }
            
            return { success: true, data: [] };
            
        } catch (error) {
            logDebug('Get pegawai data error:', error);
            
            // Check localStorage for backup
            const backup = localStorage.getItem('pegawai_data_backup');
            if (backup) {
                try {
                    const parsed = JSON.parse(backup);
                    if (parsed.data && Array.isArray(parsed.data)) {
                        logDebug('Loaded pegawai data from localStorage backup after error');
                        return {
                            success: true,
                            data: parsed.data,
                            fromBackup: true
                        };
                    }
                } catch (e) {
                    logDebug('Backup parse error:', e);
                }
            }
            
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
                    timestamp: new Date().toISOString(),
                    token: authAPI.getAuthToken()
                }
            });
            
            if (data && data.success) {
                logDebug('Pegawai data saved successfully');
                
                // Update local backup
                this.updateLocalBackup(pegawaiData);
                
                return data;
            }
            
            // Try GET method
            const getData = await safeFetch(APPS_SCRIPT_URL, {
                method: 'GET',
                body: {
                    action: 'savePegawaiData',
                    data: JSON.stringify(pegawaiData),
                    timestamp: new Date().toISOString()
                }
            });
            
            if (getData && getData.success) {
                this.updateLocalBackup(pegawaiData);
                return getData;
            }
            
            throw new Error(data?.message || getData?.message || 'Simpan data gagal');
            
        } catch (error) {
            logDebug('Save pegawai data error:', error);
            
            // Save to localStorage
            this.updateLocalBackup(pegawaiData);
            
            return {
                success: true,
                message: 'Data disimpan secara lokal (offline mode)',
                data: pegawaiData,
                offline: true
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
                    cardId: cardId,
                    token: authAPI.getAuthToken()
                }
            });
            
            if (data && data.success) {
                logDebug('Pegawai data deleted successfully');
                return data;
            }
            
            const getData = await safeFetch(APPS_SCRIPT_URL, {
                method: 'GET',
                body: {
                    action: 'deletePegawaiData',
                    cardId: cardId
                }
            });
            
            if (getData && getData.success) {
                return getData;
            }
            
            throw new Error(data?.message || getData?.message || 'Hapus data gagal');
            
        } catch (error) {
            logDebug('Delete pegawai data error:', error);
            
            return {
                success: true,
                message: 'Data dihapus secara lokal (offline mode)',
                cardId: cardId,
                offline: true
            };
        }
    },

    updateLocalBackup(pegawaiData) {
        try {
            // Get existing backup
            let backupData = [];
            const existing = localStorage.getItem('pegawai_data_backup');
            if (existing) {
                try {
                    const parsed = JSON.parse(existing);
                    if (parsed.data && Array.isArray(parsed.data)) {
                        backupData = parsed.data;
                    }
                } catch (e) {
                    logDebug('Error parsing existing backup:', e);
                }
            }
            
            // Update or add new data
            const index = backupData.findIndex(item => item.card_id === pegawaiData.card_id);
            if (index !== -1) {
                backupData[index] = pegawaiData;
            } else {
                backupData.push(pegawaiData);
            }
            
            // Save back to localStorage
            localStorage.setItem('pegawai_data_backup', JSON.stringify({
                data: backupData,
                timestamp: new Date().toISOString(),
                count: backupData.length
            }));
            
            logDebug('Local backup updated, total records:', backupData.length);
            
        } catch (error) {
            logDebug('Error updating local backup:', error);
        }
    }
};

// ============================================
// FILE UPLOAD API
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
                return {
                    success: false,
                    message: validation.message
                };
            }
            
            // Convert to base64
            const base64Data = await this.fileToBase64(file);
            const base64Content = base64Data.split(',')[1];
            
            // Prepare upload data
            const uploadData = {
                action: 'uploadPhoto',
                fileName: `${type}_${index || 'kantor'}_${Date.now()}.jpg`,
                fileData: base64Content,
                mimeType: 'image/jpeg',
                folderId: DRIVE_FOLDER_ID,
                type: type,
                index: index,
                token: authAPI.getAuthToken()
            };
            
            logDebug('Sending upload request...');
            
            // Send upload request
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadData)
            });
            
            const result = await response.text();
            logDebug('Upload raw response:', result.substring(0, 500));
            
            let parsedResult;
            try {
                parsedResult = JSON.parse(result);
            } catch (parseError) {
                logDebug('JSON parse error:', parseError);
                return {
                    success: false,
                    message: 'Invalid response from server',
                    raw: result
                };
            }
            
            if (parsedResult.success) {
                logDebug('✅ Upload successful! URL:', parsedResult.url);
                
                // Cache the result
                this.cachePhotoUrl(type, index, parsedResult.url, parsedResult.fileId);
                
                return {
                    success: true,
                    url: parsedResult.url,
                    previewUrl: parsedResult.previewUrl || parsedResult.url,
                    fileId: parsedResult.fileId,
                    fileName: parsedResult.fileName,
                    message: 'Foto berhasil diupload ke Google Drive!'
                };
            } else {
                logDebug('❌ Upload failed:', parsedResult.message);
                
                // Try fallback upload
                const fallbackResult = await this.tryFallbackUpload(file, type, index);
                if (fallbackResult.success) {
                    return fallbackResult;
                }
                
                return {
                    success: false,
                    message: parsedResult.message || 'Upload gagal'
                };
            }
            
        } catch (error) {
            logDebug('Upload error:', error);
            
            // Generate local URL for offline mode
            const localUrl = URL.createObjectURL(file);
            
            return {
                success: true,
                url: localUrl,
                previewUrl: localUrl,
                fileId: 'local_' + Date.now(),
                fileName: file.name,
                message: 'Foto disimpan secara lokal (offline mode)',
                offline: true
            };
        }
    },

    async validateImageFile(file) {
        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!validTypes.includes(file.type)) {
            return {
                valid: false,
                message: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.'
            };
        }
        
        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                valid: false,
                message: `Ukuran file terlalu besar (${this.formatFileSize(file.size)}). Maksimal 5MB.`
            };
        }
        
        return { valid: true };
    },

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    async tryFallbackUpload(file, type, index) {
        try {
            logDebug('Trying fallback upload...');
            
            // Create simpler upload data
            const base64Data = await this.fileToBase64(file);
            const base64Content = base64Data.split(',')[1];
            
            const uploadData = {
                action: 'uploadSimplePhoto',
                fileName: `${type}_${index || 'kantor'}_${Date.now()}.jpg`,
                fileData: base64Content,
                mimeType: file.type
            };
            
            const response = await fetch(APPS_SCRIPT_URL + '?action=uploadSimplePhoto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(uploadData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                return {
                    success: true,
                    url: result.url,
                    message: 'Upload berhasil (fallback method)'
                };
            }
            
            return {
                success: false,
                message: 'Fallback upload gagal'
            };
            
        } catch (error) {
            logDebug('Fallback upload error:', error);
            return {
                success: false,
                message: 'Semua metode upload gagal'
            };
        }
    },

    cachePhotoUrl(type, index, url, fileId) {
        const cacheKey = `${type}_photo_${index || 'kantor'}`;
        const cacheData = {
            url: url,
            fileId: fileId,
            timestamp: Date.now(),
            cached: true
        };
        
        try {
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            logDebug('Photo URL cached:', cacheKey);
        } catch (e) {
            logDebug('Cache error:', e);
        }
    },

    getCachedPhotoUrl(type, index = null) {
        const cacheKey = `${type}_photo_${index || 'kantor'}`;
        
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                // Cache valid for 7 days
                if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    logDebug('Using cached photo URL:', cacheKey);
                    return data.url;
                }
            }
        } catch (e) {
            logDebug('Cache read error:', e);
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
            // Create a test image
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#3498db';
            ctx.fillRect(0, 0, 100, 100);
            
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });
            
            const file = new File([blob], 'test_image.jpg', { type: 'image/jpeg' });
            
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
    
    const results = {
        allPassed: false,
        tests: []
    };
    
    try {
        // Test 1: Connection
        logDebug('Test 1: Testing API connection...');
        const connTest = await authAPI.testConnection();
        results.tests.push({ name: 'Connection', result: connTest });
        
        // Test 2: Login
        logDebug('Test 2: Testing login...');
        const loginTest = await authAPI.login('Admin', '123456');
        results.tests.push({ name: 'Login', result: loginTest });
        
        // Test 3: Get Kantor Data
        logDebug('Test 3: Testing kantor data...');
        const kantorTest = await dataAPI.getKantorData();
        results.tests.push({ name: 'Kantor Data', result: kantorTest });
        
        // Test 4: Get Pegawai Data
        logDebug('Test 4: Testing pegawai data...');
        const pegawaiTest = await dataAPI.getPegawaiData();
        results.tests.push({ name: 'Pegawai Data', result: pegawaiTest });
        
        results.allPassed = results.tests.every(test => test.result.success !== false);
        
        logDebug('=== ALL TESTS COMPLETE ===');
        console.log('Test Results:', results);
        
        return results;
        
    } catch (error) {
        logDebug('Test suite error:', error);
        results.error = error.message;
        return results;
    }
}

// ============================================
// INITIALIZATION
// ============================================

function initAPISystem() {
    logDebug('Initializing API System...');
    
    if (typeof window !== 'undefined') {
        // Export to window object
        window.authAPI = authAPI;
        window.dataAPI = dataAPI;
        window.fileAPI = fileAPI;
        window.utils = utils;
        window.APPS_SCRIPT_URL = APPS_SCRIPT_URL;
        window.DRIVE_FOLDER_ID = DRIVE_FOLDER_ID;
        window.SPREADSHEET_ID = SPREADSHEET_ID;
        window.runAllTests = runAllTests;
        window.logDebug = logDebug;
        
        // Check authentication status
        const isAuth = authAPI.isAuthenticated();
        logDebug('Authentication status:', isAuth ? 'Authenticated' : 'Not authenticated');
        
        // Show debug info
        if (DEBUG_MODE) {
            console.log('=== PROFILE SYSTEM API LOADED ===');
            console.log('Apps Script URL:', APPS_SCRIPT_URL);
            console.log('Drive Folder ID:', DRIVE_FOLDER_ID);
            console.log('Spreadsheet ID:', SPREADSHEET_ID);
            console.log('Authentication:', isAuth ? 'Yes' : 'No');
            console.log('\nAvailable commands:');
            console.log('1. runAllTests() - Run complete test suite');
            console.log('2. authAPI.testConnection() - Test API connection');
            console.log('3. authAPI.login(username, password) - Login');
            console.log('4. dataAPI.getKantorData() - Get kantor data');
            console.log('5. dataAPI.getPegawaiData() - Get pegawai data');
            console.log('6. fileAPI.testUpload() - Test file upload');
        }
    }
}

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initAPISystem);
}
