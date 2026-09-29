/*
 * Lula nos Trilhos · Desenvolvido por Alequizao <alequizao.dev@gmail.com>
 * https://github.com/alequizao · © 2026 Alequizao. Todos os direitos reservados.
 */
// Lula nos Trilhos — personagens (corredor caricato do Lula, segurança e cachorro)
// Modelos estilizados feitos só com primitivas do Three.js (sem arquivos externos
// nem texturas). Para economizar draw calls no celular, peças estáticas da mesma
// cor são fundidas numa geometria só (função `junta`).
//
// criaCorredor(P) — campos aceitos em P (cores em hexa numérico):
//   casaco   cor do paletó (ou do macacão, se P.macacao)
//   calca    cor da calça do terno (ou das pernas do macacão)
//   camisa/mochila  cor da camisa social (P.mochila é o nome usado nas SKINS)
//   bone     cor da gravata (ou do capacete, se P.macacao)
//   gravata  (opcional) sobrepõe a cor da gravata; quando existe, ganha listras
//   tenis    cor dos sapatos sociais (ou das botinas, se P.macacao)
//   pele     cor da pele
//   cabelo   cor do cabelo, barba, bigode e sobrancelhas
//   pasta    true → pasta executiva escura na mão esquerda
//   faixa    true → faixa presidencial verde-amarela com medalhão e franja dourada
//   macacao  true → "Lula Metalúrgico": macacão de operário, capacete, cabelo cheio
//   neon     true → detalhes brilhando (lapelas, gravata, camisa, sapatos)
// Retorna { root, corpo, tronco, cabeca, bracoE, bracoD, pernaE, pernaD, prancha, jato, chama }
// (o personagem olha para -z; bracoD/pernaD ficam em +x).
//
// criaVigia() — segurança de terno preto, óculos escuros e ponto no ouvido, com o
// cachorro caramelo. Retorna { root, corpo, pE, pD, bE, bD, cao, patas }.
import * as THREE from 'three';

// ================= AJUDANTES =================
// ================= AJUDANTES =================
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _p = new THREE.Vector3(), _s = new THREE.Vector3();

// matriz a partir de {p:[x,y,z], r:[x,y,z], s:[x,y,z]}
function matriz(t = {}) {
  _p.set(...(t.p || [0, 0, 0]));
  _q.setFromEuler(_e.set(...(t.r || [0, 0, 0])));
  _s.set(...(t.s || [1, 1, 1]));
  return _m.compose(_p, _q, _s);
}

// funde várias geometrias (cada uma com sua transformação) numa só
function junta(partes) {
  const pos = [], nor = [], uv = [];
  for (const [g0, t] of partes) {
    const g = g0.index ? g0.toNonIndexed() : g0.clone();
    g.applyMatrix4(matriz(t));
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
    if (g.attributes.uv) uv.push(...g.attributes.uv.array);
    else for (let i = 0; i < g.attributes.position.count; i++) uv.push(0, 0);
    g.dispose();
  }
  for (const [g0] of partes) g0.dispose();
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return out;
}

// cria um Mesh já posicionado e projetando sombra
function malha(geo, mat, t = {}) {
  const m = new THREE.Mesh(geo, mat);
  if (t.p) m.position.set(...t.p);
  if (t.r) m.rotation.set(...t.r);
  if (t.s) m.scale.set(...t.s);
  m.castShadow = true;
  return m;
}

// sólido de revolução; pts = [[raio, y], ...] listados de baixo pra cima
function torno(pts, seg = 20, escZ = 1) {
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  if (escZ !== 1) g.scale(1, 1, escZ);
  return g;
}

// retângulo com cantos arredondados (Shape 2D)
function retRedondo(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// extrusão com chanfro arredondado, centralizada na origem
function extruda(shape, prof, bevel, centraliza = true) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: prof, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, curveSegments: 10,
  });
  if (centraliza) g.center();
  return g;
}

// aba de boné/quepe em forma de "D"
function formaAba(larg, comp) {
  const s = new THREE.Shape();
  s.moveTo(-larg, 0);
  s.bezierCurveTo(-larg, comp * 1.3, larg, comp * 1.3, larg, 0);
  return s;
}

const tecido = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
const peleMat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0 });
const escurece = (c, k) => new THREE.Color(c).multiplyScalar(k);
const brilhoMat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9,
  blending: THREE.AdditiveBlending, depthWrite: false });

// forma 2D a partir de uma lista de pontos [x, y]
function poligono(pts) {
  const s = new THREE.Shape();
  s.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) s.lineTo(...pts[i]);
  s.closePath();
  return s;
}
// placa fina: polígono extrudado sem centralizar (origem da forma fica no lugar)
const placa = (pts, prof, bev) => extruda(poligono(pts), prof, bev, false);

// placa "colada" numa superfície: fz(x, y) dá o z da superfície; a peça fica
// encostada nela (afastada `off`) e acompanha a curva do peito/barriga
function colado(pts, prof, bev, fz, off = 0) {
  const g0 = placa(pts, prof, bev);
  const src = (g0.index ? g0.toNonIndexed() : g0).attributes.position.array;
  // quebra triângulos grandes (lado > 3 cm) pra peça conseguir dobrar na curva
  const fila = [], out = [], MAX2 = 0.03 * 0.03;
  for (let i = 0; i < src.length; i += 9) fila.push(Array.from(src.slice(i, i + 9)));
  const d2 = (t, i, j) => (t[i] - t[j]) ** 2 + (t[i + 1] - t[j + 1]) ** 2 + (t[i + 2] - t[j + 2]) ** 2;
  while (fila.length) {
    const t = fila.pop();
    const l = [d2(t, 0, 3), d2(t, 3, 6), d2(t, 6, 0)], k = l.indexOf(Math.max(...l));
    if (l[k] <= MAX2) { out.push(...t); continue; }
    const A = k * 3, B = ((k + 1) % 3) * 3, C = ((k + 2) % 3) * 3;
    const v = i => [t[i], t[i + 1], t[i + 2]];
    const m = [0, 1, 2].map(j => (t[A + j] + t[B + j]) / 2);
    fila.push([...v(A), ...m, ...v(C)], [...m, ...v(B), ...v(C)]);
  }
  g0.dispose();
  for (let i = 0; i < out.length; i += 3) out[i + 2] += fz(out[i], out[i + 1]) - off - (prof + bev);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  g.computeVertexNormals();
  return g;
}
// z da frente de um tronco feito com torno(perfil, …, ez), com barriga opcional {y, z, r, sx, sz}
function superficieFrente(perfil, ez, b) {
  return (x, y) => {
    let r = perfil[perfil.length - 1][0];
    for (let i = 1; i < perfil.length; i++) {
      const [r0, y0] = perfil[i - 1], [r1, y1] = perfil[i];
      if (y >= y0 && y <= y1) { r = r0 + (r1 - r0) * (y1 > y0 ? (y - y0) / (y1 - y0) : 0); break; }
    }
    let z = -ez * r * Math.sqrt(Math.max(0, 1 - (x / r) ** 2));
    if (b) {
      const dy = y - b.y, q = b.r * b.r - dy * dy - (x / b.sx) ** 2;
      if (q > 0) z = Math.min(z, b.z - b.sz * Math.sqrt(q));
    }
    return z;
  };
}

