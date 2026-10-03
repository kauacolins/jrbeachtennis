import {
  Footprints,
  Target,
  Trophy,
  Volleyball,
  Waves,
  type LucideProps,
} from "lucide-react";

const ICONE_POR_MODALIDADE: Record<string, typeof Waves> = {
  "beach tennis": Waves,
  "futevôlei": Footprints,
  "futevolei": Footprints,
  "vôlei": Volleyball,
  "volei": Volleyball,
  "queimada": Target,
};

export function ModalidadeIcon({
  nome,
  ...props
}: { nome: string } & LucideProps) {
  const Icon = ICONE_POR_MODALIDADE[nome.trim().toLowerCase()] ?? Trophy;
  return <Icon {...props} />;
}
