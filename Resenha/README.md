# Resenha

Chat, voz e compartilhamento de tela com os amigos, no navegador e sem criar conta. A pessoa coloca o nome, cria
um grupo e manda o link. Quem abrir o link entra direto.

- **Servidor** (`server.js`, só uma dependência): entrega o site, repassa o chat e apresenta os PCs uns aos outros.
  Não salva nada: os grupos e as mensagens ficam só na memória.
- **Voz e tela** vão direto de um PC para o outro (WebRTC P2P) e não passam pelo servidor. Funciona bem com
  até 5 ou 6 pessoas na mesma chamada.

## Rodar no seu PC

```powershell
npm install
npm start          # http://localhost:3000
```

Para testar sozinho, abra duas abas, uma delas anônima.

## Colocar online de graça (Render)

1. Crie um repositório no GitHub e envie esta pasta (o `node_modules` fica de fora).
2. Em [render.com](https://render.com), entre com o GitHub, clique em **New → Blueprint** e escolha o repositório.
   O `render.yaml` já configura tudo. Deixe as variáveis TURN em branco.
3. Quando terminar, você recebe um endereço como `https://resenha-xxxx.onrender.com`. É esse link que você manda
   para os amigos.

No plano grátis, o servidor dorme depois de 15 minutos sem ninguém. O primeiro a abrir espera uns 30 a 60 segundos
para ele acordar.

## Se algum amigo não conectar na voz

O chat funciona, mas a voz fica em "Conectando…" ou em "Falha na conexão". Isso acontece em algumas redes, como
rede de empresa e 4G de algumas operadoras, que bloqueiam a conexão direta. A solução é um relay TURN:

1. Crie uma conta grátis em [metered.ca/stun-turn](https://www.metered.ca/stun-turn). O plano grátis dá 20 GB por mês.
2. No Render, em **Environment**, preencha `TURN_URL` (pode ter mais de um endereço separado por vírgula),
   `TURN_USER` e `TURN_PASS`.

## Limites

- Compartilhar tela funciona no Chrome, no Edge e no Firefox do computador. O som do PC só vai junto no Chrome
  ou no Edge: marque "Compartilhar áudio" na janela que o navegador abre.
- O nome não tem dono: dois amigos podem entrar com o mesmo nome.
- As mensagens não ficam salvas. Quem chegar depois não vê o que foi dito antes.
