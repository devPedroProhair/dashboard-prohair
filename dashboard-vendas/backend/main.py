from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from datetime import datetime, timedelta
import calendar
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── SEGURANÇA: LOGIN ────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    usuario: str
    senha: str

USUARIOS_AUTORIZADOS = {
    "admin":    os.getenv("SENHA_ADMIN",    "senha_invalida"),
    "vendas":   os.getenv("SENHA_VENDAS",   "senha_invalida"),
    "diretoria":os.getenv("SENHA_DIRETORIA","senha_invalida"),
}

@app.post("/api/login")
def login(dados: LoginRequest):
    senha_correta = USUARIOS_AUTORIZADOS.get(dados.usuario)
    if senha_correta and senha_correta == dados.senha:
        return {"auth": True, "token": "sessao_ativa_prohair_2026"}
    return {"auth": False}


# ─── CONFIGURAÇÕES ────────────────────────────────────────────────────────────
# Abas de vendas — chave no formato "MM/YYYY"
TABELAS_GIDS = {
    "04/2026": "1639507081",
    "03/2026": "440786248",
    "02/2026": "336354424",
    "01/2026": "437005109",
    "12/2025": "694628997",
}

# ──────────────────────────────────────────────────────────────────────────────
# ABA DE METAS FIXAS
# A supervisora gerencia esta aba na mesma planilha.
# Estrutura esperada das colunas:
#   Vendedora  |  Mes_Ano  |  Meta_Fixa
#   Maria Clara|  03/2026  |  15000
#   Livia      |  03/2026  |  12000
#   ...
#
# Defina o GID desta aba no arquivo .env:  GID_METAS=<número>
# ──────────────────────────────────────────────────────────────────────────────
GID_METAS = os.getenv("GID_METAS")

ID_PLANILHA = os.getenv("ID_PLANILHA")

ID_METAS = os.getenv("ID_METAS")

# Lista de vendedoras ativas (apenas para garantir a ordem do ranking)
VENDEDORAS = ["Maria Clara", "Livia", "Jenifer", "Stephany", "Marina"]

DIAS_SEMANA_PT = {0:"Seg", 1:"Ter", 2:"Qua", 3:"Qui", 4:"Sex", 5:"Sáb", 6:"Dom"}


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def tratar_data_input(data_str: str):
    if not data_str:
        return None
    try:
        if "-" in data_str:
            return datetime.strptime(data_str, "%Y-%m-%d")
        return datetime.strptime(data_str, "%d/%m/%Y")
    except Exception:
        return None


def calcular_datas(periodo: str, data_inicio: str = None, data_fim: str = None):
    hoje = datetime.now() - timedelta(hours=3)

    if periodo == "personalizado" and data_inicio and data_fim:
        d_ini = tratar_data_input(data_inicio)
        d_fim = tratar_data_input(data_fim)
        if d_ini and d_fim:
            return (
                d_ini.replace(hour=0,  minute=0,  second=0),
                d_fim.replace(hour=23, minute=59, second=59),
            )

    if periodo == "semana":
        dias_para_domingo = (hoje.weekday() + 1) % 7
        inicio = hoje - timedelta(days=dias_para_domingo)
        fim    = inicio + timedelta(days=6)
        return (
            inicio.replace(hour=0,  minute=0,  second=0),
            fim.replace(  hour=23, minute=59, second=59),
        )

    if periodo == "mes":
        ultimo_dia = calendar.monthrange(hoje.year, hoje.month)[1]
        return (
            hoje.replace(day=1,          hour=0,  minute=0,  second=0),
            hoje.replace(day=ultimo_dia, hour=23, minute=59, second=59),
        )

    if periodo == "mes_passado":
        primeiro_dia_mes_atual    = hoje.replace(day=1)
        ultimo_dia_mes_passado    = primeiro_dia_mes_atual - timedelta(days=1)
        primeiro_dia_mes_passado  = ultimo_dia_mes_passado.replace(day=1)
        return (
            primeiro_dia_mes_passado.replace(hour=0,  minute=0,  second=0),
            ultimo_dia_mes_passado.replace(  hour=23, minute=59, second=59),
        )

    # Fallback: hoje
    return (
        hoje.replace(hour=0,  minute=0,  second=0),
        hoje.replace(hour=23, minute=59, second=59),
    )


