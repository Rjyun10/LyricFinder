# 🎵 LyricFinder

> Um web application moderno e responsivo para busca de letras de músicas, exploração detalhada de discografias e gerenciamento de músicas favoritas conectado ao Supabase.

---

## 🚀 Sobre o Projeto

O **LyricFinder** foi desenvolvido com foco em performance, design limpo (Dark Mode nativo) e experiência de usuário fluida. Ele permite que entusiastas da música explorem catálogos completos de artistas ou busquem por faixas específicas utilizando a **iTunes Search API** e obtenham letras completas através da **Lyrics.ovh API**.

Além disso, conta com um sistema de autenticação seguro via **Supabase**, onde usuários cadastrados podem salvar suas músicas favoritas em uma área exclusiva protegida por Row Level Security (RLS).

---

## ✨ Funcionalidades Principais

- 🔍 **Busca Dupla Estilizada (Artista vs. Música):** Alternância dinâmica por botões personalizados em CSS para explorar discografias inteiras ou faixas específicas sem conflitos visuais.
- ♾️ **Paginação Inteligente & Deduplicação:** Carregamento progressivo de resultados com tratamento robusto para catálogos extensos (como BTS) e ocultação automática do botão ao esgotar as faixas.
- 🪄 **Inspiração & História da Composição:** Seção dedicada nos detalhes de cada música para análise e contexto criativo da obra.
- 🔐 **Autenticação Segura (Supabase Auth):** Gestão de contas com limpeza automática de credenciais ao sair e prevenção contra sessões fantasmas no reload da página.
- 🗂️ **Minhas Músicas Salvas:** Área exclusiva para usuários autenticados gerenciarem e visualizarem suas músicas favoritas gravadas no banco de dados.
- 🛡️ **Privacidade & LGPD:** Termos e políticas de privacidade detalhados em modal dedicado.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 / CSS3** (Com variáveis customizadas e design responsivo)
- **Bootstrap 5.3** (Dark theme nativo)
- **JavaScript Moderno (ES6+)**
- **Supabase JS SDK v2** (Autenticação e Banco de Dados PostgreSQL)
- **iTunes Search API & Lyrics.ovh API** (Fontes de dados externos)

---

## 📂 Estrutura de Arquivos

O projeto está modularizado da seguinte forma:

```text
lyric-finder/
├── index.html       # Estrutura principal da aplicação e modais
├── style.css        # Estilização customizada, temas e animações
├── script.js        # Lógica de consumo de APIs, modais e integração com Supabase
└── favicon.svg      # Ícone vetorial do site