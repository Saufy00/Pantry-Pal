import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { CategoryCount, HealthStatus, Item, ItemInput, ItemUpdate, ItemsSummary, ListItemsParams, LocationCount, QuantityAdjust, ShoppingItem, ShoppingItemInput, ShoppingItemUpdate, StatusUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListItemsUrl: (params?: ListItemsParams) => string;
/**
 * @summary List all stock items
 */
export declare const listItems: (params?: ListItemsParams, options?: RequestInit) => Promise<Item[]>;
export declare const getListItemsQueryKey: (params?: ListItemsParams) => readonly ["/api/items", ...ListItemsParams[]];
export declare const getListItemsQueryOptions: <TData = Awaited<ReturnType<typeof listItems>>, TError = ErrorType<unknown>>(params?: ListItemsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listItems>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listItems>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListItemsQueryResult = NonNullable<Awaited<ReturnType<typeof listItems>>>;
export type ListItemsQueryError = ErrorType<unknown>;
/**
 * @summary List all stock items
 */
export declare function useListItems<TData = Awaited<ReturnType<typeof listItems>>, TError = ErrorType<unknown>>(params?: ListItemsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listItems>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateItemUrl: () => string;
/**
 * @summary Add a new stock item
 */
export declare const createItem: (itemInput: ItemInput, options?: RequestInit) => Promise<Item>;
export declare const getCreateItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createItem>>, TError, {
        data: BodyType<ItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createItem>>, TError, {
    data: BodyType<ItemInput>;
}, TContext>;
export type CreateItemMutationResult = NonNullable<Awaited<ReturnType<typeof createItem>>>;
export type CreateItemMutationBody = BodyType<ItemInput>;
export type CreateItemMutationError = ErrorType<unknown>;
/**
* @summary Add a new stock item
*/
export declare const useCreateItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createItem>>, TError, {
        data: BodyType<ItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createItem>>, TError, {
    data: BodyType<ItemInput>;
}, TContext>;
export declare const getGetItemsSummaryUrl: () => string;
/**
 * @summary Get stock summary counts
 */
export declare const getItemsSummary: (options?: RequestInit) => Promise<ItemsSummary>;
export declare const getGetItemsSummaryQueryKey: () => readonly ["/api/items/summary"];
export declare const getGetItemsSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getItemsSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getItemsSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getItemsSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetItemsSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getItemsSummary>>>;
export type GetItemsSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get stock summary counts
 */
export declare function useGetItemsSummary<TData = Awaited<ReturnType<typeof getItemsSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getItemsSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetNeedsRestockUrl: () => string;
/**
 * @summary Get items that are low or out of stock
 */
export declare const getNeedsRestock: (options?: RequestInit) => Promise<Item[]>;
export declare const getGetNeedsRestockQueryKey: () => readonly ["/api/items/needs-restock"];
export declare const getGetNeedsRestockQueryOptions: <TData = Awaited<ReturnType<typeof getNeedsRestock>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNeedsRestock>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getNeedsRestock>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetNeedsRestockQueryResult = NonNullable<Awaited<ReturnType<typeof getNeedsRestock>>>;
export type GetNeedsRestockQueryError = ErrorType<unknown>;
/**
 * @summary Get items that are low or out of stock
 */
export declare function useGetNeedsRestock<TData = Awaited<ReturnType<typeof getNeedsRestock>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNeedsRestock>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListCategoriesUrl: () => string;
/**
 * @summary List all categories with item counts
 */
export declare const listCategories: (options?: RequestInit) => Promise<CategoryCount[]>;
export declare const getListCategoriesQueryKey: () => readonly ["/api/items/categories"];
export declare const getListCategoriesQueryOptions: <TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCategoriesQueryResult = NonNullable<Awaited<ReturnType<typeof listCategories>>>;
export type ListCategoriesQueryError = ErrorType<unknown>;
/**
 * @summary List all categories with item counts
 */
export declare function useListCategories<TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListLocationsUrl: () => string;
/**
 * @summary List all storage locations with item counts
 */
export declare const listLocations: (options?: RequestInit) => Promise<LocationCount[]>;
export declare const getListLocationsQueryKey: () => readonly ["/api/items/locations"];
export declare const getListLocationsQueryOptions: <TData = Awaited<ReturnType<typeof listLocations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLocations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listLocations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListLocationsQueryResult = NonNullable<Awaited<ReturnType<typeof listLocations>>>;
export type ListLocationsQueryError = ErrorType<unknown>;
/**
 * @summary List all storage locations with item counts
 */
export declare function useListLocations<TData = Awaited<ReturnType<typeof listLocations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLocations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetItemUrl: (id: number) => string;
/**
 * @summary Get a single stock item
 */
export declare const getItem: (id: number, options?: RequestInit) => Promise<Item>;
export declare const getGetItemQueryKey: (id: number) => readonly [`/api/items/${number}`];
export declare const getGetItemQueryOptions: <TData = Awaited<ReturnType<typeof getItem>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getItem>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getItem>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetItemQueryResult = NonNullable<Awaited<ReturnType<typeof getItem>>>;
export type GetItemQueryError = ErrorType<void>;
/**
 * @summary Get a single stock item
 */
export declare function useGetItem<TData = Awaited<ReturnType<typeof getItem>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getItem>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateItemUrl: (id: number) => string;
/**
 * @summary Update a stock item
 */
export declare const updateItem: (id: number, itemUpdate: ItemUpdate, options?: RequestInit) => Promise<Item>;
export declare const getUpdateItemMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateItem>>, TError, {
        id: number;
        data: BodyType<ItemUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateItem>>, TError, {
    id: number;
    data: BodyType<ItemUpdate>;
}, TContext>;
export type UpdateItemMutationResult = NonNullable<Awaited<ReturnType<typeof updateItem>>>;
export type UpdateItemMutationBody = BodyType<ItemUpdate>;
export type UpdateItemMutationError = ErrorType<void>;
/**
* @summary Update a stock item
*/
export declare const useUpdateItem: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateItem>>, TError, {
        id: number;
        data: BodyType<ItemUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateItem>>, TError, {
    id: number;
    data: BodyType<ItemUpdate>;
}, TContext>;
export declare const getDeleteItemUrl: (id: number) => string;
/**
 * @summary Delete a stock item
 */
export declare const deleteItem: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteItem>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteItem>>, TError, {
    id: number;
}, TContext>;
export type DeleteItemMutationResult = NonNullable<Awaited<ReturnType<typeof deleteItem>>>;
export type DeleteItemMutationError = ErrorType<unknown>;
/**
* @summary Delete a stock item
*/
export declare const useDeleteItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteItem>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteItem>>, TError, {
    id: number;
}, TContext>;
export declare const getUpdateItemStatusUrl: (id: number) => string;
/**
 * @summary Quickly update item status
 */
export declare const updateItemStatus: (id: number, statusUpdate: StatusUpdate, options?: RequestInit) => Promise<Item>;
export declare const getUpdateItemStatusMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateItemStatus>>, TError, {
        id: number;
        data: BodyType<StatusUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateItemStatus>>, TError, {
    id: number;
    data: BodyType<StatusUpdate>;
}, TContext>;
export type UpdateItemStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateItemStatus>>>;
export type UpdateItemStatusMutationBody = BodyType<StatusUpdate>;
export type UpdateItemStatusMutationError = ErrorType<void>;
/**
* @summary Quickly update item status
*/
export declare const useUpdateItemStatus: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateItemStatus>>, TError, {
        id: number;
        data: BodyType<StatusUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateItemStatus>>, TError, {
    id: number;
    data: BodyType<StatusUpdate>;
}, TContext>;
export declare const getAdjustItemQuantityUrl: (id: number) => string;
/**
 * @summary Increment or decrement item quantity by a delta
 */
export declare const adjustItemQuantity: (id: number, quantityAdjust: QuantityAdjust, options?: RequestInit) => Promise<Item>;
export declare const getAdjustItemQuantityMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adjustItemQuantity>>, TError, {
        id: number;
        data: BodyType<QuantityAdjust>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adjustItemQuantity>>, TError, {
    id: number;
    data: BodyType<QuantityAdjust>;
}, TContext>;
export type AdjustItemQuantityMutationResult = NonNullable<Awaited<ReturnType<typeof adjustItemQuantity>>>;
export type AdjustItemQuantityMutationBody = BodyType<QuantityAdjust>;
export type AdjustItemQuantityMutationError = ErrorType<void>;
/**
* @summary Increment or decrement item quantity by a delta
*/
export declare const useAdjustItemQuantity: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adjustItemQuantity>>, TError, {
        id: number;
        data: BodyType<QuantityAdjust>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adjustItemQuantity>>, TError, {
    id: number;
    data: BodyType<QuantityAdjust>;
}, TContext>;
export declare const getListShoppingItemsUrl: () => string;
/**
 * @summary List custom shopping list items
 */
export declare const listShoppingItems: (options?: RequestInit) => Promise<ShoppingItem[]>;
export declare const getListShoppingItemsQueryKey: () => readonly ["/api/shopping"];
export declare const getListShoppingItemsQueryOptions: <TData = Awaited<ReturnType<typeof listShoppingItems>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listShoppingItems>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listShoppingItems>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListShoppingItemsQueryResult = NonNullable<Awaited<ReturnType<typeof listShoppingItems>>>;
export type ListShoppingItemsQueryError = ErrorType<unknown>;
/**
 * @summary List custom shopping list items
 */
export declare function useListShoppingItems<TData = Awaited<ReturnType<typeof listShoppingItems>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listShoppingItems>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateShoppingItemUrl: () => string;
/**
 * @summary Add a new custom shopping list item
 */
export declare const createShoppingItem: (shoppingItemInput: ShoppingItemInput, options?: RequestInit) => Promise<ShoppingItem>;
export declare const getCreateShoppingItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createShoppingItem>>, TError, {
        data: BodyType<ShoppingItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createShoppingItem>>, TError, {
    data: BodyType<ShoppingItemInput>;
}, TContext>;
export type CreateShoppingItemMutationResult = NonNullable<Awaited<ReturnType<typeof createShoppingItem>>>;
export type CreateShoppingItemMutationBody = BodyType<ShoppingItemInput>;
export type CreateShoppingItemMutationError = ErrorType<unknown>;
/**
* @summary Add a new custom shopping list item
*/
export declare const useCreateShoppingItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createShoppingItem>>, TError, {
        data: BodyType<ShoppingItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createShoppingItem>>, TError, {
    data: BodyType<ShoppingItemInput>;
}, TContext>;
export declare const getUpdateShoppingItemUrl: (id: number) => string;
/**
 * @summary Update a shopping list item
 */
export declare const updateShoppingItem: (id: number, shoppingItemUpdate: ShoppingItemUpdate, options?: RequestInit) => Promise<ShoppingItem>;
export declare const getUpdateShoppingItemMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateShoppingItem>>, TError, {
        id: number;
        data: BodyType<ShoppingItemUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateShoppingItem>>, TError, {
    id: number;
    data: BodyType<ShoppingItemUpdate>;
}, TContext>;
export type UpdateShoppingItemMutationResult = NonNullable<Awaited<ReturnType<typeof updateShoppingItem>>>;
export type UpdateShoppingItemMutationBody = BodyType<ShoppingItemUpdate>;
export type UpdateShoppingItemMutationError = ErrorType<void>;
/**
* @summary Update a shopping list item
*/
export declare const useUpdateShoppingItem: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateShoppingItem>>, TError, {
        id: number;
        data: BodyType<ShoppingItemUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateShoppingItem>>, TError, {
    id: number;
    data: BodyType<ShoppingItemUpdate>;
}, TContext>;
export declare const getDeleteShoppingItemUrl: (id: number) => string;
/**
 * @summary Delete a shopping list item
 */
export declare const deleteShoppingItem: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteShoppingItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteShoppingItem>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteShoppingItem>>, TError, {
    id: number;
}, TContext>;
export type DeleteShoppingItemMutationResult = NonNullable<Awaited<ReturnType<typeof deleteShoppingItem>>>;
export type DeleteShoppingItemMutationError = ErrorType<unknown>;
/**
* @summary Delete a shopping list item
*/
export declare const useDeleteShoppingItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteShoppingItem>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteShoppingItem>>, TError, {
    id: number;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map