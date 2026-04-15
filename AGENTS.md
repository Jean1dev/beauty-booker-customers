# BeautyBook Customers — Guia para Agentes de IA

> Leia este arquivo **antes de qualquer tarefa** de desenvolvimento.
> Ele define as regras obrigatórias do projeto e evita erros de compatibilidade multiplataforma.

---

## Visão geral do projeto

Aplicativo para clientes das profissionais que usam o BeautyBook.
Desenvolvido com **React Native + Expo Router**, roda em **três plataformas a partir de uma única base de código**:

| Plataforma | Saída | Como rodar |
|---|---|---|
| Android | `.apk` / `.aab` | `npx expo start --android` |
| iOS | `.ipa` | `npx expo start --ios` |
| Web | SPA estática + PWA | `npx expo start --web` |

Stack principal: **Expo SDK 54 · Expo Router 6 · React Native 0.81 · React 19 · TypeScript 5.9**

---

## Regra fundamental

> **Tudo que você desenvolver deve funcionar igualmente em Web, Android e iOS.**
> Nunca use APIs exclusivas de uma plataforma diretamente nas telas ou componentes.
> Se uma funcionalidade se comporta diferente por plataforma, use a camada de abstração descrita abaixo.

---

## Estrutura de pastas

```
app/                    → rotas (Expo Router — não criar arquivos de navegação manual)
  (tabs)/               → abas principais
  _layout.tsx           → layout raiz
components/             → componentes reutilizáveis (100% multiplataforma)
services/               → chamadas de API, autenticação, integrações
store/                  → estado global
platform/               → ÚNICO lugar para código específico de plataforma
  alert.native.ts       → implementação mobile
  alert.web.ts          → implementação web
  storage.native.ts
  storage.web.ts
  share.native.ts
  share.web.ts
hooks/                  → hooks customizados
constants/              → cores, tamanhos, textos fixos
assets/                 → imagens, fontes, ícones
```

---

## Camada de abstração de plataforma (`platform/`)

Quando uma funcionalidade se comporta diferente por plataforma, **nunca escreva `Platform.OS === 'web'` dentro de uma tela ou componente**. Em vez disso, crie os arquivos na pasta `platform/` com os sufixos corretos. O Metro Bundler resolve automaticamente qual arquivo usar.

### Exemplos obrigatórios

#### Alertas
```ts
// platform/alert.native.ts
import { Alert } from 'react-native';
export const showAlert = (title: string, message: string) =>
  Alert.alert(title, message);

// platform/alert.web.ts
export const showAlert = (title: string, message: string) =>
  window.alert(`${title}\n\n${message}`);
  // OU melhor: usar um componente de modal customizado no web
```

**Uso nas telas (nunca use Alert diretamente):**
```ts
import { showAlert } from '@/platform/alert';
showAlert('Agendamento', 'Horário confirmado!');
```

#### Storage local
```ts
// platform/storage.native.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
export const storage = AsyncStorage;

// platform/storage.web.ts
export const storage = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};
```

#### Compartilhamento
```ts
// platform/share.native.ts
import { Share } from 'react-native';
export const shareContent = (message: string) => Share.share({ message });

// platform/share.web.ts
export const shareContent = async (message: string) => {
  if (navigator.share) await navigator.share({ text: message });
  else await navigator.clipboard.writeText(message);
};
```

---

## APIs que NÃO existem na web — sempre abstrair

| API React Native | Problema na web | Solução |
|---|---|---|
| `Alert.alert()` | Não existe | `platform/alert.ts` |
| `AsyncStorage` | Não existe | `platform/storage.ts` |
| `Share` | API diferente | `platform/share.ts` |
| `Vibration` | Não existe | `platform/haptics.ts` (expo-haptics) |
| `Linking.openURL` | Funciona mas diferente | `platform/linking.ts` |
| `expo-haptics` | Não funciona na web | Verificar com `Platform.OS` dentro do próprio módulo |

---

## Regras de estilização

- Sempre use `StyleSheet.create()` ou `StyleSheet` inline — **nunca CSS strings**
- Para responsividade, use `useWindowDimensions()` — **nunca `window.innerWidth`**
- Unidades de medida: use **números puros** (sem `px`, `rem`, `%` exceto quando necessário)
- Para layouts complexos, prefira **Flexbox** (funciona igual nas 3 plataformas)
- Sombras: use `elevation` para Android e `shadowColor/shadowOffset/shadowOpacity/shadowRadius` para iOS/web juntos

```ts
// ✅ Correto
shadow: {
  elevation: 4,                // Android
  shadowColor: '#000',         // iOS + Web
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
},

// ❌ Errado
boxShadow: '0 2px 4px rgba(0,0,0,0.15)',  // só funciona na web
```

