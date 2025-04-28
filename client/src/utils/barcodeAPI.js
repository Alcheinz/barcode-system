import axios from 'axios';

// Open Food Facts API - ücretsiz, kayıt gerektirmiyor
const searchProductByBarcode = async (barcode) => {
  try {
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    // API'den gelen veriyi kontrol et
    if (response.data && response.data.status === 1) {
      const product = response.data.product;
      return {
        success: true,
        data: {
          urun_adi: product.product_name || '',
          fiyat: '', // Fiyat bilgisi bu API'de yok, kullanıcı girecek
          marka: product.brands || '',
          resimUrl: product.image_url || '',
        }
      };
    } else {
      return {
        success: false,
        error: 'Ürün bulunamadı'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'API hatası: ' + error.message
    };
  }
};

// Birden fazla API'de arama yap
const searchProduct = async (barcode) => {
  try {
    // İlk olarak Open Food Facts'te ara
    const openFoodResult = await searchProductByBarcode(barcode);
    
    if (openFoodResult.success) {
      return openFoodResult;
    }
    
    // Burada başka API'ler eklenebilir
    // Örneğin UPC Database veya Barcode Lookup gibi
    
    return {
      success: false,
      error: 'Ürün bilgileri hiçbir kaynakta bulunamadı'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Arama sırasında hata oluştu: ' + error.message
    };
  }
};

export { searchProduct }; 