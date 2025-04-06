import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("video_conversions", (t) => {
    t.uuid("id").primary();
    t.enum("status", ["pending", "processing", "finished"])
      .notNullable()
      .defaultTo("pending");
    t.string("keyInS3").defaultTo(null).unique();
    t.timestamp("createdAt").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("video_conversions");
}
