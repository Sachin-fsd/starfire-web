"use client";

import { openDB } from "idb";

export async function appDb() {
  return openDB("flowmind", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("notes")) db.createObjectStore("notes", { keyPath: "id" });
      if (!db.objectStoreNames.contains("queue")) db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
    }
  });
}
