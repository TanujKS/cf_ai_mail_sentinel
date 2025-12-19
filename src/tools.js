/**
 * Product Catalog Tools for Retail Email Agent
 * 
 * These tools use Zod schemas with Vercel AI SDK's tool() function
 * to allow the LLM to query product information.
 */

import { tool } from "ai";
import { z } from "zod";

// Sample product catalog - in production, this would come from a database or API
export const PRODUCT_CATALOG = [
	{
		id: "prod-001",
		name: "Wireless Headphones",
		description: "Premium noise-cancelling wireless headphones with 30-hour battery life",
		price: 199.99,
		currency: "USD",
		category: "Electronics",
		inStock: true,
		stockQuantity: 45,
	},
	{
		id: "prod-002",
		name: "Smart Watch",
		description: "Fitness tracking smartwatch with heart rate monitor and GPS",
		price: 299.99,
		currency: "USD",
		category: "Electronics",
		inStock: true,
		stockQuantity: 23,
	},
	{
		id: "prod-003",
		name: "Laptop Stand",
		description: "Ergonomic aluminum laptop stand, adjustable height",
		price: 49.99,
		currency: "USD",
		category: "Accessories",
		inStock: true,
		stockQuantity: 78,
	},
	{
		id: "prod-004",
		name: "USB-C Cable",
		description: "6ft braided USB-C to USB-C cable, fast charging compatible",
		price: 19.99,
		currency: "USD",
		category: "Accessories",
		inStock: true,
		stockQuantity: 120,
	},
	{
		id: "prod-005",
		name: "Wireless Mouse",
		description: "Ergonomic wireless mouse with precision tracking",
		price: 39.99,
		currency: "USD",
		category: "Accessories",
		inStock: false,
		stockQuantity: 0,
	},
];

/**
 * Tool execution functions
 */
export async function getProductInfo(productName) {
	const product = PRODUCT_CATALOG.find(
		(p) =>
			p.name.toLowerCase().includes(productName.toLowerCase()) ||
			p.id.toLowerCase() === productName.toLowerCase(),
	);

	if (!product) {
		return {
			found: false,
			message: `Product "${productName}" not found in our catalog.`,
		};
	}

	return {
		found: true,
		product: {
			id: product.id,
			name: product.name,
			description: product.description,
			price: product.price,
			currency: product.currency,
			category: product.category,
			availability: product.inStock
				? `In stock (${product.stockQuantity} available)`
				: "Out of stock",
		},
	};
}

export async function searchProducts(query) {
	const searchTerm = query.toLowerCase();
	const matches = PRODUCT_CATALOG.filter(
		(p) =>
			p.name.toLowerCase().includes(searchTerm) ||
			p.description.toLowerCase().includes(searchTerm) ||
			p.category.toLowerCase().includes(searchTerm),
	);

	if (matches.length === 0) {
		return {
			found: false,
			message: `No products found matching "${query}".`,
		};
	}

	return {
		found: true,
		count: matches.length,
		products: matches.map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description,
			price: p.price,
			currency: p.currency,
			category: p.category,
			availability: p.inStock
				? `In stock (${p.stockQuantity} available)`
				: "Out of stock",
		})),
	};
}

export async function getPricing(productName) {
	const product = PRODUCT_CATALOG.find(
		(p) =>
			p.name.toLowerCase().includes(productName.toLowerCase()) ||
			p.id.toLowerCase() === productName.toLowerCase(),
	);

	if (!product) {
		return {
			found: false,
			message: `Product "${productName}" not found. Use searchProducts to find available products.`,
		};
	}

	return {
		found: true,
		productName: product.name,
		price: product.price,
		currency: product.currency,
		formattedPrice: `${product.currency} ${product.price.toFixed(2)}`,
	};
}

export async function getAllProducts() {
	return {
		count: PRODUCT_CATALOG.length,
		products: PRODUCT_CATALOG.map((p) => ({
			id: p.id,
			name: p.name,
			price: p.price,
			currency: p.currency,
			category: p.category,
			inStock: p.inStock,
		})),
	};
}

/**
 * Create tools using Zod schemas with Vercel AI SDK's tool() function
 * These tools are compatible with generateText from the ai package
 */
export const getProductInfoTool = tool({
	description: "Get detailed information about a specific product by name or ID. Use this when the customer asks about a specific product.",
	inputSchema: z.object({
		productName: z.string().describe("The name or ID of the product to look up (e.g., 'Wireless Headphones' or 'prod-001')"),
	}),
	execute: async ({ productName }) => {
		const result = await getProductInfo(productName);
		return JSON.stringify(result);
	},
});

export const searchProductsTool = tool({
	description: "Search for products by keyword. Use this when the customer asks about products in general or searches for something specific.",
	inputSchema: z.object({
		query: z.string().describe("Search term to find products (e.g., 'headphones', 'electronics', 'wireless')"),
	}),
	execute: async ({ query }) => {
		const result = await searchProducts(query);
		return JSON.stringify(result);
	},
});

export const getPricingTool = tool({
	description: "Get pricing information for a specific product. Use this when the customer asks about prices.",
	inputSchema: z.object({
		productName: z.string().describe("The name or ID of the product to get pricing for"),
	}),
	execute: async ({ productName }) => {
		const result = await getPricing(productName);
		return JSON.stringify(result);
	},
});

export const getAllProductsTool = tool({
	description: "Get a list of all available products in the catalog. Use this when the customer asks to see all products or wants a general overview.",
	inputSchema: z.object({}),
	execute: async () => {
		const result = await getAllProducts();
		return JSON.stringify(result);
	},
});

/**
 * Export all tools as a tool set
 */
export const productTools = {
	getProductInfo: getProductInfoTool,
	searchProducts: searchProductsTool,
	getPricing: getPricingTool,
	getAllProducts: getAllProductsTool,
};