---

## Navegação

Use sempre **Expo Router** (baseado em arquivos). Nunca crie navegadores manualmente com `createStackNavigator` ou similares.

```ts
// ✅ Navegar
import { router } from 'expo-router';
router.push('/agendamento/123');
router.back();

// ✅ Link declarativo
import { Link } from 'expo-router';
<Link href="/perfil">Ver perfil</Link>

// ❌ Nunca usar
navigation.navigate('Perfil');   // API do React Navigation direta
```

---

## Imagens e assets

```ts
// ✅ Use expo-image (otimizado para todas as plataformas)
import { Image } from 'expo-image';
<Image source={{ uri: url }} style={{ width: 80, height: 80 }} />

// ⚠️ Se usar Image do react-native, funciona nas 3 plataformas mas sem otimização web
```

---

## Firebase

### SDK utilizado

Este projeto usa o **Firebase JS SDK** (`firebase`) — não o `@react-native-firebase`.

Isso significa um único código para as três plataformas. Nunca instale ou sugira `@react-native-firebase`.

```bash
# ✅ Correto
npm install firebase

# ❌ Nunca usar neste projeto
npm install @react-native-firebase
```

### Estrutura do projeto no console Firebase

O projeto tem **um único projeto Firebase** com três apps registrados:

| App registrado | Arquivo gerado | Onde vai no projeto |
|---|---|---|
| Web (`</>`) | objeto `firebaseConfig` | copiado para `.env` |
| Android | `google-services.json` | raiz do projeto |
| iOS | `GoogleService-Info.plist` | raiz do projeto |

> Os arquivos `google-services.json` e `GoogleService-Info.plist` são necessários apenas para builds nativos (EAS Build) e notificações push. Para Auth, Firestore e Storage via JS SDK, apenas o `firebaseConfig` da web é utilizado.

### Inicialização — `services/firebase.ts`

Este é o único arquivo de configuração Firebase do projeto. Nunca inicialize o Firebase em outro lugar.

```ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Única diferença por plataforma: onde a sessão do usuário é persistida
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? browserLocalPersistence       // web → localStorage
    : getReactNativePersistence(AsyncStorage), // mobile → AsyncStorage
});

export const db      = getFirestore(app);
export const storage = getStorage(app);
```

### Variáveis de ambiente

O Expo exige o prefixo `EXPO_PUBLIC_` para expor variáveis ao cliente.

```bash
# .env  (nunca subir para o repositório — adicionar no .gitignore)
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seuapp.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seuapp
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seuapp.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123...
```

### Regras de uso

- Sempre importe `auth`, `db` e `storage` de `@/services/firebase` — nunca chame `initializeApp` em outro arquivo
- Nunca use `getAuth()` sem argumento — use sempre o `auth` exportado de `services/firebase.ts`
- Um usuário autenticado na web e no mobile compartilha a mesma conta (mesmo projeto Firebase)

---

## Instalação de dependências

```bash
# ✅ Sempre use para pacotes do ecossistema Expo/React Native
npx expo install nome-do-pacote

# ✅ Ok para pacotes puramente JavaScript (sem código nativo)
npm install zod
npm install date-fns
```

> Nunca use `npm install` para pacotes nativos — pode instalar versão incompatível com o SDK 54.

---

## Verificação de plataforma (uso restrito)

Use `Platform.OS` **apenas dentro da pasta `platform/`** ou em casos muito pontuais de ajuste visual (não de funcionalidade).

```ts
import { Platform } from 'react-native';

// ✅ Uso aceitável: ajuste visual pontual
const paddingTop = Platform.OS === 'ios' ? 44 : 24;

// ❌ Uso inaceitável: lógica de negócio dentro de tela
if (Platform.OS === 'web') {
  window.alert('mensagem');  // extrair para platform/alert.ts
}
```

---

## Checklist antes de entregar qualquer código

- [ ] Usou alguma API que não existe na web? → mover para `platform/`
- [ ] Usou `Alert.alert()` diretamente? → usar `showAlert` de `platform/alert`
- [ ] Usou `window`, `document` ou qualquer API do browser? → abstrair
- [ ] Usou `npm install` para pacote nativo? → trocar por `npx expo install`
- [ ] Usou CSS string como estilo? → trocar por `StyleSheet`
- [ ] Criou navegador manualmente? → usar Expo Router
- [ ] Usou `@react-native-firebase`? → usar Firebase JS SDK (`firebase`)
- [ ] Inicializou Firebase fora de `services/firebase.ts`? → centralizar
- [ ] Usou `getAuth()` sem argumento? → importar `auth` de `services/firebase`
- [ ] Adicionou chave Firebase no código? → mover para `.env` com prefixo `EXPO_PUBLIC_`
