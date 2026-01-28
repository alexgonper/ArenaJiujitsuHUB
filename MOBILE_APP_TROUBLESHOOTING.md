# 🚨 GUIA DE TROUBLESHOOTING - Arena Mobile Apps

## Problema Atual
O app está com tela branca/carregando infinitamente no Expo Go.

## Causa Raiz Identificada
O servidor Expo está rodando corretamente em `exp://192.168.1.131:8081`, mas o Expo Go no celular não está conseguindo conectar. Isso indica um problema de **rede local** ou **cache**.

---

## ✅ SOLUÇÃO 1: Limpar Cache do Expo Go (TENTE PRIMEIRO)

### No iPhone:
1. Vá em **Ajustes** > **Geral** > **Armazenamento do iPhone**
2. Encontre **Expo Go**
3. Toque em **"Descarregar App"** ou **"Excluir App"**
4. Reinstale o Expo Go da App Store
5. Escaneie o QR Code novamente

### No Android:
1. **Pressione e segure** o ícone do Expo Go
2. Toque em **"Informações do app"**
3. Toque em **"Armazenamento"**
4. Toque em **"Limpar dados"** e **"Limpar cache"**
5. Abra o Expo Go novamente
6. Escaneie o QR Code novamente

---

## ✅ SOLUÇÃO 2: Verificar Firewall do Mac

O macOS pode estar bloqueando a porta 8081. Para permitir:

1. Vá em **Preferências do Sistema** > **Segurança e Privacidade** > **Firewall**
2. Clique no cadeado para fazer alterações
3. Clique em **"Opções do Firewall..."**
4. Procure por **"node"** ou **"expo"** na lista
5. Certifique-se que está marcado como **"Permitir conexões de entrada"**
6. Se não estiver na lista, clique em **"+"** e adicione:
   - `/usr/local/bin/node`
   - `/Users/ale/.npm/node_modules/expo-cli/bin/expo.js`

---

## ✅ SOLUÇÃO 3: Usar Túnel (não depende de Wi-Fi)

Se as opções acima não funcionarem, podemos usar um túnel ngrok que funciona pela Internet:

### Passos:
1. No terminal onde o Expo está rodando, pressione **Ctrl+C** para parar
2. Execute: `npx expo start --tunnel`
3. Aguarde aparecer um QR Code com URL `exp://xxx.ngrok.io`
4. Escaneie esse novo QR Code (funciona mesmo em 4G/5G)

---

## ✅ SOLUÇÃO 4: Instalar Xcode Completo (Simulador iOS)

Para testar sem depender do celular físico:

1. Abra a **App Store** no Mac
2. Procure por **"Xcode"** (é grátis, mas é grande ~12GB)
3. Clique em **"Obter"** e **"Instalar"**
4. Após a instalação, no terminal execute:
   ```bash
   cd /Users/ale/Documents/Antigravity/ArenaHub/arena-mobile-teacher
   npx expo start
   ```
5. Pressione a tecla **`i`** para abrir no simulador iOS

---

## 📝 CREDENCIAIS PARA TESTE

Quando o app abrir:

### App do Professor:
- Email: `prof.riodejaneiro.0@arena.com`
- Senha: (qualquer uma - validação desabilitada para testes)

### App do Aluno:
- Email: `aluno.are.0@arena.com`

---

## 🔍 DEBUG: Verificar se o Problema Persiste

Se após tentar as soluções acima o problema continuar:

1. **Verifique o Terminal do Expo**: Quando você abre o app no celular, DEVE aparecer uma linha como:
   ```
   › Opening exp://192.168.1.131:8081 on iPhone de Alexandre
   ```
   
2. **Se NÃO aparecer nada**: O problema é conexão de rede
   - Solução: Use o modo `--tunnel` (Solução 3)

3. **Se aparecer mas o app crashar**: O problema é no código
   - Eu vou depurar os erros específicos que aparecerem

---

## 🆘 SE NADA FUNCIONAR

Me envie uma captura de tela de:
1. A tela do seu celular (mostrando o erro/tela branca)
2. O terminal do Mac (mostrando os logs do Expo)

Assim posso identificar o problema exato!

---

## 📱 PRÓXIMOS PASSOS APÓS FUNCIONAR

Uma vez que o app abrir corretamente:

1. ✅ Testar Login do Professor
2. ✅ Testar Dashboard com "Próxima Aula"
3. ✅ Testar Tela de Chamada (Attendance)
4. ✅ Repetir para o App do Aluno
5. 🚀 Implementar Notificações Push
6. 🌐 Deployment na App Store/Google Play
