import { buildFullAddress } from "@fresh-mansions/db/address";
import { env } from "@fresh-mansions/env/web";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Check, Loader2, MapPin } from "lucide-react";
import type RadarSdk from "radar-sdk-js";
import type { RadarAutocompleteAddress } from "radar-sdk-js";
import type { ChangeEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface QuoteAddressSelection {
  city: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  radarMetadata?: Record<string, unknown>;
  radarPlaceId?: string;
  state: string;
  street: string;
  zip: string;
}

interface AddressAutocompleteProps {
  addressError?: string;
  addressLine2: string;
  addressLine2Label?: string;
  addressPlaceholder?: string;
  label?: string;
  onAddressLine2Change: (value: string) => void;
  onSelectionChange: (selection: null | QuoteAddressSelection) => void;
  placeholder?: string;
  selectedAddress: null | QuoteAddressSelection;
}

const AUTOCOMPLETE_REQUEST_ID = "quote-address-autocomplete";
const MIN_QUERY_LENGTH = 3;
const AUTOCOMPLETE_LIMIT = 5;
const AUTOCOMPLETE_WAIT_MS = 250;

let radarClientPromise: null | Promise<RadarSdk> = null;

const getRadarClient = (): Promise<RadarSdk> => {
  if (!radarClientPromise) {
    radarClientPromise = (async () => {
      const { default: Radar } = await import("radar-sdk-js");
      Radar.initialize(env.VITE_RADAR_PUBLISHABLE_KEY);
      return Radar;
    })();
  }

  return radarClientPromise;
};

const toStreetLine = (address: RadarAutocompleteAddress): string =>
  [address.number, address.street].filter(Boolean).join(" ").trim();

const mapSelection = (
  address: RadarAutocompleteAddress
): QuoteAddressSelection => ({
  city: address.city ?? "",
  formattedAddress:
    address.formattedAddress?.trim() ||
    buildFullAddress({
      city: address.city,
      state: address.stateCode ?? address.state,
      street: toStreetLine(address),
      zip: address.postalCode,
    }),
  latitude: address.latitude,
  longitude: address.longitude,
  radarMetadata: address as Record<string, unknown>,
  radarPlaceId: address.placeLabel,
  state: address.stateCode ?? address.state ?? "",
  street: toStreetLine(address),
  zip: address.postalCode ?? "",
});

const useAddressResults = (
  debouncedQuery: string,
  selectedAddress: null | QuoteAddressSelection
) => {
  const [results, setResults] = useState<RadarAutocompleteAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (!env.VITE_RADAR_PUBLISHABLE_KEY) {
      setLookupError("Radar publishable key is missing");
      setResults([]);
      return;
    }

    if (
      selectedAddress &&
      trimmedQuery === selectedAddress.formattedAddress.trim()
    ) {
      setResults([]);
      setLookupError(null);
      return;
    }

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLookupError(null);
      return;
    }

    let isCancelled = false;

    const searchAddresses = async () => {
      setIsLoading(true);
      setLookupError(null);

      try {
        const Radar = await getRadarClient();
        const response = await Radar.autocomplete(
          {
            countryCode: "US",
            layers: ["address"],
            limit: AUTOCOMPLETE_LIMIT,
            query: trimmedQuery,
          },
          AUTOCOMPLETE_REQUEST_ID
        );

        if (isCancelled) {
          return;
        }

        setResults(response.addresses ?? []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setResults([]);
        setLookupError(
          error instanceof Error
            ? error.message
            : "Unable to load address suggestions"
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    searchAddresses();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, selectedAddress]);

  return { isLoading, lookupError, results, setLookupError, setResults };
};

const AddressSuggestions = ({
  onSelect,
  results,
}: {
  onSelect: (address: RadarAutocompleteAddress) => void;
  results: RadarAutocompleteAddress[];
}) => {
  const handleResultClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const resultIndex = Number(event.currentTarget.dataset.resultIndex);

      if (Number.isNaN(resultIndex)) {
        return;
      }

      const result = results[resultIndex];

      if (!result) {
        return;
      }

      onSelect(result);
    },
    [onSelect, results]
  );

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
      <ul className="divide-y divide-black/6">
        {results.map((address, resultIndex) => {
          const selection = mapSelection(address);
          const addressKey = [
            selection.formattedAddress,
            selection.latitude,
            selection.longitude,
          ].join("-");

          return (
            <li key={addressKey}>
              <button
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f6f4ef]"
                data-result-index={resultIndex}
                onClick={handleResultClick}
                type="button"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-black/38" />
                <span className="text-sm leading-6 text-black">
                  {selection.formattedAddress}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const AddressSelectionSummary = ({ summary }: { summary: null | string }) => {
  if (!summary) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-[#9fc84f]/25 bg-[#eff6dd] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-[#4f7a1d] p-1 text-white">
          <Check className="h-3.5 w-3.5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-black">
            Validated property address
          </p>
          <p className="text-sm text-black/65">{summary}</p>
        </div>
      </div>
    </div>
  );
};

const AddressLookupNotice = ({
  addressError,
  isLoading,
  lookupError,
  query,
  selectedAddress,
}: {
  addressError?: string;
  isLoading: boolean;
  lookupError: null | string;
  query: string;
  selectedAddress: null | QuoteAddressSelection;
}) => {
  const shouldShowEmptyState =
    !addressError &&
    !lookupError &&
    query.trim().length >= MIN_QUERY_LENGTH &&
    !isLoading &&
    !selectedAddress;

  if (addressError) {
    return <p className="text-sm text-rose-600">{addressError}</p>;
  }

  if (lookupError) {
    return <p className="text-sm text-rose-600">{lookupError}</p>;
  }

  if (!shouldShowEmptyState) {
    return null;
  }

  return (
    <p className="text-sm text-black/55">
      No matching addresses found yet. Keep typing the full address.
    </p>
  );
};

export const AddressAutocomplete = ({
  addressError,
  addressLine2,
  addressLine2Label = "Address Line 2",
  addressPlaceholder = "Suite, gate code, or unit",
  label = "Service Address",
  onAddressLine2Change,
  onSelectionChange,
  placeholder = "Start typing your street address",
  selectedAddress,
}: AddressAutocompleteProps) => {
  const [query, setQuery] = useState(selectedAddress?.formattedAddress ?? "");
  const [debouncedQuery, debouncer] = useDebouncedValue(
    query,
    { wait: AUTOCOMPLETE_WAIT_MS },
    (state) => ({ isPending: state.isPending })
  );
  const { isLoading, lookupError, results, setLookupError, setResults } =
    useAddressResults(debouncedQuery, selectedAddress);

  useEffect(() => {
    if (selectedAddress?.formattedAddress) {
      setQuery(selectedAddress.formattedAddress);
    }
  }, [selectedAddress?.formattedAddress]);

  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      setQuery(nextValue);
      setLookupError(null);

      if (selectedAddress && nextValue !== selectedAddress.formattedAddress) {
        onSelectionChange(null);
      }
    },
    [onSelectionChange, selectedAddress, setLookupError]
  );

  const handleSelect = useCallback(
    (address: RadarAutocompleteAddress) => {
      const mappedSelection = mapSelection(address);

      onSelectionChange(mappedSelection);
      setQuery(mappedSelection.formattedAddress);
      setLookupError(null);
      setResults([]);
    },
    [onSelectionChange, setLookupError, setResults]
  );

  const handleAddressLine2InputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onAddressLine2Change(event.target.value);
    },
    [onAddressLine2Change]
  );

  const selectionSummary = useMemo(() => {
    if (!selectedAddress) {
      return null;
    }

    return buildFullAddress({
      ...selectedAddress,
      addressLine2,
      fullAddress: undefined,
    });
  }, [addressLine2, selectedAddress]);

  const showDropdown =
    results.length > 0 &&
    debouncedQuery.trim().length >= MIN_QUERY_LENGTH &&
    !selectedAddress;

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label className="text-black/72" htmlFor="serviceAddress">
          {label}
        </Label>
        <div className="relative">
          <Input
            autoComplete="street-address"
            className="h-12 rounded-2xl border-black/10 bg-white pr-11"
            id="serviceAddress"
            onChange={handleQueryChange}
            placeholder={placeholder}
            value={query}
          />
          {isLoading || debouncer.state.isPending ? (
            <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-black/45" />
          ) : null}
        </div>
        <AddressLookupNotice
          addressError={addressError}
          isLoading={isLoading}
          lookupError={lookupError}
          query={debouncedQuery}
          selectedAddress={selectedAddress}
        />

        {showDropdown ? (
          <AddressSuggestions onSelect={handleSelect} results={results} />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-black/72" htmlFor="addressLine2">
          {addressLine2Label}
        </Label>
        <Input
          className="h-12 rounded-2xl border-black/10 bg-white"
          id="addressLine2"
          onChange={handleAddressLine2InputChange}
          placeholder={addressPlaceholder}
          value={addressLine2}
        />
      </div>

      <AddressSelectionSummary summary={selectionSummary} />
    </div>
  );
};
