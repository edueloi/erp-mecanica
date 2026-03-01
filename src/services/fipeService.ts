import axios from 'axios';

const FIPE_BASE_URL = 'https://parallelum.com.br/fipe/api/v1';

export interface FipeItem {
  codigo: string;
  nome: string;
}

export interface FipeModelResponse {
  modelos: FipeItem[];
  anos: FipeItem[];
}

export interface FipeVehicleData {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  TipoVeiculo: number;
  SiglaCombustivel: string;
}

export const fipeService = {
  getBrands: async (type: 'carros' | 'motos' | 'caminhoes' = 'carros'): Promise<FipeItem[]> => {
    const response = await axios.get(`${FIPE_BASE_URL}/${type}/marcas`);
    return response.data;
  },

  getModels: async (brandId: string, type: 'carros' | 'motos' | 'caminhoes' = 'carros'): Promise<FipeItem[]> => {
    const response = await axios.get(`${FIPE_BASE_URL}/${type}/marcas/${brandId}/modelos`);
    return response.data.modelos;
  },

  getYears: async (brandId: string, modelId: string, type: 'carros' | 'motos' | 'caminhoes' = 'carros'): Promise<FipeItem[]> => {
    const response = await axios.get(`${FIPE_BASE_URL}/${type}/marcas/${brandId}/modelos/${modelId}/anos`);
    return response.data;
  },

  getVehicleDetails: async (brandId: string, modelId: string, yearId: string, type: 'carros' | 'motos' | 'caminhoes' = 'carros'): Promise<FipeVehicleData> => {
    const response = await axios.get(`${FIPE_BASE_URL}/${type}/marcas/${brandId}/modelos/${modelId}/anos/${yearId}`);
    return response.data;
  }
};
