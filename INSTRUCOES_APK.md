# Instruções para Gerar APK do Aplicativo SAM CLIMATIZA

Este guia explica como gerar o APK do aplicativo SAM CLIMATIZA, que poderá ser instalado em dispositivos Android.

## Passos para Gerar o APK

### 1. Preparação (Já realizado)
- ✓ Build da aplicação concluído
- ✓ Capacitor configurado
- ✓ Permissões do Android configuradas
- ✓ Configuração para funcionar sem servidor externo

### 2. Processo no seu Computador

#### 2.1 Download do Projeto
1. Baixe o código completo deste projeto do Replit para seu computador local
2. Descompacte o arquivo se necessário

#### 2.2 Instalação do Android Studio
1. Baixe e instale o [Android Studio](https://developer.android.com/studio)
2. Durante a instalação, certifique-se de que o "Android SDK" seja instalado
3. Aceite as licenças quando solicitado

#### 2.3 Compilação do APK
1. Abra o Android Studio
2. Selecione "Open an Existing Project"
3. Navegue até a pasta `android` dentro do projeto baixado e selecione-a
4. Aguarde o Android Studio importar e sincronizar o projeto (pode levar alguns minutos)
5. Quando a sincronização terminar, selecione "Build" -> "Build Bundle(s) / APK(s)" -> "Build APK(s)"
6. O Android Studio mostrará uma notificação quando o APK estiver pronto. Clique em "locate" para encontrar o arquivo

O APK gerado estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

#### 2.4 Para criar um APK de produção assinado (opcional)
1. No Android Studio, vá para "Build" -> "Generate Signed Bundle / APK"
2. Selecione "APK"
3. Crie uma nova keystore ou use uma existente
4. Preencha as informações solicitadas (nome, senha, etc.)
5. Clique em "Next" e selecione "release" como variante de build
6. Clique em "Finish" e aguarde a compilação

## 3. Instalação em Dispositivos

### 3.1 Instalação via arquivo APK
1. Transfira o arquivo APK para o dispositivo Android (por email, cabo USB, etc.)
2. No dispositivo, localize o arquivo e toque nele
3. Permita a instalação de fontes desconhecidas se solicitado
4. Siga as instruções na tela para concluir a instalação

### 3.2 Funcionamento offline
O aplicativo foi configurado para funcionar sem depender de um servidor externo. O arquivo `capacitor.config.ts` foi ajustado para usar o modo `bundledWebRuntime: true`.

## 4. Observações Importantes

- Se você planeja distribuir o aplicativo, lembre-se de personalizar o ícone e outras imagens de marca
- O APK assinado é necessário para publicação na Google Play Store
- Para publicar na Google Play Store, você precisará seguir os passos adicionais descritos na [documentação do Google](https://developer.android.com/studio/publish)

## 5. Solução de Problemas Comuns

### 5.1 "SDK Location not found"
- Vá para File -> Settings -> Appearance & Behavior -> System Settings -> Android SDK
- Defina o caminho correto para o SDK

### 5.2 Erro de compilação
- Verifique se tem o JDK instalado (Java Development Kit)
- Certifique-se de que está usando uma versão compatível do Android Studio

### 5.3 Problemas de permissão
- Verifique se o AndroidManifest.xml contém todas as permissões necessárias

## 6. Recursos Adicionais

- [Documentação do Capacitor](https://capacitorjs.com/docs)
- [Guia de Publicação do Android](https://developer.android.com/studio/publish)
- [Documentação do React](https://reactjs.org/docs/getting-started.html)