def periodo_abrange_multiplos_meses(dt_inicio: datetime, dt_fim: datetime) -> bool:
    """Retorna True se início e fim estão em meses/anos diferentes."""
    return (dt_inicio.year, dt_inicio.month) != (dt_fim.year, dt_fim.month)


# ─── METAS FIXAS ─────────────────────────────────────────────────────────────

def carregar_metas_fixas(mes_ano: str) -> dict[str, float]:
    """
    Lê a aba de metas da planilha e retorna um dicionário:
        { "Nome Vendedora": meta_fixa_float, ... }

    Se o GID não estiver configurado ou ocorrer erro na leitura,
    retorna um dicionário vazio (todas as metas serão zero).
    """
    if not GID_METAS or not ID_METAS:
        print("AVISO: GID_METAS ou ID_PLANILHA não configurados. Metas serão zero.")
        return {}

    url = (
        f"https://docs.google.com/spreadsheets/d/{ID_METAS}"
        f"/export?format=csv&gid={GID_METAS}"
    )

    try:
        df_metas = pd.read_csv(url, sep=",", encoding="utf-8")

        df_metas.columns = df_metas.columns.str.strip()

        df_metas["Mes_Ano"] = df_metas["Mes_Ano"].astype(str).str.strip()

        print("Mes buscado:", mes_ano)
        print("Disponíveis:", df_metas["Mes_Ano"].unique())

        df_mes = df_metas[df_metas["Mes_Ano"] == mes_ano]

        metas = {}
        for _, row in df_mes.iterrows():
            vendedora = str(row["Vendedora"]).strip()
            try:
                # Aceita tanto ponto quanto vírgula como separador decimal
                valor_str = (
                    str(row["Meta_Fixa"])
                    .replace("R$", "").replace(" ", "")
                    .replace(".", "").replace(",", ".")
                )
                metas[vendedora] = float(valor_str)
            except (ValueError, TypeError):
                metas[vendedora] = 0.0

        return metas

    except Exception as e:
        print(f"Erro ao carregar metas fixas para {mes_ano}: {e}")
        return {}


# ─── CARREGAMENTO DE VENDAS ───────────────────────────────────────────────────