// estrela de 5 pontas
function estrela(rExt, rInt) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? rInt : rExt;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return poligono(pts);
}

const metal = (c, r = 0.3) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.75 });

// ================= CORREDOR (Lula) =================
export function criaCorredor(P) {
  const neon = !!P.neon, macacao = !!P.macacao;
  const corCamisa = P.camisa ?? P.mochila ?? 0xbcd3ee;
  const corGravata = P.gravata ?? P.bone;
  const root = new THREE.Group();
  const corpo = new THREE.Group(); corpo.position.y = 0.95; root.add(corpo);

  // ---- materiais ----
  const mCasaco = tecido(P.casaco, 0.82);
  const mCasacoEsc = tecido(escurece(P.casaco, 0.72), 0.85);   // lapelas, bolsos, costuras
  const mCalca = tecido(P.calca, 0.8);
  const mPele = peleMat(P.pele);
  const mPeleEsc = peleMat(escurece(P.pele, 0.82));              // rugas, pálpebras
  const mBochecha = peleMat(new THREE.Color(P.pele).lerp(new THREE.Color(0xe0786a), 0.35));
  const mCabelo = new THREE.MeshStandardMaterial({ color: P.cabelo, roughness: 1, metalness: 0,
    emissive: escurece(P.cabelo, 0.12) });
  const mSobr = tecido(escurece(P.cabelo, macacao ? 0.9 : 0.78), 0.9);
  const mCamisa = tecido(corCamisa, 0.7);
  const mGravata = tecido(corGravata, 0.5);
  const mListraGrav = tecido(new THREE.Color(corGravata).lerp(new THREE.Color(0xffffff), 0.35), 0.5);
  const mSapato = new THREE.MeshStandardMaterial({ color: P.tenis, roughness: macacao ? 0.8 : 0.28, metalness: macacao ? 0 : 0.15 });
  const mSola = tecido(macacao ? 0x2a2420 : 0x161412, 0.8);
  const mOuro = metal(0xe0b12e, 0.3);
  const mOlhoB = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const mIris = new THREE.MeshStandardMaterial({ color: 0x2e1c10, roughness: 0.25 });
  const mBrilho = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mBoca = tecido(0x5a1a18, 0.7);
  const mDente = tecido(0xfafafa, 0.4);
  if (neon) {
    const acende = (m, c, k) => { m.color.set(c); m.emissive = new THREE.Color(c); m.emissiveIntensity = k; };
    acende(mCasacoEsc, P.bone, 0.9);
    acende(mGravata, corGravata, 0.9);
    acende(mListraGrav, corCamisa, 1.0);
    acende(mCamisa, corCamisa, 0.45);
    acende(mSapato, P.tenis, 0.7);
    mCabelo.emissive = new THREE.Color(P.cabelo); mCabelo.emissiveIntensity = 0.2;
  }

  // =============== TRONCO ===============
  const tronco = new THREE.Group(); corpo.add(tronco);
  const EZ = 0.66; // achatamento frente/costas do tronco
  // paletó (ou macacão): tronco robusto, barra cobrindo o quadril
  const PERFIL = [
    [0, -0.15], [0.3, -0.15], [0.318, -0.1], [0.322, 0.05], [0.33, 0.2], [0.335, 0.38],
    [0.34, 0.55], [0.335, 0.63], [0.3, 0.7], [0.21, 0.76], [0.13, 0.79], [0, 0.8],
  ];
  const BARRIGA = { y: 0.15, z: -0.05, r: 0.25, sx: 1.14, sz: 0.8 };
  tronco.add(malha(junta([
    [torno(PERFIL, 26, EZ), {}],
    // barriguinha arredondada na frente
    [new THREE.SphereGeometry(BARRIGA.r, 22, 16), { p: [0, BARRIGA.y, BARRIGA.z], s: [BARRIGA.sx, 1.0, BARRIGA.sz] }],
    // ombreiras
    [new THREE.SphereGeometry(0.13, 14, 10), { p: [-0.31, 0.62, 0.0], s: [1.1, 0.72, 0.95] }],
    [new THREE.SphereGeometry(0.13, 14, 10), { p: [0.31, 0.62, 0.0], s: [1.1, 0.72, 0.95] }],
  ]), mCasaco));
  // superfície frontal do tronco (pra encostar os detalhes)
  const frenteZ = superficieFrente(PERFIL, EZ, BARRIGA);

  if (!macacao) {
    // ---- frente do terno: camisa em "V", colarinho, gravata, lapelas (colados no peito) ----
    const V0 = 0.36, V1 = 0.77; // ponta de baixo do "V" e altura do pescoço
    tronco.add(malha(colado([[-0.13, V1], [0.13, V1], [0, V0]], 0.004, 0.003, frenteZ, 0.001), mCamisa));
    tronco.add(malha(junta([
      [colado([[-0.115, 0.785], [-0.006, 0.72], [-0.045, 0.655], [-0.13, 0.75]], 0.005, 0.004, frenteZ, 0.012), {}],
      [colado([[0.115, 0.785], [0.006, 0.72], [0.045, 0.655], [0.13, 0.75]], 0.005, 0.004, frenteZ, 0.012), {}],
    ]), mCamisa));
    tronco.add(malha(junta([
      [colado([[-0.032, 0.735], [0.032, 0.735], [0.022, 0.672], [-0.022, 0.672]], 0.012, 0.006, frenteZ, 0.008), {}],
      [colado([[-0.021, 0.675], [0.021, 0.675], [0.047, 0.4], [0, 0.36], [-0.047, 0.4]], 0.004, 0.003, frenteZ, 0.005), {}],
    ]), mGravata));
    if (P.gravata !== undefined || neon) {
      // listras diagonais na gravata caprichada
      const lis = [];
      for (let i = 0; i < 5; i++) {
        const y = 0.645 - i * 0.055, w = 0.02 + i * 0.005;
        lis.push([colado([[-w, y - 0.012], [-w, y - 0.004], [w, y + 0.012], [w, y + 0.004]], 0.002, 0.001, frenteZ, 0.013), {}]);
      }
      tronco.add(malha(junta(lis), mListraGrav));
    }
    // lapelas
    const lapE = [[-0.135, V1 + 0.01], [-0.004, V0 - 0.02], [-0.21, 0.6], [-0.18, 0.65], [-0.21, 0.68], [-0.16, V1 + 0.02]];
    tronco.add(malha(junta([
      [colado(lapE, 0.008, 0.006, frenteZ, 0.016), {}],
      [colado(lapE.map(([x, y]) => [-x, y]), 0.008, 0.006, frenteZ, 0.016), {}],
    ]), mCasacoEsc));
    // broche dourado na lapela esquerda
    tronco.add(malha(new THREE.SphereGeometry(0.014, 10, 8), mOuro, { p: [-0.15, 0.65, frenteZ(-0.15, 0.65) - 0.036], s: [1, 1, 0.5] }));

    // botões, bolsos, lenço-bolso e a abertura do paletó
    const botao = new THREE.CylinderGeometry(0.02, 0.02, 0.012, 12);
    const detalhes = [
      [botao.clone(), { p: [0, 0.29, frenteZ(0, 0.29) - 0.006], r: [Math.PI / 2 - 0.35, 0, 0] }],
      [botao, { p: [0, 0.12, frenteZ(0, 0.12) - 0.006], r: [Math.PI / 2 + 0.1, 0, 0] }],
      [new THREE.BoxGeometry(0.15, 0.035, 0.02), { p: [-0.19, 0.02, frenteZ(-0.19, 0.02) + 0.008], r: [0, 0.55, 0] }],
      [new THREE.BoxGeometry(0.15, 0.035, 0.02), { p: [0.19, 0.02, frenteZ(0.19, 0.02) + 0.008], r: [0, -0.55, 0] }],
      [new THREE.BoxGeometry(0.11, 0.022, 0.018), { p: [0.19, 0.52, frenteZ(0.19, 0.52) + 0.004], r: [0, -0.55, 0] }],
    ];
    const pts = [[0, 0.35], [0, 0.29], [0, 0.18], [0, 0.06], [0, -0.04], [-0.03, -0.15]]
      .map(([x, y]) => new THREE.Vector3(x, y, frenteZ(x, y) - 0.003));
    detalhes.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.006, 5), {}]);
    tronco.add(malha(junta(detalhes), mCasacoEsc));
    // colarinho da camisa em volta do pescoço (atrás) + gola do paletó
    tronco.add(malha(new THREE.TorusGeometry(0.112, 0.024, 8, 22), mCamisa, { p: [0, 0.79, 0.01], r: [Math.PI / 2 - 0.1, 0, 0] }));
    tronco.add(malha(new THREE.TorusGeometry(0.135, 0.032, 8, 22, Math.PI * 1.2), mCasaco,
      { p: [0, 0.77, 0.02], r: [Math.PI / 2 - 0.25, 0, -Math.PI * 0.1] }));
  } else {
    // ---- macacão de operário: gola, zíper, bolsos com lapela, cinto, crachá ----
    tronco.add(malha(junta([
      [placa([[-0.02, 0.44], [-0.14, 0.33], [-0.1, 0.3], [-0.01, 0.37]], 0.012, 0.006), { p: [0, 0.34, -0.2], r: [0.25, 0.35, 0] }],
      [placa([[0.02, 0.44], [0.14, 0.33], [0.1, 0.3], [0.01, 0.37]], 0.012, 0.006), { p: [0, 0.34, -0.2], r: [0.25, -0.35, 0] }],
      [new THREE.TorusGeometry(0.13, 0.03, 8, 22), { p: [0, 0.775, 0.015], r: [Math.PI / 2 - 0.2, 0, 0] }],
      [new THREE.BoxGeometry(0.13, 0.13, 0.02), { p: [-0.16, 0.47, frenteZ(-0.16, 0.47) + 0.004], r: [0.1, 0.5, 0] }],
      [new THREE.BoxGeometry(0.13, 0.13, 0.02), { p: [0.16, 0.47, frenteZ(0.16, 0.47) + 0.004], r: [0.1, -0.5, 0] }],
      [new THREE.BoxGeometry(0.14, 0.045, 0.03), { p: [-0.16, 0.54, frenteZ(-0.16, 0.54) - 0.004], r: [0.1, 0.5, 0] }],
      [new THREE.BoxGeometry(0.14, 0.045, 0.03), { p: [0.16, 0.54, frenteZ(0.16, 0.54) - 0.004], r: [0.1, -0.5, 0] }],
      [torno([[0.333, -0.02], [0.338, 0.07]], 26, EZ * 1.02), {}],   // cinto de pano
    ]), mCasacoEsc));
    // zíper metálico descendo pela frente
    const pts = [0.74, 0.64, 0.52, 0.4, 0.28, 0.16, 0.05].map(y => new THREE.Vector3(0, y, frenteZ(0, y) - 0.005));
    tronco.add(malha(junta([
      [new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.008, 5), {}],
      [new THREE.BoxGeometry(0.02, 0.04, 0.012), { p: [0, 0.7, frenteZ(0, 0.7) - 0.01], r: [0.5, 0, 0] }],
      [new THREE.BoxGeometry(0.07, 0.05, 0.02), { p: [0, 0.025, frenteZ(0, 0.025) - 0.012] }],   // fivela
    ]), metal(0xc9ccd2, 0.35)));
    // crachá branco no peito
    tronco.add(malha(new THREE.BoxGeometry(0.1, 0.035, 0.008), tecido(0xf4f4f0, 0.6),
      { p: [0.16, 0.39, frenteZ(0.16, 0.39) - 0.002], r: [0.1, -0.5, 0] }));
  }

  // ---- faixa presidencial (ombro direito → quadril esquerdo) ----
  if (P.faixa) {
    const mVerde = tecido(0x009c3b, 0.6), mAmarelo = tecido(0xffd400, 0.55);
    const RF = 0.43, SZ = 0.6, INC = 0.72; // raio, achatamento e inclinação da faixa
    const cinta = new THREE.Group(); cinta.position.set(0, 0.34, -0.02); cinta.rotation.z = INC; tronco.add(cinta);
    cinta.add(malha(new THREE.CylinderGeometry(RF, RF, 0.15, 40, 1, true), mVerde, { s: [1, 1, SZ] }));
    cinta.add(malha(new THREE.CylinderGeometry(RF + 0.004, RF + 0.004, 0.055, 40, 1, true), mAmarelo, { s: [1, 1, SZ] }));
    // ponto na frente da faixa, dado o x local
    const naFaixa = (lx, dz = 0) => {
      const zc = -SZ * Math.sqrt(RF * RF - lx * lx);
      const giro = Math.atan2(lx * SZ, Math.sqrt(RF * RF - lx * lx)); // gira pra acompanhar a curva
      return { p: [lx, 0, zc - dz], ry: giro };
    };
    // medalhão com estrela no peito
    const m1 = naFaixa(0.17, 0.012);
    const medalhao = new THREE.Group(); medalhao.position.set(...m1.p); medalhao.rotation.set(0, m1.ry, -INC); cinta.add(medalhao);
    medalhao.add(malha(junta([
      [new THREE.CylinderGeometry(0.06, 0.06, 0.014, 22), { r: [Math.PI / 2, 0, 0] }],
      [new THREE.TorusGeometry(0.06, 0.008, 6, 22), {}],
    ]), mOuro));
    medalhao.add(malha(extruda(estrela(0.045, 0.019), 0.01, 0.004), mAmarelo, { p: [0, 0, -0.014] }));
    // roseta + pontas com franja dourada no quadril esquerdo
    const m2 = naFaixa(-0.3, 0.012);
    const roseta = new THREE.Group(); roseta.position.set(...m2.p); roseta.rotation.set(0, m2.ry, -INC); cinta.add(roseta);
    roseta.add(malha(new THREE.CylinderGeometry(0.085, 0.085, 0.018, 22), mVerde, { r: [Math.PI / 2, 0, 0] }));
    roseta.add(malha(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 22), mAmarelo, { p: [0, 0, -0.006], r: [Math.PI / 2, 0, 0] }));
    roseta.add(malha(new THREE.SphereGeometry(0.035, 14, 10), mOuro, { p: [0, 0, -0.018], s: [1, 1, 0.45] }));
    // pontas pendendo (verde com listra amarela) e franja
    const ponta = new THREE.Group(); ponta.position.set(0, -0.02, 0.012); roseta.add(ponta);
    ponta.add(malha(junta([
      [new THREE.BoxGeometry(0.07, 0.22, 0.012), { p: [-0.04, -0.13, 0], r: [0, 0, -0.12] }],
      [new THREE.BoxGeometry(0.07, 0.2, 0.012), { p: [0.045, -0.12, 0], r: [0, 0, 0.14] }],
    ]), mVerde));
    ponta.add(malha(junta([
      [new THREE.BoxGeometry(0.024, 0.22, 0.014), { p: [-0.04, -0.13, -0.002], r: [0, 0, -0.12] }],
      [new THREE.BoxGeometry(0.024, 0.2, 0.014), { p: [0.045, -0.12, -0.002], r: [0, 0, 0.14] }],
    ]), mAmarelo));
    const fio = new THREE.CylinderGeometry(0.006, 0.006, 0.05, 4);
    const franja = [];
    for (let i = 0; i < 7; i++) {
      franja.push([fio.clone(), { p: [-0.07 + i * 0.011 + 0.03, -0.265 + i * 0.0045, 0], r: [0, 0, -0.12] }]);
      franja.push([fio.clone(), { p: [0.015 + i * 0.011 + 0.012, -0.235 - i * 0.004, 0], r: [0, 0, 0.14] }]);
    }
    fio.dispose();
    ponta.add(malha(junta(franja), mOuro));
  }

  // =============== CABEÇA ===============
  const cabeca = new THREE.Group(); cabeca.position.y = 0.76; cabeca.scale.setScalar(1.1); tronco.add(cabeca);  // cabeção de caricatura
  const HY = 0.3; // centro do crânio
  const orelha = new THREE.SphereGeometry(0.075, 12, 10);
  cabeca.add(malha(junta([
    [new THREE.CylinderGeometry(0.105, 0.115, 0.14, 14), { p: [0, 0.04, 0.02] }],           // pescoço curto
    [new THREE.SphereGeometry(0.26, 30, 22), { p: [0, HY, 0], s: [1.08, 1.0, 0.98] }],       // crânio (rosto largo)
    [new THREE.SphereGeometry(0.2, 20, 14), { p: [0, 0.18, -0.06], s: [1.22, 0.85, 1] }],     // mandíbula larga
    [orelha.clone(), { p: [-0.292, 0.28, 0.02], s: [0.55, 1.05, 0.78], r: [0, 0.25, 0] }],
    [orelha, { p: [0.292, 0.28, 0.02], s: [0.55, 1.05, 0.78], r: [0, -0.25, 0] }],
    [new THREE.SphereGeometry(0.062, 16, 12), { p: [0, 0.262, -0.272], s: [1.12, 0.95, 0.95] }],  // nariz redondo
    [new THREE.SphereGeometry(0.032, 10, 8), { p: [-0.048, 0.24, -0.258] }],                     // asas do nariz
    [new THREE.SphereGeometry(0.032, 10, 8), { p: [0.048, 0.24, -0.258] }],
  ]), mPele));
  // bochechas coradas
  cabeca.add(malha(junta([
    [new THREE.SphereGeometry(0.05, 10, 8), { p: [-0.145, 0.25, -0.2], s: [1, 0.75, 0.6] }],
    [new THREE.SphereGeometry(0.05, 10, 8), { p: [0.145, 0.25, -0.2], s: [1, 0.75, 0.6] }],
  ]), mBochecha));
  // rugas da testa (se o capacete não cobrir)
  if (!macacao) {
    const ruga = (y, r, arco) => {
      const g = new THREE.TorusGeometry(r, 0.0055, 5, 14, arco);
      const zf = -0.255 * Math.sqrt(1 - ((y - HY) / 0.26) ** 2) - 0.001; // encosta na testa
      return [g, { p: [0, y - r, zf], r: [0, 0, Math.PI / 2 - arco / 2] }];
    };
    cabeca.add(malha(junta([ruga(0.435, 0.22, 0.55), ruga(0.465, 0.2, 0.45)]), mPeleEsc));
  }

  // ---- olhos apertadinhos de sorriso ----
  const olhoB = new THREE.SphereGeometry(0.042, 14, 10);
  cabeca.add(malha(junta([
    [olhoB.clone(), { p: [-0.095, 0.33, -0.232], s: [1.05, 0.8, 0.5] }],
    [olhoB, { p: [0.095, 0.33, -0.232], s: [1.05, 0.8, 0.5] }],
  ]), mOlhoB));
  const iris = new THREE.SphereGeometry(0.021, 12, 8);
  cabeca.add(malha(junta([
    [iris.clone(), { p: [-0.092, 0.328, -0.248], s: [1, 1, 0.45] }],
    [iris, { p: [0.092, 0.328, -0.248], s: [1, 1, 0.45] }],
  ]), mIris));
  const luz = new THREE.SphereGeometry(0.008, 6, 4);
  cabeca.add(malha(junta([
    [luz.clone(), { p: [-0.084, 0.336, -0.259] }],
    [luz, { p: [0.1, 0.336, -0.259] }],
  ]), mBrilho));
  // pálpebras superiores (meia esfera)
  const palp = new THREE.SphereGeometry(0.047, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
  cabeca.add(malha(junta([
    [palp.clone(), { p: [-0.095, 0.346, -0.228], r: [-0.1, 0, 0.12], s: [1.05, 0.7, 0.55] }],
    [palp, { p: [0.095, 0.346, -0.228], r: [-0.1, 0, -0.12], s: [1.05, 0.7, 0.55] }],
  ]), mPeleEsc));
  // sobrancelhas grisalhas e cheias
  const sob = new THREE.CapsuleGeometry(0.019, 0.07, 3, 8);
  cabeca.add(malha(junta([
    [sob.clone(), { p: [-0.1, 0.395, -0.232], r: [0.4, 0.15, Math.PI / 2 - 0.2] }],
    [sob, { p: [0.1, 0.395, -0.232], r: [0.4, -0.15, Math.PI / 2 + 0.2] }],
  ]), mSobr));

  // ---- cabelo: coroa branca dos lados e atrás, calvície no topo e entradas ----
  const cabelo = [];
  if (!macacao) {
    // tufos fofos em volta da nuca e dos lados (a = 0 é a nuca; a frente fica careca)
    const tufo = new THREE.SphereGeometry(0.075, 12, 10);
    const fileira = (n, a0, y, R, esc) => {
      for (let i = 0; i < n; i++) {
        const a = -a0 + (2 * a0) * i / (n - 1);
        cabelo.push([tufo.clone(), { p: [Math.sin(a) * R * 1.08, y, Math.cos(a) * R], r: [0, a, 0], s: esc }]);
      }
    };
    fileira(12, 1.95, HY + 0.01, 0.252, [1.05, 1.25, 0.4]);
    fileira(9, 1.6, HY + 0.115, 0.218, [1.05, 0.95, 0.4]);
    fileira(6, 1.1, HY - 0.085, 0.232, [1.05, 0.9, 0.4]);   // nuca baixa
    tufo.dispose();
  } else {
    // anos 80: cabelo escuro e cheio (o capacete cobre o topo)
    cabelo.push([new THREE.SphereGeometry(0.274, 30, 14, 0.95 - Math.PI / 2, Math.PI * 2 - 1.9, Math.PI * 0.1, Math.PI * 0.45),
      { p: [0, HY, 0.004], s: [1.08, 1.0, 1.0] }]);
  }
  // barba cheia e aparada: casca na metade de baixo + queixo + bochechas
  cabelo.push([new THREE.SphereGeometry(0.27, 34, 12, Math.PI - 0.55, Math.PI + 1.1, Math.PI * 0.59, Math.PI * 0.39),
    { p: [0, HY - 0.005, -0.004], s: [1.12, 1.05, 1.04] }]);
  cabelo.push([new THREE.SphereGeometry(0.13, 16, 12), { p: [0, 0.115, -0.165], s: [1.35, 0.95, 0.9] }]);
  cabelo.push([new THREE.SphereGeometry(0.1, 14, 10), { p: [-0.175, 0.16, -0.13], s: [0.9, 1.1, 1] }]);
  cabelo.push([new THREE.SphereGeometry(0.1, 14, 10), { p: [0.175, 0.16, -0.13], s: [0.9, 1.1, 1] }]);
  // fecho da barba perto da orelha (junta com o cabelo)
  cabelo.push([new THREE.SphereGeometry(0.075, 12, 10), { p: [-0.245, 0.2, 0.01], s: [0.55, 1.3, 1] }]);
  cabelo.push([new THREE.SphereGeometry(0.075, 12, 10), { p: [0.245, 0.2, 0.01], s: [0.55, 1.3, 1] }]);
  // bigode (duas metades caindo nos cantos)
  cabelo.push([new THREE.SphereGeometry(0.075, 18, 10), { p: [0, 0.212, -0.262], r: [0.15, 0, 0], s: [1.4, 0.42, 0.55] }]);
  cabelo.push([new THREE.SphereGeometry(0.035, 10, 8), { p: [-0.088, 0.19, -0.25], s: [1, 1.2, 0.8] }]);
  cabelo.push([new THREE.SphereGeometry(0.035, 10, 8), { p: [0.088, 0.19, -0.25], s: [1, 1.2, 0.8] }]);
  cabeca.add(malha(junta(cabelo), mCabelo));

  // ---- boca sorrindo com dentes ----
  const semi = new THREE.Shape();
  semi.moveTo(-0.06, 0); semi.lineTo(0.06, 0);
  semi.quadraticCurveTo(0.055, -0.04, 0, -0.042); semi.quadraticCurveTo(-0.055, -0.04, -0.06, 0);
  cabeca.add(malha(extruda(semi, 0.01, 0.005, false), mBoca, { p: [0, 0.183, -0.28], r: [0.25, 0, 0] }));
  cabeca.add(malha(new THREE.BoxGeometry(0.096, 0.016, 0.012), mDente, { p: [0, 0.176, -0.288], r: [0.25, 0, 0] }));

  // ---- capacete amarelo do metalúrgico ----
  if (macacao) {
    const mCapacete = new THREE.MeshStandardMaterial({ color: P.bone, roughness: 0.35, metalness: 0.05 });
    cabeca.add(malha(junta([
      [new THREE.SphereGeometry(0.295, 26, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), { p: [0, 0.4, 0.0], s: [1.07, 0.92, 1.06] }],
      [new THREE.TorusGeometry(0.305, 0.022, 6, 30), { p: [0, 0.405, 0.0], r: [Math.PI / 2, 0, 0], s: [1.07, 1.06, 1] }],   // aba em volta
      [extruda(formaAba(0.22, 0.12), 0.014, 0.01, false), { p: [0, 0.405, -0.3], r: [-Math.PI / 2 - 0.12, 0, 0] }],
      [new THREE.TorusGeometry(0.29, 0.026, 6, 24, Math.PI), { p: [0, 0.4, 0.0], r: [0, Math.PI / 2, 0], s: [1.06, 0.93, 1] }],  // crista
    ]), mCapacete));
  }

  // =============== BRAÇOS (pivô no ombro, membro pende pra -y) ===============
  const manga = torno([
    [0, -0.42], [0.086, -0.42], [0.09, -0.3], [0.098, -0.15], [0.106, -0.02], [0.1, 0.045], [0.06, 0.078], [0, 0.082],
  ], 16);
  const punho = new THREE.CylinderGeometry(0.078, 0.076, 0.06, 14);
  const barraManga = new THREE.TorusGeometry(0.087, 0.01, 5, 16);
  const mao = junta([
    [new THREE.SphereGeometry(0.075, 14, 10), { p: [0, -0.54, -0.005], s: [0.8, 1.1, 0.95] }],
    [new THREE.CapsuleGeometry(0.022, 0.04, 3, 6), { p: [0, -0.51, -0.06], r: [0.5, 0, 0] }],  // polegar
  ]);
  const braco = x => {
    const piv = new THREE.Group(); piv.position.set(x, 0.66, 0);
    piv.add(malha(manga, mCasaco));
    piv.add(malha(barraManga, mCasacoEsc, { p: [0, -0.405, 0], r: [Math.PI / 2, 0, 0] }));
    piv.add(malha(punho, macacao ? mCasacoEsc : mCamisa, { p: [0, -0.44, 0] }));
    piv.add(malha(mao, mPele));
    tronco.add(piv); return piv;
  };
  const bracoE = braco(-0.42), bracoD = braco(0.42);

  // ---- pasta de documentos na mão esquerda ----
  if (P.pasta) {
    const mCouro = new THREE.MeshStandardMaterial({ color: 0x2b1d15, roughness: 0.5, metalness: 0.05 });
    const pasta = new THREE.Group(); pasta.position.set(0, -0.6, -0.02); bracoE.add(pasta);
    pasta.add(malha(extruda(retRedondo(0.4, 0.28, 0.03), 0.07, 0.012), mCouro, { p: [0, -0.2, 0], r: [0, Math.PI / 2, 0] }));
    pasta.add(malha(junta([
      [new THREE.TorusGeometry(0.05, 0.012, 6, 14, Math.PI), { p: [0, -0.05, 0], r: [0, Math.PI / 2, 0] }],   // alça
      [new THREE.BoxGeometry(0.086, 0.012, 0.36), { p: [0, -0.075, 0] }],                                    // borda
    ]), tecido(0x1a120d, 0.6)));
    pasta.add(malha(junta([
      [new THREE.BoxGeometry(0.09, 0.03, 0.04), { p: [0, -0.11, -0.12] }],
      [new THREE.BoxGeometry(0.09, 0.03, 0.04), { p: [0, -0.11, 0.12] }],
    ]), mOuro));
  }

  // =============== PERNAS (pivô no quadril) ===============
  const calca = torno([
    [0, -0.8], [0.118, -0.8], [0.124, -0.7], [0.12, -0.5], [0.13, -0.2], [0.145, 0], [0.12, 0.07], [0, 0.08],
  ], 16);
  const vinco = new THREE.CapsuleGeometry(0.006, 0.6, 2, 4);
  const sapato = macacao ? junta([
    [new THREE.CylinderGeometry(0.125, 0.13, 0.16, 16), { p: [0, -0.8, 0] }],                         // cano da botina
    [new THREE.SphereGeometry(0.13, 18, 12), { p: [0, -0.86, -0.06], s: [0.95, 0.65, 1.55] }],
  ]) : junta([
    [new THREE.SphereGeometry(0.12, 18, 12), { p: [0, -0.86, -0.065], s: [0.92, 0.55, 1.65] }],
    [new THREE.CylinderGeometry(0.11, 0.115, 0.07, 16), { p: [0, -0.84, 0.03] }],                     // calcanhar
  ]);
  const sola = junta([
    [new THREE.CylinderGeometry(0.125, 0.12, 0.04, 20), { p: [0, -0.905, -0.065], s: [0.95, 1, 1.68] }],
    [new THREE.BoxGeometry(0.2, 0.03, 0.09), { p: [0, -0.9, 0.06] }],   // salto
  ]);
  const cadarco = new THREE.CapsuleGeometry(0.008, 0.06, 2, 4);
  const lacos = junta([
    [cadarco.clone(), { p: [0, -0.8, -0.13], r: [0.9, 0, Math.PI / 2] }],
    [cadarco, { p: [0, -0.815, -0.165], r: [1.05, 0, Math.PI / 2] }],
  ]);
  const perna = x => {
    const piv = new THREE.Group(); piv.position.set(x, 0, 0);
    piv.add(malha(calca, mCalca));
    if (!macacao) piv.add(malha(vinco, mCasacoEsc, { p: [0, -0.42, -0.122], r: [-0.03, 0, 0] }));
    piv.add(malha(sapato, mSapato));
    piv.add(malha(sola, mSola));
    piv.add(malha(lacos, mSola));
    corpo.add(piv); return piv;
  };
  const pernaE = perna(-0.17), pernaD = perna(0.17);

  // ---- prancha flutuante e jato (iguais ao original) ----
  const prancha = new THREE.Group();
  const mPrancha = new THREE.MeshStandardMaterial({ color: 0x19c2ff, roughness: 0.35, metalness: 0.2,
    emissive: 0x0a4a66, emissiveIntensity: 0.6 });
  prancha.add(malha(extruda(retRedondo(0.72, 1.7, 0.34), 0.04, 0.03), mPrancha, { p: [0, 0.12, 0], r: [-Math.PI / 2, 0, 0] }));
  const mFaixa = new THREE.MeshStandardMaterial({ color: 0xff3d7f, roughness: 0.5, emissive: 0xff3d7f, emissiveIntensity: 0.35 });
  prancha.add(malha(extruda(retRedondo(0.16, 1.3, 0.08), 0.006, 0.006), mFaixa, { p: [0, 0.178, 0], r: [-Math.PI / 2, 0, 0] }));
  const brilhoPrancha = malha(new THREE.ShapeGeometry(retRedondo(0.86, 1.86, 0.4), 12), brilhoMat(0x6ff0ff),
    { p: [0, 0.05, 0], r: [-Math.PI / 2, 0, 0] });
  brilhoPrancha.material.opacity = 0.55;
  prancha.add(brilhoPrancha);
  prancha.visible = false; root.add(prancha);

  // ---- jato nas costas ----
  const jato = new THREE.Group(); jato.position.set(0, 0.35, 0.45);
  const tanque = new THREE.CapsuleGeometry(0.1, 0.36, 6, 16);
  jato.add(malha(junta([
    [tanque.clone(), { p: [-0.15, 0, 0.12] }],
    [tanque, { p: [0.15, 0, 0.12] }],
  ]), new THREE.MeshStandardMaterial({ color: 0xe8364f, roughness: 0.35, metalness: 0.45 })));
  const anel = new THREE.TorusGeometry(0.103, 0.018, 6, 18);
  const bocal = new THREE.CylinderGeometry(0.06, 0.085, 0.11, 16, 1, true);
  const valvula = new THREE.CylinderGeometry(0.025, 0.025, 0.07, 8);
  const partesMetal = [];
  for (const x of [-0.15, 0.15]) {
    partesMetal.push([anel.clone(), { p: [x, 0.12, 0.12], r: [Math.PI / 2, 0, 0] }]);
    partesMetal.push([anel.clone(), { p: [x, -0.12, 0.12], r: [Math.PI / 2, 0, 0] }]);
    partesMetal.push([bocal.clone(), { p: [x, -0.33, 0.12] }]);
    partesMetal.push([valvula.clone(), { p: [x, 0.3, 0.12] }]);
  }
  partesMetal.push([new THREE.CapsuleGeometry(0.03, 0.22, 3, 8), { p: [0, 0.12, 0.12], r: [0, 0, Math.PI / 2] }]);  // ponte
  partesMetal.push([new THREE.CapsuleGeometry(0.022, 0.3, 3, 8), { p: [0, -0.12, 0.03], r: [0, 0, Math.PI / 2] }]); // alça que prende
  [anel, bocal, valvula].forEach(g => g.dispose());
  jato.add(malha(junta(partesMetal), new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 0.45, metalness: 0.6 })));
  // chama: cone externo laranja + núcleo claro; a da direita é filha da da esquerda (escala junto)
  const cone = (r, h) => { const g = new THREE.ConeGeometry(r, h, 14, 1, true); g.rotateX(Math.PI); g.translate(0, -h / 2, 0); return g; };
  const gChama = cone(0.075, 0.6), gNucleo = cone(0.04, 0.34);
  const mChama = brilhoMat(0xff8a1a), mNucleo = brilhoMat(0xfff2b0);
  const chama = malha(gChama, mChama, { p: [-0.15, -0.385, 0.12] });
  chama.add(malha(gNucleo, mNucleo));
  const chamaD = malha(gChama, mChama, { p: [0.3, 0, 0] });
  chamaD.add(malha(gNucleo, mNucleo));
  chama.add(chamaD);
  jato.add(chama);
  jato.visible = false; tronco.add(jato);

  return { root, corpo, tronco, cabeca, bracoE, bracoD, pernaE, pernaD, prancha, jato, chama };
}

