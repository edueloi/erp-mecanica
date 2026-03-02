import axios from "axios";

const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

export interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

export interface Cidade {
  id: number;
  nome: string;
}

// Get all Brazilian states
export const getEstados = async (): Promise<Estado[]> => {
  try {
    const response = await axios.get(`${IBGE_BASE_URL}/estados?orderBy=nome`);
    return response.data;
  } catch (error) {
    console.error("Error fetching states from IBGE:", error);
    throw error;
  }
};

// Get cities by state ID
export const getCidadesPorEstado = async (estadoId: number): Promise<Cidade[]> => {
  try {
    const response = await axios.get(
      `${IBGE_BASE_URL}/estados/${estadoId}/municipios?orderBy=nome`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching cities from IBGE:", error);
    throw error;
  }
};

// Get cities by state abbreviation (UF)
export const getCidadesPorUF = async (uf: string): Promise<Cidade[]> => {
  try {
    const response = await axios.get(
      `${IBGE_BASE_URL}/estados/${uf}/municipios?orderBy=nome`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching cities from IBGE:", error);
    throw error;
  }
};

// Get state by UF
export const getEstadoPorUF = async (uf: string): Promise<Estado> => {
  try {
    const response = await axios.get(`${IBGE_BASE_URL}/estados/${uf}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching state from IBGE:", error);
    throw error;
  }
};

export default {
  getEstados,
  getCidadesPorEstado,
  getCidadesPorUF,
  getEstadoPorUF,
};