def carregar_dataframe(dt_inicio: datetime, dt_fim: datetime) -> pd.DataFrame:
    meses_necessarios = []
    atual = dt_inicio.replace(day=1)
    while atual <= dt_fim:
        meses_necessarios.append(atual.strftime("%m/%Y"))
        proximo_mes = atual.month % 12 + 1
        proximo_ano = atual.year + (atual.month // 12)
        atual = atual.replace(month=proximo_mes, year=proximo_ano)

    dfs = []
    for mes_ano in meses_necessarios:
        gid = TABELAS_GIDS.get(mes_ano)
        if gid:
            url = (
                f"https://docs.google.com/spreadsheets/d/{ID_PLANILHA}"
                f"/export?format=csv&gid={gid}"
            )
            try:
                temp_df = pd.read_csv(url, skiprows=1)
                dfs.append(temp_df)
            except Exception as e:
                print(f"Erro ao carregar aba {mes_ano}: {e}")

    if not dfs:
        raise ValueError("Nenhuma aba correspondente encontrada para o período solicitado.")

    df = pd.concat(dfs, ignore_index=True)
    df = df[df["Data"].astype(str).str.contains(r"\d", na=False)]
    df = df[df["Data"] != "SUBTOTAL"]
    df["Data"] = pd.to_datetime(
        df["Data"].astype(str).str.strip(), format="%d/%m/%Y", errors="coerce"
    )
    df = df.dropna(subset=["Data"])
    return df


def filtrar_periodo(df: pd.DataFrame, dt_inicio: datetime, dt_fim: datetime) -> pd.DataFrame:
    inicio = pd.Timestamp(dt_inicio).normalize()
    fim    = pd.Timestamp(dt_fim).normalize()
    return df[
        (df["Data"].dt.normalize() >= inicio) &
        (df["Data"].dt.normalize() <= fim)
    ]


def extrair_total_vendedora(df: pd.DataFrame, nome: str) -> float:
    coluna = next((c for c in df.columns if nome in str(c)), None)
    if coluna is None:
        return 0.0
    valores = (
        df[coluna]
        .astype(str)
        .str.replace(r"[R\$\s\.]", "", regex=True)
        .str.replace(",", ".", regex=False)
    )
    return float(pd.to_numeric(valores, errors="coerce").fillna(0).sum())


def calcular_historico_semana(
    df: pd.DataFrame, dt_inicio: datetime, dt_fim: datetime
) -> list:
    data_limite_inicio = dt_fim - timedelta(days=6)
    df_sete_dias = df[
        (df["Data"].dt.normalize() >= pd.Timestamp(data_limite_inicio).normalize()) &
        (df["Data"].dt.normalize() <= pd.Timestamp(dt_fim).normalize())
    ]

    historico = {}
    for nome in VENDEDORAS:
        coluna = next((c for c in df_sete_dias.columns if nome in str(c)), None)
        if coluna is None:
            continue

        valores = pd.to_numeric(
            df_sete_dias[coluna]
            .astype(str)
            .str.replace(r"[R\$\s\.]", "", regex=True)
            .str.replace(",", ".", regex=False),
            errors="coerce",
        ).fillna(0)

        temp = df_sete_dias.copy()
        temp["_val"] = valores.values
        agrupado = temp.groupby(temp["Data"].dt.date)["_val"].sum()

        for data, valor in agrupado.items():
            historico[data] = historico.get(data, 0.0) + float(valor)

    resultado = []
    for data in sorted(historico.keys()):
        dia_semana = DIAS_SEMANA_PT.get(data.weekday(), str(data))
        resultado.append({
            "dia":   dia_semana,
            "data":  data.strftime("%d/%m"),
            "valor": round(historico[data], 2),
        })
    return resultado


# ─── ENDPOINT PRINCIPAL ───────────────────────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard_data(
    periodo: str = "mes",
    data_inicio: str = None,
    data_fim: str = None,
):
    dt_inicio, dt_fim = calcular_datas(periodo, data_inicio, data_fim)

    # ── Detecta se o filtro abrange múltiplos meses ──────────────────────────
    multiplos_meses = periodo_abrange_multiplos_meses(dt_inicio, dt_fim)

    # ── Determina o mês de referência para buscar as metas ──────────────────
    # (válido somente quando o período é de um único mês)
    mes_ano_referencia = dt_inicio.strftime("%m/%Y")

    # ── Carrega metas fixas (zeradas se múltiplos meses) ────────────────────
    if multiplos_meses:
        metas_fixas: dict[str, float] = {}
    else:
        metas_fixas = carregar_metas_fixas(mes_ano_referencia)

    # ── Carrega e filtra dados de vendas ─────────────────────────────────────
    try:
        df          = carregar_dataframe(dt_inicio, dt_fim)
        df_filtrado = filtrar_periodo(df, dt_inicio, dt_fim)
    except Exception as e:
        print(f"Erro ao carregar dados: {e}")
        return {
            "faturamento_geral": 0,
            "meta_empresa":      0,
            "melhor_vendedora":  "-",
            "metas_zeradas":     multiplos_meses,
            "ranking":           [],
            "historico_semana":  [],
            "periodo": {
                "inicio": dt_inicio.strftime("%d/%m/%Y"),
                "fim":    dt_fim.strftime("%d/%m/%Y"),
            },
        }

    # ── Ranking ───────────────────────────────────────────────────────────────
    ranking          = []
    faturamento_total = 0.0
    meta_total        = 0.0

    for nome in VENDEDORAS:
        total = extrair_total_vendedora(df_filtrado, nome)

        # Meta fixa do mês — zero se vendedora não estiver na planilha de metas
        # ou se o filtro abranger múltiplos meses
        meta_individual = metas_fixas.get(nome, 0.0)

        percentual = (total / meta_individual * 100) if meta_individual > 0 else 0.0

        faturamento_total += total
        meta_total        += meta_individual

        ranking.append({
            "nome":       nome,
            "total":      round(total, 2),
            "meta":       round(meta_individual, 2),
            "percentual": round(percentual, 1),
        })

    ranking.sort(key=lambda x: x["total"], reverse=True)

    # ── Histórico semanal ─────────────────────────────────────────────────────
    historico_semana = calcular_historico_semana(df, dt_inicio, dt_fim)

    return {
        "faturamento_geral": round(faturamento_total, 2),
        "meta_empresa":      round(meta_total, 2),
        "melhor_vendedora":  ranking[0]["nome"] if ranking else "-",
        "metas_zeradas":     multiplos_meses,   # ← novo campo
        "ranking":           ranking,
        "historico_semana":  historico_semana,
        "periodo": {
            "inicio": dt_inicio.strftime("%d/%m/%Y"),
            "fim":    dt_fim.strftime("%d/%m/%Y"),
        },
    }


# ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}