// ================= SEGURANÇA + CACHORRO =================
export function criaVigia() {
  const root = new THREE.Group();
  const corpo = new THREE.Group(); corpo.position.y = 1.05; root.add(corpo);

  const terno = tecido(0x1b1c22, 0.75);
  const ternoEsc = tecido(0x0c0c10, 0.7);
  const camisa = tecido(0xf2f4f6, 0.65);
  const pele = peleMat(0xc98d68);
  const preto = new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.25, metalness: 0.2 });
  const lente = new THREE.MeshStandardMaterial({ color: 0x08090c, roughness: 0.08, metalness: 0.9 });
  const pelo = new THREE.MeshStandardMaterial({ color: 0x241a14, roughness: 1, flatShading: true });
  const fone = new THREE.MeshStandardMaterial({ color: 0xcfe0ea, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85 });

  // ---- tronco de armário: paletó preto ----
  const EZ = 0.72;
  const PERFIL = [
    [0, -0.14], [0.33, -0.14], [0.35, 0.08], [0.37, 0.35], [0.4, 0.62], [0.395, 0.76], [0.3, 0.87], [0.15, 0.93], [0, 0.94],
  ];
  corpo.add(malha(junta([
    [torno(PERFIL, 24, EZ), {}],
    [new THREE.SphereGeometry(0.15, 14, 10), { p: [-0.36, 0.75, 0], s: [1.1, 0.7, 0.95] }],
    [new THREE.SphereGeometry(0.15, 14, 10), { p: [0.36, 0.75, 0], s: [1.1, 0.7, 0.95] }],
  ]), terno));
  // frente: camisa branca, gravata preta, lapelas (coladas no peito)
  const fz = superficieFrente(PERFIL, EZ);
  const V0 = 0.4, V1 = 0.9;
  corpo.add(malha(colado([[-0.15, V1], [0.15, V1], [0, V0]], 0.004, 0.003, fz, 0.001), camisa));
  corpo.add(malha(junta([
    [colado([[-0.036, 0.87], [0.036, 0.87], [0.025, 0.8], [-0.025, 0.8]], 0.012, 0.006, fz, 0.008), {}],
    [colado([[-0.024, 0.805], [0.024, 0.805], [0.05, 0.45], [0, 0.4], [-0.05, 0.45]], 0.004, 0.003, fz, 0.005), {}],
  ]), ternoEsc));
  const lapE = [[-0.155, V1 + 0.01], [-0.004, V0 - 0.02], [-0.25, 0.7], [-0.215, 0.76], [-0.25, 0.79], [-0.19, V1 + 0.02]];
  corpo.add(malha(junta([
    [colado(lapE, 0.008, 0.006, fz, 0.016), {}],
    [colado(lapE.map(([x, y]) => [-x, y]), 0.008, 0.006, fz, 0.016), {}],
  ]), ternoEsc));
  // botões + colarinho atrás
  const bot = new THREE.CylinderGeometry(0.022, 0.022, 0.012, 12);
  corpo.add(malha(junta([
    [bot.clone(), { p: [0, 0.33, fz(0, 0.33) - 0.004], r: [Math.PI / 2 - 0.1, 0, 0] }],
    [bot, { p: [0, 0.17, fz(0, 0.17) - 0.004], r: [Math.PI / 2 - 0.05, 0, 0] }],
    [new THREE.BoxGeometry(0.16, 0.035, 0.02), { p: [-0.22, 0.1, -0.2], r: [0, 0.6, 0] }],
    [new THREE.BoxGeometry(0.16, 0.035, 0.02), { p: [0.22, 0.1, -0.2], r: [0, -0.6, 0] }],
  ]), ternoEsc));
  corpo.add(malha(new THREE.TorusGeometry(0.13, 0.026, 8, 22), camisa, { p: [0, 0.94, 0.01], r: [Math.PI / 2 - 0.1, 0, 0] }));

  // ---- cabeça: cabelo raspado, óculos escuros, cara séria ----
  const orelha = new THREE.SphereGeometry(0.065, 10, 8);
  corpo.add(malha(junta([
    [new THREE.CylinderGeometry(0.13, 0.14, 0.18, 14), { p: [0, 0.98, 0] }],
    [new THREE.SphereGeometry(0.27, 26, 18), { p: [0, 1.17, 0], s: [1, 1.08, 0.98] }],
    [new THREE.SphereGeometry(0.19, 16, 12), { p: [0, 1.06, -0.07], s: [1.12, 0.78, 1] }],       // queixo quadrado
    [orelha.clone(), { p: [-0.265, 1.15, 0.01], s: [0.5, 1, 0.8] }],
    [orelha, { p: [0.265, 1.15, 0.01], s: [0.5, 1, 0.8] }],
    [new THREE.SphereGeometry(0.048, 10, 8), { p: [0, 1.13, -0.27], s: [0.9, 1.05, 1] }],
  ]), pele));
  corpo.add(malha(junta([
    [new THREE.SphereGeometry(0.278, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.34), { p: [0, 1.17, 0.01], s: [1, 1.08, 0.99] }],
    [new THREE.CapsuleGeometry(0.018, 0.08, 3, 6), { p: [-0.1, 1.26, -0.245], r: [0.3, 0, Math.PI / 2 + 0.12] }],
    [new THREE.CapsuleGeometry(0.018, 0.08, 3, 6), { p: [0.1, 1.26, -0.245], r: [0.3, 0, Math.PI / 2 - 0.12] }],
  ]), pelo));
  // óculos escuros: lentes + ponte + hastes
  const lenteG = extruda(retRedondo(0.12, 0.07, 0.028), 0.012, 0.006);
  corpo.add(malha(junta([
    [lenteG.clone(), { p: [-0.075, 1.205, -0.262], r: [0, 0.18, 0] }],
    [lenteG, { p: [0.075, 1.205, -0.262], r: [0, -0.18, 0] }],
  ]), lente));
  corpo.add(malha(junta([
    [new THREE.BoxGeometry(0.05, 0.014, 0.014), { p: [0, 1.225, -0.272] }],
    [new THREE.BoxGeometry(0.012, 0.014, 0.16), { p: [-0.19, 1.215, -0.2], r: [0, -0.72, 0] }],
    [new THREE.BoxGeometry(0.012, 0.014, 0.16), { p: [0.19, 1.215, -0.2], r: [0, 0.72, 0] }],
    [new THREE.BoxGeometry(0.012, 0.014, 0.17), { p: [-0.262, 1.215, -0.065], r: [0, -0.22, 0] }],
    [new THREE.BoxGeometry(0.012, 0.014, 0.17), { p: [0.262, 1.215, -0.065], r: [0, 0.22, 0] }],
    [new THREE.CapsuleGeometry(0.009, 0.08, 2, 4), { p: [0, 1.04, -0.262], r: [0, 0, Math.PI / 2] }],   // boca séria
  ]), preto));
  // ponto no ouvido direito com fio espiral descendo pro colarinho
  const espiral = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, a = t * Math.PI * 14;
    espiral.push(new THREE.Vector3(0.28 + Math.cos(a) * 0.012 - t * 0.05, 1.12 - t * 0.2, 0.05 + Math.sin(a) * 0.012 + t * 0.07));
  }
  corpo.add(malha(junta([
    [new THREE.TubeGeometry(new THREE.CatmullRomCurve3(espiral), 120, 0.005, 4), {}],
    [new THREE.SphereGeometry(0.022, 8, 6), { p: [0.27, 1.14, 0.0] }],
  ]), fone));

  // ---- pernas: calça preta + sapato social ----
  const gCalca = new THREE.CapsuleGeometry(0.145, 0.62, 4, 14);
  const gSapato = junta([
    [new THREE.SphereGeometry(0.14, 16, 10), { p: [0, -0.965, -0.06], s: [0.95, 0.55, 1.5] }],
    [new THREE.CylinderGeometry(0.145, 0.14, 0.04, 18), { p: [0, -1.03, -0.06], s: [0.95, 1, 1.55] }],
  ]);
  const perna = x => {
    const p = new THREE.Group(); p.position.set(x, 0, 0);
    p.add(malha(gCalca, terno, { p: [0, -0.42, 0] }));
    p.add(malha(gSapato, preto));
    corpo.add(p); return p;
  };
  const pE = perna(-0.19), pD = perna(0.19);

  // ---- braços: ombro → cotovelo dobrado → antebraço, punho branco, mão ----
  // (pivô no ombro; o antebraço já vem dobrado pra frente, pose de quem corre)
  const gBraco = new THREE.CapsuleGeometry(0.12, 0.2, 4, 14);
  const gAnte = new THREE.CapsuleGeometry(0.105, 0.2, 4, 14);
  const gCotovelo = new THREE.SphereGeometry(0.113, 14, 10);
  const gPunho = new THREE.CylinderGeometry(0.088, 0.088, 0.06, 12);
  const gMao = new THREE.SphereGeometry(0.095, 12, 10);
  const braco = x => {
    const p = new THREE.Group(); p.position.set(x, 0.76, 0);
    const abre = new THREE.Group(); abre.rotation.z = Math.sign(x) * 0.1; p.add(abre); // leve afastamento do corpo
    abre.add(malha(gBraco, terno, { p: [0, -0.17, 0] }));
    abre.add(malha(gCotovelo, terno, { p: [0, -0.34, 0] }));
    const ante = new THREE.Group(); ante.position.y = -0.34; ante.rotation.x = 0.85; abre.add(ante);
    ante.add(malha(gAnte, terno, { p: [0, -0.15, 0] }));
    ante.add(malha(gPunho, camisa, { p: [0, -0.3, 0] }));
    ante.add(malha(gMao, pele, { p: [0, -0.39, 0], s: [0.9, 1.1, 1] }));
    corpo.add(p); p.ante = ante; return p;
  };
  const bE = braco(-0.47), bD = braco(0.47);

  // ---- cachorro caramelo ----
  const cao = new THREE.Group(); cao.position.set(1.0, 0, 0.3);
  const caramelo = tecido(0xc98a45, 0.9), creme = tecido(0xf0d2a0, 0.9), marrom = tecido(0x8e5526, 0.9);
  cao.add(malha(junta([
    [new THREE.CapsuleGeometry(0.19, 0.42, 6, 16), { p: [0, 0.6, 0.02], r: [Math.PI / 2, 0, 0] }],   // corpo
    [new THREE.SphereGeometry(0.14, 14, 10), { p: [0, 0.74, -0.3] }],                                   // pescoço
    [new THREE.SphereGeometry(0.17, 18, 14), { p: [0, 0.88, -0.44], s: [1, 0.95, 1.05] }],             // cabeça
    [new THREE.CapsuleGeometry(0.038, 0.26, 4, 8), { p: [0, 0.83, 0.47], r: [0.75, 0, 0] }],           // rabo
  ]), caramelo));
  cao.add(malha(junta([
    [new THREE.SphereGeometry(0.095, 14, 10), { p: [0, 0.8, -0.6], s: [0.9, 0.78, 1.35] }],            // focinho
    [new THREE.SphereGeometry(0.13, 14, 10), { p: [0, 0.55, -0.26], s: [0.95, 1, 0.8] }],             // peito
  ]), creme));
  const gOrelha = new THREE.SphereGeometry(0.08, 10, 8);
  cao.add(malha(junta([
    [gOrelha.clone(), { p: [-0.13, 0.99, -0.42], r: [0, 0, 0.45], s: [0.45, 1.2, 0.9] }],
    [gOrelha, { p: [0.13, 0.99, -0.42], r: [0, 0, -0.45], s: [0.45, 1.2, 0.9] }],
  ]), marrom));
  const gOlhoCao = new THREE.SphereGeometry(0.03, 10, 8);
  cao.add(malha(junta([
    [new THREE.SphereGeometry(0.038, 10, 8), { p: [0, 0.83, -0.72], s: [1.2, 0.9, 1] }],               // nariz
    [gOlhoCao.clone(), { p: [-0.075, 0.93, -0.57] }],
    [gOlhoCao, { p: [0.075, 0.93, -0.57] }],
  ]), new THREE.MeshStandardMaterial({ color: 0x14100d, roughness: 0.3 })));
  cao.add(malha(new THREE.SphereGeometry(0.04, 10, 6), tecido(0xe86a7a, 0.5), { p: [0.02, 0.73, -0.62], s: [0.8, 0.3, 1.4], r: [0.4, 0, 0] })); // língua
  cao.add(malha(new THREE.TorusGeometry(0.13, 0.028, 8, 20), tecido(0xd42a2a, 0.6), { p: [0, 0.76, -0.33], r: [Math.PI / 2 - 0.6, 0, 0] })); // coleira
  // patas: pivô no topo, perna pende pra baixo
  const gPata = new THREE.CapsuleGeometry(0.055, 0.32, 4, 10);
  const gPe = new THREE.SphereGeometry(0.066, 10, 8);
  const patas = [[-0.11, -0.22], [0.11, -0.22], [-0.11, 0.26], [0.11, 0.26]].map(([x, z]) => {
    const piv = new THREE.Group(); piv.position.set(x, 0.48, z);
    piv.add(malha(gPata, caramelo, { p: [0, -0.21, 0] }));
    piv.add(malha(gPe, creme, { p: [0, -0.445, -0.02], s: [1, 0.55, 1.3] }));
    cao.add(piv); return piv;
  });
  root.add(cao);

  return { root, corpo, pE, pD, bE, bD, cao, patas };
}
