# 🇧🇷 Lula nos Trilhos — jogo de corrida infinita 3D no navegador

[![Jogar agora](https://img.shields.io/badge/▶_Jogar_agora-alequizao.com%2Flula-e8364f?style=for-the-badge)](https://alequizao.com/lula/)
![Versão](https://img.shields.io/badge/versão-1.0.2-2f6bff?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-r170-000?style=for-the-badge&logo=three.js)
![PWA](https://img.shields.io/badge/PWA-offline-1fc46b?style=for-the-badge)

**Lula nos Trilhos** é uma paródia bem-humorada em forma de jogo de corrida infinita (*endless runner*) 3D, no estilo Subway Surfers, que roda direto no navegador do celular ou do computador — sem instalar, sem cadastro e de graça. O Lula, de terno azul-marinho, gravata vinho e faixa presidencial, corre pelos trilhos, desvia dos trens, pega moedas e poderes e foge do segurança.

👉 **Jogue em: [alequizao.com/lula](https://alequizao.com/lula/)**

<p align="center"><img src="docs/img/00-preview.jpg" width="720" alt="Lula nos Trilhos"></p>

> Paródia de humor, sem fins políticos. Não é afiliado ao Governo Federal.

## 📸 Telas do jogo

| Menu | Corrida |
|:---:|:---:|
| <img src="docs/img/prod-menu.jpg" width="300"> | <img src="docs/img/jogo-11-corrida.jpg" width="300"> |
| **Ímã de moedas** | **Pulo** |
| <img src="docs/img/jogo-05-ima.jpg" width="300"> | <img src="docs/img/jogo-03-pulo.jpg" width="300"> |

<details>
<summary><b>Mais telas</b> (jatinho, prancha, segurança, loja, missões, desktop)</summary>

| Jatinho | Prancha |
|:---:|:---:|
| <img src="docs/img/jogo-05-jato.jpg" width="300"> | <img src="docs/img/jogo-07-prancha.jpg" width="300"> |
| **Tropeço** | **Segurança na cola** |
| <img src="docs/img/jogo-02-tropeco.jpg" width="300"> | <img src="docs/img/jogo-10-seguranca.jpg" width="300"> |
| **Loja** | **Missões** |
| <img src="docs/img/jogo-13-loja.jpg" width="300"> | <img src="docs/img/jogo-12-missoes.jpg" width="300"> |

<img src="docs/img/jogo-01-menu-1366.jpg" width="720" alt="Versão desktop">
</details>

## 🎮 Como jogar

| Ação | Celular | Teclado |
|---|---|---|
| Trocar de trilho | deslizar para os lados | ← → / A D |
| Pular | deslizar para cima | ↑ / W / Espaço |
| Rolar (no ar: descer rápido) | deslizar para baixo | ↓ / S |
| Usar prancha (aguenta uma batida) | toque duplo | B / Shift |
| Pausar | botão ❚❚ | Esc / P |

## ✨ Recursos

- **Personagem Lula em 3D:** cabelo e barba brancos, terno azul-marinho, camisa azul clara, gravata vinho e faixa presidencial.
- **Visuais na loja:** Lula, Lula Debate, Lula Metalúrgico, Lula Presidente e Lula Neon.
- **Poderes:** Ímã de Moedas, Jatinho, Tênis Mola e Picanha 2x — com níveis na loja.
- **Obstáculos:** trens parados e na contramão, barreiras, placas para rolar, rampas para correr em cima dos vagões.
- **Segurança** na perseguição quando você tropeça.
- **Missões** com multiplicador de pontos permanente.
- **Som e trilha** sintetizados com WebAudio.
- **PWA:** instala como app e funciona offline.
- **Qualidade adaptativa** para aparelhos mais fracos.

## 🛠️ Tecnologia

- [Three.js](https://threejs.org/) r170 (WebGL), sem build — ES modules puros.
- Texturas desenhadas por código (canvas).
- Service worker com cache versionado.

| Arquivo | O que faz |
|---|---|
| `index.html` | telas, HUD, sprite de ícones SVG, SEO |
| `jogo.js` | regras, física, pista, cenário, câmera, loja, missões, áudio |
| `personagens.js` | Lula e segurança |
| `objetos.js` | trens, rampa e obstáculos |
| `itens.js` | moedas e poderes |
| `icones.js` | helper dos ícones SVG |
| `estilo.css` | interface |
| `sw.js` / `manifest.webmanifest` | PWA offline |

### Rodar localmente

```bash
git clone https://github.com/alequizao/lula-nos-trilhos.git
cd lula-nos-trilhos
python3 -m http.server 8080
# abra http://localhost:8080
```

> A cada publicação, suba a versão (`?v=`) em `index.html`, nos `import` dos módulos, em `sw.js` (`VERSAO` e lista) e em `jogo.js`.

Veja também: [Surf nos Trilhos](https://github.com/alequizao/surf-nos-trilhos), o jogo original.

## 👨‍💻 Desenvolvedor

Jogo desenvolvido por **Alequizao**.

- **E-mail:** alequizao.dev@gmail.com
- **GitHub:** [@alequizao](https://github.com/alequizao)
- **Site:** [alequizao.com](https://alequizao.com/)

Quer um jogo ou sistema como este? Entre em contato.

---

© 2026 Alequizao · Todos os direitos reservados. Paródia de humor, sem fins políticos e sem relação com o Governo Federal, Subway Surfers ou SYBO.
Uso, cópia ou redistribuição somente com autorização. Three.js é distribuído sob a licença MIT pelos seus autores.
