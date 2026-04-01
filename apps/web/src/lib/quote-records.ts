import { enrichPropertyWithFullAddress } from "@/lib/address";

interface WithProperty<TProperty> {
  property?: null | TProperty;
}

export const withPropertyFullAddress = <
  TRecord extends WithProperty<TProperty>,
  TProperty extends {
    addressLine2?: null | string;
    city?: null | string;
    formattedAddress?: null | string;
    fullAddress?: null | string;
    state?: null | string;
    street?: null | string;
    zip?: null | string;
  },
>(
  record: TRecord
): Omit<TRecord, "property"> & {
  property: null | (TProperty & { fullAddress: string });
} => ({
  ...record,
  property: enrichPropertyWithFullAddress(record.property),
});

export const withPropertiesFullAddress = <
  TProperty extends {
    addressLine2?: null | string;
    city?: null | string;
    formattedAddress?: null | string;
    fullAddress?: null | string;
    state?: null | string;
    street?: null | string;
    zip?: null | string;
  },
>(
  properties: TProperty[]
): (TProperty & { fullAddress: string })[] => {
  const normalizedProperties: (TProperty & { fullAddress: string })[] = [];

  for (const property of properties) {
    const normalizedProperty = enrichPropertyWithFullAddress(property);

    if (normalizedProperty) {
      normalizedProperties.push(normalizedProperty);
    }
  }

  return normalizedProperties;
};

export const withQuotePropertyFullAddress = <
  TRecord extends {
    quote?: null | {
      property?: null | {
        addressLine2?: null | string;
        city?: null | string;
        formattedAddress?: null | string;
        fullAddress?: null | string;
        state?: null | string;
        street?: null | string;
        zip?: null | string;
      };
    };
  },
>(
  record: TRecord
): Omit<TRecord, "quote"> & {
  quote:
    | null
    | (NonNullable<TRecord["quote"]> & {
        property:
          | null
          | (NonNullable<NonNullable<TRecord["quote"]>["property"]> & {
              fullAddress: string;
            });
      });
} => {
  if (!record.quote) {
    return {
      ...record,
      quote: null,
    };
  }

  return {
    ...record,
    quote: withPropertyFullAddress(record.quote),
  };
};
