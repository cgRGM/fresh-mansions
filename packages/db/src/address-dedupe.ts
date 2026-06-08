import { buildFullAddress } from "./address";
import type { AddressRecordLike } from "./address";

const UNIT_PREFIX_PATTERN =
  /^(apartment|apt|building|bldg|floor|fl|lot|space|ste|suite|unit)\b/;
const NON_ADDRESS_CHARACTER_PATTERN = /[^a-z0-9]+/g;
const WHITESPACE_PATTERN = /\s+/g;

const normalizePart = (value?: null | string): string =>
  value
    ?.toLowerCase()
    .trim()
    .replaceAll(".", "")
    .replace(UNIT_PREFIX_PATTERN, "")
    .replace(NON_ADDRESS_CHARACTER_PATTERN, " ")
    .replace(WHITESPACE_PATTERN, " ")
    .trim() ?? "";

export const buildNormalizedAddressKey = (
  address?: null | AddressRecordLike
): string => {
  if (!address) {
    return "";
  }

  const street = normalizePart(address.street);
  const addressLine2 = normalizePart(address.addressLine2);
  const city = normalizePart(address.city);
  const state = normalizePart(address.state);
  const zip = normalizePart(address.zip).slice(0, 5);

  const keyedParts = [street, addressLine2, city, state, zip].filter(Boolean);

  if (keyedParts.length > 0) {
    return keyedParts.join("|");
  }

  return normalizePart(buildFullAddress(address));
};
