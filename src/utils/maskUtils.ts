export const maskPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);
  if (value.length > 10) {
    return value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
  } else if (value.length > 5) {
    return value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  } else if (value.length > 2) {
    return value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  } else {
    return value.replace(/^(\d*)/, "($1");
  }
};

export const maskCPF = (value: string) => {
  value = value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);
  return value
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const maskCNPJ = (value: string) => {
  value = value.replace(/\D/g, "");
  if (value.length > 14) value = value.slice(0, 14);
  return value
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const maskDocument = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) return maskCPF(value);
  return maskCNPJ(value);
};

export const maskCEP = (value: string) => {
  value = value.replace(/\D/g, "");
  if (value.length > 8) value = value.slice(0, 8);
  return value.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
};
