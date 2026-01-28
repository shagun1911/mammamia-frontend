export interface Website {
  id: string;
  name: string; // The human-readable name of the website document
  url: string;
  created_at_unix: number;
  type: "url"; // Explicitly set to 'url'
  status: "ready" | "processing" | "failed";
}

export const mockWebsites: Website[] = [
  {
    id: "KBDoc_website_1",
    name: "Example Company Homepage",
    url: "https://example.com",
    created_at_unix: Date.now() / 1000 - (1000 * 60 * 60 * 24 * 3),
    type: "url",
    status: "ready",
  },
  {
    id: "KBDoc_website_2",
    name: "Example Docs - Getting Started",
    url: "https://docs.example.com/getting-started",
    created_at_unix: Date.now() / 1000 - (1000 * 60 * 60 * 24 * 1),
    type: "url",
    status: "ready",
  },
  {
    id: "KBDoc_website_3",
    name: "Example Blog - Latest Launch",
    url: "https://blog.example.com/2024/01/product-launch",
    created_at_unix: Date.now() / 1000 - (1000 * 60 * 60 * 12),
    type: "url",
    status: "processing", // Example of a processing document
  },
];
