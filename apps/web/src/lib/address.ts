import { buildFullAddress, withFullAddress } from "@fresh-mansions/db/address";

interface PropertyAddressLike {
  addressLine2?: null | string;
  city?: null | string;
  formattedAddress?: null | string;
  fullAddress?: null | string;
  state?: null | string;
  street?: null | string;
  zip?: null | string;
}

export const getPropertyDisplayAddress = (
  property?: null | PropertyAddressLike
): string => {
  if (!property) {
    return "No property address";
  }

  return property.fullAddress?.trim() || buildFullAddress(property);
};

export const enrichPropertyWithFullAddress = <T extends PropertyAddressLike>(
  property?: null | T
): null | (T & { fullAddress: string }) => withFullAddress(property);
