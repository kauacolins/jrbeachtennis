// Aritmética de datas em dias de calendário (strings "yyyy-MM-dd"), sem
// depender do fuso do processo — o fuso só entra na hora de montar o
// instante UTC de um horário (ver features/reservas).

export function diaSemanaDaData(dataISO: string) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export function adicionarDias(dataISO: string, dias: number) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}
