import { InferSelectModel } from "drizzle-orm";
import { credentials } from "./schema";

export type Credential = InferSelectModel<typeof credentials>;
