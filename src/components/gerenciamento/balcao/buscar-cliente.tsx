"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatarDataCurta, formatarTelefone } from "@/lib/format";
import { buscarClientes, type ClienteBalcao } from "@/features/clientes/actions/buscar-clientes";
import { criarCliente } from "@/features/clientes/actions/criar-cliente";

// Busca no cadastro do balcão por nome ou telefone; não achou, cadastra na
// hora com nome, sobrenome e telefone (opcional). Usado no day use da
// comanda, nos planos e na Nova reserva da agenda.
export function BuscarCliente({
  termoInicial = "",
  acaoLabel,
  pendente = false,
  autoFocus = true,
  onSelecionar,
}: {
  termoInicial?: string;
  acaoLabel: string;
  pendente?: boolean;
  /** Desligar quando a busca não é o primeiro campo da tela (ex.: Nova reserva). */
  autoFocus?: boolean;
  onSelecionar: (cliente: ClienteBalcao) => void;
}) {
  const [termo, setTermo] = useState(termoInicial);
  const [resultados, setResultados] = useState<ClienteBalcao[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, startTransition] = useTransition();

  useEffect(() => {
    const texto = termo.trim();
    if (texto.length < 2) {
      setResultados(null);
      return;
    }
    // resposta de uma busca antiga não sobrescreve a da digitação atual
    let atual = true;
    setBuscando(true);
    const id = setTimeout(() => {
      buscarClientes(texto)
        .then((lista) => atual && setResultados(lista))
        .finally(() => atual && setBuscando(false));
    }, 250);
    return () => {
      atual = false;
      clearTimeout(id);
    };
  }, [termo]);

  function abrirCadastro() {
    const soDigitos = termo.replace(/\D/g, "");
    if (soDigitos.length >= 8) {
      setTelefone(soDigitos.slice(0, 11));
      setNome("");
      setSobrenome("");
    } else {
      // "João Paulo Silva" → nome "João", sobrenome "Paulo Silva"
      const [primeiro = "", ...resto] = termo.trim().split(/\s+/);
      setNome(primeiro);
      setSobrenome(resto.join(" "));
      setTelefone("");
    }
    setErro(null);
    setCadastrando(true);
  }

  function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const resultado = await criarCliente({ nome, sobrenome, telefone });
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setCadastrando(false);
      onSelecionar(resultado.cliente);
    });
  }

  if (cadastrando) {
    return (
      <form onSubmit={cadastrar} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente-nome">Nome</Label>
            <Input
              id="cliente-nome"
              required
              minLength={2}
              autoFocus
              autoComplete="off"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente-sobrenome">Sobrenome</Label>
            <Input
              id="cliente-sobrenome"
              required
              minLength={2}
              autoComplete="off"
              value={sobrenome}
              onChange={(e) => setSobrenome(e.target.value)}
              className="h-11"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cliente-telefone">
            Telefone <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="cliente-telefone"
            type="tel"
            placeholder="(00) 00000-0000"
            aria-describedby="cliente-telefone-ajuda"
            value={formatarTelefone(telefone)}
            onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            className="h-11"
          />
          <p id="cliente-telefone-ajuda" className="text-xs text-muted-foreground">
            Ajuda a achar a pessoa depois e a diferenciar nomes parecidos.
          </p>
        </div>
        {erro && (
          <p className="text-sm text-destructive" aria-live="polite">
            {erro}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={() => setCadastrando(false)}>
            Voltar
          </Button>
          <Button type="submit" className="h-11 flex-1" disabled={salvando || pendente}>
            {salvando ? "Cadastrando…" : `Cadastrar e ${acaoLabel.toLowerCase()}`}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          aria-label="Buscar cliente por nome ou telefone"
          placeholder="Nome ou telefone"
          autoFocus={autoFocus}
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          className="h-11 pl-9"
        />
      </div>

      {resultados !== null && (
        <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto" aria-live="polite">
          {resultados.length === 0 && !buscando && (
            <li className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
              Ninguém encontrado com &quot;{termo.trim()}&quot;.
            </li>
          )}
          {resultados.map((cliente) => (
            <li key={cliente.id}>
              <button
                type="button"
                disabled={pendente}
                onClick={() => onSelecionar(cliente)}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{cliente.nome}</span>
                  {cliente.telefone && (
                    <span className="text-xs text-muted-foreground">
                      {formatarTelefone(cliente.telefone)}
                    </span>
                  )}
                </span>
                {cliente.planoAteISO ? (
                  <Badge variant="secondary">Mensal até {formatarDataCurta(cliente.planoAteISO)}</Badge>
                ) : (
                  <span className="text-xs font-medium text-primary">{acaoLabel}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" className="h-11" onClick={abrirCadastro}>
        <UserPlus aria-hidden />
        Cadastrar cliente novo
      </Button>
    </div>
  );
}
