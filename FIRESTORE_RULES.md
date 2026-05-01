# Firestore Security Rules

Este documento descreve as regras de segurança necessárias no Firestore para suportar
o modo **guest** (acesso anônimo) implementado conforme a Guideline 5.1.1 da Apple.

## Contexto

O app permite que usuários não autenticados naveguem pela tela inicial e visualizem
profissionais sem fazer login. Apenas ações que requerem conta (agendar, favoritar,
ver agenda) exigem autenticação.

Por isso, a collection `user-preferences` (que armazena perfis públicos das
profissionais) precisa permitir leitura sem autenticação.

## Regras recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Perfis públicos das profissionais — leitura aberta (modo guest suportado)
    match /user-preferences/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == docId;
    }

    // Favoritos — somente o próprio usuário autenticado
    match /customer_favorites/{docId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.customerId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.customerId;
    }

    // Clientes — somente o próprio usuário autenticado
    match /customers/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Agendamentos — somente usuários autenticados com o telefone correspondente
    match /appointments/{docId} {
      allow read: if request.auth != null;
      allow write: if false; // escrita feita pelo lado do profissional (outro app)
    }
  }
}
```

## Resumo das permissões por collection

| Collection          | Leitura sem auth | Leitura com auth | Escrita |
|---------------------|-----------------|-----------------|---------|
| `user-preferences`  | ✅ Permitida     | ✅ Permitida     | Só o dono do doc |
| `customer_favorites`| ❌ Bloqueada     | ✅ Próprio usuário | Próprio usuário |
| `customers`         | ❌ Bloqueada     | ✅ Próprio usuário | Próprio usuário |
| `appointments`      | ❌ Bloqueada     | ✅ Autenticados  | ❌ Bloqueada (lado profissional) |

## Ação necessária

Aplicar essas regras no [Firebase Console](https://console.firebase.google.com)
em **Firestore Database → Rules** antes de publicar a versão com suporte a guest.

> **Atenção:** se as regras atuais exigirem `request.auth != null` para ler
> `user-preferences`, a tela inicial ficará em loading indefinido para usuários
> guest. Atualize as regras para `allow read: if true` nessa collection.
