generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "postgresql"
url      = env("DATABASE_URL")
}

//////////////////////////////////////////////////////
// ENUMS
//////////////////////////////////////////////////////

enum Role {
ADMIN
STAFF
}

enum PaymentMethod {
WHATSAPP
COD
ONLINE
}

enum PaymentStatus {
PENDING
PAID
FAILED
}

enum OrderStatus {
PLACED
CONFIRMED
SHIPPED
DELIVERED
CANCELLED
}

//////////////////////////////////////////////////////
// USER (ADMIN / STAFF)
//////////////////////////////////////////////////////

model User {
id        String   @id @default(uuid())
name      String
email     String   @unique
password  String
role      Role     @default(ADMIN)

createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

//////////////////////////////////////////////////////
// CUSTOMER (END USERS)
//////////////////////////////////////////////////////

model Customer {
id        String   @id @default(uuid())
name      String
phone     String
email     String?
address   String?

orders    Order[]

createdAt DateTime @default(now())
}

//////////////////////////////////////////////////////
// CATEGORY
//////////////////////////////////////////////////////

model Category {
id        String   @id @default(uuid())
name      String
slug      String   @unique

products  Product[]

createdAt DateTime @default(now())
}

//////////////////////////////////////////////////////
// PRODUCT
//////////////////////////////////////////////////////

model Product {
id               String   @id @default(uuid())
name             String
description      String?
price            Float
discountedPrice  Float?
images           String[] // array of image URLs
stock            Int      @default(0)
isActive         Boolean  @default(true)

categoryId       String
category         Category @relation(fields: [categoryId], references: [id])

orderItems       OrderItem[]

createdAt        DateTime @default(now())
updatedAt        DateTime @updatedAt
}

//////////////////////////////////////////////////////
// CART (OPTIONAL SIMPLE STRUCTURE)
//////////////////////////////////////////////////////

model Cart {
id         String   @id @default(uuid())
customerId String?
items      Json     // flexible cart items

createdAt  DateTime @default(now())
updatedAt  DateTime @updatedAt
}

//////////////////////////////////////////////////////
// ORDER
//////////////////////////////////////////////////////

model Order {
id              String         @id @default(uuid())

customerId      String?
customer        Customer?      @relation(fields: [customerId], references: [id])

customerName    String
customerPhone   String
customerAddress String

items           OrderItem[]

totalAmount     Float

paymentMethod   PaymentMethod
paymentStatus   PaymentStatus @default(PENDING)
orderStatus     OrderStatus   @default(PLACED)

metadata        Json?         // for WhatsApp/custom data

createdAt       DateTime      @default(now())
updatedAt       DateTime      @updatedAt
}

//////////////////////////////////////////////////////
// ORDER ITEMS
//////////////////////////////////////////////////////

model OrderItem {
id         String   @id @default(uuid())

orderId    String
order      Order    @relation(fields: [orderId], references: [id])

productId  String
product    Product  @relation(fields: [productId], references: [id])

name       String   // snapshot
price      Float
quantity   Int

createdAt  DateTime @default(now())
}

//////////////////////////////////////////////////////
// STORE CONFIG (WHITE-LABEL CORE)
//////////////////////////////////////////////////////

model StoreConfig {
id              String   @id @default(uuid())

storeName       String
logo            String?
primaryColor    String?

whatsappNumber  String

orderModes      Json     // { whatsapp: true, cod: true, online: false }
features        Json?    // future toggles

createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
}
