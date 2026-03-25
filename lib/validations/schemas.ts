import { z } from "zod";

export const createPageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug può contenere solo lettere minuscole, numeri e trattini"),
  title: z.string().min(1).max(500),
  content: z.string().default(""),
  type: z.enum(["LANDING", "PORTFOLIO", "BLOG", "SHOP"]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updatePageSchema = createPageSchema.partial();

export const createPostSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug non valido"),
  title: z.string().min(1).max(500),
  excerpt: z.string().max(1000).optional().nullable(),
  content: z.string().min(1),
  featuredImage: z.string().max(500).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  tags: z.array(z.string().max(50)).default([]),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export const updatePostSchema = createPostSchema.partial();

export const createProductSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug non valido"),
  name: z.string().min(1).max(500),
  description: z.string().default(""),
  price: z.number().min(0).multipleOf(0.01),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string()).default([]),
  categoryId: z.string().cuid().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug non valido"),
  parentId: z.string().cuid().nullable().optional(),
});

const orderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "L'ordine deve contenere almeno un prodotto"),
  shipping: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    address: z.string().min(1).max(500),
    city: z.string().min(1).max(200),
    zip: z.string().min(1).max(20),
    country: z.string().min(1).max(100),
  }),
  notes: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});


export const blockSchema = z.object({
  type: z.string().min(1).max(50),
  order: z.number().int().min(0),
  content: z.record(z.unknown()),
});

export const updateBlocksSchema = z.array(blockSchema);


export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "READER"]),
});
export const updateUserSchema = z.object({
  name: z.string().max(200).optional(),
  avatar: z.union([z.string().url().max(500), z.literal("")]).optional().nullable(),
  role: z.enum(["ADMIN", "EDITOR", "READER"]).optional(),
});


export const upsertSettingSchema = z.object({
  key: z.string().min(1).max(200).regex(/^[a-z0-9_]+$/, "Chiave impostazione non valida"),
  value: z.unknown(),
});

export const upsertSettingsBulkSchema = z.array(upsertSettingSchema);


export const bulkActionSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "Seleziona almeno un elemento"),
  action: z.enum(["publish", "draft", "archive", "delete"]),
});