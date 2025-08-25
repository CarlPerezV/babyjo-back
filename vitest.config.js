
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.js"],
        environment: "node",
        reporters: "default",
        testTimeout: 10000,
    },

});
