// ============================================
// API CONFIGURATION
// ============================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyM988ziCnnKJtvU_hRiFqecvZu5L1GjSEaJJieGmEdeN1wMUOYIDEp7dGYRrHDp1trfw/exec';
const DRIVE_FOLDER_ID = '1JFC4y14WCQjthAh7XZZUdQ-58kEsg1Ck';
const SPREADSHEET_ID = '1XCTZBBxu4HGDZ1e7JW8DJGdoYT8tMkooxfNrZMJoruY';
const DEBUG_MODE = true;

// ============================================
// ENHANCED FILE UPLOAD API
// ============================================

const fileAPI = {
  // Upload photo ke Google Drive dengan real implementation
  async uploadPhoto(file, type, index = null) {
    try {
      logDebug('Uploading photo to Google Drive:', { 
        type, 
        index, 
        name: file.name,
        size: file.size 
      });
      
      // Convert file to base64 dengan compression
      const base64Data = await this.compressAndConvertToBase64(file);
      
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'uploadPhoto',
          fileName: `${type}_${index || 'kantor'}_${Date.now()}.jpg`,
          fileData: base64Data,
          mimeType: 'image/jpeg', // Always convert to JPEG for consistency
          folderId: DRIVE_FOLDER_ID,
          type: type,
          index: index
        })
      });
      
      const data = await response.json();
      logDebug('Upload response:', data);
      
      if (data.success) {
        // Store file info in localStorage for caching
        const fileKey = `${type}_${index || 'kantor'}_photo`;
        localStorage.setItem(fileKey, JSON.stringify({
          url: data.url,
          fileId: data.fileId,
          timestamp: Date.now()
        }));
        
        return {
          success: true,
          url: data.url,
          fileId: data.fileId,
          fileName: data.fileName,
          message: 'Foto berhasil diupload ke Google Drive'
        };
      } else {
        throw new Error(data.message || 'Upload gagal');
      }
      
    } catch (error) {
      logDebug('Upload photo error:', error);
      
      // Fallback to placeholder if upload fails
      return {
        success: true, // Still success to allow data saving
        url: `https://via.placeholder.com/1080x1350/2c3e50/ffffff?text=${type}+${index || 'kantor'}`,
        fileId: 'placeholder-' + Date.now(),
        message: 'Foto menggunakan placeholder (upload gagal)'
      };
    }
  },

  // Compress and convert image to base64
  async compressAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      reader.onload = function(e) {
        img.onload = function() {
          // Set canvas size to 4:5 ratio (1080x1350)
          const targetWidth = 1080;
          const targetHeight = 1350;
          
          // Calculate scaling to maintain aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width / height > targetWidth / targetHeight) {
            // Image is wider than target ratio
            width = height * (targetWidth / targetHeight);
          } else {
            // Image is taller than target ratio
            height = width * (targetHeight / targetWidth);
          }
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // Draw image centered and scaled to fill canvas
          const offsetX = (targetWidth - width) / 2;
          const offsetY = (targetHeight - height) / 2;
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, offsetX, offsetY, width, height);
          
          // Convert to JPEG with quality 85%
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64 = compressedDataUrl.split(',')[1];
          resolve(base64);
        };
        img.src = e.target.result;
      };
      
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  },

  // Get cached photo URL
  getCachedPhotoUrl(type, index = null) {
    const fileKey = `${type}_${index || 'kantor'}_photo`;
    const cached = localStorage.getItem(fileKey);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is less than 24 hours old
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return data.url;
      }
    }
    return null;
  }
};

// ============================================
// ENHANCED DATA API WITH CACHING
// ============================================

