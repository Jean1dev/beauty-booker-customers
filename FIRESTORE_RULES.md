# Firestore Security Rules — Guest Mode

Este documento descreve a **única alteração necessária** nas Firestore Security Rules
para suportar o modo guest (Apple Guideline 5.1.1).

## Contexto

O app agora permite que usuários não autenticados visualizem profissionais na tela
inicial. A collection `user-preferences` contém os perfis públicos das profissionais
e precisa ser legível sem autenticação.

## Problema nas regras atuais

A regra atual usa `resource.data.userLink != null` para tentar permitir leitura pública:

```js
match /user-preferences/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId ||
                 resource.data.userLink != null;  // ⚠️ não funciona para collection queries
}
```

Isso **não é suficiente** para collection queries de clients não autenticados.
O Firestore exige que a regra seja verificável sem acessar os dados do documento,
e `resource.data` não satisfaz esse requisito em queries sem filtro.

Além disso, existe um segundo bloco duplicado para a mesma collection
(adicionado anteriormente como sugestão deste arquivo) que é redundante:

```js
match /user-preferences/{docId} {
  allow read: if request.auth != null;  // redundante — pode ser removido
}
```

## Alteração necessária

**Apenas o bloco `user-preferences` precisa ser atualizado.** Todas as outras
collections permanecem inalteradas.

### Antes

```js
match /user-preferences/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId ||
                 resource.data.userLink != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}

// Remover este bloco duplicado:
match /user-preferences/{docId} {
  allow read: if request.auth != null;
}
```

### Depois

```js
match /user-preferences/{userId} {
  allow read: if true;   // perfis públicos de profissionais — leitura aberta
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

## Regras completas recomendadas (sem alterar nada mais)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ✅ ALTERADO: leitura aberta para guests
    match /user-preferences/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // ── Sem alteração nas demais ──────────────────────────────────────────────

    match /availability/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /user_services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /appointments/{appointmentId} {
      allow read: if resource.data.userId != null;
      allow create: if request.resource.data.userId != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    match /googleCalendarIntegrations/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /excludedDays/{excludedDayId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    match /customers/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /appointments/{id} {
      allow read: if request.auth != null
        && resource.data.clientPhone ==
          get(/databases/$(database)/documents/customers/$(request.auth.uid)).data.phone;
    }

    match /customer_favorites/{docId} {
      allow read, write: if request.auth != null
        && resource.data.customerId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.customerId == request.auth.uid;
    }
  }
}
```

## Resumo do impacto

| Collection            | Guest (sem auth) | Autenticado |
|-----------------------|-----------------|-------------|
| `user-preferences`    | ✅ Leitura livre | ✅ Leitura + escrita própria |
| `customer_favorites`  | ❌ Bloqueado     | ✅ Próprio usuário |
| `customers`           | ❌ Bloqueado     | ✅ Próprio usuário |
| `appointments`        | ❌ Bloqueado     | ✅ Por telefone vinculado |
| `availability`        | ✅ Leitura livre | ✅ Escrita própria |
| `user_services`       | ✅ Leitura livre | ✅ Escrita própria |
