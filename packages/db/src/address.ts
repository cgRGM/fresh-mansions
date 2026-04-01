export interface AddressRecordLike {
  addressLine2?: null | string;
  city?: null | string;
  formattedAddress?: null | string;
  fullAddress?: null | string;
  state?: null | string;
  street?: null | string;
  zip?: null | string;
}

const compactAddressParts = (
  parts: (null | string | undefined)[]
): string[] => {
  const compactedParts: string[] = [];

  for (const part of parts) {
    const trimmedPart = part?.trim();

    if (trimmedPart) {
      compactedParts.push(trimmedPart);
    }
  }

  return compactedParts;
};

const buildCityStateZipLine = ({
  city,
  state,
  zip,
}: Pick<AddressRecordLike, "city" | "state" | "zip">): null | string => {
  const cityState = compactAddressParts([city, state]).join(", ");
  const line = compactAddressParts([cityState, zip]).join(" ");
  return line || null;
};

export const buildFullAddress = (
  address?: null | AddressRecordLike
): string => {
  if (!address) {
    return "";
  }

  const explicitFullAddress = address.fullAddress?.trim();

  if (explicitFullAddress) {
    return explicitFullAddress;
  }

  const formattedAddress = address.formattedAddress?.trim();

  if (formattedAddress && !address.addressLine2?.trim()) {
    return formattedAddress;
  }

  const cityStateZip = buildCityStateZipLine(address);
  const joinedAddress = compactAddressParts([
    address.street,
    address.addressLine2,
    cityStateZip,
  ]).join(", ");

  if (joinedAddress) {
    return joinedAddress;
  }

  return formattedAddress ?? "";
};

export const withFullAddress = <T extends AddressRecordLike>(
  address?: null | T
): null | (T & { fullAddress: string }) => {
  if (!address) {
    return null;
  }

  return {
    ...address,
    fullAddress: buildFullAddress(address),
  };
};