const dataAPI = {
  // Get kantor data dengan caching
  async getKantorData(forceRefresh = false) {
    const cacheKey = 'kantor_data_cache';
    
    // Check cache first
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 5 * 60 * 1000) { // 5 minutes cache
          logDebug('Using cached kantor data');
          return data;
        }
      }
    }
    
    try {
      logDebug('Fetching kantor data from server');
      const data = await safeFetch(APPS_SCRIPT_URL + '?action=getKantorData&_=' + Date.now());
      
      if (data && data.success) {
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          ...data,
          timestamp: Date.now()
        }));
        return data;
      }
      
      // Return empty data as fallback
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

  // Get pegawai data dengan caching
  async getPegawaiData(forceRefresh = false) {
    const cacheKey = 'pegawai_data_cache';
    
    // Check cache first
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 5 * 60 * 1000) { // 5 minutes cache
          logDebug('Using cached pegawai data');
          return data;
        }
      }
    }
    
    try {
      logDebug('Fetching pegawai data from server');
      const data = await safeFetch(APPS_SCRIPT_URL + '?action=getPegawaiData&_=' + Date.now());
      
      if (data && data.success) {
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          ...data,
          timestamp: Date.now()
        }));
        return data;
      }
      
      return { success: true, data: [] };
      
    } catch (error) {
      logDebug('Get pegawai data error:', error);
      return { success: true, data: [] };
    }
  },

  // Save data with better error handling
  async saveKantorData(kantorData) {
    try {
      logDebug('Saving kantor data:', kantorData);
      
      const data = await safeFetch(APPS_SCRIPT_URL, {
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
      
      if (data && data.success) {
        // Clear cache on successful save
        localStorage.removeItem('kantor_data_cache');
        return data;
      }
      
      throw new Error(data?.message || 'Simpan gagal');
      
    } catch (error) {
      logDebug('Save kantor data error:', error);
      return {
        success: false,
        message: 'Gagal menyimpan data: ' + error.message
      };
    }
  },

  async savePegawaiData(pegawaiData) {
    try {
      logDebug('Saving pegawai data:', pegawaiData);
      
      const data = await safeFetch(APPS_SCRIPT_URL, {
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
      
      if (data && data.success) {
        // Clear cache on successful save
        localStorage.removeItem('pegawai_data_cache');
        return data;
      }
      
      throw new Error(data?.message || 'Simpan gagal');
      
    } catch (error) {
      logDebug('Save pegawai data error:', error);
      return {
        success: false,
        message: 'Gagal menyimpan data: ' + error.message
      };
    }
  }
};

// ============================================
// ENHANCED CROP FUNCTIONALITY
// ============================================

const cropUtils = {
  // Create cropper instance with 4:5 ratio
  createCropper(imageElement) {
    return new Cropper(imageElement, {
      aspectRatio: 4/5,
      viewMode: 2, // View mode 2 restricts crop box to container
      dragMode: 'move',
      autoCropArea: 0.8,
      responsive: true,
      restore: false,
      guides: true,
      center: true,
      highlight: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      minCanvasWidth: 1080,
      minCanvasHeight: 1350,
      minCropBoxWidth: 432,  // 40% of 1080
      minCropBoxHeight: 540, // 40% of 1350
      ready: function() {
        console.log('Cropper ready with 4:5 aspect ratio');
      }
    });
  },

  // Get cropped canvas with exact dimensions
  getCroppedCanvas(cropper) {
    return cropper.getCroppedCanvas({
      width: 1080,
      height: 1350,
      fillColor: '#fff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });
  },

  // Validate crop ratio
  validateCropRatio(cropper) {
    const cropBoxData = cropper.getCropBoxData();
    const ratio = cropBoxData.width / cropBoxData.height;
    const targetRatio = 4/5; // 0.8
    
    // Allow small tolerance (±0.01)
    return Math.abs(ratio - targetRatio) < 0.01;
  }
};

// ============================================
// EXPORT ENHANCED UTILITIES
// ============================================

window.authAPI = authAPI;
window.dataAPI = dataAPI;
window.fileAPI = fileAPI;
window.cropUtils = cropUtils;
window.utils = {
  ...utils,
  // Add new utilities
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Format file harus JPG, PNG, GIF, atau WebP'
      };
    }
    
    if (file.size > maxSize) {
      return {
        valid: false,
        message: 'Ukuran file maksimal 5MB'
      };
    }
    
    return { valid: true };
  }
};
