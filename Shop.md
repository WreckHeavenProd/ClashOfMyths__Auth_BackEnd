# **Document de Spécifications Logicielles (SRS)**

## **Module Boutique & Registre Légal (Ledger) \- Projet Unity Shop**

### **1\. Présentation du Module**

Ce module gère l'économie du jeu "Server-Side". Il est responsable de la validation des reçus de paiement (IAP), de la gestion de la monnaie virtuelle (Hard Currency) et de la persistance de l'historique complet des transactions pour la conformité légale, l'audit et le support client.

### **2\. Modèle de Données (Schéma Prisma)**

Le schéma se concentre sur la traçabilité immuable des flux financiers et des changements d'état.

// Extension du modèle User et ajout des tables Shop  
model User {  
  id           String        @id @default(uuid())  
  // ... champs auth existants ...  
  transactions Transaction\[\]  
  balance      Int           @default(0) // Hard Currency (Gemmes, etc.)  
}

model Transaction {  
  id              String               @id @default(uuid())  
  userId          String  
  user            User                 @relation(fields: \[userId\], references: \[id\])  
    
  // Détails du Store  
  store           StoreType            // APPLE, GOOGLE  
  storeOrderId    String               @unique // ID unique fourni par Apple/Google  
  productId       String               // ID technique (ex: com.game.gems\_pack\_10)  
    
  // Détails Financiers  
  price           Float  
  currency        String               // ex: "EUR", "USD"  
  purchaseDate    DateTime             @default(now())  
    
  // État actuel  
  status          TransactionStatus    @default(PENDING)  
  rawReceipt      String?              @db.Text   
    
  // Historique des changements  
  logs            TransactionStatusLog\[\]  
}

model TransactionStatusLog {  
  id            String            @id @default(uuid())  
  transactionId String  
  transaction   Transaction       @relation(fields: \[transactionId\], references: \[id\])  
    
  fromStatus    TransactionStatus?   
  toStatus      TransactionStatus  
  changedAt     DateTime          @default(now())  
  reason        String?           // ex: "Webhook Google: Refunded", "Manual Override"  
}

enum StoreType {  
  APPLE  
  GOOGLE  
}

enum TransactionStatus {  
  PENDING  
  SUCCESS  
  FAILED  
  REFUNDED  
}

### **3\. Architecture de Validation & Suivi**

#### **3.1. Flux de Confiance**

1. **Réception :** Le client Unity envoie le receipt et le productId.  
2. **Création Initiale :** Une Transaction est créée en état PENDING avec un premier log dans TransactionStatusLog.  
3. **Validation Externe :** Appel aux API Google/Apple.  
4. **Transition d'État :** \- Si valide : Passage à SUCCESS. Un log est ajouté. La balance du User est incrémentée.  
   * Si invalide : Passage à FAILED. Un log est ajouté avec le motif de l'erreur.

#### **3.2. Gestion des Remboursements (Refunds)**

Le système doit écouter les **Webhooks (Server-to-Server Notifications)** des stores :

1. Le store envoie une notification de remboursement.  
2. Le backend identifie la Transaction via le storeOrderId.  
3. Le statut passe de SUCCESS à REFUNDED.  
4. Un log est créé indiquant la source (ex: "Apple Server Notification").  
5. **Action correctrice :** Le backend ajuste la balance de l'utilisateur (si possible) ou marque le compte pour revue manuelle.

### **4\. Spécifications des API (Endpoints)**

| Méthode | Point de terminaison | Description |
| :---- | :---- | :---- |
| GET | /shop/products | Liste les produits actifs. |
| POST | /shop/verify-purchase | Valide un reçu et déclenche la livraison. |
| GET | /shop/my-transactions | Historique des achats avec leurs statuts actuels. |
| GET | /shop/transactions/:id/history | Détails des changements de statut pour une transaction spécifique. |

### **5\. Sécurité et Audit**

* **Immuabilité :** Une ligne dans TransactionStatusLog ne doit jamais être modifiée ou supprimée. C'est la trace légale de "quand" et "pourquoi" l'argent/le statut a bougé.  
* **Idempotence :** Le système vérifie l'existence du storeOrderId avant toute action pour éviter de créditer deux fois un utilisateur pour le même achat.  
* **Traçabilité des Remboursements :** Le passage à l'état REFUNDED déclenche une alerte automatique si la balance de l'utilisateur devient négative.

### **6\. Intégrations Externes (Configuration)**

* **GOOGLE\_SERVICE\_ACCOUNT\_JSON :** Pour la validation et l'écoute des webhooks Google Play.  
* **APPLE\_STORE\_KIT\_KEY :** Pour l'App Store Server API (V2) et les notifications de transaction.

### **7\. Conservation des Données**

* Toutes les transactions et leurs logs de statut sont conservés indéfiniment pour répondre aux obligations de reporting financier et aux demandes de support liées aux remboursements.