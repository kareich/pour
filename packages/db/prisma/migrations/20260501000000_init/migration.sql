-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distilleries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "website" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distilleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spirits" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "distillery_id" TEXT,
    "category_id" TEXT,
    "subcategory" TEXT,
    "abv" DOUBLE PRECISION,
    "age_statement" INTEGER,
    "description" TEXT,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "flavor_sweet" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "flavor_smoke" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "flavor_fruit" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "flavor_grain" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "flavor_spice" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "flavor_floral" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "flavor_body" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spirits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spirit_barcodes" (
    "id" TEXT NOT NULL,
    "spirit_id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "barcode_type" TEXT NOT NULL DEFAULT 'EAN13',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spirit_barcodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spirit_images" (
    "id" TEXT NOT NULL,
    "spirit_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spirit_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spirit_attributes" (
    "id" TEXT NOT NULL,
    "spirit_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spirit_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "is_21_plus" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taste_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sweet" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "smoke" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "fruit" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "grain" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "spice" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "floral" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "body" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "price_min" DOUBLE PRECISION,
    "price_max" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taste_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spirit_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "flavor_sweet" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "flavor_smoke" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "flavor_fruit" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "flavor_grain" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "flavor_spice" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "flavor_floral" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "flavor_body" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spirit_id" TEXT NOT NULL,
    "bottle_status" TEXT NOT NULL DEFAULT 'sealed',
    "price_paid" DOUBLE PRECISION,
    "acquired_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spirit_id" TEXT NOT NULL,
    "target_price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spirit_id" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_snapshots" (
    "id" TEXT NOT NULL,
    "spirit_id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "retailer" TEXT,
    "url" TEXT,
    "region" TEXT,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spirit_submissions" (
    "id" TEXT NOT NULL,
    "barcode" TEXT,
    "product_name" TEXT NOT NULL,
    "brand" TEXT,
    "image_url" TEXT,
    "notes" TEXT,
    "submitted_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spirit_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "distilleries_slug_key" ON "distilleries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "spirits_slug_key" ON "spirits"("slug");

-- CreateIndex
CREATE INDEX "spirits_name_idx" ON "spirits"("name");

-- CreateIndex
CREATE INDEX "spirits_distillery_id_idx" ON "spirits"("distillery_id");

-- CreateIndex
CREATE INDEX "spirits_category_id_idx" ON "spirits"("category_id");

-- CreateIndex
CREATE INDEX "spirit_barcodes_barcode_idx" ON "spirit_barcodes"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "spirit_barcodes_barcode_key" ON "spirit_barcodes"("barcode");

-- CreateIndex
CREATE INDEX "spirit_images_spirit_id_idx" ON "spirit_images"("spirit_id");

-- CreateIndex
CREATE INDEX "spirit_attributes_spirit_id_idx" ON "spirit_attributes"("spirit_id");

-- CreateIndex
CREATE UNIQUE INDEX "spirit_attributes_spirit_id_key_key" ON "spirit_attributes"("spirit_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "taste_profiles_user_id_key" ON "taste_profiles"("user_id");

-- CreateIndex
CREATE INDEX "ratings_spirit_id_idx" ON "ratings"("spirit_id");

-- CreateIndex
CREATE INDEX "ratings_user_id_idx" ON "ratings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_spirit_id_key" ON "ratings"("user_id", "spirit_id");

-- CreateIndex
CREATE INDEX "collection_entries_user_id_idx" ON "collection_entries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_entries_user_id_spirit_id_key" ON "collection_entries"("user_id", "spirit_id");

-- CreateIndex
CREATE INDEX "wishlist_entries_user_id_idx" ON "wishlist_entries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_entries_user_id_spirit_id_key" ON "wishlist_entries"("user_id", "spirit_id");

-- CreateIndex
CREATE INDEX "reviews_spirit_id_idx" ON "reviews"("spirit_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_spirit_id_key" ON "reviews"("user_id", "spirit_id");

-- CreateIndex
CREATE INDEX "price_snapshots_spirit_id_idx" ON "price_snapshots"("spirit_id");

-- CreateIndex
CREATE INDEX "price_snapshots_captured_at_idx" ON "price_snapshots"("captured_at");

-- CreateIndex
CREATE INDEX "spirit_submissions_status_idx" ON "spirit_submissions"("status");

-- CreateIndex
CREATE INDEX "spirit_submissions_barcode_idx" ON "spirit_submissions"("barcode");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spirits" ADD CONSTRAINT "spirits_distillery_id_fkey" FOREIGN KEY ("distillery_id") REFERENCES "distilleries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spirits" ADD CONSTRAINT "spirits_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spirit_barcodes" ADD CONSTRAINT "spirit_barcodes_spirit_id_fkey" FOREIGN KEY ("spirit_id") REFERENCES "spirits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spirit_images" ADD CONSTRAINT "spirit_images_spirit_id_fkey" FOREIGN KEY ("spirit_id") REFERENCES "spirits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spirit_attributes" ADD CONSTRAINT "spirit_attributes_spirit_id_fkey" FOREIGN KEY ("spirit_id") REFERENCES "spirits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taste_profiles" ADD CONSTRAINT "taste_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_spirit_id_fkey" FOREIGN KEY ("spirit_id") REFERENCES "spirits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_entries" ADD CONSTRAINT "collection_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_entries" ADD CONSTRAINT "collection_entries_spirit_id_fkey" FOREIGN KEY ("spirit_id") REFERENCES "spirits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_entries" ADD CONSTRAINT "wishlist_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_entries" ADD CONSTRAINT "wishlist_entries_spirit_id_fkey" FOREIGN KEY ("spirit_id") REFERENCES "spirits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_spirit_id_fkey" FOREIGN KEY ("spirit_id") REFERENCES "spirits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_spirit_id_fkey" FOREIGN KEY ("spirit_id") REFERENCES "spirits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

