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

const DIAS_SEMANA_EXTENSO = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "sábado, 11 de outubro" a partir de uma data "yyyy-MM-dd", sem depender de fuso. */
export function formatarDataExtensaISO(dataISO: string) {
  const [, mes, dia] = dataISO.split("-").map(Number);
  const diaSemana = diaSemanaDaData(dataISO);
  return `${DIAS_SEMANA_EXTENSO[diaSemana]}, ${dia} de ${MESES[mes - 1]}`;
}
