// ============================================
// API CONFIGURATION
// ============================================

// Google Apps Script Web App URL
// GANTI DENGAN URL APPS SCRIPT ANDA SETELAH DEPLOY
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_idtLPGT_wK9N9BNmjqCBExK50gGonoi_uoUv58Kg95Zyk5_sV8I8meD5B85urtp4XQ/exec';

// Google Drive Folder ID untuk foto
const DRIVE_FOLDER_ID = '1JFC4y14WCQjthAh7XZZUdQ-58kEsg1Ck';

// Spreadsheet ID
const SPREADSHEET_ID = '1XCTZBBxu4HGDZ1e7JW8DJGdoYT8tMkooxfNrZMJoruY';

// ============================================
// AUTHENTICATION API
// ============================================


const authAPI = {
    // Login user
    async login(username, password) {
        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Login API error:', error);
            return {
                success: false,
                message: 'Koneksi ke server gagal'
            };
        }
    },

    // Logout user
    async logout(token) {
        try {
            const response = await fetch(`${APPS_SCRIPT_URL}?action=logout&token=${token}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Logout API error:', error);
            return { success: false };
        }
    },

    // Verify token
    async verifyToken(token) {
        try {
            const response = await fetch(`${APPS_SCRIPT_URL}?action=verifyToken&token=${token}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Token verification error:', error);
            return { success: false };
        }
    }
};

// ============================================
// DATA API - KANTOR & PEGAWAI
// ============================================

const dataAPI = {
    // Get kantor data
    async getKantorData() {
        try {
            const response = await fetch(`${APPS_SCRIPT_URL}?action=getKantorData`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get kantor data error:', error);
            return {
                success: false,
                message: 'Gagal mengambil data kantor'
            };
        }
    },

    // Save kantor data
    async saveKantorData(kantorData) {
        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'saveKantorData',
                    data: kantorData,
                    timestamp: new Date().toISOString()
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Save kantor data error:', error);
            return {
                success: false,
                message: 'Gagal menyimpan data kantor'
            };
        }
    },

    // Get semua data pegawai
    async getPegawaiData() {
        try {
            const response = await fetch(`${APPS_SCRIPT_URL}?action=getPegawaiData`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get pegawai data error:', error);
            return {
                success: false,
                message: 'Gagal mengambil data pegawai'
            };
        }
    },

    // Save data pegawai
    async savePegawaiData(pegawaiData) {
        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'savePegawaiData',
                    data: pegawaiData,
                    timestamp: new Date().toISOString()
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Save pegawai data error:', error);
            return {
                success: false,
                message: 'Gagal menyimpan data pegawai'
            };
        }
    },

    // Delete data pegawai
    async deletePegawaiData(cardId) {
        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'deletePegawaiData',
                    cardId: cardId
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Delete pegawai data error:', error);
            return {
                success: false,
                message: 'Gagal menghapus data pegawai'
            };
        }
    }
};

// ============================================
// FILE UPLOAD API
// ============================================

const fileAPI = {
    // Upload photo ke Google Drive
    async uploadPhoto(file, type, index = null) {
        try {
            // Convert file to base64
            const base64Data = await this.fileToBase64(file);
            
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'uploadPhoto',
                    fileName: `${type}_${index || 'kantor'}_${Date.now()}.jpg`,
                    fileData: base64Data,
                    mimeType: file.type,
                    folderId: DRIVE_FOLDER_ID,
                    type: type,
                    index: index
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Upload photo error:', error);
            return {
                success: false,
                message: 'Gagal mengupload foto'
            };
        }
    },

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    },

    // Delete photo dari Google Drive
    async deletePhoto(fileId) {
        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'deletePhoto',
                    fileId: fileId
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Delete photo error:', error);
            return {
                success: false,
                message: 'Gagal menghapus foto'
            };
        }
    },

    // Get photo URL dari Google Drive
    getPhotoUrl(fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const utils = {
    // Format date to Indonesian format
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

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate phone number
    validatePhone(phone) {
        const re = /^[0-9+\-\s()]{10,15}$/;
        return re.test(phone);
    },

    // Generate random ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Debounce function
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
    }
};

// ============================================
// ERROR HANDLER
// ============================================

const errorHandler = {
    // Handle API errors
    handleApiError(error, context) {
        console.error(`API Error in ${context}:`, error);
        
        let userMessage = 'Terjadi kesalahan pada sistem';
        
        if (error.message.includes('NetworkError')) {
            userMessage = 'Koneksi internet terputus. Periksa jaringan Anda.';
        } else if (error.message.includes('Failed to fetch')) {
            userMessage = 'Server tidak merespon. Coba lagi nanti.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            userMessage = 'Akses ditolak. Silakan login kembali.';
        } else if (error.message.includes('404')) {
            userMessage = 'Data tidak ditemukan.';
        }
        
        return {
            success: false,
            message: userMessage,
            originalError: error.message
        };
    },

    // Show error to user
    showError(message, details = null) {
        console.error('User Error:', message, details);
        
        // You can implement custom error display here
        alert(message);
        
        if (details && console) {
            console.error('Error Details:', details);
        }
    }
};

// ============================================
// EXPORT API OBJECTS (for module usage)
// ============================================

// If using ES6 modules
// export { authAPI, dataAPI, fileAPI, utils, errorHandler };

// For global usage (attached to window)
window.authAPI = authAPI;
window.dataAPI = dataAPI;
window.fileAPI = fileAPI;
window.utils = utils;
window.errorHandler = errorHandler;
