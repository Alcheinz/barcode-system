import React, { useState, useEffect, useRef } from 'react';
import { getUrun, satisKaydet, tumUrunleriGetir } from '../utils/api';
import { Container, Row, Col, Table, Button, Form, Alert, Card, Badge, InputGroup, ListGroup } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';

function SatisEkrani() {
  const { sepet, toplam, sepeteEkle, urunKaldir, miktarDegistir, sepetiTemizle } = useCart();
  const [barkod, setBarkod] = useState('');
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');
  const barkodInputRef = useRef(null);
  const [showUrunList, setShowUrunList] = useState(false);
  const [urunler, setUrunler] = useState([]);
  const [filteredUrunler, setFilteredUrunler] = useState([]);
  const [searchUrun, setSearchUrun] = useState('');

  // Barkod input alanına odaklanma
  useEffect(() => {
    barkodInputRef.current.focus();
  }, []);

  // Tüm ürünleri yükle
  useEffect(() => {
    if (showUrunList) {
      const fetchUrunler = async () => {
        try {
          const data = await tumUrunleriGetir();
          setUrunler(data);
          setFilteredUrunler(data);
        } catch (error) {
          setHata('Ürünler yüklenirken hata oluştu');
        }
      };
      fetchUrunler();
    }
  }, [showUrunList]);

  // Arama işlevi
  useEffect(() => {
    if (urunler.length > 0) {
      const filtered = urunler.filter(
        urun => 
          urun.urun_adi.toLowerCase().includes(searchUrun.toLowerCase()) ||
          urun.barkod.includes(searchUrun)
      );
      setFilteredUrunler(filtered);
    }
  }, [searchUrun, urunler]);

  // Barkod değişikliğini işle ve 13 haneye ulaşıldığında otomatik sepete ekle
  const handleBarkodChange = (e) => {
    const value = e.target.value;
    
    // Sadece sayısal değerlere izin ver
    const numericValue = value.replace(/[^0-9]/g, '');
    setBarkod(numericValue);
    
    // 13 haneli EAN-13 barkod kontrolü
    if (numericValue.length === 13) {
      // Değer 13 haneye ulaştığında otomatik sepete ekle
      setTimeout(() => {
        handleBarkodUrunEkle(numericValue);
      }, 100);
    }
  };

  // Barkod ile doğrudan ürün ekleme - yeni fonksiyon
  const handleBarkodUrunEkle = async (barkodNumarasi) => {
    if (!barkodNumarasi) return;
    
    try {
      const urun = await getUrun(barkodNumarasi);
      sepeteEkle(urun);
      setHata('');
      setBarkod('');
      
      // Başarılı eklemeden sonra kısa bir bildirim göster
      setMesaj(`"${urun.urun_adi}" sepete eklendi`);
      setTimeout(() => {
        setMesaj('');
      }, 1500);
    } catch (error) {
      setHata('Ürün bulunamadı');
      // Hata durumunda bile barkod alanını temizle
      setTimeout(() => {
        setBarkod('');
        setHata('');
      }, 1500);
    }
    
    barkodInputRef.current.focus();
  };

  // Barkod okuma ve sepete ekleme işlemi - form için
  const handleBarkodSubmit = async (e) => {
    e.preventDefault();
    
    if (!barkod) return;
    handleBarkodUrunEkle(barkod);
  };

  // Alışverişi tamamlama
  const alisverisiTamamla = async () => {
    if (sepet.length === 0) {
      setHata('Sepet boş');
      return;
    }
    
    try {
      // Satış kaydetme (isteğe bağlı)
      await satisKaydet({
        toplam_fiyat: toplam,
        urunler: sepet.map(item => ({
          barkod: item.urun.barkod,
          urun_adi: item.urun.urun_adi,
          fiyat: item.urun.fiyat,
          miktar: item.miktar
        }))
      });
      
      setMesaj('Alışveriş başarıyla tamamlandı!');
      sepetiTemizle();
      setBarkod('');
      setHata('');
      
      setTimeout(() => {
        setMesaj('');
        barkodInputRef.current.focus();
      }, 3000);
    } catch (error) {
      setHata('Satış kaydedilirken hata oluştu');
    }
  };

  // Daha fazla ürün göster/gizle
  const toggleUrunList = () => {
    setShowUrunList(!showUrunList);
    setSearchUrun('');
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <h2 className="mb-4 text-primary text-center">
            <i className="bi bi-cart-fill me-2"></i>
            Satış Ekranı
          </h2>
          
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
        </Card.Body>
      </Card>
      
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <Form onSubmit={handleBarkodSubmit} className="mb-4">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <i className="bi bi-upc-scan me-2"></i>
                    Barkod Okut
                    <small className="text-muted ms-2">(EAN-13)</small>
                  </Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      value={barkod}
                      onChange={handleBarkodChange}
                      ref={barkodInputRef}
                      placeholder="Barkodu okutun veya girin..."
                      className="border-primary"
                      style={{borderRadius: '8px 0 0 8px'}}
                      maxLength={13}
                      autoComplete="off"
                    />
                    <Button 
                      variant="primary" 
                      type="submit"
                      style={{borderRadius: '0 8px 8px 0'}}
                    >
                      <i className="bi bi-cart-plus me-1"></i>
                      Sepete Ekle
                    </Button>
                  </div>
                  {barkod && (
                    <small className="text-muted">
                      {barkod.length}/13 karakter
                      {barkod.length === 13 && <span className="text-success ms-2"><i className="bi bi-check-circle"></i> Barkod doğru uzunlukta</span>}
                    </small>
                  )}
                </Form.Group>
              </Form>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Button 
                    variant={showUrunList ? "outline-primary" : "outline-secondary"} 
                    onClick={toggleUrunList}
                    className="rounded-pill"
                  >
                    <i className={`bi ${showUrunList ? "bi-arrow-up-circle" : "bi-arrow-down-circle"} me-2`}></i>
                    {showUrunList ? "Ürün Listesini Gizle" : "Ürün Listesini Göster"}
                  </Button>
                  {showUrunList && (
                    <Badge bg="info" pill>
                      Toplam {filteredUrunler.length} ürün
                    </Badge>
                  )}
                </div>
                
                {showUrunList && (
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <InputGroup className="mb-3">
                        <InputGroup.Text className="bg-white border-end-0">
                          <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Ürün adı veya barkod ile ara..."
                          value={searchUrun}
                          onChange={(e) => setSearchUrun(e.target.value)}
                          className="border-start-0"
                        />
                        {searchUrun && (
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => setSearchUrun('')}
                          >
                            <i className="bi bi-x-lg"></i>
                          </Button>
                        )}
                      </InputGroup>
                      
                      <div style={{maxHeight: '300px', overflowY: 'auto'}} className="bg-white rounded border">
                        <ListGroup variant="flush">
                          {filteredUrunler.length === 0 ? (
                            <div className="text-center p-3 text-muted">
                              <i className="bi bi-search me-2"></i>
                              Arama sonucu bulunamadı
                            </div>
                          ) : (
                            filteredUrunler.map((urun) => (
                              <ListGroup.Item key={urun.barkod} className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-bold">{urun.urun_adi}</div>
                                  <div className="d-flex align-items-center">
                                    <small className="text-muted me-2">
                                      <i className="bi bi-upc-scan me-1"></i>
                                      {urun.barkod}
                                    </small>
                                    <Badge bg="success" className="me-1">
                                      {Number(urun.fiyat).toFixed(2)} TL
                                    </Badge>
                                    {urun.stok_adedi <= 0 ? (
                                      <Badge bg="danger">Stokta Yok</Badge>
                                    ) : urun.stok_adedi <= 5 ? (
                                      <Badge bg="warning" text="dark">Son {urun.stok_adedi} adet</Badge>
                                    ) : null}
                                  </div>
                                </div>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => sepeteEkle(urun)}
                                  className="rounded-pill"
                                  disabled={urun.stok_adedi <= 0}
                                >
                                  <i className="bi bi-plus-circle me-1"></i>
                                  Sepete Ekle
                                </Button>
                              </ListGroup.Item>
                            ))
                          )}
                        </ListGroup>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </div>
              
              <h3 className="mb-3 border-bottom pb-2 text-secondary">
                <i className="bi bi-basket2-fill me-2"></i>
                Sepet
                {sepet.length > 0 && 
                  <Badge bg="primary" pill className="ms-2">
                    {sepet.length}
                  </Badge>
                }
              </h3>
              {sepet.length === 0 ? (
                <div className="text-center p-5 text-muted bg-light rounded">
                  <i className="bi bi-cart-x" style={{fontSize: '3rem'}}></i>
                  <p className="mt-3">Sepette ürün yok</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>#</th>
                        <th>Ürün Adı</th>
                        <th>Birim Fiyat</th>
                        <th>Miktar</th>
                        <th>Toplam</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sepet.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td className="fw-bold">{item.urun.urun_adi}</td>
                          <td>{Number(item.urun.fiyat).toFixed(2)} TL</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Button 
                                size="sm" 
                                variant="outline-secondary"
                                onClick={() => miktarDegistir(index, item.miktar - 1)}
                                className="rounded-circle"
                                style={{width: '30px', height: '30px', padding: '0'}}
                              >
                                <i className="bi bi-dash"></i>
                              </Button>
                              <span className="mx-3 fw-bold">{item.miktar}</span>
                              <Button 
                                size="sm" 
                                variant="outline-secondary"
                                onClick={() => miktarDegistir(index, item.miktar + 1)}
                                className="rounded-circle"
                                style={{width: '30px', height: '30px', padding: '0'}}
                              >
                                <i className="bi bi-plus"></i>
                              </Button>
                            </div>
                          </td>
                          <td className="fw-bold text-success">
                            {(Number(item.urun.fiyat) * item.miktar).toFixed(2)} TL
                          </td>
                          <td>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => urunKaldir(index)}
                              className="rounded-pill"
                            >
                              <i className="bi bi-trash me-1"></i>
                              Kaldır
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow border-0 sticky-top" style={{top: '1rem'}}>
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0 fs-5">
                <i className="bi bi-receipt me-2"></i>
                Sipariş Özeti
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Toplam Ürün:</span>
                <Badge bg="secondary" pill>
                  {sepet.reduce((total, item) => total + item.miktar, 0)}
                </Badge>
              </div>
              
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Ara Toplam:</span>
                <span>{toplam.toFixed(2)} TL</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Toplam:</h4>
                <h3 className="mb-0 text-primary">{toplam.toFixed(2)} TL</h3>
              </div>
              
              <Button 
                variant="success" 
                size="lg" 
                className="w-100 py-3 rounded-pill"
                onClick={alisverisiTamamla}
                disabled={sepet.length === 0}
              >
                <i className="bi bi-check2-circle me-2"></i>
                Alışverişi Tamamla
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default SatisEkrani;