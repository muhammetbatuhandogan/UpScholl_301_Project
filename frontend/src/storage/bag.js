import { BAG_DEFAULT_ITEMS } from "../content/bag-items.js";
import { BAG_STORAGE_KEY } from "../content/constants.js";
import { loadJSON, saveJSON } from "./base.js";

export function loadBagState() {
  const parsed = loadJSON(BAG_STORAGE_KEY, {});
  const map = typeof parsed === "object" && parsed !== null ? parsed : {};
  return BAG_DEFAULT_ITEMS.map((item) => ({
    ...item,
    checked: Boolean(map[item.id])
  }));
}

export function saveBagState(items) {
  const compact = items.reduce(
    (acc, item) => ({ ...acc, [item.id]: item.checked }),
    {}
  );
  saveJSON(BAG_STORAGE_KEY, compact);
}
