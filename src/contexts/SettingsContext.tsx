import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../services/api";
import { useAuthStore } from "../services/authStore";

interface UserPreferences {
  id?: string;
  theme_mode: "light" | "dark" | "auto";
  primary_color: string;
  secondary_color: string;
  sidebar_color: string;
  sidebar_text_color: string;
  header_color: string;
  sidebar_collapsed: boolean;
  show_dashboard_cards: boolean;
  default_rows_per_page: number;
  filters_json: string;
  table_preferences_json: string;
  sidebar_display: "name_and_logo" | "logo_only" | "name_only";
}

interface TenantSettings {
  id?: string;
  
  // Dados Básicos
  company_name?: string;
  trade_name?: string;
  cnpj?: string;
  ie?: string;
  im?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  
  // Endereço
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  
  // Identidade / Marca
  logo_url?: string;
  primary_color?: string;
  theme?: string;
  short_name?: string;
  slogan?: string;
  
  // Horários de Funcionamento
  weekday_open?: string;
  weekday_close?: string;
  saturday_open?: string;
  saturday_close?: string;
  sunday_open?: string;
  sunday_close?: string;
  lunch_start?: string;
  lunch_end?: string;
  default_appointment_duration?: number;
  tolerance_minutes?: number;
  blocked_dates?: string;
  
  // Documentos / PDF
  show_logo_pdf?: boolean;
  show_company_data_pdf?: boolean;
  pdf_footer_address?: boolean;
  pdf_footer_phone?: boolean;
  pdf_footer_whatsapp?: boolean;
  pdf_footer_website?: boolean;
  terms_and_conditions?: string;
  default_warranty_text?: string;
  default_quote_text?: string;
  receipt_text?: string;
  os_prefix?: string;
  os_format?: string;
  os_reset_yearly?: boolean;
  signature?: string;
  
  // Financeiro
  default_payment_terms?: string;
  default_warranty_days?: number;
  late_fee_percentage?: number;
  fixed_penalty?: number;
  default_due_days?: number;
  max_installments?: number;
  card_fee_percentage?: number;
  pix_key?: string;
  payment_methods?: string;
  
  // Regras Operacionais
  allow_finish_os_without_payment?: boolean;
  allow_deliver_without_payment?: boolean;
  require_client_approval?: boolean;
  auto_decrease_stock?: boolean;
  alert_stock_low?: boolean;
  require_checklist?: boolean;
  
  // Comunicação
  whatsapp_bot_enabled?: boolean;
  whatsapp_connected?: boolean;
  
  // Alertas
  alert_os_stopped_days?: number;
  alert_overdue_clients?: boolean;
  user_limit?: number;
}

interface SettingsContextType {
  preferences: UserPreferences;
  tenantSettings: TenantSettings;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  updateTenantSettings: (settings: Partial<TenantSettings>) => Promise<void>;
  applyTheme: () => void;
  loading: boolean;
}

const defaultPreferences: UserPreferences = {
  theme_mode: "light",
  primary_color: "#1e293b",
  secondary_color: "#64748b",
  sidebar_color: "#0f172a",
  sidebar_text_color: "#94a3b8",
  header_color: "#ffffff",
  sidebar_collapsed: false,
  show_dashboard_cards: true,
  default_rows_per_page: 20,
  filters_json: "{}",
  table_preferences_json: "{}",
  sidebar_display: "name_and_logo",
};

const SettingsContext = createContext<SettingsContextType>({
  preferences: defaultPreferences,
  tenantSettings: {},
  updatePreferences: async () => {},
  updateTenantSettings: async () => {},
  applyTheme: () => {},
  loading: true,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({});
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setPreferences(defaultPreferences);
      setTenantSettings({});
      setLoading(false);
      return;
    }

    setLoading(true);
    void loadSettings();
  }, [isAuthenticated, token]);

  // Apply theme whenever preferences change
  useEffect(() => {
    applyTheme();
  }, [preferences.theme_mode, preferences.primary_color, preferences.secondary_color, preferences.sidebar_color, preferences.sidebar_text_color, preferences.header_color]);

  const loadSettings = async () => {
    try {
      const [preferencesResponse, tenantResponse] = await Promise.all([
        api.get("/settings/preferences"),
        api.get("/settings/tenant"),
      ]);

      const prefs = preferencesResponse.data;
      // Convert SQLite 0/1 to boolean
      setPreferences({
        ...prefs,
        sidebar_collapsed: !!prefs.sidebar_collapsed,
        show_dashboard_cards: !!prefs.show_dashboard_cards,
        sidebar_display: prefs.sidebar_display || 'name_and_logo',
      });
      setTenantSettings(tenantResponse.data);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    try {
      const response = await api.patch("/settings/preferences", prefs);
      const updatedPrefs = response.data;
      setPreferences({
        ...updatedPrefs,
        sidebar_collapsed: !!updatedPrefs.sidebar_collapsed,
        show_dashboard_cards: !!updatedPrefs.show_dashboard_cards,
        sidebar_display: updatedPrefs.sidebar_display || 'name_and_logo',
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      throw error;
    }
  };

  const updateTenantSettings = async (settings: Partial<TenantSettings>) => {
    try {
      const response = await api.patch("/settings/tenant", settings);
      setTenantSettings(response.data);
    } catch (error) {
      console.error("Error updating tenant settings:", error);
      throw error;
    }
  };

  const applyTheme = () => {
    const root = document.documentElement;
    let effectiveTheme = preferences.theme_mode || "light";

    // Handle auto theme
    if (effectiveTheme === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      effectiveTheme = prefersDark ? "dark" : "light";
    }

    // Apply theme class with smooth transition
    root.style.transition = "background-color 0.3s ease, color 0.3s ease";
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${effectiveTheme}`);

    // Apply primary color with fallback and smooth transition
    const primaryColor = preferences.primary_color || "#1e293b";
    root.style.setProperty("--primary-color", primaryColor);
    root.style.setProperty("--primary-hover", adjustColorBrightness(primaryColor, -20));
    root.style.setProperty("--secondary-color", preferences.secondary_color || "#64748b");
    root.style.setProperty("--sidebar-color", preferences.sidebar_color || "#0f172a");
    root.style.setProperty("--sidebar-text", preferences.sidebar_text_color || "#94a3b8");
    root.style.setProperty("--header-bg", preferences.header_color || "#ffffff");
  };

  // Helper to adjust color brightness
  const adjustColorBrightness = (color: string | undefined, amount: number): string => {
    // Fallback to default color if undefined
    if (!color) {
      color = "#1e293b";
    }
    
    // Remove # if present
    const hexColor = color.startsWith("#") ? color.slice(1) : color;
    
    const num = parseInt(hexColor, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        preferences,
        tenantSettings,
        updatePreferences,
        updateTenantSettings,
        applyTheme,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
