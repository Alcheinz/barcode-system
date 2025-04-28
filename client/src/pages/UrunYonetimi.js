import React, { useState, useEffect, useCallback } from 'react';
import { tumUrunleriGetir, urunEkle, urunGuncelle, getUrun, urunSil, tumUrunleriSil } from '../utils/api';
import { searchProduct } from '../utils/barcodeAPI';
import { Container, Table, Button, Form, Modal, Alert, Card, InputGroup, Badge, Row, Col, Spinner } from 'react-bootstrap';

function UrunYonetimi() {
  const [urunler, setUrunler] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [currentUrun, setCurrentUrun] = useState({ barkod: '', urun_adi: '', fiyat: '', stok_adedi: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUrunler, setFilteredUrunler] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [productInfo, setProductInfo] = useState(null);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Sıralama işlevi
  const sortData = useCallback((data) => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Fiyat alanını sayıya çevir
      if (sortConfig.key === 'fiyat') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      // Son güncelleme için tarih karşılaştırması
      if (sortConfig.key === 'son_guncelleme') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      // String değerler için Türkçe karakter desteği ile sıralama
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending' 
          ? aValue.localeCompare(bValue, 'tr-TR') 
          : bValue.localeCompare(aValue, 'tr-TR');
      }
      
      // Sayısal değerler ve tarihler için
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [sortConfig]);

  // Ürünleri yükle
  const loadUrunler = async () => {
    try {
      const data = await tumUrunleriGetir();
      setUrunler(data);
      setFilteredUrunler(data);
    } catch (error) {
      setHata('Ürünler yüklenirken hata oluştu');
    }
  };

  useEffect(() => {
    loadUrunler();
  }, []);

  // Arama işlevi
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUrunler(sortData([...urunler]));
    } else {
      const filtered = urunler.filter(
        urun => 
          urun.barkod.toLowerCase().includes(searchTerm.toLowerCase()) ||
          urun.urun_adi.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUrunler(sortData([...filtered]));
    }
  }, [searchTerm, urunler, sortData]);

  // Sütun başlığına tıklanınca
  const requestSort = (key) => {
    let direction = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };
  
  // Sıralama oku için yardımcı fonksiyon
  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <i className="bi bi-arrow-down-up text-muted opacity-25 ms-1"></i>;
    }
    
    return sortConfig.direction === 'ascending' 
      ? <i className="bi bi-sort-alpha-down ms-1 text-primary"></i> 
      : <i className="bi bi-sort-alpha-up ms-1 text-primary"></i>;
  };

  // Modal'ı kapat
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentUrun({ barkod: '', urun_adi: '', fiyat: '', stok_adedi: '' });
    setIsEditing(false);
  };

  // Ürün silme işlemi
  const handleDeleteUrun = async (barkod) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      try {
        await urunSil(barkod);
        setMesaj('Ürün başarıyla silindi');
        loadUrunler();
        
        setTimeout(() => {
          setMesaj('');
        }, 3000);
      } catch (error) {
        setHata('Ürün silinirken hata oluştu');
      }
    }
  };

  // Yeni ürün ekle modal'ını aç
  const handleShowAddModal = () => {
    setCurrentUrun({ barkod: '', urun_adi: '', fiyat: '', stok_adedi: '' });
    setIsEditing(false);
    setShowModal(true);
  };

  // Düzenleme modal'ını aç
  const handleShowEditModal = async (barkod) => {
    try {
      const urun = await getUrun(barkod);
      setCurrentUrun(urun);
      setIsEditing(true);
      setShowModal(true);
    } catch (error) {
      setHata('Ürün bilgileri alınırken hata oluştu');
    }
  };

  // Barkod elle giriş veya okuyucu için
  const handleBarkodScan = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await searchProductByBarcode(currentUrun.barkod);
    }
  };
  
  // Barkod değişikliğini takip et - 13 hane olduğunda otomatik arama yap
  const handleBarkodChange = (e) => {
    const { value } = e.target;
    
    // Sadece sayıları kabul et
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Maksimum uzunluk 13 karakter (EAN-13 standardı)
    if (numericValue.length <= 13) {
      setCurrentUrun({ ...currentUrun, barkod: numericValue });
      
      // Barkod 13 haneye ulaştığında otomatik arama yap
      if (numericValue.length === 13) {
        searchProductByBarcode(numericValue);
      }
    }
  };
  
  // Barkod ile ürün bilgilerini ara
  const searchProductByBarcode = async (barcode) => {
    if (!barcode || barcode.length !== 13 || isEditing) return;
    
    setIsLoading(true);
    setProductInfo(null);
    
    try {
      const result = await searchProduct(barcode);
      
      if (result.success) {
        // Ürün bilgileri bulundu, formu doldur - ÖNEMLİ: barkod değerini koruyoruz
        setCurrentUrun({
          ...currentUrun,
          barkod: barcode, // Barkod değerini koruyoruz
          urun_adi: result.data.urun_adi,
          // Fiyat bilgisi API'den gelmediği için buraya bir değer koymuyoruz
          // Kullanıcı girecek
        });
        
        // Ürün bilgilerini göster
        setProductInfo(result.data);
        setMesaj('Ürün bilgileri başarıyla alındı!');
        
        setTimeout(() => {
          setMesaj('');
        }, 3000);
      } else {
        // Ürün bulunamadı
        setHata(`Barkod bilgisi bulunamadı: ${result.error}`);
        
        setTimeout(() => {
          setHata('');
        }, 3000);
      }
    } catch (error) {
      setHata('Barkod sorgulanırken hata oluştu');
      
      setTimeout(() => {
        setHata('');
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Form alanlarını güncelle
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Barkod alanı için sadece sayısal değer kontrolü
    if (name === 'barkod') {
      // Barkod değişikliği için özel fonksiyonu çağır
      handleBarkodChange(e);
    } else {
      setCurrentUrun({ ...currentUrun, [name]: value });
    }
  };

  // EAN-13 doğrulama
  const isValidEAN13 = (barkod) => {
    return barkod.length === 13;
  };

  // Form gönderme
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        await urunGuncelle(currentUrun.barkod, currentUrun);
        setMesaj('Ürün başarıyla güncellendi');
      } else {
        await urunEkle(currentUrun);
        setMesaj('Ürün başarıyla eklendi');
      }
      
      handleCloseModal();
      loadUrunler();
      
      setTimeout(() => {
        setMesaj('');
      }, 3000);
    } catch (error) {
      setHata('İşlem sırasında hata oluştu');
    }
  };

  // Tüm ürünleri silme modalını aç
  const handleShowDeleteAllModal = () => {
    setShowDeleteAllModal(true);
  };

  // Tüm ürünleri silme modalını kapat
  const handleCloseDeleteAllModal = () => {
    setShowDeleteAllModal(false);
  };

  // Tüm ürünleri sil
  const handleDeleteAllProducts = async () => {
    setDeleteAllLoading(true);
    
    try {
      const result = await tumUrunleriSil();
      setMesaj(`${result.silinenUrunSayisi} ürün başarıyla silindi`);
      loadUrunler(); // Ürün listesini yeniden yükle
      
      setTimeout(() => {
        setMesaj('');
      }, 3000);
    } catch (error) {
      setHata('Ürünler silinirken hata oluştu');
      
      setTimeout(() => {
        setHata('');
      }, 3000);
    } finally {
      setDeleteAllLoading(false);
      setShowDeleteAllModal(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary mb-0">
              <i className="bi bi-box-seam me-2"></i>
              Ürün Yönetimi
            </h2>
            <div>
              <Button 
                variant="danger" 
                onClick={handleShowDeleteAllModal}
                className="rounded-pill shadow-sm me-2"
              >
                <i className="bi bi-trash me-2"></i>
                Tüm Ürünleri Sil
              </Button>
              <Button 
                variant="primary" 
                onClick={handleShowAddModal}
                className="rounded-pill shadow-sm"
              >
                <i className="bi bi-plus-circle me-2"></i>
                Yeni Ürün Ekle
              </Button>
            </div>
          </div>
          
          {hata && 
            <Alert 
              variant="danger" 
              className="animate__animated animate__fadeIn shadow-sm" 
              style={{borderRadius: '8px'}}
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {hata}
            </Alert>
          }
          {mesaj && 
            <Alert 
              variant="success" 
              className="animate__animated animate__fadeIn shadow-sm"
              style={{borderRadius: '8px'}}
            >
              <i className="bi bi-check-circle-fill me-2"></i>
              {mesaj}
            </Alert>
          }
          
          <Card className="bg-light border-0 mb-4">
            <Card.Body>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Ürün adı veya barkod ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x-lg"></i>
                  </Button>
                )}
              </InputGroup>
            </Card.Body>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-3">Barkod</th>
                      <th 
                        className="cursor-pointer" 
                        onClick={() => requestSort('urun_adi')}
                        style={{ cursor: 'pointer' }}
                      >
                        Ürün Adı {getSortIcon('urun_adi')}
                      </th>
                      <th 
                        className="cursor-pointer" 
                        onClick={() => requestSort('fiyat')}
                        style={{ cursor: 'pointer' }}
                      >
                        Fiyat {getSortIcon('fiyat')}
                      </th>
                      <th 
                        className="cursor-pointer"
                        onClick={() => requestSort('stok_adedi')}
                        style={{ cursor: 'pointer' }}
                      >
                        Stok {getSortIcon('stok_adedi')}
                      </th>
                      <th 
                        className="cursor-pointer"
                        onClick={() => requestSort('son_guncelleme')}
                        style={{ cursor: 'pointer' }}
                      >
                        Son Güncelleme {getSortIcon('son_guncelleme')}
                      </th>
                      <th className="text-end pe-3">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUrunler.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          {searchTerm ? (
                            <>
                              <i className="bi bi-search text-muted" style={{fontSize: '2rem'}}></i>
                              <p className="mt-3 text-muted">Arama sonucu bulunamadı</p>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-box text-muted" style={{fontSize: '2rem'}}></i>
                              <p className="mt-3 text-muted">Henüz ürün bulunmuyor</p>
                            </>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredUrunler.map((urun) => (
                        <tr key={urun.barkod}>
                          <td className="ps-3">
                            <Badge bg="light" text="dark" className="border">
                              {urun.barkod}
                            </Badge>
                          </td>
                          <td className="fw-bold">{urun.urun_adi}</td>
                          <td className="text-success fw-bold">{Number(urun.fiyat).toFixed(2)} TL</td>
                          <td>
                            {urun.stok_adedi > 10 ? (
                              <Badge bg="success" pill>{urun.stok_adedi}</Badge>
                            ) : urun.stok_adedi > 0 ? (
                              <Badge bg="warning" text="dark" pill>{urun.stok_adedi}</Badge>
                            ) : (
                              <Badge bg="danger" pill>Stokta Yok</Badge>
                            )}
                          </td>
                          <td className="text-muted small">
                            <i className="bi bi-clock me-1"></i>
                            {new Date(urun.son_guncelleme).toLocaleString('tr-TR')}
                          </td>
                          <td className="text-end pe-3">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleShowEditModal(urun.barkod)}
                              className="me-2 rounded-pill btn-sm-icon"
                            >
                              <i className="bi bi-pencil-fill"></i>
                              <span className="ms-1 d-none d-md-inline">Düzenle</span>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDeleteUrun(urun.barkod)}
                              className="rounded-pill btn-sm-icon"
                            >
                              <i className="bi bi-trash-fill"></i>
                              <span className="ms-1 d-none d-md-inline">Sil</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
          
          <div className="text-muted text-center mt-3">
            <small>Toplam {filteredUrunler.length} ürün gösteriliyor</small>
          </div>
        </Card.Body>
      </Card>
      
      {/* Ürün Ekleme/Düzenleme Modal'ı */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            {isEditing ? (
              <><i className="bi bi-pencil-square me-2"></i>Ürün Düzenle</>
            ) : (
              <><i className="bi bi-plus-circle me-2"></i>Yeni Ürün Ekle</>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                <i className="bi bi-upc me-2"></i>
                Barkod
                <small className="text-muted ms-2">(EAN-13)</small>
              </Form.Label>
              <InputGroup>
                <InputGroup.Text><i className="bi bi-123"></i></InputGroup.Text>
                <Form.Control
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  name="barkod"
                  value={currentUrun.barkod}
                  onChange={handleInputChange}
                  onKeyDown={handleBarkodScan}
                  disabled={isEditing}
                  required
                  placeholder="Barkodu girin veya okutun..."
                  maxLength={13}
                  autoComplete="off"
                />
                {!isEditing && isLoading && (
                  <InputGroup.Text>
                    <Spinner animation="border" size="sm" />
                  </InputGroup.Text>
                )}
                {!isEditing && !isLoading && currentUrun.barkod.length === 13 && (
                  <Button 
                    variant="outline-secondary"
                    onClick={() => searchProductByBarcode(currentUrun.barkod)}
                  >
                    <i className="bi bi-cloud-download"></i>
                  </Button>
                )}
              </InputGroup>
              {!isEditing && currentUrun.barkod && (
                <small className={`mt-1 d-block ${isValidEAN13(currentUrun.barkod) ? 'text-success' : 'text-muted'}`}>
                  {currentUrun.barkod.length}/13 karakter
                  {isValidEAN13(currentUrun.barkod) && 
                    <span className="ms-2">
                      <i className="bi bi-check-circle"></i> Barkod doğru uzunlukta
                    </span>
                  }
                </small>
              )}
            </Form.Group>
            
            {productInfo && !isEditing && (
              <Alert variant="info" className="mt-2 mb-3">
                <p className="mb-1"><strong>Bulunan Ürün Bilgileri:</strong></p>
                {productInfo.marka && <p className="mb-1 small"><strong>Marka:</strong> {productInfo.marka}</p>}
                {productInfo.resimUrl && (
                  <div className="text-center my-2">
                    <img 
                      src={productInfo.resimUrl} 
                      alt={productInfo.urun_adi} 
                      style={{maxHeight: '100px', maxWidth: '100%'}} 
                      className="img-thumbnail"
                    />
                  </div>
                )}
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                <i className="bi bi-tag me-2"></i>
                Ürün Adı
              </Form.Label>
              <InputGroup>
                <InputGroup.Text><i className="bi bi-pencil"></i></InputGroup.Text>
                <Form.Control
                  type="text"
                  name="urun_adi"
                  value={currentUrun.urun_adi}
                  onChange={handleInputChange}
                  required
                  placeholder="Ürün adını giriniz"
                />
              </InputGroup>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <i className="bi bi-currency-lira me-2"></i>
                    Fiyat (TL)
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text><i className="bi bi-cash"></i></InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="fiyat"
                      value={currentUrun.fiyat}
                      onChange={handleInputChange}
                      required
                      placeholder="0.00"
                    />
                    <InputGroup.Text>TL</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <i className="bi bi-boxes me-2"></i>
                    Stok Adedi
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text><i className="bi bi-hash"></i></InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="stok_adedi"
                      value={currentUrun.stok_adedi}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                    <InputGroup.Text>adet</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end mt-4">
              <Button 
                variant="light" 
                onClick={handleCloseModal}
                className="me-2"
              >
                <i className="bi bi-x-circle me-2"></i>
                İptal
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                className="px-4"
              >
                {isEditing ? (
                  <><i className="bi bi-check2-circle me-2"></i>Güncelle</>
                ) : (
                  <><i className="bi bi-plus-circle me-2"></i>Ekle</>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Tüm Ürünleri Silme Onay Modal'ı */}
      <Modal 
        show={showDeleteAllModal} 
        onHide={handleCloseDeleteAllModal}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Tüm Ürünleri Sil
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="mb-0">Bu işlem <strong>tüm ürünleri</strong> veritabanından <strong>kalıcı olarak</strong> silecektir.</p>
          <p className="mt-3 mb-0 text-danger fw-bold">Bu işlem geri alınamaz!</p>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={handleCloseDeleteAllModal}
          >
            <i className="bi bi-x-circle me-2"></i>
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteAllProducts}
            disabled={deleteAllLoading}
          >
            {deleteAllLoading ? (
              <>
                <Spinner 
                  as="span" 
                  animation="border" 
                  size="sm" 
                  className="me-2" 
                />
                Siliniyor...
              </>
            ) : (
              <>
                <i className="bi bi-trash-fill me-2"></i>
                Tüm Ürünleri Sil
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default UrunYonetimi;