// Minimal stub — exists to satisfy Bun project conventions.
// This file is not executed; the probe is lockfile-driven.
import { Hono } from "hono";
import { Elysia } from "elysia";

// hono: multi-runtime HTTP framework
const hono = new Hono();
hono.get("/", (c) => c.text("bun-1.1-text-lock-probe"));

// elysia: Bun-native HTTP framework
const elysia = new Elysia();
elysia.get("/", () => "bun-1.1-text-lock-probe");

export { hono, elysia };
