import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getUrun = async (barkod) => {
  try {
    const response = await axios.get(`${API_URL}/urun/${barkod}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const tumUrunleriGetir = async () => {
  try {
    const response = await axios.get(`${API_URL}/urunler`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const urunEkle = async (urunData) => {
  try {
    const response = await axios.post(`${API_URL}/urun`, urunData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const urunGuncelle = async (barkod, urunData) => {
  try {
    const response = await axios.put(`${API_URL}/urun/${barkod}`, urunData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const urunSil = async (barkod) => {
  try {
    const response = await axios.delete(`${API_URL}/urun/${barkod}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const tumUrunleriSil = async () => {
  try {
    const response = await axios.delete(`${API_URL}/urunler/tumunu-sil`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const satisKaydet = async (satisData) => {
  try {
    const response = await axios.post(`${API_URL}/satis`, satisData);
    return response.data;
  } catch (error) {
    throw error;
  }
};