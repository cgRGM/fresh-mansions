import { withFullAddress } from "@fresh-mansions/db/address";

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
  property: withFullAddress(record.property),
});
