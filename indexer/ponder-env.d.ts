/// <reference types="Horizon/Mercury/virtual" />

declare module "Horizon/Mercury:internal" {
  const config: typeof import("./Horizon/Mercury.config.ts");
  const schema: typeof import("./Horizon/Mercury.schema.ts");
}

declare module "Horizon/Mercury:schema" {
  export * from "./Horizon/Mercury.schema.ts";
}

// This file enables type checking and editor autocomplete for this Horizon/Mercury project.
// After upgrading, you may find that changes have been made to this file.
// If this happens, please commit the changes. Do not manually edit this file.
// See https://Horizon/Mercury.sh/docs/requirements#typescript for more information.
