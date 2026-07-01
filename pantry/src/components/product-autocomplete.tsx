import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useListProducts, type Product } from "@workspace/api-client-react";
import { searchCachedProducts } from "@/utils/db-cache";

interface ProductAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelectProduct: (product: Product) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

export function ProductAutocomplete({
  value,
  onChange,
  onSelectProduct,
  placeholder,
  id,
  required,
}: ProductAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [localResults, setLocalResults] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Debounce input value to search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(value);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  // Query remote API (only if search term is at least 2 chars)
  const remoteQuery = useListProducts(
    { search: searchTerm },
    { query: { enabled: searchTerm.trim().length >= 2 } as any }
  );

  // Query local IndexedDB cache
  useEffect(() => {
    let active = true;
    if (searchTerm.trim().length < 2) {
      setLocalResults([]);
      return;
    }

    searchCachedProducts(searchTerm).then((results) => {
      if (active) {
        setLocalResults(results);
      }
    });

    return () => {
      active = false;
    };
  }, [searchTerm]);

  // Merge and deduplicate results by ID
  const mergedMap = new Map<number, Product>();
  localResults.forEach((p) => mergedMap.set(p.id, p));
  if (remoteQuery.data) {
    remoteQuery.data.forEach((p) => mergedMap.set(p.id, p));
  }
  const suggestions = Array.from(mergedMap.values()).slice(0, 8); // limit to 8 suggestions

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]!);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        required={required}
        autoComplete="off"
        className="w-full"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-card border border-card-border rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-hidden py-1">
          {suggestions.map((product, idx) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelect(product)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between gap-3 hover:bg-secondary/60 transition-colors ${
                idx === activeIndex ? "bg-secondary" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {product.imageUrl && (
                  <div className="w-8 h-8 rounded border border-border/40 overflow-hidden shrink-0 bg-muted/20">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate">{product.name}</span>
                  {product.brand && (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.brand}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground shrink-0 border border-border/30">
                {product.category || "Catalog"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
